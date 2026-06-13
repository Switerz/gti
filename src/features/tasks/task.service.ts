/* eslint-disable @typescript-eslint/no-explicit-any */
// The `as any` casts on supabase.from() calls work around a TypeScript 6.x
// inference regression with the Supabase JS SDK v2 mutation methods.
import { supabase } from '@/lib/supabase'
import type { TaskActivityAction, TaskFormValues, TaskWithRelations } from '@/types/domain'

import {
  buildTaskAssigneeRows,
  buildUpdateTaskPayload,
} from './task-payload'
import { diffAssigneeIds } from './task-assignees'
import { buildRecurringTitle, getNextDueDate, type RecurrenceType } from './recurrence'

const TASK_SELECT = `
  *,
  status:task_statuses(id, name, slug, color, is_final),
  category:categories(id, name, color),
  project:projects(id, name),
  creator:profiles!creator_id(id, full_name, avatar_url),
  owner:profiles!owner_id(id, full_name, avatar_url),
  assignees:task_assignees(profile:profiles!task_assignees_profile_id_fkey(id, full_name, avatar_url)),
  _comments:task_comments(id),
  _checklist:task_checklist_items(id, is_done, title, position)
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
  task_checklist_items: () => supabase.from('task_checklist_items') as any,
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
    const { data: taskId, error } = await (supabase.rpc as any)('create_task_with_assignees', {
      p_title: values.title.trim(),
      p_description: values.description?.trim() || null,
      p_status_id: values.statusId,
      p_category_id: values.categoryId || null,
      p_project_id: values.projectId || null,
      p_owner_id: values.ownerId || creatorId,
      p_priority: values.priority,
      p_due_date: values.dueDate || null,
      p_start_date: values.startDate || null,
      p_recurrence_type: values.recurrenceType ?? 'none',
      p_estimated_hours: values.estimatedHours ?? null,
      p_actual_hours: values.actualHours ?? null,
      p_assignee_ids: values.assigneeIds ?? [],
    })
    if (error) throw error

    const full = await taskService.getById(taskId)
    if (!full) throw new Error('Task created but not found')
    return full
  },

  async update(
    id: string,
    values: Partial<TaskFormValues>,
    actorId: string,
  ): Promise<{ task: TaskWithRelations; recurringCreated: boolean }> {
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

      const rows = buildTaskAssigneeRows({
        taskId: id,
        actorId,
        ownerId: values.ownerId || actorId,
        assigneeIds: values.assigneeIds,
      })

      const changes = diffAssigneeIds(
        (existingAssigneeRows ?? []).map((row: any) => row.profile_id),
        rows.map((row) => row.profile_id),
      )

      if (changes.removed.length > 0) {
        const { error: removeError } = await db
          .task_assignees()
          .delete()
          .eq('task_id', id)
          .in('profile_id', changes.removed)
        if (removeError) throw removeError
      }

      const addedRows = rows.filter((row) => changes.added.includes(row.profile_id))
      if (addedRows.length > 0) {
        const { error: ae } = await db.task_assignees().insert(addedRows)
        if (ae) throw ae
      }

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

    let recurringCreated = false
    if (statusRow?.is_final && full.recurrence_type !== 'none') {
      recurringCreated = await taskService.createRecurring(full, actorId)
    }

    return { task: full, recurringCreated }
  },

  async createRecurring(source: TaskWithRelations, actorId: string): Promise<boolean> {
    const recurrenceType = source.recurrence_type as RecurrenceType

    const { data: backlogStatus } = await db.task_statuses()
      .select('id')
      .eq('is_final', false)
      .neq('slug', 'archived')
      .order('position', { ascending: true })
      .limit(1)
      .single()

    const nextStatusId = backlogStatus?.id ?? source.status_id
    const nextDueDate = source.due_date
      ? getNextDueDate(recurrenceType, new Date(source.due_date))
      : getNextDueDate(recurrenceType)

    // Use the next cycle's date for the title suffix, not today
    const nextDueDateObj = nextDueDate ? new Date(nextDueDate) : new Date()

    const { data: newTask, error } = await db.tasks()
      .insert({
        title: buildRecurringTitle(source.title, recurrenceType, nextDueDateObj),
        description: source.description,
        status_id: nextStatusId,
        category_id: source.category_id,
        project_id: source.project_id,
        creator_id: actorId,
        owner_id: source.owner_id,
        priority: source.priority,
        due_date: nextDueDate || null,
        start_date: null,
        recurrence_type: recurrenceType,
        estimated_hours: source.estimated_hours,
        actual_hours: null,
      })
      .select('id')
      .single()

    if (error) throw error

    const assigneeRows = buildTaskAssigneeRows({
      taskId: newTask.id,
      actorId,
      ownerId: source.owner_id ?? actorId,
      assigneeIds: source.assignees.map((a) => a.profile.id).filter((id) => id !== source.owner_id),
    })
    if (assigneeRows.length > 0) {
      await db.task_assignees().insert(assigneeRows)
    }

    if (source._checklist.length > 0) {
      const checklistRows = source._checklist.map((item) => ({
        task_id: newTask.id,
        title: item.title,
        is_done: false,
        position: item.position,
      }))
      await db.task_checklist_items().insert(checklistRows)
    }

    // Non-fatal: log failure should not roll back the already-created task
    try {
      await taskService.logActivity(newTask.id, actorId, 'task_created')
    } catch {
      console.warn('[createRecurring] logActivity failed but task was created:', newTask.id)
    }

    return true
  },

  async moveStatus(id: string, statusId: string, position: number, actorId: string): Promise<boolean> {
    const updatePayload: Record<string, unknown> = { status_id: statusId, position }
    const { data: statusRow } = await db.task_statuses()
      .select('is_final')
      .eq('id', statusId)
      .single()
    updatePayload.completed_at = statusRow?.is_final ? new Date().toISOString() : null

    const { error } = await db.tasks().update(updatePayload).eq('id', id)
    if (error) throw error

    await taskService.logActivity(id, actorId, 'status_changed', { status_id: statusId })

    if (statusRow?.is_final) {
      const full = await taskService.getById(id)
      if (full && full.recurrence_type !== 'none') {
        return taskService.createRecurring(full, actorId)
      }
    }

    return false
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
