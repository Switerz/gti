/* eslint-disable @typescript-eslint/no-explicit-any */
// The `as any` casts on supabase.from() calls work around a TypeScript 6.x
// inference regression with the Supabase JS SDK v2 mutation methods.
import { supabase } from '@/lib/supabase'
import type { TaskActivityAction, TaskFormValues, TaskWithRelations } from '@/types/domain'

import {
  buildCreateTaskPayload,
  buildTaskAssigneeRows,
  buildUpdateTaskPayload,
} from './task-payload'
import { diffAssigneeIds } from './task-assignees'

const TASK_SELECT = `
  *,
  status:task_statuses(id, name, slug, color, is_final),
  category:categories(id, name, color),
  project:projects(id, name),
  creator:profiles!creator_id(id, full_name, avatar_url),
  owner:profiles!owner_id(id, full_name, avatar_url),
  assignees:task_assignees(profile:profiles!task_assignees_profile_id_fkey(id, full_name, avatar_url)),
  _comments:task_comments(id),
  _checklist:task_checklist_items(id, is_done)
` as const

export interface TaskFilters {
  ownerId?: string
  creatorId?: string
  categoryId?: string
  projectId?: string
  priority?: string
  statusId?: string
  search?: string
  archived?: boolean
}

const db = {
  tasks: () => supabase.from('tasks') as any,
  task_assignees: () => supabase.from('task_assignees') as any,
  task_activity_logs: () => supabase.from('task_activity_logs') as any,
  task_statuses: () => supabase.from('task_statuses') as any,
}

export const taskService = {
  async getAll(filters: TaskFilters = {}): Promise<TaskWithRelations[]> {
    let query = supabase.from('tasks').select(TASK_SELECT)

    if (!filters.archived) query = query.eq('is_archived', false)
    if (filters.ownerId) query = query.eq('owner_id', filters.ownerId)
    if (filters.creatorId) query = query.eq('creator_id', filters.creatorId)
    if (filters.categoryId) query = query.eq('category_id', filters.categoryId)
    if (filters.projectId) query = query.eq('project_id', filters.projectId)
    if (filters.priority) query = query.eq('priority', filters.priority)
    if (filters.statusId) query = query.eq('status_id', filters.statusId)
    if (filters.search) query = query.ilike('title', `%${filters.search}%`)

    query = query.order('position', { ascending: true }).order('created_at', { ascending: false })

    const { data, error } = await query
    if (error) throw error
    return (data ?? []) as unknown as TaskWithRelations[]
  },

  async getMyTasks(userId: string): Promise<TaskWithRelations[]> {
    // Run direct-tasks and assignee-id lookups in parallel
    const [{ data: directTasks, error: e1 }, { data: assignedRows, error: e2 }] =
      await Promise.all([
        supabase
          .from('tasks')
          .select(TASK_SELECT)
          .eq('is_archived', false)
          .or(`creator_id.eq.${userId},owner_id.eq.${userId}`)
          .order('position', { ascending: true }),
        supabase.from('task_assignees').select('task_id').eq('profile_id', userId),
      ])

    if (e1) throw e1
    if (e2) throw e2

    // Only fetch tasks that weren't already returned in the direct query
    const directIds = new Set((directTasks ?? []).map((t: any) => t.id))
    const extraIds = (assignedRows ?? [])
      .map((r: any) => r.task_id as string)
      .filter((id) => !directIds.has(id))

    if (extraIds.length === 0) {
      return (directTasks ?? []) as unknown as TaskWithRelations[]
    }

    const { data: extraTasks, error: e3 } = await supabase
      .from('tasks')
      .select(TASK_SELECT)
      .eq('is_archived', false)
      .in('id', extraIds)
      .order('position', { ascending: true })

    if (e3) throw e3

    return [...(directTasks ?? []), ...(extraTasks ?? [])] as unknown as TaskWithRelations[]
  },

  async getById(id: string): Promise<TaskWithRelations | null> {
    const { data, error } = await supabase.from('tasks').select(TASK_SELECT).eq('id', id).maybeSingle()
    if (error) throw error
    return data as unknown as TaskWithRelations | null
  },

  async create(values: TaskFormValues, creatorId: string): Promise<TaskWithRelations> {
    const { data: task, error } = await db.tasks()
      .insert(buildCreateTaskPayload(values, creatorId))
      .select('id')
      .single()

    if (error) throw error

    const assigneeRows = buildTaskAssigneeRows({
      taskId: task.id,
      actorId: creatorId,
      ownerId: values.ownerId || creatorId,
      assigneeIds: values.assigneeIds,
    })

    if (assigneeRows.length > 0) {
      const { error: assignError } = await db.task_assignees().insert(assigneeRows)
      if (assignError) throw assignError
    }

    await taskService.logActivity(task.id, creatorId, 'task_created')

    const full = await taskService.getById(task.id)
    if (!full) throw new Error('Task created but not found')
    return full
  },

  async update(
    id: string,
    values: Partial<TaskFormValues>,
    actorId: string,
  ): Promise<TaskWithRelations> {
    let statusRow: { id: string; is_final: boolean } | null = null
    if (values.statusId !== undefined) {
      const { data } = await db.task_statuses()
        .select('is_final')
        .eq('id', values.statusId)
        .single()
      statusRow = { id: values.statusId, is_final: Boolean(data?.is_final) }
    }

    const updatePayload = buildUpdateTaskPayload(values, statusRow)

    if (Object.keys(updatePayload).length > 0) {
      const { error } = await db.tasks().update(updatePayload).eq('id', id)
      if (error) throw error
    }

    if (values.assigneeIds !== undefined) {
      const { data: existingAssigneeRows, error: existingAssigneesError } = await db
        .task_assignees()
        .select('profile_id')
        .eq('task_id', id)
      if (existingAssigneesError) throw existingAssigneesError

      await db.task_assignees().delete().eq('task_id', id)
      const rows = buildTaskAssigneeRows({
        taskId: id,
        actorId,
        ownerId: values.ownerId || actorId,
        assigneeIds: values.assigneeIds,
      })
      if (rows.length > 0) {
        const { error: ae } = await db.task_assignees().insert(rows)
        if (ae) throw ae
      }

      const changes = diffAssigneeIds(
        (existingAssigneeRows ?? []).map((row: any) => row.profile_id),
        rows.map((row) => row.profile_id),
      )

      await Promise.all([
        ...changes.added.map((profileId) =>
          taskService.logActivity(id, actorId, 'assignee_added', { profile_id: profileId }),
        ),
        ...changes.removed.map((profileId) =>
          taskService.logActivity(id, actorId, 'assignee_removed', { profile_id: profileId }),
        ),
      ])
    }

    if (values.statusId !== undefined) {
      await taskService.logActivity(id, actorId, 'status_changed', { status_id: values.statusId })
    } else {
      await taskService.logActivity(id, actorId, 'task_updated', updatePayload)
    }

    const full = await taskService.getById(id)
    if (!full) throw new Error('Task not found after update')
    return full
  },

  async moveStatus(id: string, statusId: string, position: number, actorId: string): Promise<void> {
    const updatePayload: Record<string, unknown> = { status_id: statusId, position }
    const { data: statusRow } = await db.task_statuses()
      .select('is_final')
      .eq('id', statusId)
      .single()
    updatePayload.completed_at = statusRow?.is_final ? new Date().toISOString() : null

    const { error } = await db.tasks().update(updatePayload).eq('id', id)
    if (error) throw error

    await taskService.logActivity(id, actorId, 'status_changed', { status_id: statusId })
  },

  async archive(id: string, actorId: string): Promise<void> {
    const { error } = await db.tasks().update({ is_archived: true }).eq('id', id)
    if (error) throw error
    await taskService.logActivity(id, actorId, 'task_archived')
  },

  async logActivity(
    taskId: string,
    actorId: string,
    action: TaskActivityAction,
    metadata?: Record<string, unknown>,
  ): Promise<void> {
    await db.task_activity_logs().insert({
      task_id: taskId,
      actor_id: actorId,
      action,
      metadata: metadata ?? null,
    })
  },
}
