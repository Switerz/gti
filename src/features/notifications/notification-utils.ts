import type { TaskAssignee } from '@/types/domain'

export type TaskAssignmentNotification = {
  id: string
  taskId: string
  profileId: string
  assignedBy: string | null
  createdAt: string
  taskTitle: string
  projectName: string | null
  read: boolean
}

export type TaskAssignmentSummary = {
  title: string | null
  projectName?: string | null
}

export function buildTaskAssignmentNotification(
  row: TaskAssignee,
  currentProfileId: string,
  summary: TaskAssignmentSummary | null = null,
): TaskAssignmentNotification | null {
  if (row.profile_id !== currentProfileId) return null
  if (row.assigned_by === currentProfileId) return null

  return {
    id: `task-assignment:${row.task_id}:${row.profile_id}:${row.created_at}`,
    taskId: row.task_id,
    profileId: row.profile_id,
    assignedBy: row.assigned_by,
    createdAt: row.created_at,
    taskTitle: summary?.title || 'Nova tarefa atribuida',
    projectName: summary?.projectName ?? null,
    read: false,
  }
}

export function upsertNotification(
  notifications: TaskAssignmentNotification[],
  notification: TaskAssignmentNotification,
  limit = 20,
) {
  const withoutDuplicate = notifications.filter((item) => item.id !== notification.id)
  return [notification, ...withoutDuplicate].slice(0, limit)
}

export function markNotificationRead(
  notifications: TaskAssignmentNotification[],
  notificationId: string,
) {
  return notifications.map((notification) =>
    notification.id === notificationId ? { ...notification, read: true } : notification,
  )
}

export function markAllNotificationsRead(notifications: TaskAssignmentNotification[]) {
  return notifications.map((notification) => ({ ...notification, read: true }))
}

export function getUnreadNotificationCount(notifications: TaskAssignmentNotification[]) {
  return notifications.filter((notification) => !notification.read).length
}
