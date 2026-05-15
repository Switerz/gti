import { useQuery } from '@tanstack/react-query'

import { authService } from '@/features/auth/auth.service'

export function useSession() {
  return useQuery({
    queryKey: ['auth', 'session'],
    queryFn: authService.getSession,
    staleTime: Infinity,
    retry: false,
    // AuthProvider seeds this cache via setQueryData (from onAuthStateChange INITIAL_SESSION),
    // so the queryFn only runs if the cache is somehow empty on first mount.
    // enabled: false would be ideal but breaks the fallback — keep enabled + fast-path via setQueryData.
    gcTime: Infinity,
  })
}
