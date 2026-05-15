import { supabase } from '@/lib/supabase'
import type { Profile } from '@/types/domain'

import { buildProfileInsert, buildProfileSelfUpdate } from './profile-sync'

export const authService = {
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
