import { useEffect, useMemo, useState } from 'react'

import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { notificationService } from '@/features/notifications/notification.service'
import {
  buildTaskAssignmentNotification,
  getUnreadNotificationCount,
  markAllNotificationsRead,
  markNotificationRead,
  type TaskAssignmentNotification,
  upsertNotification,
} from '@/features/notifications/notification-utils'
import { supabase } from '@/lib/supabase'
import type { TaskAssignee } from '@/types/domain'

export function useTaskNotifications(currentProfileId?: string) {
  const queryClient = useQueryClient()
  const [notifications, setNotifications] = useState<TaskAssignmentNotification[]>([])

  useEffect(() => {
    if (!currentProfileId) return

    const channel = supabase
      .channel(`task-notifications-${currentProfileId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'task_assignees',
          filter: `profile_id=eq.${currentProfileId}`,
        },
        (payload) => {
          const row = payload.new as TaskAssignee

          void (async () => {
            const summary = await notificationService
              .getTaskAssignmentSummary(row.task_id)
              .catch(() => null)
            const notification = buildTaskAssignmentNotification(row, currentProfileId, summary)
            if (!notification) return

            setNotifications((current) => upsertNotification(current, notification))
            queryClient.invalidateQueries({ queryKey: ['tasks'] })

            toast.info('Nova tarefa atribuida', {
              description: notification.taskTitle,
            })
          })()
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [currentProfileId, queryClient])

  const unreadCount = useMemo(() => getUnreadNotificationCount(notifications), [notifications])

  return {
    notifications,
    unreadCount,
    markAsRead: (notificationId: string) =>
      setNotifications((current) => markNotificationRead(current, notificationId)),
    markAllAsRead: () => setNotifications((current) => markAllNotificationsRead(current)),
    clear: () => setNotifications([]),
  }
}
