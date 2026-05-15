/* eslint-disable @typescript-eslint/no-explicit-any */
import { supabase } from '@/lib/supabase'
import type { Project, ProjectWithCategory } from '@/types/domain'

export const projectService = {
  async getAll(): Promise<ProjectWithCategory[]> {
    const { data, error } = await supabase
      .from('projects')
      .select('*, category:categories(id, name, color)')
      .eq('active', true)
      .order('name', { ascending: true })

    if (error) throw error
    return (data ?? []) as unknown as ProjectWithCategory[]
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
}
