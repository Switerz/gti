import { useEffect } from 'react'
import { Outlet, useNavigate } from 'react-router-dom'

import { useQueryClient } from '@tanstack/react-query'

import { supabase } from '@/lib/supabase'

import { authService } from './auth.service'

// Root layout component that listens to auth state changes.
// Must be placed inside RouterProvider so useNavigate is available.
export function AuthProvider() {
  const queryClient = useQueryClient()
  const navigate = useNavigate()

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      // Immediately seed the session cache so AuthGuard never waits for getSession() network calls.
      // INITIAL_SESSION fires synchronously from local storage — no network round-trip needed.
      queryClient.setQueryData(['auth', 'session'], session)

      if (event === 'SIGNED_IN' && session?.user) {
        const user = session.user
        const email = user.email ?? ''

        const allowed = await authService.checkAllowlist(email)

        if (!allowed || !allowed.active) {
          await supabase.auth.signOut()
          navigate('/unauthorized', { replace: true })
          return
        }

        await authService.upsertProfile({
          id: user.id,
          email,
          full_name: user.user_metadata?.full_name ?? null,
          avatar_url: user.user_metadata?.avatar_url ?? null,
          role: allowed.role,
        })

        queryClient.invalidateQueries({ queryKey: ['profiles', 'current'] })
      }

      if (event === 'SIGNED_OUT') {
        queryClient.clear()
        navigate('/login', { replace: true })
      }
    })

    return () => subscription.unsubscribe()
  }, [navigate, queryClient])

  return <Outlet />
}
