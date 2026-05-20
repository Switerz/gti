import { useMutation, useQueryClient } from '@tanstack/react-query'

import { projectService } from '@/features/projects/project.service'

export function useDeleteProject() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => projectService.archive(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] })
    },
  })
}
