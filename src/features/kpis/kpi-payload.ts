import type { Database } from '@/types/database.types'
import type { Kpi, KpiTargetOperator } from '@/types/domain'

import type {
  KpiActionPlanFormValues,
  KpiFormValues,
  KpiOffenderFormValues,
  KpiWeeklyValueFormValues,
} from './kpi.schema'
import { evaluateKpiValue } from './kpi-utils'

type KpiInsert = Database['public']['Tables']['kpis']['Insert']
type KpiUpdate = Database['public']['Tables']['kpis']['Update']
type KpiWeeklyValueInsert = Database['public']['Tables']['kpi_weekly_values']['Insert']
type KpiActionPlanInsert = Database['public']['Tables']['kpi_action_plans']['Insert']
type KpiOffenderInsert = Database['public']['Tables']['kpi_offenders']['Insert']

export function slugifyKpiName(name: string) {
  return name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}

export function buildCreateKpiPayload(values: KpiFormValues, creatorId: string): KpiInsert {
  return {
    name: values.name.trim(),
    slug: slugifyKpiName(values.name),
    description: values.description?.trim() || null,
    group_id: values.groupId,
    category_id: values.categoryId || null,
    project_id: values.projectId || null,
    owner_id: values.ownerId || null,
    created_by: creatorId,
    owner_label: values.ownerLabel?.trim() || null,
    product: values.product?.trim() || null,
    format_kind: values.formatKind,
    decimal_places: values.decimalPlaces,
    target_operator: values.targetOperator,
    target_value: values.targetOperator === 'informational' ? null : values.targetValue,
    target_label: values.targetLabel?.trim() || null,
    unit_label: values.unitLabel?.trim() || null,
    chart_type: values.chartType,
    active: true,
  }
}

export function buildUpdateKpiPayload(values: Partial<KpiFormValues>): KpiUpdate {
  const payload: KpiUpdate = {}

  if (values.name !== undefined) {
    payload.name = values.name.trim()
    payload.slug = slugifyKpiName(values.name)
  }
  if (values.description !== undefined) payload.description = values.description?.trim() || null
  if (values.groupId !== undefined) payload.group_id = values.groupId || null
  if (values.categoryId !== undefined) payload.category_id = values.categoryId || null
  if (values.projectId !== undefined) payload.project_id = values.projectId || null
  if (values.ownerId !== undefined) payload.owner_id = values.ownerId || null
  if (values.ownerLabel !== undefined) payload.owner_label = values.ownerLabel?.trim() || null
  if (values.product !== undefined) payload.product = values.product?.trim() || null
  if (values.formatKind !== undefined) payload.format_kind = values.formatKind
  if (values.decimalPlaces !== undefined) payload.decimal_places = values.decimalPlaces
  if (values.targetOperator !== undefined) payload.target_operator = values.targetOperator
  if (values.targetValue !== undefined) payload.target_value = values.targetValue ?? null
  if (values.targetOperator === 'informational') payload.target_value = null
  if (values.targetLabel !== undefined) payload.target_label = values.targetLabel?.trim() || null
  if (values.unitLabel !== undefined) payload.unit_label = values.unitLabel?.trim() || null
  if (values.chartType !== undefined) payload.chart_type = values.chartType

  return payload
}

export function buildKpiAssignmentRows({
  kpiId,
  actorId,
  ownerId,
  assigneeIds = [],
}: {
  kpiId: string
  actorId: string
  ownerId?: string | null
  assigneeIds?: string[]
}) {
  return Array.from(new Set([ownerId, ...assigneeIds].filter(Boolean) as string[])).map(
    (profileId) => ({
      kpi_id: kpiId,
      profile_id: profileId,
      assigned_by: actorId,
    }),
  )
}

export function diffKpiAssignmentIds(previousIds: string[], nextIds: string[]) {
  const previous = new Set(previousIds)
  const next = new Set(nextIds)

  return {
    added: Array.from(next).filter((id) => !previous.has(id)),
    removed: Array.from(previous).filter((id) => !next.has(id)),
  }
}

export function buildWeeklyValuePayload(
  values: KpiWeeklyValueFormValues,
  kpi: Pick<Kpi, 'target_value' | 'target_operator' | 'format_kind'>,
  actorId: string,
): KpiWeeklyValueInsert {
  const targetOperator = kpi.target_operator as KpiTargetOperator
  const numericValue = values.value ?? null
  const textValue = values.valueText?.trim() || null
  const status =
    kpi.format_kind === 'text'
      ? textValue
        ? 'neutral'
        : 'missing'
      : evaluateKpiValue(numericValue, kpi.target_value, targetOperator)

  return {
    kpi_id: values.kpiId,
    iso_year: values.isoYear,
    iso_week: values.isoWeek,
    week_start: values.weekStart,
    week_end: values.weekEnd,
    value: kpi.format_kind === 'text' ? null : numericValue,
    value_text: kpi.format_kind === 'text' ? textValue : null,
    target_value_snapshot: kpi.target_value,
    target_operator_snapshot: targetOperator,
    status,
    notes: values.notes?.trim() || null,
    created_by: actorId,
    updated_by: actorId,
  }
}

export function buildActionPlanPayload(
  values: KpiActionPlanFormValues,
  actorId: string,
): KpiActionPlanInsert {
  return {
    kpi_id: values.kpiId,
    kpi_weekly_value_id: values.kpiWeeklyValueId || null,
    restriction_text: values.restrictionText?.trim() || null,
    action_text: values.actionText?.trim() || null,
    due_date: values.dueDate || null,
    status: values.status,
    owner_id: values.ownerId || null,
    created_by: actorId,
    position: values.position,
  }
}

export function buildOffenderPayload(values: KpiOffenderFormValues, actorId: string): KpiOffenderInsert {
  return {
    kpi_id: values.kpiId,
    kpi_weekly_value_id: values.kpiWeeklyValueId || null,
    label: values.label.trim(),
    impact_value: values.impactValue,
    impact_label: values.impactLabel?.trim() || null,
    description: values.description?.trim() || null,
    position: values.position,
    created_by: actorId,
  }
}
