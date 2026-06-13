import { useEffect, useMemo } from 'react'

import { useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { notificationService } from '@/features/notifications/notification.service'
import {
  getUnreadNotificationCount,
  markAllNotificationsRead,
  markNotificationRead,
  type TaskAssignmentNotification,
  upsertNotification,
} from '@/features/notifications/notification-utils'
import { supabase } from '@/lib/supabase'

export function useTaskNotifications(currentProfileId?: string) {
  const queryClient = useQueryClient()
  const queryKey = useMemo(
    () => ['task-assignment-notifications', currentProfileId] as const,
    [currentProfileId],
  )
  const { data: notifications = [] } = useQuery({
    queryKey,
    queryFn: () => notificationService.getTaskAssignmentNotifications(currentProfileId!),
    enabled: !!currentProfileId,
  })

  useEffect(() => {
    if (!currentProfileId) return

    const channel = supabase
      .channel(`task-notifications-${currentProfileId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'task_assignment_notifications',
          filter: `profile_id=eq.${currentProfileId}`,
        },
        (payload) => {
          void (async () => {
            const notification = await notificationService
              .getTaskAssignmentNotification(String((payload.new as { id?: string }).id))
              .catch(() => null)
            if (!notification) return

            queryClient.setQueryData<TaskAssignmentNotification[]>(queryKey, (current = []) =>
              upsertNotification(current, notification),
            )
            queryClient.invalidateQueries({ queryKey: ['tasks'] })

            toast.info('Nova tarefa atribuida', {
              description: notification.taskTitle,
            })
          })()
        },
      )
      .subscribe((status, err) => {
        if (status === 'CHANNEL_ERROR') {
          console.error('[notifications] realtime channel error:', err)
        } else if (status === 'TIMED_OUT') {
          console.warn('[notifications] realtime channel timed out')
        }
      })

    return () => {
      supabase.removeChannel(channel)
    }
  }, [currentProfileId, queryClient, queryKey])

  const unreadCount = useMemo(() => getUnreadNotificationCount(notifications), [notifications])

  return {
    notifications,
    unreadCount,
    markAsRead: (notificationId: string) => {
      queryClient.setQueryData<TaskAssignmentNotification[]>(queryKey, (current = []) =>
        markNotificationRead(current, notificationId),
      )
      void notificationService.markTaskAssignmentNotificationRead(notificationId)
    },
    markAllAsRead: () => {
      queryClient.setQueryData<TaskAssignmentNotification[]>(queryKey, (current = []) =>
        markAllNotificationsRead(current),
      )
      if (currentProfileId) {
        void notificationService.markAllTaskAssignmentNotificationsRead(currentProfileId)
      }
    },
    clear: () => {
      queryClient.setQueryData<TaskAssignmentNotification[]>(queryKey, [])
      if (currentProfileId) {
        void notificationService.clearTaskAssignmentNotifications(currentProfileId)
      }
    },
  }
}
