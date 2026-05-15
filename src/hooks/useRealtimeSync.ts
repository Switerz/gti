import { useEffect } from 'react'

import { useQueryClient } from '@tanstack/react-query'

import { supabase } from '@/lib/supabase'

export function useRealtimeSync() {
  const queryClient = useQueryClient()

  useEffect(() => {
    const channel = supabase
      .channel('gti-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks' }, () => {
        queryClient.invalidateQueries({ queryKey: ['tasks'] })
      })
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'task_comments' },
        (payload) => {
          const taskId =
            (payload.new as Record<string, unknown>)?.task_id ??
            (payload.old as Record<string, unknown>)?.task_id
          if (taskId) queryClient.invalidateQueries({ queryKey: ['task-comments', taskId] })
          queryClient.invalidateQueries({ queryKey: ['tasks'] })
        },
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'task_checklist_items' },
        (payload) => {
          const taskId =
            (payload.new as Record<string, unknown>)?.task_id ??
            (payload.old as Record<string, unknown>)?.task_id
          if (taskId) queryClient.invalidateQueries({ queryKey: ['task-checklist', taskId] })
          queryClient.invalidateQueries({ queryKey: ['tasks'] })
        },
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'task_activity_logs' },
        (payload) => {
          const taskId =
            (payload.new as Record<string, unknown>)?.task_id ??
            (payload.old as Record<string, unknown>)?.task_id
          if (taskId) queryClient.invalidateQueries({ queryKey: ['task-activity', taskId] })
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [queryClient])
}
