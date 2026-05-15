import { useQuery } from '@tanstack/react-query'

import { authService } from '@/features/auth/auth.service'

export function useSession() {
  return useQuery({
    queryKey: ['auth', 'session'],
    queryFn: authService.getSession,
  })
}
