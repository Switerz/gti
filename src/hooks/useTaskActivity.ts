import { useQuery } from '@tanstack/react-query'

import { activityService } from '@/features/activity/activity.service'

export function useTaskActivity(taskId: string) {
  return useQuery({
    queryKey: ['task-activity', taskId],
    queryFn: () => activityService.getByTaskId(taskId),
    enabled: !!taskId,
  })
}
