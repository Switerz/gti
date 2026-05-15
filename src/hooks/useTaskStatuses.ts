import { useQuery } from '@tanstack/react-query'

import { taskStatusService } from '@/features/tasks/task-status.service'

export function useTaskStatuses() {
  return useQuery({
    queryKey: ['task-statuses'],
    queryFn: taskStatusService.getAll,
    staleTime: Infinity,
  })
}
