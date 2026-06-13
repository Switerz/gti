/* eslint-disable @typescript-eslint/no-explicit-any */
import { supabase } from '@/lib/supabase'

import type { TaskAssignmentNotification, TaskAssignmentSummary } from './notification-utils'

type TaskSummaryRow = {
  title: string | null
  project: { name: string | null } | null
}

type NotificationRow = {
  id: string
  profile_id: string
  task_id: string
  assigned_by: string | null
  read_at: string | null
  created_at: string
  task: TaskSummaryRow | null
}

function mapNotification(row: NotificationRow): TaskAssignmentNotification {
  return {
    id: row.id,
    taskId: row.task_id,
    profileId: row.profile_id,
    assignedBy: row.assigned_by,
    createdAt: row.created_at,
    taskTitle: row.task?.title || 'Nova tarefa atribuida',
    projectName: row.task?.project?.name ?? null,
    read: Boolean(row.read_at),
  }
}

export const notificationService = {
  async getTaskAssignmentSummary(taskId: string): Promise<TaskAssignmentSummary | null> {
    const { data, error } = await supabase
      .from('tasks')
      .select('title, project:projects(name)')
      .eq('id', taskId)
      .maybeSingle()

    if (error) throw error

    const row = data as unknown as TaskSummaryRow | null
    if (!row) return null

    return {
      title: row.title,
      projectName: row.project?.name ?? null,
    }
  },

  async getTaskAssignmentNotifications(profileId: string): Promise<TaskAssignmentNotification[]> {
    const { data, error } = await (supabase.from('task_assignment_notifications') as any)
      .select('id, profile_id, task_id, assigned_by, read_at, created_at, task:tasks(title, project:projects(name))')
      .eq('profile_id', profileId)
      .order('created_at', { ascending: false })
      .limit(20)

    if (error) throw error
    return ((data ?? []) as unknown as NotificationRow[]).map(mapNotification)
  },

  async getTaskAssignmentNotification(id: string): Promise<TaskAssignmentNotification | null> {
    const { data, error } = await (supabase.from('task_assignment_notifications') as any)
      .select('id, profile_id, task_id, assigned_by, read_at, created_at, task:tasks(title, project:projects(name))')
      .eq('id', id)
      .maybeSingle()

    if (error) throw error
    return data ? mapNotification(data as unknown as NotificationRow) : null
  },

  async markTaskAssignmentNotificationRead(id: string): Promise<void> {
    const { error } = await (supabase.from('task_assignment_notifications') as any)
      .update({ read_at: new Date().toISOString() })
      .eq('id', id)
      .is('read_at', null)

    if (error) throw error
  },

  async markAllTaskAssignmentNotificationsRead(profileId: string): Promise<void> {
    const { error } = await (supabase.from('task_assignment_notifications') as any)
      .update({ read_at: new Date().toISOString() })
      .eq('profile_id', profileId)
      .is('read_at', null)

    if (error) throw error
  },

  async clearTaskAssignmentNotifications(profileId: string): Promise<void> {
    const { error } = await (supabase.from('task_assignment_notifications') as any)
      .delete()
      .eq('profile_id', profileId)

    if (error) throw error
  },
}
