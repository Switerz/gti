/* eslint-disable @typescript-eslint/no-explicit-any */
// Keep writes explicit where RLS applies operation-specific policies.
import { supabase } from '@/lib/supabase'
import type {
  Kpi,
  KpiActionPlan,
  KpiActivityAction,
  KpiGroup,
  KpiOffender,
  KpiWeeklyValue,
  KpiWithRelations,
} from '@/types/domain'

import type {
  KpiActionPlanFormValues,
  KpiFormValues,
  KpiOffenderFormValues,
  KpiWeeklyValueFormValues,
} from './kpi.schema'
import {
  buildActionPlanPayload,
  buildCreateKpiPayload,
  buildKpiAssignmentRows,
  buildOffenderPayload,
  buildUpdateKpiPayload,
  buildWeeklyValuePayload,
  diffKpiAssignmentIds,
} from './kpi-payload'

const KPI_SELECT = `
  *,
  group:kpi_groups(id, name, slug, position),
  category:categories(id, name, color),
  project:projects(id, name),
  owner:profiles!kpis_owner_id_fkey(id, full_name, avatar_url),
  created_by_profile:profiles!kpis_created_by_fkey(id, full_name, avatar_url),
  assignments:kpi_assignments(profile:profiles!kpi_assignments_profile_id_fkey(id, full_name, avatar_url)),
  weekly_values:kpi_weekly_values(*)
` as const

export type KpiFilters = {
  search?: string
  ownerId?: string
  product?: string
  groupId?: string
  categoryId?: string
  projectId?: string
  active?: boolean
}

const db = {
  kpis: () => supabase.from('kpis') as any,
  kpi_assignments: () => supabase.from('kpi_assignments') as any,
  kpi_weekly_values: () => supabase.from('kpi_weekly_values') as any,
  kpi_action_plans: () => supabase.from('kpi_action_plans') as any,
  kpi_offenders: () => supabase.from('kpi_offenders') as any,
  kpi_activity_logs: () => supabase.from('kpi_activity_logs') as any,
}

export const kpiService = {
  async getGroups(): Promise<KpiGroup[]> {
    const { data, error } = await supabase
      .from('kpi_groups')
      .select('*')
      .eq('active', true)
      .order('position', { ascending: true })

    if (error) throw error
    return data ?? []
  },

  async getAll(filters: KpiFilters = {}): Promise<KpiWithRelations[]> {
    let query = supabase.from('kpis').select(KPI_SELECT)

    if (filters.active !== false) query = query.eq('active', true)
    if (filters.search) query = query.ilike('name', `%${filters.search}%`)
    if (filters.ownerId) query = query.eq('owner_id', filters.ownerId)
    if (filters.product) query = query.eq('product', filters.product)
    if (filters.groupId) query = query.eq('group_id', filters.groupId)
    if (filters.categoryId) query = query.eq('category_id', filters.categoryId)
    if (filters.projectId) query = query.eq('project_id', filters.projectId)

    query = query.order('position', { ascending: true }).order('name', { ascending: true })

    const { data, error } = await query
    if (error) throw error
    return (data ?? []) as unknown as KpiWithRelations[]
  },

  async getMine(profileId: string): Promise<KpiWithRelations[]> {
    const kpis = await kpiService.getAll()
    return kpis.filter(
      (kpi) =>
        kpi.owner_id === profileId ||
        kpi.created_by === profileId ||
        kpi.assignments.some((assignment) => assignment.profile.id === profileId),
    )
  },

  async getById(id: string): Promise<KpiWithRelations | null> {
    const { data, error } = await supabase.from('kpis').select(KPI_SELECT).eq('id', id).maybeSingle()
    if (error) throw error
    return data as unknown as KpiWithRelations | null
  },

  async create(values: KpiFormValues, creatorId: string): Promise<KpiWithRelations> {
    const { data: kpi, error } = await db.kpis()
      .insert(buildCreateKpiPayload(values, creatorId))
      .select('id')
      .single()

    if (error) throw error

    const assignmentRows = buildKpiAssignmentRows({
      kpiId: kpi.id,
      actorId: creatorId,
      ownerId: values.ownerId,
      assigneeIds: values.assigneeIds,
    })

    if (assignmentRows.length > 0) {
      const { error: assignmentError } = await db.kpi_assignments().insert(assignmentRows)
      if (assignmentError) throw assignmentError
    }

    await kpiService.logActivity(kpi.id, creatorId, 'kpi_created')

    const full = await kpiService.getById(kpi.id)
    if (!full) throw new Error('KPI created but not found')
    return full
  },

  async update(id: string, values: Partial<KpiFormValues>, actorId: string): Promise<KpiWithRelations> {
    const payload = buildUpdateKpiPayload(values)

    if (Object.keys(payload).length > 0) {
      const { error } = await db.kpis().update(payload).eq('id', id)
      if (error) throw error
    }

    if (values.assigneeIds !== undefined || values.ownerId !== undefined) {
      const current = await kpiService.getById(id)
      if (!current) throw new Error('KPI not found')
      const ownerId = values.ownerId !== undefined ? values.ownerId : current.owner_id
      const assigneeIds =
        values.assigneeIds !== undefined
          ? values.assigneeIds
          : current.assignments.map((assignment) => assignment.profile.id).filter((profileId) => profileId !== ownerId)

      const { data: existingRows, error: existingError } = await db
        .kpi_assignments()
        .select('profile_id')
        .eq('kpi_id', id)
      if (existingError) throw existingError

      const rows = buildKpiAssignmentRows({
        kpiId: id,
        actorId,
        ownerId,
        assigneeIds,
      })
      const changes = diffKpiAssignmentIds(
        (existingRows ?? []).map((row: { profile_id: string }) => row.profile_id),
        rows.map((row) => row.profile_id),
      )

      if (changes.removed.length > 0) {
        const { error: removeError } = await db
          .kpi_assignments()
          .delete()
          .eq('kpi_id', id)
          .in('profile_id', changes.removed)
        if (removeError) throw removeError
      }

      const addedRows = rows.filter((row) => changes.added.includes(row.profile_id))
      if (addedRows.length > 0) {
        const { error: addError } = await db.kpi_assignments().insert(addedRows)
        if (addError) throw addError
      }
    }

    await kpiService.logActivity(id, actorId, 'kpi_updated', payload)

    const full = await kpiService.getById(id)
    if (!full) throw new Error('KPI not found after update')
    return full
  },

  async archive(id: string, actorId: string): Promise<void> {
    const { error } = await db.kpis().update({ active: false }).eq('id', id)
    if (error) throw error
    await kpiService.logActivity(id, actorId, 'kpi_archived')
  },

  async getWeeklyValues(kpiId: string): Promise<KpiWeeklyValue[]> {
    const { data, error } = await supabase
      .from('kpi_weekly_values')
      .select('*')
      .eq('kpi_id', kpiId)
      .order('iso_year', { ascending: true })
      .order('iso_week', { ascending: true })

    if (error) throw error
    return data ?? []
  },

  async upsertWeeklyValue(
    values: KpiWeeklyValueFormValues,
    actorId: string,
  ): Promise<KpiWeeklyValue> {
    const kpi = await kpiService.getById(values.kpiId)
    if (!kpi) throw new Error('KPI not found')

    const { data: existing, error: existingError } = await db
      .kpi_weekly_values()
      .select('id')
      .eq('kpi_id', values.kpiId)
      .eq('iso_year', values.isoYear)
      .eq('iso_week', values.isoWeek)
      .maybeSingle()
    if (existingError) throw existingError

    const payload = buildWeeklyValuePayload(values, kpi as Kpi, actorId)
    let writeQuery

    if (existing) {
      const { created_by: _createdBy, ...updatePayload } = payload
      void _createdBy
      writeQuery = db.kpi_weekly_values().update(updatePayload).eq('id', existing.id)
      // The write is restricted where the primary key matches the row found above.
    } else {
      writeQuery = db.kpi_weekly_values().insert(payload)
    }

    const { data, error } = await writeQuery.select('*').single()

    if (error) throw error

    await kpiService.logActivity(
      values.kpiId,
      actorId,
      existing ? 'weekly_value_updated' : 'weekly_value_created',
      { iso_year: values.isoYear, iso_week: values.isoWeek },
    )

    return data as KpiWeeklyValue
  },

  async getKpiIdsWithOpenActionPlans(): Promise<string[]> {
    const { data, error } = await supabase
      .from('kpi_action_plans')
      .select('kpi_id')
      .not('status', 'in', '("done","cancelled")')

    if (error) throw error
    return [...new Set((data ?? []).map((row: { kpi_id: string }) => row.kpi_id))]
  },

  async getActionPlans(kpiId: string): Promise<KpiActionPlan[]> {
    const { data, error } = await supabase
      .from('kpi_action_plans')
      .select('*')
      .eq('kpi_id', kpiId)
      .order('position', { ascending: true })
      .order('created_at', { ascending: false })

    if (error) throw error
    return data ?? []
  },

  async createActionPlan(values: KpiActionPlanFormValues, actorId: string): Promise<KpiActionPlan> {
    const { data, error } = await db
      .kpi_action_plans()
      .insert(buildActionPlanPayload(values, actorId))
      .select('*')
      .single()

    if (error) throw error
    await kpiService.logActivity(values.kpiId, actorId, 'action_plan_created')
    return data as KpiActionPlan
  },

  async updateActionPlan(
    id: string,
    kpiId: string,
    values: Partial<KpiActionPlanFormValues>,
    actorId: string,
  ): Promise<KpiActionPlan> {
    const payload: Record<string, unknown> = {}
    if (values.kpiWeeklyValueId !== undefined) payload.kpi_weekly_value_id = values.kpiWeeklyValueId || null
    if (values.restrictionText !== undefined) payload.restriction_text = values.restrictionText?.trim() || null
    if (values.actionText !== undefined) payload.action_text = values.actionText?.trim() || null
    if (values.dueDate !== undefined) payload.due_date = values.dueDate || null
    if (values.status !== undefined) payload.status = values.status
    if (values.ownerId !== undefined) payload.owner_id = values.ownerId || null
    if (values.position !== undefined) payload.position = values.position

    const { data, error } = await db.kpi_action_plans().update(payload).eq('id', id).select('*').single()
    if (error) throw error
    await kpiService.logActivity(kpiId, actorId, 'action_plan_updated', payload)
    return data as KpiActionPlan
  },

  async deleteActionPlan(id: string): Promise<void> {
    const { error } = await db.kpi_action_plans().delete().eq('id', id)
    if (error) throw error
  },

  async getOffenders(kpiId: string): Promise<KpiOffender[]> {
    const { data, error } = await supabase
      .from('kpi_offenders')
      .select('*')
      .eq('kpi_id', kpiId)
      .order('position', { ascending: true })

    if (error) throw error
    return data ?? []
  },

  async createOffender(values: KpiOffenderFormValues, actorId: string): Promise<KpiOffender> {
    const { data, error } = await db
      .kpi_offenders()
      .insert(buildOffenderPayload(values, actorId))
      .select('*')
      .single()

    if (error) throw error
    await kpiService.logActivity(values.kpiId, actorId, 'offender_created')
    return data as KpiOffender
  },

  async updateOffender(
    id: string,
    kpiId: string,
    values: Partial<KpiOffenderFormValues>,
    actorId: string,
  ): Promise<KpiOffender> {
    const payload: Record<string, unknown> = {}
    if (values.kpiWeeklyValueId !== undefined) payload.kpi_weekly_value_id = values.kpiWeeklyValueId || null
    if (values.label !== undefined) payload.label = values.label.trim()
    if (values.impactValue !== undefined) payload.impact_value = values.impactValue
    if (values.impactLabel !== undefined) payload.impact_label = values.impactLabel?.trim() || null
    if (values.description !== undefined) payload.description = values.description?.trim() || null
    if (values.position !== undefined) payload.position = values.position

    const { data, error } = await db.kpi_offenders().update(payload).eq('id', id).select('*').single()
    if (error) throw error
    await kpiService.logActivity(kpiId, actorId, 'offender_updated', payload)
    return data as KpiOffender
  },

  async deleteOffender(id: string): Promise<void> {
    const { error } = await db.kpi_offenders().delete().eq('id', id)
    if (error) throw error
  },

  async logActivity(
    kpiId: string,
    actorId: string,
    action: KpiActivityAction,
    metadata?: Record<string, unknown>,
  ): Promise<void> {
    await db.kpi_activity_logs().insert({
      kpi_id: kpiId,
      actor_id: actorId,
      action,
      metadata: metadata ?? null,
    })
  },
}
