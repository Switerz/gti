import { Navigate, Outlet } from 'react-router-dom'

import { LoadingState } from '@/components/shared/LoadingState'
import { useCurrentProfile } from '@/hooks/useCurrentProfile'
import { useSession } from '@/hooks/useSession'

export function AuthGuard() {
  const { data: session, isLoading: sessionLoading } = useSession()
  const { data: profile, isLoading: profileLoading } = useCurrentProfile()

  if (sessionLoading || (session && profileLoading)) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <LoadingState />
      </div>
    )
  }

  if (!session) {
    return <Navigate to="/login" replace />
  }

  if (!profile || !profile.active) {
    return <Navigate to="/unauthorized" replace />
  }

  return <Outlet />
}
