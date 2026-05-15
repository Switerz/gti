import { useQuery } from '@tanstack/react-query'

import { projectService } from '@/features/projects/project.service'

export function useProjects() {
  return useQuery({
    queryKey: ['projects'],
    queryFn: projectService.getAll,
    staleTime: 5 * 60 * 1000,
  })
}
