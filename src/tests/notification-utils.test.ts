import { describe, expect, it } from 'vitest'

import {
  buildTaskAssignmentNotification,
  getUnreadNotificationCount,
  markAllNotificationsRead,
  markNotificationRead,
  upsertNotification,
  type TaskAssignmentNotification,
} from '@/features/notifications/notification-utils'
import type { TaskAssignee } from '@/types/domain'

const ROW: TaskAssignee = {
  task_id: 'task-1',
  profile_id: 'user-1',
  assigned_by: 'user-2',
  created_at: '2026-05-15T10:00:00Z',
}

function makeNotification(id: string, read = false): TaskAssignmentNotification {
  return {
    id,
    taskId: 'task-1',
    profileId: 'user-1',
    assignedBy: 'user-2',
    createdAt: '2026-05-15T10:00:00Z',
    taskTitle: 'Revisar SLA',
    projectName: null,
    read,
  }
}

describe('notification utils', () => {
  it('builds a task assignment notification for the assigned user', () => {
    const notification = buildTaskAssignmentNotification(ROW, 'user-1', {
      title: 'Revisar SLA',
      projectName: 'Transportadoras',
    })

    expect(notification).toMatchObject({
      taskId: 'task-1',
      profileId: 'user-1',
      assignedBy: 'user-2',
      taskTitle: 'Revisar SLA',
      projectName: 'Transportadoras',
      read: false,
    })
  })

  it('ignores assignment rows for other users', () => {
    expect(buildTaskAssignmentNotification(ROW, 'user-3')).toBeNull()
  })

  it('ignores self assignments to avoid noisy local notifications', () => {
    expect(
      buildTaskAssignmentNotification({ ...ROW, assigned_by: 'user-1' }, 'user-1'),
    ).toBeNull()
  })

  it('deduplicates notifications while keeping the newest copy first', () => {
    const original = makeNotification('n1', true)
    const updated = { ...original, read: false, taskTitle: 'Titulo atualizado' }

    expect(upsertNotification([original], updated)).toEqual([updated])
  })

  it('marks one or all notifications as read', () => {
    const notifications = [makeNotification('n1'), makeNotification('n2')]

    expect(markNotificationRead(notifications, 'n1')[0].read).toBe(true)
    expect(markAllNotificationsRead(notifications).every((item) => item.read)).toBe(true)
  })

  it('counts unread notifications', () => {
    expect(getUnreadNotificationCount([makeNotification('n1'), makeNotification('n2', true)])).toBe(1)
  })
})
