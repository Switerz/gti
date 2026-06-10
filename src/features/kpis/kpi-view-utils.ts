import type { KpiStatus, KpiTargetOperator, KpiWithRelations } from '@/types/domain'

import type { IsoWeek } from './kpi-utils'
import { evaluateKpiValue } from './kpi-utils'

export type KpiFilterState = {
  search: string
  ownerId: string
  product: string
  groupId: string
  categoryId: string
  status: string
  hasOpenPlan: string
}

export const EMPTY_KPI_FILTERS: KpiFilterState = {
  search: '',
  ownerId: '',
  product: '',
  groupId: '',
  categoryId: '',
  status: '',
  hasOpenPlan: '',
}

export function getWeekKey(week: Pick<IsoWeek, 'isoYear' | 'isoWeek'>) {
  return `${week.isoYear}-${week.isoWeek}`
}

export function getKpiValueForWeek(kpi: KpiWithRelations, week: Pick<IsoWeek, 'isoYear' | 'isoWeek'>) {
  return kpi.weekly_values.find(
    (value) => value.iso_year === week.isoYear && value.iso_week === week.isoWeek,
  )
}

export function getKpiCurrentStatus(
  kpi: KpiWithRelations,
  currentWeek: Pick<IsoWeek, 'isoYear' | 'isoWeek'>,
) {
  const currentValue = getKpiValueForWeek(kpi, currentWeek)
  if (currentValue) return currentValue.status as KpiStatus
  return evaluateKpiValue(null, kpi.target_value, kpi.target_operator as KpiTargetOperator)
}
