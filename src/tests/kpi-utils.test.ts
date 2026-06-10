import { describe, expect, it } from 'vitest'

import {
  buildTrendPoints,
  calculateKpiDelta,
  evaluateKpiValue,
  formatKpiValue,
  formatWeekLabel,
  getIsoWeekRange,
  getVisibleWeeks,
} from '@/features/kpis/kpi-utils'

describe('kpi utils', () => {
  it('evaluates gte targets', () => {
    expect(evaluateKpiValue(96, 96, 'gte')).toBe('on_track')
    expect(evaluateKpiValue(95.9, 96, 'gte')).toBe('off_track')
  })

  it('evaluates lte targets', () => {
    expect(evaluateKpiValue(1, 1, 'lte')).toBe('on_track')
    expect(evaluateKpiValue(1.1, 1, 'lte')).toBe('off_track')
  })

  it('evaluates informational values as neutral when present', () => {
    expect(evaluateKpiValue(10, null, 'informational')).toBe('neutral')
    expect(evaluateKpiValue(null, null, 'informational')).toBe('missing')
  })

  it('formats KPI values', () => {
    expect(formatKpiValue(96.2, 'percent', 1)).toBe('96,2%')
    expect(formatKpiValue(3, 'days', 0)).toBe('3 dias')
    expect(formatKpiValue(null, 'number', 1)).toBe('—')
  })

  it('calculates ISO week range across year boundaries', () => {
    const week = getIsoWeekRange(new Date('2026-01-01T12:00:00Z'))
    expect(week.isoYear).toBe(2026)
    expect(week.isoWeek).toBe(1)
    expect(week.weekStart).toBe('2025-12-29')
    expect(week.weekEnd).toBe('2026-01-04')
  })

  it('returns visible weeks ending at the anchor week', () => {
    const weeks = getVisibleWeeks(new Date('2026-05-13T12:00:00Z'), 4)
    expect(weeks).toHaveLength(4)
    expect(formatWeekLabel(weeks.at(-1)!.isoWeek)).toMatch(/^S\d+$/)
  })

  it('calculates deltas and trend points', () => {
    expect(calculateKpiDelta(110, 100)).toEqual({ absolute: 10, percent: 10 })
    expect(calculateKpiDelta(110, 0)).toEqual({ absolute: 110, percent: null })

    const trend = buildTrendPoints([
      { iso_year: 2026, iso_week: 20, value: 95 },
      { iso_year: 2026, iso_week: 19, value: 94 },
      { iso_year: 2026, iso_week: 18, value: null },
    ])
    expect(trend.map((point) => point.label)).toEqual(['S19', 'S20'])
  })
})
