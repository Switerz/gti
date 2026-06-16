import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { z } from 'zod'

import { startAudit } from '../audit.js'
import type { GtiMcpConfig } from '../config.js'
import { requireGtiSupabaseClient } from '../supabase.js'
import { normalizeTask, taskSelect, taskSummarySchema, type TaskRow } from './tasks.js'
import { toToolResult } from './utils.js'

const dateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/)
const prioritySchema = z.enum(['low', 'medium', 'high', 'urgent'])
const recurrenceSchema = z.enum(['none', 'weekly', 'monthly'])

const createTaskInputSchema = z.object({
  title: z.string().trim().min(1).max(140),
  description: z.string().trim().max(4000).optional(),
  statusId: z.string().uuid(),
  categoryId: z.string().uuid().optional(),
  projectId: z.string().uuid().optional(),
  ownerId: z.string().uuid().optional(),
  assigneeIds: z.array(z.string().uuid()).default([]),
  priority: prioritySchema.default('medium'),
  dueDate: dateSchema.optional(),
  startDate: dateSchema.optional(),
  recurrenceType: recurrenceSchema.default('none'),
  estimatedHours: z.number().min(0).max(9999).optional(),
  actualHours: z.number().min(0).max(9999).optional(),
  confirmAssignedToOther: z.boolean().default(false),
})

const updateTaskInputSchema = z
  .object({
    id: z.string().uuid(),
    title: z.string().trim().min(1).max(140).optional(),
    description: z.string().trim().max(4000).nullable().optional(),
    statusId: z.string().uuid().optional(),
    categoryId: z.string().uuid().nullable().optional(),
    projectId: z.string().uuid().nullable().optional(),
    ownerId: z.string().uuid().nullable().optional(),
    assigneeIds: z.array(z.string().uuid()).optional(),
    priority: prioritySchema.optional(),
    dueDate: dateSchema.nullable().optional(),
    startDate: dateSchema.nullable().optional(),
    recurrenceType: recurrenceSchema.optional(),
    estimatedHours: z.number().min(0).max(9999).nullable().optional(),
    actualHours: z.number().min(0).max(9999).nullable().optional(),
    confirmOwnerChange: z.boolean().default(false),
    confirmFinalize: z.boolean().default(false),
  })
  .refine(
    (input) =>
      Object.entries(input).some(
        ([key, value]) =>
          !['id', 'confirmOwnerChange', 'confirmFinalize'].includes(key) && value !== undefined,
      ),
    { message: 'Provide at least one task field to update.' },
  )

const moveTaskStatusInputSchema = z.object({
  id: z.string().uuid(),
  statusId: z.string().uuid(),
  position: z.number().default(0),
  confirmFinalize: z.boolean().default(false),
})

const archiveTaskInputSchema = z.object({
  id: z.string().uuid(),
  confirmArchive: z.boolean().default(false),
})

const taskWriteOutputSchema = z.object({
  requestId: z.string(),
  task: taskSummarySchema,
})

const moveTaskStatusOutputSchema = taskWriteOutputSchema.extend({
  finalized: z.boolean(),
})

type CurrentUser = {
  id: string
}

const getCurrentUser = async (
  supabase: ReturnType<typeof requireGtiSupabaseClient>,
  config: GtiMcpConfig,
): Promise<CurrentUser> => {
  const { data, error } = await supabase.auth.getUser(config.userAccessToken)
  if (error) throw error
  if (!data.user?.id) throw new Error('Authenticated GTI user not found for MCP token.')
  return { id: data.user.id }
}

const getTaskOrThrow = async (
  supabase: ReturnType<typeof requireGtiSupabaseClient>,
  taskId: string,
) => {
  const { data, error } = await supabase.from('tasks').select(taskSelect).eq('id', taskId).maybeSingle()
  if (error) throw error
  if (!data) throw new Error(`Task not found: ${taskId}`)
  return normalizeTask(data as unknown as TaskRow)
}

const getStatusOrThrow = async (
  supabase: ReturnType<typeof requireGtiSupabaseClient>,
  statusId: string,
) => {
  const { data, error } = await supabase
    .from('task_statuses')
    .select('id, is_final')
    .eq('id', statusId)
    .maybeSingle()

  if (error) throw error
  if (!data) throw new Error(`Task status not found: ${statusId}`)
  return data as { id: string; is_final: boolean | null }
}

const logTaskActivity = async (
  supabase: ReturnType<typeof requireGtiSupabaseClient>,
  taskId: string,
  actorId: string,
  action: string,
  metadata?: Record<string, unknown>,
) => {
  const { error } = await supabase.from('task_activity_logs').insert({
    task_id: taskId,
    actor_id: actorId,
    action,
    metadata: metadata ?? null,
  })
  if (error) throw error
}

const syncAssignees = async (
  supabase: ReturnType<typeof requireGtiSupabaseClient>,
  taskId: string,
  actorId: string,
  ownerId: string,
  assigneeIds: string[],
) => {
  const nextIds = Array.from(new Set([ownerId, ...assigneeIds].filter(Boolean)))

  const { data: existingRows, error: existingError } = await supabase
    .from('task_assignees')
    .select('profile_id')
    .eq('task_id', taskId)

  if (existingError) throw existingError

  const previousIds = (existingRows ?? []).map((row) => row.profile_id as string)
  const previous = new Set(previousIds)
  const next = new Set(nextIds)

  const removed = previousIds.filter((id) => !next.has(id))
  const added = nextIds.filter((id) => !previous.has(id))

  if (removed.length > 0) {
    const { error } = await supabase
      .from('task_assignees')
      .delete()
      .eq('task_id', taskId)
      .in('profile_id', removed)
    if (error) throw error
  }

  if (added.length > 0) {
    const { error } = await supabase.from('task_assignees').insert(
      added.map((profileId) => ({
        task_id: taskId,
        profile_id: profileId,
        assigned_by: actorId,
      })),
    )
    if (error) throw error
  }

  await Promise.all([
    ...added.map((profileId) =>
      logTaskActivity(supabase, taskId, actorId, 'assignee_added', { profile_id: profileId }),
    ),
    ...removed.map((profileId) =>
      logTaskActivity(supabase, taskId, actorId, 'assignee_removed', { profile_id: profileId }),
    ),
  ])
}

export const registerTaskWriteTools = (server: McpServer, config: GtiMcpConfig) => {
  server.registerTool(
    'gti_create_task',
    {
      title: 'Create GTI task',
      description: 'Creates one GTI task through the transactional create_task_with_assignees RPC.',
      inputSchema: createTaskInputSchema,
      outputSchema: taskWriteOutputSchema,
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: false,
      },
    },
    async (values) => {
      const audit = await startAudit('gti_create_task', values)
      try {
        const supabase = requireGtiSupabaseClient(config)
        const actor = await getCurrentUser(supabase, config)
        const ownerId = values.ownerId ?? actor.id
        const createsForOther = ownerId !== actor.id || values.assigneeIds.length > 0

        if (createsForOther && !values.confirmAssignedToOther) {
          throw new Error('Creating a task assigned to another person requires confirmAssignedToOther=true.')
        }

        const { data: taskId, error } = await supabase.rpc('create_task_with_assignees', {
          p_title: values.title.trim(),
          p_description: values.description?.trim() || null,
          p_status_id: values.statusId,
          p_category_id: values.categoryId ?? null,
          p_project_id: values.projectId ?? null,
          p_owner_id: ownerId,
          p_priority: values.priority,
          p_due_date: values.dueDate ?? null,
          p_start_date: values.startDate ?? null,
          p_recurrence_type: values.recurrenceType,
          p_estimated_hours: values.estimatedHours ?? null,
          p_actual_hours: values.actualHours ?? null,
          p_assignee_ids: values.assigneeIds,
        })

        if (error) throw error
        if (!taskId) throw new Error('Task RPC did not return a task id.')

        const task = await getTaskOrThrow(supabase, taskId as string)
        await audit.success({ taskId })
        return toToolResult({ requestId: audit.requestId, task })
      } catch (error) {
        await audit.failure(error)
        throw audit.error(error)
      }
    },
  )

  server.registerTool(
    'gti_update_task',
    {
      title: 'Update GTI task',
      description: 'Updates known fields on one GTI task and optionally synchronizes assignees.',
      inputSchema: updateTaskInputSchema,
      outputSchema: taskWriteOutputSchema,
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: false,
      },
    },
    async ({ id, assigneeIds, confirmOwnerChange, confirmFinalize, ...values }) => {
      const audit = await startAudit('gti_update_task', {
        id,
        assigneeIds,
        confirmOwnerChange,
        confirmFinalize,
        ...values,
      })
      try {
        const supabase = requireGtiSupabaseClient(config)
        const actor = await getCurrentUser(supabase, config)
        const existingTask = await getTaskOrThrow(supabase, id)

        if (values.ownerId !== undefined && values.ownerId !== existingTask.owner_id && !confirmOwnerChange) {
          throw new Error('Changing task owner requires confirmOwnerChange=true.')
        }

        let statusIsFinal = false
        if (values.statusId !== undefined) {
          const status = await getStatusOrThrow(supabase, values.statusId)
          statusIsFinal = Boolean(status.is_final)
          if (statusIsFinal && !confirmFinalize) {
            throw new Error('Moving a task to a final status requires confirmFinalize=true.')
          }
        }

        const payload: Record<string, unknown> = {}
        if (values.title !== undefined) payload.title = values.title.trim()
        if (values.description !== undefined) payload.description = values.description?.trim() || null
        if (values.statusId !== undefined) {
          payload.status_id = values.statusId
          payload.completed_at = statusIsFinal ? new Date().toISOString() : null
        }
        if (values.categoryId !== undefined) payload.category_id = values.categoryId || null
        if (values.projectId !== undefined) payload.project_id = values.projectId || null
        if (values.ownerId !== undefined) payload.owner_id = values.ownerId || null
        if (values.priority !== undefined) payload.priority = values.priority
        if (values.dueDate !== undefined) payload.due_date = values.dueDate || null
        if (values.startDate !== undefined) payload.start_date = values.startDate || null
        if (values.recurrenceType !== undefined) payload.recurrence_type = values.recurrenceType
        if (values.estimatedHours !== undefined) payload.estimated_hours = values.estimatedHours
        if (values.actualHours !== undefined) payload.actual_hours = values.actualHours

        if (Object.keys(payload).length > 0) {
          const { error } = await supabase.from('tasks').update(payload).eq('id', id)
          if (error) throw error
        }

        if (assigneeIds !== undefined) {
          await syncAssignees(
            supabase,
            id,
            actor.id,
            (values.ownerId ?? existingTask.owner_id ?? actor.id) as string,
            assigneeIds,
          )
        }

        await logTaskActivity(
          supabase,
          id,
          actor.id,
          values.statusId !== undefined ? 'status_changed' : 'task_updated',
          payload,
        )

        const task = await getTaskOrThrow(supabase, id)
        await audit.success({ taskId: id })
        return toToolResult({ requestId: audit.requestId, task })
      } catch (error) {
        await audit.failure(error)
        throw audit.error(error)
      }
    },
  )

  server.registerTool(
    'gti_move_task_status',
    {
      title: 'Move GTI task status',
      description: 'Moves one task to another status and updates its Kanban position.',
      inputSchema: moveTaskStatusInputSchema,
      outputSchema: moveTaskStatusOutputSchema,
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: false,
      },
    },
    async ({ id, statusId, position, confirmFinalize }) => {
      const audit = await startAudit('gti_move_task_status', {
        id,
        statusId,
        position,
        confirmFinalize,
      })
      try {
        const supabase = requireGtiSupabaseClient(config)
        const actor = await getCurrentUser(supabase, config)
        const status = await getStatusOrThrow(supabase, statusId)
        const finalized = Boolean(status.is_final)

        if (finalized && !confirmFinalize) {
          throw new Error('Moving a task to a final status requires confirmFinalize=true.')
        }

        const { error } = await supabase
          .from('tasks')
          .update({
            status_id: statusId,
            position,
            completed_at: finalized ? new Date().toISOString() : null,
          })
          .eq('id', id)

        if (error) throw error

        await logTaskActivity(supabase, id, actor.id, 'status_changed', { status_id: statusId })

        const task = await getTaskOrThrow(supabase, id)
        await audit.success({ taskId: id, finalized })
        return toToolResult({ requestId: audit.requestId, task, finalized })
      } catch (error) {
        await audit.failure(error)
        throw audit.error(error)
      }
    },
  )

  server.registerTool(
    'gti_archive_task',
    {
      title: 'Archive GTI task',
      description: 'Archives one GTI task when confirmArchive=true and records task_archived activity.',
      inputSchema: archiveTaskInputSchema,
      outputSchema: taskWriteOutputSchema,
      annotations: {
        readOnlyHint: false,
        destructiveHint: true,
        idempotentHint: false,
      },
    },
    async ({ id, confirmArchive }) => {
      const audit = await startAudit('gti_archive_task', { id, confirmArchive })
      try {
        if (!confirmArchive) {
          throw new Error('Archiving a task requires confirmArchive=true.')
        }

        const supabase = requireGtiSupabaseClient(config)
        const actor = await getCurrentUser(supabase, config)
        const existingTask = await getTaskOrThrow(supabase, id)

        if (existingTask.is_archived) {
          throw new Error(`Task is already archived: ${id}`)
        }

        const { error } = await supabase.from('tasks').update({ is_archived: true }).eq('id', id)
        if (error) throw error

        await logTaskActivity(supabase, id, actor.id, 'task_archived')

        const task = await getTaskOrThrow(supabase, id)
        await audit.success({ taskId: id, archived: true })
        return toToolResult({ requestId: audit.requestId, task })
      } catch (error) {
        await audit.failure(error)
        throw audit.error(error)
      }
    },
  )
}
