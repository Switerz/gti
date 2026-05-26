import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { applyTaskMove, type KanbanMove } from '@/features/tasks/kanban-utils'
import { taskService } from '@/features/tasks/task.service'
import type { TaskWithRelations } from '@/types/domain'

type MoveContext = {
  previousTaskQueries: Array<[readonly unknown[], unknown]>
}

export function useMoveTask(actorId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ taskId, statusId, position }: KanbanMove) =>
      taskService.moveStatus(taskId, statusId, position, actorId),
    onMutate: async (move): Promise<MoveContext> => {
      await queryClient.cancelQueries({ queryKey: ['tasks'] })

      const previousTaskQueries = queryClient.getQueriesData({ queryKey: ['tasks'] })

      previousTaskQueries.forEach(([queryKey, value]) => {
        if (Array.isArray(value)) {
          queryClient.setQueryData(queryKey, applyTaskMove(value as TaskWithRelations[], move))
          return
        }

        if (value && typeof value === 'object' && 'id' in value && value.id === move.taskId) {
          queryClient.setQueryData(queryKey, {
            ...(value as TaskWithRelations),
            status_id: move.statusId,
            position: move.position,
          })
        }
      })

      return { previousTaskQueries }
    },
    onSuccess: (recurringCreated) => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
      if (recurringCreated) {
        toast.success('Tarefa concluída. Nova recorrência criada automaticamente.')
      }
    },
    onError: (_error, _move, context) => {
      context?.previousTaskQueries.forEach(([queryKey, value]) => {
        queryClient.setQueryData(queryKey, value)
      })
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
      toast.error('Erro ao mover tarefa.')
    },
  })
}
