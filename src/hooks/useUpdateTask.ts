import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { taskService } from '@/features/tasks/task.service'
import type { TaskFormValues } from '@/types/domain'

export function useUpdateTask(actorId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, values }: { id: string; values: Partial<TaskFormValues> }) =>
      taskService.update(id, values, actorId),
    onSuccess: ({ task: updated, recurringCreated }) => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
      queryClient.setQueryData(['tasks', updated.id], updated)
      if (recurringCreated) {
        toast.success('Tarefa concluída. Nova recorrência criada automaticamente.')
      } else {
        toast.success('Tarefa atualizada.')
      }
    },
    onError: () => {
      toast.error('Erro ao atualizar tarefa.')
    },
  })
}
