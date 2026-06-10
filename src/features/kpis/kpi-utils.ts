import type { KpiFormatKind, KpiStatus, KpiTargetOperator, KpiWeeklyValue } from '@/types/domain'

export type IsoWeek = {
  isoYear: number
  isoWeek: number
  weekStart: string
  weekEnd: string
}

const DAY_MS = 24 * 60 * 60 * 1000

function utcDateOnly(date: Date) {
  return new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
}

function toDateString(date: Date) {
  return date.toISOString().slice(0, 10)
}

export function getIsoWeekRange(date: Date): IsoWeek {
  const utc = utcDateOnly(date)
  const day = utc.getUTCDay() || 7
  const thursday = new Date(utc)
  thursday.setUTCDate(utc.getUTCDate() + 4 - day)

  const isoYear = thursday.getUTCFullYear()
  const yearStart = new Date(Date.UTC(isoYear, 0, 1))
  const isoWeek = Math.ceil(((thursday.getTime() - yearStart.getTime()) / DAY_MS + 1) / 7)

  const weekStart = new Date(utc)
  weekStart.setUTCDate(utc.getUTCDate() - day + 1)
  const weekEnd = new Date(weekStart)
  weekEnd.setUTCDate(weekStart.getUTCDate() + 6)

  return {
    isoYear,
    isoWeek,
    weekStart: toDateString(weekStart),
    weekEnd: toDateString(weekEnd),
  }
}

export function getCurrentIsoWeek(now = new Date()) {
  return getIsoWeekRange(now)
}

export function getVisibleWeeks(anchorDate = new Date(), count = 5): IsoWeek[] {
  const anchor = utcDateOnly(anchorDate)
  const anchorDay = anchor.getUTCDay() || 7
  const currentMonday = new Date(anchor)
  currentMonday.setUTCDate(anchor.getUTCDate() - anchorDay + 1)

  return Array.from({ length: count }).map((_, index) => {
    const offset = index - (count - 1)
    const date = new Date(currentMonday)
    date.setUTCDate(currentMonday.getUTCDate() + offset * 7)
    return getIsoWeekRange(date)
  })
}

export function formatWeekLabel(isoWeek: number) {
  return `S${isoWeek}`
}

export function getKpiWeekLabel(isoWeek: number) {
  return formatWeekLabel(isoWeek)
}

export function evaluateKpiValue(
  value: number | null | undefined,
  targetValue: number | null | undefined,
  targetOperator: KpiTargetOperator,
): KpiStatus {
  if (targetOperator === 'informational') return value == null ? 'missing' : 'neutral'
  if (value == null || targetValue == null) return 'missing'

  if (targetOperator === 'gte') return value >= targetValue ? 'on_track' : 'off_track'
  if (targetOperator === 'lte') return value <= targetValue ? 'on_track' : 'off_track'
  if (targetOperator === 'eq') return value === targetValue ? 'on_track' : 'off_track'

  return 'neutral'
}

export function formatKpiValue(
  value: number | string | null | undefined,
  formatKind: KpiFormatKind,
  decimalPlaces = 1,
  unitLabel?: string | null,
) {
  if (value == null || value === '') return '—'
  if (formatKind === 'text') return String(value)

  const numericValue = Number(value)
  if (Number.isNaN(numericValue)) return '—'

  if (formatKind === 'integer') return Math.round(numericValue).toLocaleString('pt-BR')
  if (formatKind === 'currency') {
    return numericValue.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: decimalPlaces,
      maximumFractionDigits: decimalPlaces,
    })
  }

  const formatted = numericValue.toLocaleString('pt-BR', {
    minimumFractionDigits: decimalPlaces,
    maximumFractionDigits: decimalPlaces,
  })

  if (formatKind === 'percent') return `${formatted}%`
  if (formatKind === 'days') return `${formatted} ${unitLabel ?? 'dias'}`
  return unitLabel ? `${formatted} ${unitLabel}` : formatted
}

export function getKpiStatusColor(status: KpiStatus) {
  if (status === 'on_track') return 'text-green-600 bg-green-500'
  if (status === 'off_track') return 'text-red-600 bg-red-500'
  if (status === 'neutral') return 'text-slate-500 bg-slate-400'
  return 'text-amber-600 bg-amber-400'
}

export function calculateKpiDelta(
  current: number | null | undefined,
  previous: number | null | undefined,
) {
  if (current == null || previous == null) return null
  return {
    absolute: current - previous,
    percent: previous === 0 ? null : ((current - previous) / Math.abs(previous)) * 100,
  }
}

export function buildTrendPoints(values: Array<Pick<KpiWeeklyValue, 'iso_year' | 'iso_week' | 'value'>>) {
  return values
    .filter((value) => value.value != null)
    .sort((a, b) => a.iso_year - b.iso_year || a.iso_week - b.iso_week)
    .map((value) => ({
      label: formatWeekLabel(value.iso_week),
      value: Number(value.value),
      isoYear: value.iso_year,
      isoWeek: value.iso_week,
    }))
}
