import { useQuery } from '@tanstack/react-query'

import { authService, hasAuthCallbackParams } from '@/features/auth/auth.service'
import { withTimeout } from '@/lib/timeout'

const SESSION_QUERY_TIMEOUT_MS = 6_000

export function useSession() {
  return useQuery({
    queryKey: ['auth', 'session'],
    queryFn: () => withTimeout(authService.getSession(), SESSION_QUERY_TIMEOUT_MS, 'session query timed out'),
    initialData: () => {
      const cachedSession = authService.getCachedSession()
      if (cachedSession) return cachedSession

      // OAuth redirects need Supabase to exchange the callback code once.
      // Plain unauthenticated visits should resolve immediately to avoid a full-page spinner.
      return hasAuthCallbackParams() ? undefined : null
    },
    staleTime: Infinity,
    retry: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
    refetchOnWindowFocus: false,
    networkMode: 'always',
    // AuthProvider seeds this cache via setQueryData (from onAuthStateChange INITIAL_SESSION),
    // so the queryFn only runs if the cache is somehow empty on first mount.
    // enabled: false would be ideal but breaks the fallback — keep enabled + fast-path via setQueryData.
    gcTime: Infinity,
  })
}
