import { Navigate, Outlet } from 'react-router-dom'

import { LoadingState } from '@/components/shared/LoadingState'
import { useCurrentProfile } from '@/hooks/useCurrentProfile'
import { useSession } from '@/hooks/useSession'

export function AuthGuard() {
  // isLoading (not isFetching) — only true when there's genuinely no cached data.
  // AuthProvider seeds this cache via setQueryData from INITIAL_SESSION (no network call),
  // so isLoading should resolve within one render cycle in almost all cases.
  const { data: session, isLoading: sessionLoading } = useSession()
  const { data: profile, isLoading: profileLoading, isError: profileError } = useCurrentProfile()

  if (sessionLoading || (session && profileLoading)) {
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
