import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { commentService } from '@/features/comments/comment.service'

export function useTaskComments(taskId: string) {
  return useQuery({
    queryKey: ['task-comments', taskId],
    queryFn: () => commentService.getByTaskId(taskId),
    enabled: !!taskId,
  })
}

export function useCreateComment(taskId: string, authorId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (body: string) => commentService.create(taskId, authorId, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['task-comments', taskId] })
      queryClient.invalidateQueries({ queryKey: ['tasks', taskId] })
      queryClient.invalidateQueries({ queryKey: ['task-activity', taskId] })
    },
    onError: () => toast.error('Erro ao adicionar comentário.'),
  })
}

export function useDeleteComment(taskId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (commentId: string) => commentService.delete(commentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['task-comments', taskId] })
      queryClient.invalidateQueries({ queryKey: ['tasks', taskId] })
    },
    onError: () => toast.error('Erro ao excluir comentário.'),
  })
}
