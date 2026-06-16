import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { z } from 'zod'

import type { GtiMcpConfig } from '../config.js'
import { requireGtiSupabaseClient } from '../supabase.js'
import { normalizeTask, taskSelect, taskSummarySchema, type TaskRow } from './tasks.js'
import { toToolResult } from './utils.js'

const DEFAULT_FETCH_LIMIT = 200
const MAX_FETCH_LIMIT = 500
const DEFAULT_TOP_N = 5
const MAX_TOP_N = 10
const DEFAULT_DUE_SOON_DAYS = 7

const summaryInputSchema = z.object({
  topN: z.number().int().min(1).max(MAX_TOP_N).default(DEFAULT_TOP_N),
  dueSoonDays: z.number().int().min(1).max(30).default(DEFAULT_DUE_SOON_DAYS),
  fetchLimit: z.number().int().min(1).max(MAX_FETCH_LIMIT).default(DEFAULT_FETCH_LIMIT),
})

const scopedSummaryInputSchema = summaryInputSchema.extend({
  id: z.string().uuid(),
})

const countItemSchema = z.object({
  key: z.string(),
  label: z.string(),
  count: z.number(),
})

const checklistSummarySchema = z.object({
  tasks_with_checklist: z.number(),
  total_items: z.number(),
  done_items: z.number(),
  overall_percent: z.number(),
  average_task_percent: z.number(),
})

const dueSummarySchema = z.object({
  overdue_count: z.number(),
  due_soon_count: z.number(),
  no_due_date_count: z.number(),
  due_soon_days: z.number(),
  today: z.string(),
  overdue: z.array(taskSummarySchema),
  due_soon: z.array(taskSummarySchema),
})

const operationalSummarySchema = z.object({
  scope: z.enum(['my_tasks', 'project', 'category']),
  scopeId: z.string().nullable(),
  total: z.number(),
  open_total: z.number(),
  final_total: z.number(),
  archived_excluded: z.boolean(),
  truncated: z.boolean(),
  fetchLimit: z.number(),
  counts_by_status: z.array(countItemSchema),
  counts_by_priority: z.array(countItemSchema),
  due: dueSummarySchema,
  checklist: checklistSummarySchema,
})

const summaryOutputSchema = z.object({
  summary: operationalSummarySchema,
})

type SupabaseClient = ReturnType<typeof requireGtiSupabaseClient>
type TaskSummary = z.infer<typeof taskSummarySchema>
type SummaryScope = z.infer<typeof operationalSummarySchema>['scope']

const priorityLabels: Record<TaskSummary['priority'], string> = {
  low: 'Baixa',
  medium: 'Media',
  high: 'Alta',
  urgent: 'Urgente',
}

const getCurrentUserId = async (supabase: SupabaseClient, config: GtiMcpConfig) => {
  const { data, error } = await supabase.auth.getUser(config.userAccessToken)
  if (error) throw error
  if (!data.user?.id) throw new Error('Authenticated GTI user not found for MCP token.')
  return data.user.id
}

const normalizeRows = (rows: unknown[] | null | undefined) =>
  ((rows ?? []) as TaskRow[]).map(normalizeTask)

const uniqueTasks = (tasks: TaskSummary[]) =>
  Array.from(new Map(tasks.map((task) => [task.id, task])).values())

const fetchScopedTasks = async (
  supabase: SupabaseClient,
  scope: SummaryScope,
  scopeId: string | null,
  limit: number,
) => {
  if (scope === 'my_tasks') {
    const userId = scopeId
    if (!userId) throw new Error('Current user id is required for my task summary.')

    const [{ data: directData, error: directError }, { data: assignedRows, error: assignedError }] =
      await Promise.all([
        supabase
          .from('tasks')
          .select(taskSelect)
          .eq('is_archived', false)
          .or(`creator_id.eq.${userId},owner_id.eq.${userId}`)
          .order('due_date', { ascending: true, nullsFirst: false })
          .order('updated_at', { ascending: false })
          .limit(limit),
        supabase.from('task_assignees').select('task_id').eq('profile_id', userId).limit(limit),
      ])

    if (directError) throw directError
    if (assignedError) throw assignedError

    const directTasks = normalizeRows(directData)
    const directIds = new Set(directTasks.map((task) => task.id))
    const extraIds = (assignedRows ?? [])
      .map((row) => row.task_id as string)
      .filter((id) => !directIds.has(id))
      .slice(0, limit)

    if (extraIds.length === 0) return directTasks

    const { data: extraData, error: extraError } = await supabase
      .from('tasks')
      .select(taskSelect)
      .eq('is_archived', false)
      .in('id', extraIds)
      .order('due_date', { ascending: true, nullsFirst: false })
      .order('updated_at', { ascending: false })
      .limit(limit)

    if (extraError) throw extraError
    return uniqueTasks([...directTasks, ...normalizeRows(extraData)]).slice(0, limit)
  }

  const column = scope === 'project' ? 'project_id' : 'category_id'
  const { data, error } = await supabase
    .from('tasks')
    .select(taskSelect)
    .eq('is_archived', false)
    .eq(column, scopeId)
    .order('due_date', { ascending: true, nullsFirst: false })
    .order('updated_at', { ascending: false })
    .limit(limit)

  if (error) throw error
  return normalizeRows(data)
}

const increment = (counts: Map<string, { label: string; count: number }>, key: string, label: string) => {
  const current = counts.get(key)
  counts.set(key, { label, count: (current?.count ?? 0) + 1 })
}

const toCountItems = (counts: Map<string, { label: string; count: number }>) =>
  Array.from(counts.entries()).map(([key, value]) => ({
    key,
    label: value.label,
    count: value.count,
  }))

const compareByDueDate = (a: TaskSummary, b: TaskSummary) =>
  (a.due_date ?? '').localeCompare(b.due_date ?? '') || a.title.localeCompare(b.title, 'pt-BR')

const roundPercent = (value: number) => Math.round(value * 1000) / 10

const buildSummary = (
  tasks: TaskSummary[],
  scope: SummaryScope,
  scopeId: string | null,
  topN: number,
  dueSoonDays: number,
  fetchLimit: number,
) => {
  const today = new Date().toISOString().slice(0, 10)
  const dueSoonEnd = new Date(`${today}T00:00:00.000Z`)
  dueSoonEnd.setUTCDate(dueSoonEnd.getUTCDate() + dueSoonDays)
  const dueSoonEndDate = dueSoonEnd.toISOString().slice(0, 10)

  const statusCounts = new Map<string, { label: string; count: number }>()
  const priorityCounts = new Map<string, { label: string; count: number }>()
  let openTotal = 0
  let finalTotal = 0
  let noDueDateCount = 0
  let totalChecklistItems = 0
  let totalDoneItems = 0
  let tasksWithChecklist = 0
  let summedTaskChecklistRatio = 0

  const openTasks = tasks.filter((task) => !task.status?.is_final)

  for (const task of tasks) {
    const statusKey = task.status?.slug ?? task.status_id
    increment(statusCounts, statusKey, task.status?.name ?? 'Sem status')
    increment(priorityCounts, task.priority, priorityLabels[task.priority])

    if (task.status?.is_final) finalTotal += 1
    else openTotal += 1
    if (!task.due_date) noDueDateCount += 1

    const checklistTotal = task.checklist_progress.total
    const checklistDone = task.checklist_progress.done
    totalChecklistItems += checklistTotal
    totalDoneItems += checklistDone
    if (checklistTotal > 0) {
      tasksWithChecklist += 1
      summedTaskChecklistRatio += checklistDone / checklistTotal
    }
  }

  const overdue = openTasks
    .filter((task) => task.due_date !== null && task.due_date < today)
    .sort(compareByDueDate)

  const dueSoon = openTasks
    .filter((task) => task.due_date !== null && task.due_date >= today && task.due_date <= dueSoonEndDate)
    .sort(compareByDueDate)

  return {
    scope,
    scopeId,
    total: tasks.length,
    open_total: openTotal,
    final_total: finalTotal,
    archived_excluded: true,
    truncated: tasks.length >= fetchLimit,
    fetchLimit,
    counts_by_status: toCountItems(statusCounts),
    counts_by_priority: toCountItems(priorityCounts),
    due: {
      overdue_count: overdue.length,
      due_soon_count: dueSoon.length,
      no_due_date_count: noDueDateCount,
      due_soon_days: dueSoonDays,
      today,
      overdue: overdue.slice(0, topN),
      due_soon: dueSoon.slice(0, topN),
    },
    checklist: {
      tasks_with_checklist: tasksWithChecklist,
      total_items: totalChecklistItems,
      done_items: totalDoneItems,
      overall_percent: totalChecklistItems > 0 ? roundPercent(totalDoneItems / totalChecklistItems) : 0,
      average_task_percent:
        tasksWithChecklist > 0 ? roundPercent(summedTaskChecklistRatio / tasksWithChecklist) : 0,
    },
  }
}

export const registerTaskSummaryTools = (server: McpServer, config: GtiMcpConfig) => {
  server.registerTool(
    'gti_summarize_my_tasks',
    {
      title: 'Summarize my GTI tasks',
      description: 'Summarizes the authenticated user tasks by status, priority, due dates and checklist progress.',
      inputSchema: summaryInputSchema,
      outputSchema: summaryOutputSchema,
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
      },
    },
    async ({ topN, dueSoonDays, fetchLimit }) => {
      const supabase = requireGtiSupabaseClient(config)
      const userId = await getCurrentUserId(supabase, config)
      const tasks = await fetchScopedTasks(supabase, 'my_tasks', userId, fetchLimit)
      return toToolResult({
        summary: buildSummary(tasks, 'my_tasks', userId, topN, dueSoonDays, fetchLimit),
      })
    },
  )

  server.registerTool(
    'gti_summarize_project',
    {
      title: 'Summarize GTI project',
      description: 'Summarizes one GTI project by status, priority, due dates and checklist progress.',
      inputSchema: scopedSummaryInputSchema,
      outputSchema: summaryOutputSchema,
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
      },
    },
    async ({ id, topN, dueSoonDays, fetchLimit }) => {
      const supabase = requireGtiSupabaseClient(config)
      const tasks = await fetchScopedTasks(supabase, 'project', id, fetchLimit)
      return toToolResult({
        summary: buildSummary(tasks, 'project', id, topN, dueSoonDays, fetchLimit),
      })
    },
  )

  server.registerTool(
    'gti_summarize_category',
    {
      title: 'Summarize GTI category',
      description: 'Summarizes one GTI category by status, priority, due dates and checklist progress.',
      inputSchema: scopedSummaryInputSchema,
      outputSchema: summaryOutputSchema,
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
      },
    },
    async ({ id, topN, dueSoonDays, fetchLimit }) => {
      const supabase = requireGtiSupabaseClient(config)
      const tasks = await fetchScopedTasks(supabase, 'category', id, fetchLimit)
      return toToolResult({
        summary: buildSummary(tasks, 'category', id, topN, dueSoonDays, fetchLimit),
      })
    },
  )
}
