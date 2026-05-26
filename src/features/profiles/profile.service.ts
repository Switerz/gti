import { supabase } from '@/lib/supabase'
import { withTimeout } from '@/lib/timeout'
import type { Profile, UserRole } from '@/types/domain'

const PROFILE_QUERY_TIMEOUT_MS = 6_000

export const profileService = {
  async getCurrentProfile(): Promise<Profile | null> {
    const {
      data: { user },
    } = await withTimeout(supabase.auth.getUser(), PROFILE_QUERY_TIMEOUT_MS, 'profile user lookup timed out')

    if (!user) return null

    const { data, error } = await withTimeout(
      supabase.from('profiles').select('*').eq('id', user.id).maybeSingle(),
      PROFILE_QUERY_TIMEOUT_MS,
      'profile query timed out',
    )

    if (error) throw error
    return data
  },

  async getById(id: string): Promise<Profile | null> {
    const { data, error } = await withTimeout(
      supabase.from('profiles').select('*').eq('id', id).maybeSingle(),
      PROFILE_QUERY_TIMEOUT_MS,
      'profile query timed out',
    )

    if (error) throw error
    return data
  },

  async getAll(): Promise<Profile[]> {
    const { data, error } = await withTimeout(
      supabase.from('profiles').select('*').eq('active', true).order('full_name', { ascending: true }),
      PROFILE_QUERY_TIMEOUT_MS,
      'profiles query timed out',
    )

    if (error) throw error
    return data ?? []
  },

  async updateByEmail(email: string, values: { role?: UserRole; active?: boolean }): Promise<void> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase.from('profiles') as any)
      .update({ ...values, updated_at: new Date().toISOString() })
      .eq('email', email)
    if (error) throw error
  },
}
