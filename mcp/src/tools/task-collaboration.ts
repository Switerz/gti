import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { z } from 'zod'

import { startAudit } from '../audit.js'
import type { GtiMcpConfig } from '../config.js'
import { requireGtiSupabaseClient } from '../supabase.js'
import { toToolResult } from './utils.js'

const checklistItemSchema = z.object({
  id: z.string(),
  task_id: z.string(),
  title: z.string(),
  is_done: z.boolean().nullable(),
  position: z.number().nullable(),
  created_at: z.string().nullable(),
  updated_at: z.string().nullable(),
})

const profileSummarySchema = z
  .object({
    id: z.string(),
    full_name: z.string().nullable(),
    avatar_url: z.string().nullable(),
  })
  .nullable()

const commentSchema = z.object({
  id: z.string(),
  task_id: z.string(),
  author_id: z.string().nullable(),
  body: z.string(),
  created_at: z.string().nullable(),
  updated_at: z.string().nullable(),
  author: profileSummarySchema,
})

const checklistOutputSchema = z.object({
  requestId: z.string(),
  taskId: z.string(),
  checklist: z.array(checklistItemSchema),
})

const deletedChecklistOutputSchema = checklistOutputSchema.extend({
  deletedId: z.string(),
})

const commentOutputSchema = z.object({
  requestId: z.string(),
  comment: commentSchema,
})

const addChecklistInputSchema = z.object({
  taskId: z.string().uuid(),
  title: z.string().trim().min(1).max(500),
  position: z.number().int().min(0).default(0),
})

const updateChecklistInputSchema = z.object({
  id: z.string().uuid(),
  title: z.string().trim().min(1).max(500),
})

const toggleChecklistInputSchema = z.object({
  id: z.string().uuid(),
  isDone: z.boolean(),
})

const deleteChecklistInputSchema = z.object({
  id: z.string().uuid(),
  confirmDelete: z.boolean().default(false),
})

const addCommentInputSchema = z.object({
  taskId: z.string().uuid(),
  body: z.string().trim().min(1).max(4000),
})

type SupabaseClient = ReturnType<typeof requireGtiSupabaseClient>

type ChecklistItem = z.infer<typeof checklistItemSchema>
type ProfileSummary = NonNullable<z.infer<typeof profileSummarySchema>>
type MaybeOne<T> = T | T[] | null

type CommentRow = {
  id: string
  task_id: string
  author_id: string | null
  body: string
  created_at: string | null
  updated_at: string | null
  author: MaybeOne<ProfileSummary>
}

const normalizeMaybeOne = <T>(value: MaybeOne<T>): T | null => {
  if (Array.isArray(value)) return value[0] ?? null
  return value
}

const getCurrentUserId = async (supabase: SupabaseClient, config: GtiMcpConfig) => {
  const { data, error } = await supabase.auth.getUser(config.userAccessToken)
  if (error) throw error
  if (!data.user?.id) throw new Error('Authenticated GTI user not found for MCP token.')
  return data.user.id
}

const fetchChecklist = async (supabase: SupabaseClient, taskId: string) => {
  const { data, error } = await supabase
    .from('task_checklist_items')
    .select('id, task_id, title, is_done, position, created_at, updated_at')
    .eq('task_id', taskId)
    .order('position', { ascending: true })
    .order('created_at', { ascending: true })

  if (error) throw error
  return (data ?? []) as ChecklistItem[]
}

const fetchChecklistItemOrThrow = async (supabase: SupabaseClient, id: string) => {
  const { data, error } = await supabase
    .from('task_checklist_items')
    .select('id, task_id, title, is_done, position, created_at, updated_at')
    .eq('id', id)
    .maybeSingle()

  if (error) throw error
  if (!data) throw new Error(`Checklist item not found: ${id}`)
  return data as ChecklistItem
}

const logTaskActivity = async (
  supabase: SupabaseClient,
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

export const registerTaskCollaborationTools = (server: McpServer, config: GtiMcpConfig) => {
  server.registerTool(
    'gti_add_checklist_item',
    {
      title: 'Add GTI checklist item',
      description: 'Adds one checklist item to a GTI task and returns the updated checklist.',
      inputSchema: addChecklistInputSchema,
      outputSchema: checklistOutputSchema,
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: false,
      },
    },
    async ({ taskId, title, position }) => {
      const audit = await startAudit('gti_add_checklist_item', { taskId, title, position })
      try {
        const supabase = requireGtiSupabaseClient(config)
        const actorId = await getCurrentUserId(supabase, config)

        const { data, error } = await supabase
          .from('task_checklist_items')
          .insert({ task_id: taskId, title: title.trim(), position })
          .select('id, task_id, title, is_done, position, created_at, updated_at')
          .single()

        if (error) throw error

        await logTaskActivity(supabase, taskId, actorId, 'task_updated', {
          checklist_item_id: data.id,
          checklist_item_title: data.title,
        })

        await audit.success({ taskId, checklistItemId: data.id })
        return toToolResult({
          requestId: audit.requestId,
          taskId,
          checklist: await fetchChecklist(supabase, taskId),
        })
      } catch (error) {
        await audit.failure(error)
        throw audit.error(error)
      }
    },
  )

  server.registerTool(
    'gti_update_checklist_item',
    {
      title: 'Update GTI checklist item',
      description: 'Updates one checklist item title and returns the updated checklist.',
      inputSchema: updateChecklistInputSchema,
      outputSchema: checklistOutputSchema,
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: false,
      },
    },
    async ({ id, title }) => {
      const audit = await startAudit('gti_update_checklist_item', { id, title })
      try {
        const supabase = requireGtiSupabaseClient(config)
        const actorId = await getCurrentUserId(supabase, config)

        const { data, error } = await supabase
          .from('task_checklist_items')
          .update({ title: title.trim() })
          .eq('id', id)
          .select('id, task_id, title, is_done, position, created_at, updated_at')
          .single()

        if (error) throw error

        await logTaskActivity(supabase, data.task_id, actorId, 'task_updated', {
          checklist_item_id: data.id,
          checklist_item_title: data.title,
        })

        await audit.success({ taskId: data.task_id, checklistItemId: data.id })
        return toToolResult({
          requestId: audit.requestId,
          taskId: data.task_id,
          checklist: await fetchChecklist(supabase, data.task_id),
        })
      } catch (error) {
        await audit.failure(error)
        throw audit.error(error)
      }
    },
  )

  server.registerTool(
    'gti_toggle_checklist_item',
    {
      title: 'Toggle GTI checklist item',
      description: 'Marks one checklist item done or not done and returns the updated checklist.',
      inputSchema: toggleChecklistInputSchema,
      outputSchema: checklistOutputSchema,
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: false,
      },
    },
    async ({ id, isDone }) => {
      const audit = await startAudit('gti_toggle_checklist_item', { id, isDone })
      try {
        const supabase = requireGtiSupabaseClient(config)
        const actorId = await getCurrentUserId(supabase, config)

        const { data, error } = await supabase
          .from('task_checklist_items')
          .update({ is_done: isDone })
          .eq('id', id)
          .select('id, task_id, title, is_done, position, created_at, updated_at')
          .single()

        if (error) throw error

        await logTaskActivity(
          supabase,
          data.task_id,
          actorId,
          isDone ? 'checklist_item_done' : 'task_updated',
          { checklist_item_id: data.id, checklist_item_title: data.title, is_done: isDone },
        )

        await audit.success({ taskId: data.task_id, checklistItemId: data.id, isDone })
        return toToolResult({
          requestId: audit.requestId,
          taskId: data.task_id,
          checklist: await fetchChecklist(supabase, data.task_id),
        })
      } catch (error) {
        await audit.failure(error)
        throw audit.error(error)
      }
    },
  )

  server.registerTool(
    'gti_delete_checklist_item',
    {
      title: 'Delete GTI checklist item',
      description: 'Deletes one checklist item only when confirmDelete=true and returns the updated checklist.',
      inputSchema: deleteChecklistInputSchema,
      outputSchema: deletedChecklistOutputSchema,
      annotations: {
        readOnlyHint: false,
        destructiveHint: true,
        idempotentHint: false,
      },
    },
    async ({ id, confirmDelete }) => {
      const audit = await startAudit('gti_delete_checklist_item', { id, confirmDelete })
      try {
        if (!confirmDelete) {
          throw new Error('Deleting a checklist item requires confirmDelete=true.')
        }

        const supabase = requireGtiSupabaseClient(config)
        const actorId = await getCurrentUserId(supabase, config)
        const existing = await fetchChecklistItemOrThrow(supabase, id)

        const { error } = await supabase.from('task_checklist_items').delete().eq('id', id)
        if (error) throw error

        await logTaskActivity(supabase, existing.task_id, actorId, 'task_updated', {
          checklist_item_id: existing.id,
          checklist_item_title: existing.title,
          checklist_item_deleted: true,
        })

        await audit.success({ taskId: existing.task_id, checklistItemId: id, deleted: true })
        return toToolResult({
          requestId: audit.requestId,
          taskId: existing.task_id,
          deletedId: id,
          checklist: await fetchChecklist(supabase, existing.task_id),
        })
      } catch (error) {
        await audit.failure(error)
        throw audit.error(error)
      }
    },
  )

  server.registerTool(
    'gti_add_comment',
    {
      title: 'Add GTI task comment',
      description: 'Adds one comment to a GTI task and records activity.',
      inputSchema: addCommentInputSchema,
      outputSchema: commentOutputSchema,
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: false,
      },
    },
    async ({ taskId, body }) => {
      const audit = await startAudit('gti_add_comment', { taskId, body })
      try {
        const supabase = requireGtiSupabaseClient(config)
        const actorId = await getCurrentUserId(supabase, config)

        const { data, error } = await supabase
          .from('task_comments')
          .insert({ task_id: taskId, author_id: actorId, body: body.trim() })
          .select('id, task_id, author_id, body, created_at, updated_at, author:profiles!author_id(id, full_name, avatar_url)')
          .single()

        if (error) throw error

        await logTaskActivity(supabase, taskId, actorId, 'comment_added')

        const commentRow = data as unknown as CommentRow
        await audit.success({ taskId, commentId: commentRow.id })
        return toToolResult({
          requestId: audit.requestId,
          comment: {
            ...commentRow,
            author: normalizeMaybeOne(commentRow.author),
          },
        })
      } catch (error) {
        await audit.failure(error)
        throw audit.error(error)
      }
    },
  )
}
