import { useQuery } from '@tanstack/react-query'

import { taskService } from '@/features/tasks/task.service'

export function useTask(id: string | undefined) {
  return useQuery({
    queryKey: ['tasks', id],
    queryFn: () => taskService.getById(id!),
    enabled: !!id,
  })
}
