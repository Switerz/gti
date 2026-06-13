import { useQuery } from '@tanstack/react-query'

import { authService, hasAuthCallbackParams } from '@/features/auth/auth.service'
import { isSupabaseConfigured } from '@/lib/supabase'
import { withTimeout } from '@/lib/timeout'

const SESSION_QUERY_TIMEOUT_MS = 6_000

export function useSession() {
  return useQuery({
    queryKey: ['auth', 'session'],
    queryFn: () => withTimeout(authService.getSession(), SESSION_QUERY_TIMEOUT_MS, 'session query timed out'),
    initialData: () => {
      if (!isSupabaseConfigured) return null

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
    enabled: isSupabaseConfigured,
    // AuthProvider seeds this cache via INITIAL_SESSION. Placeholder envs used
    // by CI/E2E stay offline and resolve as unauthenticated.
    gcTime: Infinity,
  })
}
