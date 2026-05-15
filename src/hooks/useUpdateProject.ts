import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { projectService } from '@/features/projects/project.service'

export function useUpdateProject() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      id,
      values,
    }: {
      id: string
      values: { name?: string; description?: string | null; categoryId?: string | null }
    }) => projectService.update(id, values),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: ['projects'] })
      queryClient.setQueryData(['projects', updated.id], updated)
      toast.success('Projeto atualizado.')
    },
    onError: () => {
      toast.error('Erro ao atualizar projeto.')
    },
  })
}
