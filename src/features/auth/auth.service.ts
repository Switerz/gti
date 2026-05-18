import { supabase } from '@/lib/supabase'
import type { Profile } from '@/types/domain'
import type { Session } from '@supabase/supabase-js'

import { buildProfileInsert, buildProfileSelfUpdate } from './profile-sync'

const SESSION_EXPIRY_SKEW_MS = 30_000

type StoredSupabaseSession = Partial<Session> & {
  currentSession?: Session | null
}

export function getSupabaseAuthStorageKey(supabaseUrl = import.meta.env.VITE_SUPABASE_URL) {
  if (!supabaseUrl) return null

  try {
    const [projectRef] = new URL(supabaseUrl).hostname.split('.')
    return projectRef ? `sb-${projectRef}-auth-token` : null
  } catch {
    return null
  }
}

export function hasAuthCallbackParams() {
  if (typeof window === 'undefined') return false

  const searchParams = new URLSearchParams(window.location.search)
  if (searchParams.has('code') || searchParams.has('error') || searchParams.has('error_code')) {
    return true
  }

  const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ''))
  return hashParams.has('access_token') || hashParams.has('refresh_token') || hashParams.has('error')
}

function isExpiredSession(session: Session, nowMs: number) {
  if (!session.expires_at) return false
  return session.expires_at * 1000 <= nowMs + SESSION_EXPIRY_SKEW_MS
}

export const authService = {
  clearCachedSession() {
    if (typeof window === 'undefined' || !window.localStorage) return

    const storageKey = getSupabaseAuthStorageKey()
    if (!storageKey) return

    window.localStorage.removeItem(storageKey)
  },

  getCachedSession(nowMs = Date.now()): Session | null {
    if (typeof window === 'undefined') return null
    if (!window.localStorage) return null

    const storageKey = getSupabaseAuthStorageKey()
    if (!storageKey) return null

    try {
      const rawSession = window.localStorage.getItem(storageKey)
      if (!rawSession) return null

      const stored = JSON.parse(rawSession) as StoredSupabaseSession
      const session = stored.currentSession ?? stored

      if (!session?.access_token || !session.user) return null

      if (isExpiredSession(session as Session, nowMs)) {
        this.clearCachedSession()
        return null
      }

      return session as Session
    } catch {
      this.clearCachedSession()
      return null
    }
  },

  async getSession() {
    const { data, error } = await supabase.auth.getSession()
    if (error) throw error
    return data.session
  },

  async signInWithGoogle() {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/dashboard`,
      },
    })
    if (error) throw error
    return data
  },

  async signOut() {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
  },

  async checkAllowlist(email: string): Promise<{ role: string; active: boolean } | null> {
    const { data } = await supabase
      .from('allowed_emails')
      .select('role, active')
      .eq('email', email.toLowerCase())
      .maybeSingle()
    return data
  },

  async upsertProfile(params: {
    id: string
    email: string
    full_name?: string | null
    avatar_url?: string | null
    role: string
  }): Promise<Profile | null> {
    const profileData = buildProfileInsert(params)

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase.from('profiles') as any)
      .insert(profileData)
      .select()
      .maybeSingle()

    if (!error) return data

    if (error.code !== '23505') throw error

    const updateData = buildProfileSelfUpdate(params)

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: updated, error: updateError } = await (supabase.from('profiles') as any)
      .update(updateData)
      .eq('id', params.id)
      .select()
      .maybeSingle()

    if (updateError) throw updateError
    return updated
  },
}
