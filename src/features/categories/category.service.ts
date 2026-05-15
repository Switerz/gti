import { supabase } from '@/lib/supabase'
import type { Category } from '@/types/domain'

export const categoryService = {
  async getAll(): Promise<Category[]> {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .eq('active', true)
      .order('name', { ascending: true })

    if (error) throw error
    return data ?? []
  },
}
