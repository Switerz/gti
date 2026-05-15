import { useQuery } from '@tanstack/react-query'

import { profileService } from '@/features/profiles/profile.service'

import { useSession } from './useSession'

export function useCurrentProfile() {
  const { data: session } = useSession()

  return useQuery({
    queryKey: ['profiles', 'current'],
    queryFn: profileService.getCurrentProfile,
    enabled: !!session,
    staleTime: 5 * 60 * 1000,
  })
}
