import { supabase } from '@/lib/supabase'
import type { Category } from '@/types/domain'

function slugify(name: string): string {
  return name
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}

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

  async getAllForAdmin(): Promise<Category[]> {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .order('name', { ascending: true })

    if (error) throw error
    return data ?? []
  },

  async create(name: string, color: string | null): Promise<Category> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase.from('categories') as any)
      .insert({ name: name.trim(), slug: slugify(name), color: color ?? null, active: true })
      .select()
      .single()

    if (error) throw error
    return data as Category
  },

  async update(
    id: string,
    values: { name?: string; color?: string | null; active?: boolean },
  ): Promise<void> {
    const payload: Record<string, unknown> = {}
    if (values.name !== undefined) {
      payload.name = values.name.trim()
      payload.slug = slugify(values.name)
    }
    if (values.color !== undefined) payload.color = values.color
    if (values.active !== undefined) payload.active = values.active

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase.from('categories') as any).update(payload).eq('id', id)
    if (error) throw error
  },

  async remove(id: string): Promise<void> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase.from('categories') as any).delete().eq('id', id)
    if (error) throw error
  },
}
