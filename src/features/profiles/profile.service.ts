import { supabase } from '@/lib/supabase'
import type { Profile } from '@/types/domain'

export const profileService = {
  async getCurrentProfile(): Promise<Profile | null> {
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) return null

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .maybeSingle()

    if (error) throw error
    return data
  },

  async getAll(): Promise<Profile[]> {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('active', true)
      .order('full_name', { ascending: true })

    if (error) throw error
    return data ?? []
  },
}
