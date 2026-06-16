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

const ProfileSchema = z.object({
  id: z.string(),
  full_name: z.string().nullable(),
  email: z.string(),
  role: z.enum(['admin', 'lead', 'member']),
  active: z.boolean(),
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

const profilesInputSchema = z.object({
  activeOnly: z.boolean().default(true),
  limit: z.number().int().min(1).max(50).default(20),
})

const searchProfilesInputSchema = profilesInputSchema.extend({
  query: z.string().trim().min(1).max(120),
})

const ProfilesOutputSchema = z.object({
  profiles: z.array(ProfileSchema),
  count: z.number(),
  limit: z.number(),
  activeOnly: z.boolean(),
})

const SearchProfilesOutputSchema = ProfilesOutputSchema.extend({
  query: z.string(),
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

  server.registerTool(
    'gti_list_profiles',
    {
      title: 'List GTI profiles',
      description: 'Lists GTI user profiles for assigning tasks, active profiles only by default.',
      inputSchema: profilesInputSchema,
      outputSchema: ProfilesOutputSchema,
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
      },
    },
    async ({ activeOnly, limit }) => {
      const supabase = requireGtiSupabaseClient(config)
      let query = supabase
        .from('profiles')
        .select('id, full_name, email, role, active')
        .order('full_name', { ascending: true })
        .order('email', { ascending: true })
        .limit(limit)

      if (activeOnly) query = query.eq('active', true)

      const { data, error } = await query
      if (error) throw error

      const profiles = data ?? []
      return toToolResult({
        profiles,
        count: profiles.length,
        limit,
        activeOnly,
      })
    },
  )

  server.registerTool(
    'gti_search_profiles',
    {
      title: 'Search GTI profiles',
      description: 'Searches GTI user profiles by full name or email for resolving assignee IDs.',
      inputSchema: searchProfilesInputSchema,
      outputSchema: SearchProfilesOutputSchema,
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
      },
    },
    async ({ query: searchText, activeOnly, limit }) => {
      const supabase = requireGtiSupabaseClient(config)

      let nameQuery = supabase
        .from('profiles')
        .select('id, full_name, email, role, active')
        .ilike('full_name', `%${searchText}%`)
        .order('full_name', { ascending: true })
        .order('email', { ascending: true })
        .limit(limit)

      let emailQuery = supabase
        .from('profiles')
        .select('id, full_name, email, role, active')
        .ilike('email', `%${searchText}%`)
        .order('full_name', { ascending: true })
        .order('email', { ascending: true })
        .limit(limit)

      if (activeOnly) {
        nameQuery = nameQuery.eq('active', true)
        emailQuery = emailQuery.eq('active', true)
      }

      const [{ data: nameData, error: nameError }, { data: emailData, error: emailError }] =
        await Promise.all([nameQuery, emailQuery])

      if (nameError) throw nameError
      if (emailError) throw emailError

      const profilesById = new Map(
        [...(nameData ?? []), ...(emailData ?? [])].map((profile) => [profile.id, profile]),
      )
      const profiles = Array.from(profilesById.values())
        .sort((a, b) => {
          const byName = (a.full_name ?? '').localeCompare(b.full_name ?? '', 'pt-BR')
          if (byName !== 0) return byName
          return a.email.localeCompare(b.email, 'pt-BR')
        })
        .slice(0, limit)
      return toToolResult({
        profiles,
        count: profiles.length,
        limit,
        activeOnly,
        query: searchText,
      })
    },
  )
}
