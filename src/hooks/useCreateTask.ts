import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { taskService } from '@/features/tasks/task.service'
import type { TaskFormValues } from '@/types/domain'

export function useCreateTask(creatorId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (values: TaskFormValues) => taskService.create(values, creatorId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
      toast.success('Tarefa criada com sucesso.')
    },
    onError: () => {
      toast.error('Erro ao criar tarefa. Tente novamente.')
    },
  })
}
