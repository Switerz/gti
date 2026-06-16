import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { z } from 'zod'

import type { GtiMcpConfig } from '../config.js'
import { requireGtiSupabaseClient } from '../supabase.js'
import { toToolResult } from './utils.js'

const DEFAULT_LIMIT = 50
const MAX_LIMIT = 100

const kpiStatusSchema = z.enum(['on_track', 'off_track', 'neutral', 'missing'])
const kpiTargetOperatorSchema = z.enum(['gte', 'lte', 'eq', 'informational'])

const profileSummarySchema = z
  .object({
    id: z.string(),
    full_name: z.string().nullable(),
    avatar_url: z.string().nullable(),
  })
  .nullable()

const kpiWeeklyValueSchema = z.object({
  id: z.string(),
  kpi_id: z.string().nullable(),
  iso_year: z.number(),
  iso_week: z.number(),
  week_start: z.string(),
  week_end: z.string(),
  value: z.number().nullable(),
  value_text: z.string().nullable(),
  status: kpiStatusSchema,
  notes: z.string().nullable(),
})

const kpiSummarySchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().nullable(),
  group_id: z.string().nullable(),
  group: z
    .object({
      id: z.string(),
      name: z.string(),
      slug: z.string(),
      position: z.number(),
    })
    .nullable(),
  category_id: z.string().nullable(),
  project_id: z.string().nullable(),
  owner_id: z.string().nullable(),
  owner_label: z.string().nullable(),
  product: z.string().nullable(),
  format_kind: z.string(),
  decimal_places: z.number(),
  target_operator: kpiTargetOperatorSchema,
  target_value: z.number().nullable(),
  target_label: z.string().nullable(),
  unit_label: z.string().nullable(),
  active: z.boolean(),
  position: z.number(),
  owner: profileSummarySchema,
  assignments: z.array(profileSummarySchema.unwrap()),
  current_status: kpiStatusSchema,
  current_week_value: kpiWeeklyValueSchema.nullable(),
})

const kpiActionPlanSchema = z.object({
  id: z.string(),
  kpi_id: z.string().nullable(),
  kpi_weekly_value_id: z.string().nullable(),
  restriction_text: z.string().nullable(),
  action_text: z.string().nullable(),
  due_date: z.string().nullable(),
  status: z.enum(['not_started', 'in_progress', 'blocked', 'done', 'cancelled']),
  owner_id: z.string().nullable(),
  position: z.number(),
  created_at: z.string().nullable(),
  updated_at: z.string().nullable(),
})

const okrMilestoneSchema = z.object({
  id: z.string(),
  label: z.string(),
  target_value: z.number(),
  current_value: z.number(),
  position: z.number(),
  progress: z.number(),
})

const okrKeyResultSchema = z.object({
  id: z.string(),
  code: z.string(),
  title: z.string(),
  owner: z.string().nullable(),
  updater: z.string().nullable(),
  data_source: z.string().nullable(),
  grade_min: z.number(),
  grade_target: z.number(),
  current_value: z.number(),
  notes: z.string().nullable(),
  position: z.number(),
  progress: z.number(),
  milestones: z.array(okrMilestoneSchema),
})

const okrObjectiveSchema = z.object({
  id: z.string(),
  macro_title: z.string(),
  description: z.string().nullable(),
  semester: z.string(),
  position: z.number(),
  progress: z.number(),
  key_results: z.array(okrKeyResultSchema),
})

const listKpisInputSchema = z.object({
  search: z.string().trim().min(1).max(120).optional(),
  ownerId: z.string().uuid().optional(),
  product: z.string().trim().min(1).max(120).optional(),
  groupId: z.string().uuid().optional(),
  categoryId: z.string().uuid().optional(),
  projectId: z.string().uuid().optional(),
  status: kpiStatusSchema.optional(),
  isoYear: z.number().int().min(2000).max(2100).optional(),
  isoWeek: z.number().int().min(1).max(53).optional(),
  limit: z.number().int().min(1).max(MAX_LIMIT).default(DEFAULT_LIMIT),
})

const getKpiInputSchema = z.object({
  id: z.string().uuid(),
  actionPlanLimit: z.number().int().min(1).max(50).default(20),
})

const offTrackInputSchema = z.object({
  isoYear: z.number().int().min(2000).max(2100).optional(),
  isoWeek: z.number().int().min(1).max(53).optional(),
  limit: z.number().int().min(1).max(MAX_LIMIT).default(DEFAULT_LIMIT),
})

const actionPlansInputSchema = z.object({
  kpiId: z.string().uuid().optional(),
  includeDone: z.boolean().default(false),
  limit: z.number().int().min(1).max(MAX_LIMIT).default(DEFAULT_LIMIT),
})

const okrsInputSchema = z.object({
  semester: z.string().trim().min(1).max(20).optional(),
})

const kpiListOutputSchema = z.object({
  isoYear: z.number(),
  isoWeek: z.number(),
  kpis: z.array(kpiSummarySchema),
  count: z.number(),
  limit: z.number(),
})

const kpiDetailOutputSchema = z.object({
  kpi: kpiSummarySchema.nullable(),
  weekly_values: z.array(kpiWeeklyValueSchema),
  action_plans: z.array(kpiActionPlanSchema),
})

const offTrackOutputSchema = z.object({
  isoYear: z.number(),
  isoWeek: z.number(),
  counts: z.record(kpiStatusSchema, z.number()),
  off_track: z.array(kpiSummarySchema),
  missing: z.array(kpiSummarySchema),
})

const actionPlansOutputSchema = z.object({
  action_plans: z.array(kpiActionPlanSchema),
  count: z.number(),
  includeDone: z.boolean(),
})

const okrsOutputSchema = z.object({
  objectives: z.array(okrObjectiveSchema),
  count: z.number(),
  average_progress: z.number(),
})

type MaybeOne<T> = T | T[] | null
type ProfileSummary = NonNullable<z.infer<typeof profileSummarySchema>>
type KpiWeeklyValue = z.infer<typeof kpiWeeklyValueSchema>
type KpiSummary = z.infer<typeof kpiSummarySchema>
type KpiStatus = z.infer<typeof kpiStatusSchema>
type KpiTargetOperator = z.infer<typeof kpiTargetOperatorSchema>
type OkrMilestone = z.infer<typeof okrMilestoneSchema>
type OkrKeyResult = z.infer<typeof okrKeyResultSchema>
type OkrObjective = z.infer<typeof okrObjectiveSchema>

type KpiRow = Omit<KpiSummary, 'assignments' | 'current_status' | 'current_week_value'> & {
  target_operator: KpiTargetOperator
  owner: MaybeOne<ProfileSummary>
  assignments: Array<{ profile: ProfileSummary | null }>
  weekly_values: KpiWeeklyValue[]
}

type OkrMilestoneRow = Omit<OkrMilestone, 'progress'>
type OkrKeyResultRow = Omit<OkrKeyResult, 'progress' | 'milestones'> & {
  milestones: OkrMilestoneRow[]
}
type OkrObjectiveRow = Omit<OkrObjective, 'progress' | 'key_results'> & {
  key_results: OkrKeyResultRow[]
}

const kpiSelect = `
  id,
  name,
  description,
  group_id,
  category_id,
  project_id,
  owner_id,
  owner_label,
  product,
  format_kind,
  decimal_places,
  target_operator,
  target_value,
  target_label,
  unit_label,
  active,
  position,
  group:kpi_groups(id, name, slug, position),
  owner:profiles!kpis_owner_id_fkey(id, full_name, avatar_url),
  assignments:kpi_assignments(profile:profiles!kpi_assignments_profile_id_fkey(id, full_name, avatar_url)),
  weekly_values:kpi_weekly_values(id, kpi_id, iso_year, iso_week, week_start, week_end, value, value_text, status, notes)
` as const

const normalizeMaybeOne = <T>(value: MaybeOne<T>): T | null => {
  if (Array.isArray(value)) return value[0] ?? null
  return value
}

const roundPercent = (value: number) => Math.round(value * 1000) / 10

const getIsoWeekRange = (date = new Date()) => {
  const utc = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
  const day = utc.getUTCDay() || 7
  const thursday = new Date(utc)
  thursday.setUTCDate(utc.getUTCDate() + 4 - day)
  const isoYear = thursday.getUTCFullYear()
  const yearStart = new Date(Date.UTC(isoYear, 0, 1))
  const isoWeek = Math.ceil(((thursday.getTime() - yearStart.getTime()) / 86_400_000 + 1) / 7)
  return { isoYear, isoWeek }
}

const evaluateKpiValue = (
  value: number | null | undefined,
  targetValue: number | null | undefined,
  targetOperator: KpiTargetOperator,
): KpiStatus => {
  if (targetOperator === 'informational') return value == null ? 'missing' : 'neutral'
  if (value == null || targetValue == null) return 'missing'
  if (targetOperator === 'gte') return value >= targetValue ? 'on_track' : 'off_track'
  if (targetOperator === 'lte') return value <= targetValue ? 'on_track' : 'off_track'
  if (targetOperator === 'eq') return value === targetValue ? 'on_track' : 'off_track'
  return 'neutral'
}

const getKpiValueForWeek = (kpi: KpiRow, isoYear: number, isoWeek: number) =>
  (kpi.weekly_values ?? []).find((value) => value.iso_year === isoYear && value.iso_week === isoWeek) ?? null

const normalizeKpi = (kpi: KpiRow, isoYear: number, isoWeek: number): KpiSummary => {
  const currentWeekValue = getKpiValueForWeek(kpi, isoYear, isoWeek)
  const currentStatus =
    currentWeekValue?.status ?? evaluateKpiValue(null, kpi.target_value, kpi.target_operator)

  return {
    ...kpi,
    owner: normalizeMaybeOne(kpi.owner),
    assignments: (kpi.assignments ?? [])
      .map((assignment) => assignment.profile)
      .filter((profile): profile is ProfileSummary => profile !== null),
    current_status: currentStatus,
    current_week_value: currentWeekValue,
  }
}

const calcMilestoneProgress = (milestone: OkrMilestoneRow) => {
  if (milestone.target_value === 0) return 0
  return Math.min(Number(milestone.current_value) / Number(milestone.target_value), 1)
}

const calcKeyResultProgress = (kr: OkrKeyResultRow) => {
  if (kr.milestones.length > 0) {
    const totalTarget = kr.milestones.reduce((sum, milestone) => sum + Number(milestone.target_value), 0)
    if (totalTarget === 0) return 0
    const totalDone = kr.milestones.reduce(
      (sum, milestone) => sum + Math.min(Number(milestone.current_value), Number(milestone.target_value)),
      0,
    )
    return Math.min(totalDone / totalTarget, 1)
  }

  if (kr.grade_target === 0) return 0
  return Math.min(Number(kr.current_value) / Number(kr.grade_target), 1)
}

const normalizeOkrObjective = (objective: OkrObjectiveRow): OkrObjective => {
  const keyResults = [...(objective.key_results ?? [])]
    .sort((a, b) => a.position - b.position)
    .map((kr) => ({
      ...kr,
      progress: roundPercent(calcKeyResultProgress(kr)),
      milestones: [...(kr.milestones ?? [])]
        .sort((a, b) => a.position - b.position)
        .map((milestone) => ({
          ...milestone,
          progress: roundPercent(calcMilestoneProgress(milestone)),
        })),
    }))

  const totalTarget = keyResults.reduce((sum, kr) => sum + Number(kr.grade_target), 0)
  const totalDone = keyResults.reduce(
    (sum, kr) => sum + (kr.progress / 100) * Number(kr.grade_target),
    0,
  )

  return {
    ...objective,
    key_results: keyResults,
    progress: totalTarget > 0 ? roundPercent(totalDone / totalTarget) : 0,
  }
}

export const registerKpiOkrTools = (server: McpServer, config: GtiMcpConfig) => {
  server.registerTool(
    'gti_list_kpis',
    {
      title: 'List GTI KPIs',
      description: 'Lists active GTI KPIs with current-week status and optional filters.',
      inputSchema: listKpisInputSchema,
      outputSchema: kpiListOutputSchema,
      annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true },
    },
    async ({ isoYear, isoWeek, status, limit, ...filters }) => {
      const week = isoYear && isoWeek ? { isoYear, isoWeek } : getIsoWeekRange()
      const supabase = requireGtiSupabaseClient(config)
      let query = supabase.from('kpis').select(kpiSelect).eq('active', true)

      if (filters.search) query = query.ilike('name', `%${filters.search}%`)
      if (filters.ownerId) query = query.eq('owner_id', filters.ownerId)
      if (filters.product) query = query.eq('product', filters.product)
      if (filters.groupId) query = query.eq('group_id', filters.groupId)
      if (filters.categoryId) query = query.eq('category_id', filters.categoryId)
      if (filters.projectId) query = query.eq('project_id', filters.projectId)

      const { data, error } = await query
        .order('position', { ascending: true })
        .order('name', { ascending: true })
        .limit(limit)

      if (error) throw error

      const kpis = ((data ?? []) as unknown as KpiRow[])
        .map((kpi) => normalizeKpi(kpi, week.isoYear, week.isoWeek))
        .filter((kpi) => !status || kpi.current_status === status)

      return toToolResult({
        isoYear: week.isoYear,
        isoWeek: week.isoWeek,
        kpis,
        count: kpis.length,
        limit,
      })
    },
  )

  server.registerTool(
    'gti_get_kpi',
    {
      title: 'Get GTI KPI',
      description: 'Gets one GTI KPI with weekly values and recent action plans.',
      inputSchema: getKpiInputSchema,
      outputSchema: kpiDetailOutputSchema,
      annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true },
    },
    async ({ id, actionPlanLimit }) => {
      const supabase = requireGtiSupabaseClient(config)
      const week = getIsoWeekRange()
      const [{ data: kpiData, error: kpiError }, { data: plansData, error: plansError }] =
        await Promise.all([
          supabase.from('kpis').select(kpiSelect).eq('id', id).maybeSingle(),
          supabase
            .from('kpi_action_plans')
            .select('id, kpi_id, kpi_weekly_value_id, restriction_text, action_text, due_date, status, owner_id, position, created_at, updated_at')
            .eq('kpi_id', id)
            .order('position', { ascending: true })
            .order('created_at', { ascending: false })
            .limit(actionPlanLimit),
        ])

      if (kpiError) throw kpiError
      if (plansError) throw plansError

      if (!kpiData) return toToolResult({ kpi: null, weekly_values: [], action_plans: [] })

      const kpi = normalizeKpi(kpiData as unknown as KpiRow, week.isoYear, week.isoWeek)
      return toToolResult({
        kpi,
        weekly_values: [...((kpiData as unknown as KpiRow).weekly_values ?? [])].sort(
          (a, b) => a.iso_year - b.iso_year || a.iso_week - b.iso_week,
        ),
        action_plans: plansData ?? [],
      })
    },
  )

  server.registerTool(
    'gti_summarize_kpis_off_track',
    {
      title: 'Summarize off-track GTI KPIs',
      description: 'Summarizes current or selected week KPIs that are off target or missing values.',
      inputSchema: offTrackInputSchema,
      outputSchema: offTrackOutputSchema,
      annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true },
    },
    async ({ isoYear, isoWeek, limit }) => {
      const week = isoYear && isoWeek ? { isoYear, isoWeek } : getIsoWeekRange()
      const supabase = requireGtiSupabaseClient(config)
      const { data, error } = await supabase
        .from('kpis')
        .select(kpiSelect)
        .eq('active', true)
        .order('position', { ascending: true })
        .order('name', { ascending: true })
        .limit(limit)

      if (error) throw error

      const kpis = ((data ?? []) as unknown as KpiRow[]).map((kpi) =>
        normalizeKpi(kpi, week.isoYear, week.isoWeek),
      )
      const counts = { on_track: 0, off_track: 0, neutral: 0, missing: 0 }
      for (const kpi of kpis) counts[kpi.current_status] += 1

      return toToolResult({
        isoYear: week.isoYear,
        isoWeek: week.isoWeek,
        counts,
        off_track: kpis.filter((kpi) => kpi.current_status === 'off_track'),
        missing: kpis.filter((kpi) => kpi.current_status === 'missing'),
      })
    },
  )

  server.registerTool(
    'gti_list_kpi_action_plans',
    {
      title: 'List GTI KPI action plans',
      description: 'Lists KPI action plans, open by default, optionally scoped to one KPI.',
      inputSchema: actionPlansInputSchema,
      outputSchema: actionPlansOutputSchema,
      annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true },
    },
    async ({ kpiId, includeDone, limit }) => {
      const supabase = requireGtiSupabaseClient(config)
      let query = supabase
        .from('kpi_action_plans')
        .select('id, kpi_id, kpi_weekly_value_id, restriction_text, action_text, due_date, status, owner_id, position, created_at, updated_at')
        .order('due_date', { ascending: true, nullsFirst: false })
        .order('position', { ascending: true })
        .limit(limit)

      if (kpiId) query = query.eq('kpi_id', kpiId)
      if (!includeDone) query = query.not('status', 'in', '("done","cancelled")')

      const { data, error } = await query
      if (error) throw error

      const actionPlans = data ?? []
      return toToolResult({ action_plans: actionPlans, count: actionPlans.length, includeDone })
    },
  )

  server.registerTool(
    'gti_list_okrs',
    {
      title: 'List GTI OKRs',
      description: 'Lists GTI OKR objectives with key results, milestones and computed progress.',
      inputSchema: okrsInputSchema,
      outputSchema: okrsOutputSchema,
      annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true },
    },
    async ({ semester }) => {
      const supabase = requireGtiSupabaseClient(config)
      let query = supabase
        .from('okr_objectives')
        .select('id, macro_title, description, semester, position, key_results:okr_key_results(id, code, title, owner, updater, data_source, grade_min, grade_target, current_value, notes, position, milestones:okr_milestones(id, label, target_value, current_value, position))')
        .order('position', { ascending: true })

      if (semester) query = query.eq('semester', semester)

      const { data, error } = await query
      if (error) throw error

      const objectives = ((data ?? []) as unknown as OkrObjectiveRow[]).map(normalizeOkrObjective)
      const averageProgress =
        objectives.length > 0
          ? roundPercent(objectives.reduce((sum, objective) => sum + objective.progress, 0) / objectives.length / 100)
          : 0

      return toToolResult({
        objectives,
        count: objectives.length,
        average_progress: averageProgress,
      })
    },
  )
}
