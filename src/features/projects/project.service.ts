/* eslint-disable @typescript-eslint/no-explicit-any */
import { supabase } from '@/lib/supabase'
import type { Project, ProjectWithCategory } from '@/types/domain'

const PROJECT_SELECT = '*, category:categories(id, name, color)' as const

export const projectService = {
  async getAll(): Promise<ProjectWithCategory[]> {
    const { data, error } = await supabase
      .from('projects')
      .select(PROJECT_SELECT)
      .eq('active', true)
      .order('name', { ascending: true })

    if (error) throw error
    return (data ?? []) as unknown as ProjectWithCategory[]
  },

  async getById(id: string): Promise<ProjectWithCategory | null> {
    const { data, error } = await supabase
      .from('projects')
      .select(PROJECT_SELECT)
      .eq('id', id)
      .maybeSingle()

    if (error) throw error
    return data as unknown as ProjectWithCategory | null
  },

  async create(params: {
    name: string
    description?: string
    categoryId?: string
    createdBy: string
  }): Promise<Project> {
    const { data, error } = await (supabase.from('projects') as any)
      .insert({
        name: params.name,
        description: params.description || null,
        category_id: params.categoryId || null,
        created_by: params.createdBy,
      })
      .select('*')
      .single()

    if (error) throw error
    return data as unknown as Project
  },

  async update(
    id: string,
    values: { name?: string; description?: string | null; categoryId?: string | null },
  ): Promise<ProjectWithCategory> {
    const payload: Record<string, unknown> = {}
    if (values.name !== undefined) payload.name = values.name
    if ('description' in values) payload.description = values.description
    if ('categoryId' in values) payload.category_id = values.categoryId || null

    const { data, error } = await (supabase.from('projects') as any)
      .update(payload)
      .eq('id', id)
      .select(PROJECT_SELECT)
      .single()

    if (error) throw error
    return data as unknown as ProjectWithCategory
  },
}
