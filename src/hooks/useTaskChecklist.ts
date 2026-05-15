import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { checklistService } from '@/features/checklist/checklist.service'

export function useTaskChecklist(taskId: string) {
  return useQuery({
    queryKey: ['task-checklist', taskId],
    queryFn: () => checklistService.getByTaskId(taskId),
    enabled: !!taskId,
  })
}

export function useCreateChecklistItem(taskId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ title, position, actorId }: { title: string; position: number; actorId: string }) =>
      checklistService.create(taskId, title, position, actorId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['task-checklist', taskId] })
      queryClient.invalidateQueries({ queryKey: ['tasks', taskId] })
    },
    onError: () => toast.error('Erro ao adicionar item.'),
  })
}

export function useToggleChecklistItem(taskId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, isDone, actorId }: { id: string; isDone: boolean; actorId: string }) =>
      checklistService.toggle(id, isDone, actorId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['task-checklist', taskId] })
      queryClient.invalidateQueries({ queryKey: ['tasks', taskId] })
      queryClient.invalidateQueries({ queryKey: ['task-activity', taskId] })
    },
    onError: () => toast.error('Erro ao atualizar item.'),
  })
}

export function useDeleteChecklistItem(taskId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => checklistService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['task-checklist', taskId] })
      queryClient.invalidateQueries({ queryKey: ['tasks', taskId] })
    },
    onError: () => toast.error('Erro ao excluir item.'),
  })
}
