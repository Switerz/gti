import { Navigate, Outlet } from 'react-router-dom'

import { LoadingState } from '@/components/shared/LoadingState'
import { useCurrentProfile } from '@/hooks/useCurrentProfile'
import { useSession } from '@/hooks/useSession'

export function AuthGuard() {
  const { data: session, isLoading: sessionLoading, isError: sessionError } = useSession()
  const { data: profile, isLoading: profileLoading, isError: profileError } = useCurrentProfile()

  if (sessionLoading || (session && profileLoading)) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <LoadingState fullPage />
      </div>
    )
  }

  if (sessionError || profileError || !session) {
    return <Navigate to="/login" replace />
  }

  if (!profile || !profile.active) {
    return <Navigate to="/unauthorized" replace />
  }

  return <Outlet />
}
