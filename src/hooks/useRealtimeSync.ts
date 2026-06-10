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
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'task_assignees' },
        () => {
          queryClient.invalidateQueries({ queryKey: ['tasks'] })
        },
      )
      .on('postgres_changes', { event: '*', schema: 'public', table: 'kpis' }, () => {
        queryClient.invalidateQueries({ queryKey: ['kpis'] })
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'kpi_weekly_values' }, () => {
        queryClient.invalidateQueries({ queryKey: ['kpis'] })
      })
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'kpi_action_plans' },
        (payload) => {
          const kpiId =
            (payload.new as Record<string, unknown>)?.kpi_id ??
            (payload.old as Record<string, unknown>)?.kpi_id
          if (kpiId) {
            queryClient.invalidateQueries({ queryKey: ['kpis', kpiId, 'action-plans'] })
            queryClient.invalidateQueries({ queryKey: ['kpis', 'open-action-plans'] })
          }
        },
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'kpi_offenders' },
        (payload) => {
          const kpiId =
            (payload.new as Record<string, unknown>)?.kpi_id ??
            (payload.old as Record<string, unknown>)?.kpi_id
          if (kpiId) queryClient.invalidateQueries({ queryKey: ['kpis', kpiId, 'offenders'] })
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [queryClient])
}
