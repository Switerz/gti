import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { projectService } from '@/features/projects/project.service'

export function useDeleteProject() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => projectService.archive(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] })
      toast.success('Projeto excluído.')
    },
    onError: (err) => {
      console.error('[useDeleteProject] erro:', err)
      toast.error('Erro ao excluir projeto.')
    },
  })
}
