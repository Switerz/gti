import type { KpiStatus, KpiTargetOperator, KpiWeeklyValue, KpiWithRelations } from '@/types/domain'

import type { IsoWeek } from './kpi-utils'
import { evaluateKpiValue, getIsoWeekRange } from './kpi-utils'

const KPI_MIN_CURRENT_WEEK = getIsoWeekRange(new Date('2026-06-18T12:00:00'))

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

function compareWeeks(a: Pick<IsoWeek, 'isoYear' | 'isoWeek'>, b: Pick<IsoWeek, 'isoYear' | 'isoWeek'>) {
  return a.isoYear - b.isoYear || a.isoWeek - b.isoWeek
}

function weekFromWeeklyValue(value: KpiWeeklyValue): IsoWeek {
  return {
    isoYear: value.iso_year,
    isoWeek: value.iso_week,
    weekStart: value.week_start,
    weekEnd: value.week_end,
  }
}

function addWeeks(week: IsoWeek, amount: number) {
  const date = new Date(`${week.weekStart}T12:00:00`)
  date.setDate(date.getDate() + amount * 7)
  return getIsoWeekRange(date)
}

export function getKpiOperationalWeek(kpis: KpiWithRelations[], calendarWeek: IsoWeek): IsoWeek {
  let latestWeek: IsoWeek | null = null

  for (const kpi of kpis) {
    for (const value of kpi.weekly_values) {
      const valueWeek = weekFromWeeklyValue(value)
      if (!latestWeek || compareWeeks(valueWeek, latestWeek) > 0) {
        latestWeek = valueWeek
      }
    }
  }

  if (!latestWeek) {
    return compareWeeks(KPI_MIN_CURRENT_WEEK, calendarWeek) > 0 ? KPI_MIN_CURRENT_WEEK : calendarWeek
  }

  const nextWeekAfterLatestValue = addWeeks(latestWeek, 1)
  return [calendarWeek, nextWeekAfterLatestValue, KPI_MIN_CURRENT_WEEK].reduce((latest, week) =>
    compareWeeks(week, latest) > 0 ? week : latest,
  )
}
