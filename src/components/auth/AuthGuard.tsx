import { useEffect, useState } from 'react'
import { Navigate, Outlet } from 'react-router-dom'

import { useQueryClient } from '@tanstack/react-query'

import { LoadingState } from '@/components/shared/LoadingState'
import { authService } from '@/features/auth/auth.service'
import { useCurrentProfile } from '@/hooks/useCurrentProfile'
import { useSession } from '@/hooks/useSession'

const AUTH_GUARD_TIMEOUT_MS = 8_000

export function AuthGuard() {
  const queryClient = useQueryClient()
  const [timedOut, setTimedOut] = useState(false)
  // isLoading (not isFetching) — only true when there's genuinely no cached data.
  // AuthProvider seeds this cache via setQueryData from INITIAL_SESSION (no network call),
  // so isLoading should resolve within one render cycle in almost all cases.
  const { data: session, isLoading: sessionLoading, isError: sessionError } = useSession()
  const { data: profile, isLoading: profileLoading, isError: profileError } = useCurrentProfile()
  const isAuthLoading = sessionLoading || Boolean(session && profileLoading)

  useEffect(() => {
    if (!isAuthLoading) return

    const timeoutId = window.setTimeout(() => {
      authService.clearCachedSession()
      queryClient.removeQueries({ queryKey: ['auth'] })
      queryClient.removeQueries({ queryKey: ['profiles', 'current'] })
      setTimedOut(true)
    }, AUTH_GUARD_TIMEOUT_MS)

    return () => window.clearTimeout(timeoutId)
  }, [isAuthLoading, queryClient])

  if (timedOut || sessionError) {
    return <Navigate to="/login" replace />
  }

  if (isAuthLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <LoadingState fullPage />
      </div>
    )
  }

  // session is null → user not logged in (SIGNED_OUT or no stored session)
  if (profileError || !session) {
    return <Navigate to="/login" replace />
  }

  if (!profile || !profile.active) {
    return <Navigate to="/unauthorized" replace />
  }

  return <Outlet />
}
