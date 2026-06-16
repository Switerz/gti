import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { z } from 'zod'

import type { GtiMcpConfig } from '../config.js'
import { requireGtiSupabaseClient } from '../supabase.js'
import { normalizeTask, taskSelect, taskSummarySchema, type TaskRow } from './tasks.js'
import { toToolResult } from './utils.js'

const DEFAULT_FETCH_LIMIT = 200
const MAX_FETCH_LIMIT = 500
const DEFAULT_MAX_SUGGESTIONS = 10
const MAX_SUGGESTIONS = 20
const DEFAULT_DUE_SOON_DAYS = 7

const suggestNextActionsInputSchema = z
  .object({
    scope: z.enum(['my_tasks', 'project', 'category']).default('my_tasks'),
    projectId: z.string().uuid().optional(),
    categoryId: z.string().uuid().optional(),
    maxSuggestions: z.number().int().min(1).max(MAX_SUGGESTIONS).default(DEFAULT_MAX_SUGGESTIONS),
    dueSoonDays: z.number().int().min(1).max(30).default(DEFAULT_DUE_SOON_DAYS),
    fetchLimit: z.number().int().min(1).max(MAX_FETCH_LIMIT).default(DEFAULT_FETCH_LIMIT),
  })
  .refine((input) => input.scope !== 'project' || Boolean(input.projectId), {
    message: 'projectId is required when scope=project.',
  })
  .refine((input) => input.scope !== 'category' || Boolean(input.categoryId), {
    message: 'categoryId is required when scope=category.',
  })

const suggestionSchema = z.object({
  taskId: z.string(),
  title: z.string(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']),
  due_date: z.string().nullable(),
  status: z.string().nullable(),
  owner_id: z.string().nullable(),
  criteria: z.array(z.string()),
  suggestion: z.string(),
})

const suggestNextActionsOutputSchema = z.object({
  scope: z.enum(['my_tasks', 'project', 'category']),
  scopeId: z.string().nullable(),
  today: z.string(),
  dueSoonDays: z.number(),
  fetched: z.number(),
  truncated: z.boolean(),
  criteriaUsed: z.array(z.string()),
  suggestions: z.array(suggestionSchema),
})

type SupabaseClient = ReturnType<typeof requireGtiSupabaseClient>
type TaskSummary = z.infer<typeof taskSummarySchema>
type Suggestion = z.infer<typeof suggestionSchema>
type SuggestionScope = z.infer<typeof suggestNextActionsOutputSchema>['scope']

const criteriaUsed = [
  'atrasada',
  'urgente',
  'sem_responsavel',
  'sem_checklist',
  'status_inicial',
  'proxima_de_vencer',
]

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
  config: GtiMcpConfig,
  scope: SuggestionScope,
  scopeId: string | null,
  limit: number,
) => {
  if (scope === 'my_tasks') {
    const userId = await getCurrentUserId(supabase, config)

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

    if (extraIds.length === 0) return { scopeId: userId, tasks: directTasks }

    const { data: extraData, error: extraError } = await supabase
      .from('tasks')
      .select(taskSelect)
      .eq('is_archived', false)
      .in('id', extraIds)
      .order('due_date', { ascending: true, nullsFirst: false })
      .order('updated_at', { ascending: false })
      .limit(limit)

    if (extraError) throw extraError
    return { scopeId: userId, tasks: uniqueTasks([...directTasks, ...normalizeRows(extraData)]).slice(0, limit) }
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
  return { scopeId, tasks: normalizeRows(data) }
}

const isInitialStatus = (task: TaskSummary) => {
  const slug = task.status?.slug?.toLowerCase()
  const name = task.status?.name?.toLowerCase()
  return ['todo', 'to-do', 'backlog', 'a-fazer', 'fazer', 'novo'].some(
    (value) => slug === value || name === value || name?.includes('a fazer'),
  )
}

const scoreCriteria = (criteria: string[]) =>
  criteria.reduce((score, criterion) => {
    if (criterion === 'atrasada') return score + 50
    if (criterion === 'urgente') return score + 35
    if (criterion === 'proxima_de_vencer') return score + 25
    if (criterion === 'sem_responsavel') return score + 20
    if (criterion === 'sem_checklist') return score + 10
    if (criterion === 'status_inicial') return score + 8
    return score
  }, 0)

const buildSuggestionText = (criteria: string[]) => {
  if (criteria.includes('atrasada')) return 'Priorizar desbloqueio, revisar responsavel e definir uma proxima acao objetiva.'
  if (criteria.includes('urgente')) return 'Confirmar dono, prazo e primeiro passo para evitar perda de prioridade.'
  if (criteria.includes('proxima_de_vencer')) return 'Revisar andamento hoje e atualizar checklist/status se houver progresso.'
  if (criteria.includes('sem_responsavel')) return 'Definir responsavel antes de planejar execucao.'
  if (criteria.includes('sem_checklist')) return 'Adicionar checklist minimo com as proximas etapas executaveis.'
  return 'Revisar se a tarefa ainda deve permanecer no status inicial ou se ja pode avancar.'
}

const buildSuggestions = (
  tasks: TaskSummary[],
  today: string,
  dueSoonEndDate: string,
  maxSuggestions: number,
) => {
  const suggestions = tasks
    .filter((task) => !task.status?.is_final)
    .map((task) => {
      const criteria: string[] = []
      if (task.due_date && task.due_date < today) criteria.push('atrasada')
      if (task.priority === 'urgent') criteria.push('urgente')
      if (!task.owner_id) criteria.push('sem_responsavel')
      if (task.checklist_progress.total === 0) criteria.push('sem_checklist')
      if (isInitialStatus(task)) criteria.push('status_inicial')
      if (task.due_date && task.due_date >= today && task.due_date <= dueSoonEndDate) {
        criteria.push('proxima_de_vencer')
      }

      return {
        task,
        criteria,
        score: scoreCriteria(criteria),
      }
    })
    .filter((item) => item.criteria.length > 0)
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score
      return (a.task.due_date ?? '9999-12-31').localeCompare(b.task.due_date ?? '9999-12-31')
    })
    .slice(0, maxSuggestions)

  return suggestions.map<Suggestion>(({ task, criteria }) => ({
    taskId: task.id,
    title: task.title,
    priority: task.priority,
    due_date: task.due_date,
    status: task.status?.name ?? null,
    owner_id: task.owner_id,
    criteria,
    suggestion: buildSuggestionText(criteria),
  }))
}

export const registerTaskNextActionTools = (server: McpServer, config: GtiMcpConfig) => {
  server.registerTool(
    'gti_suggest_next_actions',
    {
      title: 'Suggest GTI next actions',
      description:
        'Suggests next actions from real GTI tasks without writing changes. Uses overdue, urgent, unowned, missing-checklist, initial-status and due-soon criteria.',
      inputSchema: suggestNextActionsInputSchema,
      outputSchema: suggestNextActionsOutputSchema,
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
      },
    },
    async ({ scope, projectId, categoryId, maxSuggestions, dueSoonDays, fetchLimit }) => {
      const supabase = requireGtiSupabaseClient(config)
      const requestedScopeId = scope === 'project' ? projectId : scope === 'category' ? categoryId : null
      const { scopeId, tasks } = await fetchScopedTasks(supabase, config, scope, requestedScopeId ?? null, fetchLimit)
      const today = new Date().toISOString().slice(0, 10)
      const dueSoonEnd = new Date(`${today}T00:00:00.000Z`)
      dueSoonEnd.setUTCDate(dueSoonEnd.getUTCDate() + dueSoonDays)

      return toToolResult({
        scope,
        scopeId,
        today,
        dueSoonDays,
        fetched: tasks.length,
        truncated: tasks.length >= fetchLimit,
        criteriaUsed,
        suggestions: buildSuggestions(tasks, today, dueSoonEnd.toISOString().slice(0, 10), maxSuggestions),
      })
    },
  )
}
