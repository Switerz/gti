import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { z } from 'zod'

import type { GtiMcpConfig } from '../config.js'
import { requireGtiSupabaseClient } from '../supabase.js'
import { toToolResult } from './utils.js'

const MAX_TASK_LIMIT = 50
const DEFAULT_TASK_LIMIT = 20

export const taskSelect = `
  id,
  title,
  description,
  status_id,
  category_id,
  project_id,
  creator_id,
  owner_id,
  priority,
  due_date,
  start_date,
  completed_at,
  position,
  is_archived,
  created_at,
  updated_at,
  recurrence_type,
  estimated_hours,
  actual_hours,
  status:task_statuses(id, name, slug, color, is_final),
  category:categories(id, name, color),
  project:projects(id, name),
  creator:profiles!creator_id(id, full_name, avatar_url),
  owner:profiles!owner_id(id, full_name, avatar_url),
  assignees:task_assignees(profile:profiles!task_assignees_profile_id_fkey(id, full_name, avatar_url)),
  _comments:task_comments(id),
  _checklist:task_checklist_items(id, is_done, title, position)
` as const

const profileSummarySchema = z
  .object({
    id: z.string(),
    full_name: z.string().nullable(),
    avatar_url: z.string().nullable(),
  })
  .nullable()

const taskStatusSummarySchema = z
  .object({
    id: z.string(),
    name: z.string(),
    slug: z.string(),
    color: z.string().nullable(),
    is_final: z.boolean().nullable(),
  })
  .nullable()

const categorySummarySchema = z
  .object({
    id: z.string(),
    name: z.string(),
    color: z.string().nullable(),
  })
  .nullable()

const projectSummarySchema = z
  .object({
    id: z.string(),
    name: z.string(),
  })
  .nullable()

const checklistProgressSchema = z.object({
  done: z.number(),
  total: z.number(),
})

export const taskSummarySchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string().nullable(),
  status_id: z.string(),
  category_id: z.string().nullable(),
  project_id: z.string().nullable(),
  creator_id: z.string(),
  owner_id: z.string().nullable(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']),
  due_date: z.string().nullable(),
  start_date: z.string().nullable(),
  completed_at: z.string().nullable(),
  position: z.number().nullable(),
  is_archived: z.boolean().nullable(),
  created_at: z.string().nullable(),
  updated_at: z.string().nullable(),
  recurrence_type: z.enum(['none', 'weekly', 'monthly']).nullable(),
  estimated_hours: z.number().nullable(),
  actual_hours: z.number().nullable(),
  status: taskStatusSummarySchema,
  category: categorySummarySchema,
  project: projectSummarySchema,
  creator: profileSummarySchema,
  owner: profileSummarySchema,
  assignees: z.array(profileSummarySchema.unwrap()),
  comment_count: z.number(),
  checklist_progress: checklistProgressSchema,
})

const commentSchema = z.object({
  id: z.string(),
  task_id: z.string(),
  body: z.string(),
  created_at: z.string().nullable(),
  updated_at: z.string().nullable(),
  author: profileSummarySchema,
})

const activityLogSchema = z.object({
  id: z.string(),
  task_id: z.string(),
  action: z.string(),
  metadata: z.record(z.string(), z.unknown()).nullable(),
  created_at: z.string().nullable(),
  actor: profileSummarySchema,
})

const taskDetailSchema = taskSummarySchema.extend({
  checklist_items: z.array(
    z.object({
      id: z.string(),
      title: z.string(),
      is_done: z.boolean().nullable(),
      position: z.number().nullable(),
    }),
  ),
  recent_comments: z.array(commentSchema),
  recent_activity: z.array(activityLogSchema),
})

const taskFiltersSchema = z.object({
  ownerId: z.string().uuid().optional(),
  creatorId: z.string().uuid().optional(),
  categoryId: z.string().uuid().optional(),
  projectId: z.string().uuid().optional(),
  statusId: z.string().uuid().optional(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
  includeArchived: z.boolean().default(false),
  limit: z.number().int().min(1).max(MAX_TASK_LIMIT).default(DEFAULT_TASK_LIMIT),
})

const searchTasksInputSchema = taskFiltersSchema.extend({
  query: z.string().trim().min(1).max(140),
})

const getTaskInputSchema = z.object({
  id: z.string().uuid(),
  recentLimit: z.number().int().min(1).max(20).default(10),
})

const taskListOutputSchema = z.object({
  tasks: z.array(taskSummarySchema),
  count: z.number(),
  limit: z.number(),
  includeArchived: z.boolean(),
})

const taskSearchOutputSchema = taskListOutputSchema.extend({
  query: z.string(),
})

const getTaskOutputSchema = z.object({
  task: taskDetailSchema.nullable(),
})

export type ProfileSummary = {
  id: string
  full_name: string | null
  avatar_url: string | null
}

export type EmbeddedChecklistItem = {
  id: string
  title: string
  is_done: boolean | null
  position: number | null
}

type MaybeOne<T> = T | T[] | null
type TaskStatusSummary = NonNullable<z.infer<typeof taskStatusSummarySchema>>
type CategorySummary = NonNullable<z.infer<typeof categorySummarySchema>>
type ProjectSummary = NonNullable<z.infer<typeof projectSummarySchema>>

export type TaskRow = {
  id: string
  title: string
  description: string | null
  status_id: string
  category_id: string | null
  project_id: string | null
  creator_id: string
  owner_id: string | null
  priority: 'low' | 'medium' | 'high' | 'urgent'
  due_date: string | null
  start_date: string | null
  completed_at: string | null
  position: number | null
  is_archived: boolean | null
  created_at: string | null
  updated_at: string | null
  recurrence_type: 'none' | 'weekly' | 'monthly' | null
  estimated_hours: number | null
  actual_hours: number | null
  status: MaybeOne<TaskStatusSummary>
  category: MaybeOne<CategorySummary>
  project: MaybeOne<ProjectSummary>
  creator: MaybeOne<ProfileSummary>
  owner: MaybeOne<ProfileSummary>
  assignees: Array<{ profile: ProfileSummary | null }>
  _comments: Array<{ id: string }>
  _checklist: EmbeddedChecklistItem[]
}

type CommentRow = {
  id: string
  task_id: string
  body: string
  created_at: string | null
  updated_at: string | null
  author: MaybeOne<ProfileSummary>
}

type ActivityLogRow = {
  id: string
  task_id: string
  action: string
  metadata: Record<string, unknown> | null
  created_at: string | null
  actor: MaybeOne<ProfileSummary>
}

const normalizeMaybeOne = <T>(value: MaybeOne<T>): T | null => {
  if (Array.isArray(value)) return value[0] ?? null
  return value
}

export const normalizeTask = (task: TaskRow): z.infer<typeof taskSummarySchema> => {
  const checklistItems = task._checklist ?? []
  const checklistDone = checklistItems.filter((item) => item.is_done).length

  return {
    id: task.id,
    title: task.title,
    description: task.description,
    status_id: task.status_id,
    category_id: task.category_id,
    project_id: task.project_id,
    creator_id: task.creator_id,
    owner_id: task.owner_id,
    priority: task.priority,
    due_date: task.due_date,
    start_date: task.start_date,
    completed_at: task.completed_at,
    position: task.position,
    is_archived: task.is_archived,
    created_at: task.created_at,
    updated_at: task.updated_at,
    recurrence_type: task.recurrence_type,
    estimated_hours: task.estimated_hours,
    actual_hours: task.actual_hours,
    status: normalizeMaybeOne(task.status),
    category: normalizeMaybeOne(task.category),
    project: normalizeMaybeOne(task.project),
    creator: normalizeMaybeOne(task.creator),
    owner: normalizeMaybeOne(task.owner),
    assignees: (task.assignees ?? [])
      .map((assignee) => assignee.profile)
      .filter((profile): profile is ProfileSummary => profile !== null),
    comment_count: task._comments?.length ?? 0,
    checklist_progress: {
      done: checklistDone,
      total: checklistItems.length,
    },
  }
}

const normalizeComment = (comment: CommentRow): z.infer<typeof commentSchema> => ({
  ...comment,
  author: normalizeMaybeOne(comment.author),
})

const normalizeActivityLog = (activity: ActivityLogRow): z.infer<typeof activityLogSchema> => ({
  ...activity,
  actor: normalizeMaybeOne(activity.actor),
})

const applyTaskFilters = <QueryBuilder>(
  query: QueryBuilder,
  filters: z.infer<typeof taskFiltersSchema>,
) => {
  let filteredQuery = query as QueryBuilder & {
    eq: (column: string, value: unknown) => typeof filteredQuery
    limit: (count: number) => typeof filteredQuery
  }

  if (!filters.includeArchived) filteredQuery = filteredQuery.eq('is_archived', false)
  if (filters.ownerId) filteredQuery = filteredQuery.eq('owner_id', filters.ownerId)
  if (filters.creatorId) filteredQuery = filteredQuery.eq('creator_id', filters.creatorId)
  if (filters.categoryId) filteredQuery = filteredQuery.eq('category_id', filters.categoryId)
  if (filters.projectId) filteredQuery = filteredQuery.eq('project_id', filters.projectId)
  if (filters.statusId) filteredQuery = filteredQuery.eq('status_id', filters.statusId)
  if (filters.priority) filteredQuery = filteredQuery.eq('priority', filters.priority)

  return filteredQuery
}

export const registerTaskReadTools = (server: McpServer, config: GtiMcpConfig) => {
  server.registerTool(
    'gti_list_tasks',
    {
      title: 'List GTI tasks',
      description: 'Lists GTI tasks with optional filters, excluding archived tasks by default.',
      inputSchema: taskFiltersSchema,
      outputSchema: taskListOutputSchema,
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
      },
    },
    async (filters) => {
      const supabase = requireGtiSupabaseClient(config)
      let query = supabase
        .from('tasks')
        .select(taskSelect)
        .order('position', { ascending: true })
        .order('created_at', { ascending: false })
        .limit(filters.limit)

      query = applyTaskFilters(query, filters)

      const { data, error } = await query
      if (error) throw error

      const tasks = ((data ?? []) as unknown as TaskRow[]).map(normalizeTask)

      return toToolResult({
        tasks,
        count: tasks.length,
        limit: filters.limit,
        includeArchived: filters.includeArchived,
      })
    },
  )

  server.registerTool(
    'gti_search_tasks',
    {
      title: 'Search GTI tasks',
      description: 'Searches GTI tasks by title with optional filters, excluding archived tasks by default.',
      inputSchema: searchTasksInputSchema,
      outputSchema: taskSearchOutputSchema,
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
      },
    },
    async ({ query: searchText, ...filters }) => {
      const supabase = requireGtiSupabaseClient(config)
      let query = supabase
        .from('tasks')
        .select(taskSelect)
        .ilike('title', `%${searchText}%`)
        .order('position', { ascending: true })
        .order('created_at', { ascending: false })
        .limit(filters.limit)

      query = applyTaskFilters(query, filters)

      const { data, error } = await query
      if (error) throw error

      const tasks = ((data ?? []) as unknown as TaskRow[]).map(normalizeTask)

      return toToolResult({
        tasks,
        count: tasks.length,
        limit: filters.limit,
        includeArchived: filters.includeArchived,
        query: searchText,
      })
    },
  )

  server.registerTool(
    'gti_get_task',
    {
      title: 'Get GTI task',
      description: 'Gets one GTI task with checklist, recent comments and recent activity.',
      inputSchema: getTaskInputSchema,
      outputSchema: getTaskOutputSchema,
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
      },
    },
    async ({ id, recentLimit }) => {
      const supabase = requireGtiSupabaseClient(config)

      const [
        { data: taskData, error: taskError },
        { data: commentsData, error: commentsError },
        { data: activityData, error: activityError },
      ] = await Promise.all([
        supabase.from('tasks').select(taskSelect).eq('id', id).maybeSingle(),
        supabase
          .from('task_comments')
          .select('id, task_id, body, created_at, updated_at, author:profiles!author_id(id, full_name, avatar_url)')
          .eq('task_id', id)
          .order('created_at', { ascending: false })
          .limit(recentLimit),
        supabase
          .from('task_activity_logs')
          .select('id, task_id, action, metadata, created_at, actor:profiles!actor_id(id, full_name, avatar_url)')
          .eq('task_id', id)
          .order('created_at', { ascending: false })
          .limit(recentLimit),
      ])

      if (taskError) throw taskError
      if (commentsError) throw commentsError
      if (activityError) throw activityError

      if (!taskData) {
        return toToolResult({ task: null })
      }

      const taskRow = taskData as unknown as TaskRow
      const task = {
        ...normalizeTask(taskRow),
        checklist_items: [...(taskRow._checklist ?? [])].sort(
          (a, b) => (a.position ?? 0) - (b.position ?? 0),
        ),
        recent_comments: ((commentsData ?? []) as unknown as CommentRow[]).map(normalizeComment),
        recent_activity: ((activityData ?? []) as unknown as ActivityLogRow[]).map(
          normalizeActivityLog,
        ),
      }

      return toToolResult({ task })
    },
  )
}
