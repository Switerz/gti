import { useQuery } from '@tanstack/react-query'

import { type TaskFilters, taskService } from '@/features/tasks/task.service'

export function useTasks(filters: TaskFilters = {}) {
  return useQuery({
    queryKey: ['tasks', filters],
    queryFn: () => taskService.getAll(filters),
    staleTime: 30_000,
  })
}

export function useMyTasks(userId: string | undefined) {
  return useQuery({
    queryKey: ['tasks', 'mine', userId],
    queryFn: () => taskService.getMyTasks(userId!),
    enabled: !!userId,
    staleTime: 30_000,
  })
}
