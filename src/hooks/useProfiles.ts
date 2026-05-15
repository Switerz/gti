import { useQuery } from '@tanstack/react-query'

import { profileService } from '@/features/profiles/profile.service'

export function useProfiles() {
  return useQuery({
    queryKey: ['profiles'],
    queryFn: profileService.getAll,
    staleTime: 5 * 60 * 1000,
  })
}
