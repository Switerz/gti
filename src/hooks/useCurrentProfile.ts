import { useQuery } from '@tanstack/react-query'

import { profileService } from '@/features/profiles/profile.service'

import { useSession } from './useSession'

export function useCurrentProfile() {
  const { data: session } = useSession()
  const userId = session?.user.id

  return useQuery({
    queryKey: ['profiles', 'current'],
    // Pass userId directly so the service uses the cached session id instead of calling getUser()
    queryFn: () => profileService.getById(userId!),
    enabled: !!userId,
    staleTime: 5 * 60 * 1000,
    retry: false,
  })
}
