import type { KpiStatus, KpiTargetOperator, KpiWeeklyValue, KpiWithRelations } from '@/types/domain'

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

function compareKpiWeeks(a: Pick<KpiWeeklyValue, 'iso_year' | 'iso_week'>, b: Pick<KpiWeeklyValue, 'iso_year' | 'iso_week'>) {
  return a.iso_year - b.iso_year || a.iso_week - b.iso_week
}

export function getKpiReportingWeek(kpis: KpiWithRelations[], fallbackWeek: IsoWeek): IsoWeek {
  const hasFallbackValue = kpis.some((kpi) => getKpiValueForWeek(kpi, fallbackWeek))
  if (hasFallbackValue) return fallbackWeek

  let latestValue: KpiWeeklyValue | null = null

  for (const kpi of kpis) {
    for (const value of kpi.weekly_values) {
      if (!latestValue || compareKpiWeeks(value, latestValue) > 0) {
        latestValue = value
      }
    }
  }

  if (!latestValue) return fallbackWeek

  return {
    isoYear: latestValue.iso_year,
    isoWeek: latestValue.iso_week,
    weekStart: latestValue.week_start,
    weekEnd: latestValue.week_end,
  }
}
