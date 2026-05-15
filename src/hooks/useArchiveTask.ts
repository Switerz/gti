import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { taskService } from '@/features/tasks/task.service'

export function useArchiveTask(actorId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (taskId: string) => taskService.archive(taskId, actorId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
      toast.success('Tarefa arquivada.')
    },
    onError: () => {
      toast.error('Erro ao arquivar tarefa.')
    },
  })
}
