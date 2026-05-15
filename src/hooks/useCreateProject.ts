import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { projectService } from '@/features/projects/project.service'

export function useCreateProject(createdBy: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (params: { name: string; description?: string; categoryId?: string }) =>
      projectService.create({ ...params, createdBy }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] })
      toast.success('Projeto criado.')
    },
    onError: () => toast.error('Erro ao criar projeto.'),
  })
}
