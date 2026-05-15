import { useQuery } from '@tanstack/react-query'

import { projectService } from '@/features/projects/project.service'

export function useProject(id: string | undefined) {
  return useQuery({
    queryKey: ['projects', id],
    queryFn: () => projectService.getById(id!),
    enabled: !!id,
    staleTime: 30_000,
  })
}
