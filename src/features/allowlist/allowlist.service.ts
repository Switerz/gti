/* eslint-disable @typescript-eslint/no-explicit-any */
import { supabase } from '@/lib/supabase'
import type { AllowedEmail, UserRole } from '@/types/domain'

export const allowlistService = {
  async getAll(): Promise<AllowedEmail[]> {
    const { data, error } = await supabase
      .from('allowed_emails')
      .select('*')
      .order('email', { ascending: true })
    if (error) throw error
    return data ?? []
  },

  async add(email: string, role: UserRole): Promise<AllowedEmail> {
    const { data, error } = await (supabase.from('allowed_emails') as any)
      .insert({ email: email.toLowerCase().trim(), role })
      .select('*')
      .single()
    if (error) throw error
    return data as AllowedEmail
  },

  async update(id: string, values: { role?: UserRole; active?: boolean }): Promise<void> {
    const { error } = await (supabase.from('allowed_emails') as any)
      .update(values)
      .eq('id', id)
    if (error) throw error
  },

  async remove(id: string): Promise<void> {
    const { error } = await (supabase.from('allowed_emails') as any).delete().eq('id', id)
    if (error) throw error
  },
}
