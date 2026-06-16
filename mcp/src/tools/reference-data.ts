import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { z } from 'zod'

import type { GtiMcpConfig } from '../config.js'
import { requireGtiSupabaseClient } from '../supabase.js'
import { toToolResult } from './utils.js'

const TaskStatusSchema = z.object({
  id: z.string(),
  name: z.string(),
  slug: z.string(),
  position: z.number(),
  color: z.string().nullable(),
  is_final: z.boolean().nullable(),
})

const CategorySchema = z.object({
  id: z.string(),
  name: z.string(),
  slug: z.string(),
  description: z.string().nullable(),
  color: z.string().nullable(),
  active: z.boolean().nullable(),
})

const ProjectSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().nullable(),
  category_id: z.string().nullable(),
  active: z.boolean().nullable(),
  category: z
    .object({
      id: z.string(),
      name: z.string(),
      color: z.string().nullable(),
    })
    .nullable(),
})

const TaskStatusesOutputSchema = z.object({
  taskStatuses: z.array(TaskStatusSchema),
})

const CategoriesOutputSchema = z.object({
  categories: z.array(CategorySchema),
})

const ProjectsOutputSchema = z.object({
  projects: z.array(ProjectSchema),
})

export const registerReferenceDataTools = (server: McpServer, config: GtiMcpConfig) => {
  server.registerTool(
    'gti_list_task_statuses',
    {
      title: 'List GTI task statuses',
      description: 'Lists GTI Kanban task statuses ordered by position.',
      outputSchema: TaskStatusesOutputSchema,
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
      },
    },
    async () => {
      const supabase = requireGtiSupabaseClient(config)
      const { data, error } = await supabase
        .from('task_statuses')
        .select('id, name, slug, position, color, is_final')
        .order('position', { ascending: true })

      if (error) throw error

      return toToolResult({ taskStatuses: data ?? [] })
    },
  )

  server.registerTool(
    'gti_list_categories',
    {
      title: 'List GTI categories',
      description: 'Lists active GTI categories ordered by name.',
      outputSchema: CategoriesOutputSchema,
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
      },
    },
    async () => {
      const supabase = requireGtiSupabaseClient(config)
      const { data, error } = await supabase
        .from('categories')
        .select('id, name, slug, description, color, active')
        .eq('active', true)
        .order('name', { ascending: true })

      if (error) throw error

      return toToolResult({ categories: data ?? [] })
    },
  )

  server.registerTool(
    'gti_list_projects',
    {
      title: 'List GTI projects',
      description: 'Lists active GTI projects ordered by name, including category summary.',
      outputSchema: ProjectsOutputSchema,
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
      },
    },
    async () => {
      const supabase = requireGtiSupabaseClient(config)
      const { data, error } = await supabase
        .from('projects')
        .select('id, name, description, category_id, active, category:categories(id, name, color)')
        .eq('active', true)
        .order('name', { ascending: true })

      if (error) throw error

      return toToolResult({ projects: data ?? [] })
    },
  )
}
