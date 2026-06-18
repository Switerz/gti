import { describe, expect, it } from 'vitest'

import { getKpiReportingWeek } from '@/features/kpis/kpi-view-utils'
import type { IsoWeek } from '@/features/kpis/kpi-utils'
import type { KpiWithRelations } from '@/types/domain'

const fallbackWeek: IsoWeek = {
  isoYear: 2026,
  isoWeek: 25,
  weekStart: '2026-06-15',
  weekEnd: '2026-06-21',
}

function kpi(overrides: Partial<KpiWithRelations> = {}): KpiWithRelations {
  return {
    id: 'kpi-1',
    name: 'SLA Cliente',
    slug: 'sla-cliente',
    description: null,
    group_id: null,
    category_id: null,
    project_id: null,
    owner_id: null,
    created_by: null,
    owner_label: null,
    product: null,
    format_kind: 'percent',
    decimal_places: 1,
    target_operator: 'gte',
    target_value: 93,
    target_label: '>= 93%',
    unit_label: '%',
    chart_type: 'line',
    active: true,
    position: 1,
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
    group: null,
    category: null,
    project: null,
    owner: null,
    created_by_profile: null,
    assignments: [],
    weekly_values: [],
    ...overrides,
  } as KpiWithRelations
}

describe('kpi view utils', () => {
  it('uses the latest filled week when the calendar week has no KPI values', () => {
    const week = getKpiReportingWeek(
      [
        kpi({
          weekly_values: [
            {
              id: 'value-1',
              kpi_id: 'kpi-1',
              iso_year: 2026,
              iso_week: 24,
              week_start: '2026-06-08',
              week_end: '2026-06-14',
              value: 89.1,
              value_text: null,
              target_value_snapshot: 93,
              target_operator_snapshot: 'gte',
              status: 'off_track',
              notes: null,
              created_by: null,
              updated_by: null,
              created_at: '2026-06-14T00:00:00Z',
              updated_at: '2026-06-14T00:00:00Z',
            },
          ],
        }),
      ],
      fallbackWeek,
    )

    expect(week).toMatchObject({ isoYear: 2026, isoWeek: 24 })
  })

  it('keeps the calendar week when it already has KPI values', () => {
    const week = getKpiReportingWeek(
      [
        kpi({
          weekly_values: [
            {
              id: 'value-1',
              kpi_id: 'kpi-1',
              iso_year: 2026,
              iso_week: 25,
              week_start: '2026-06-15',
              week_end: '2026-06-21',
              value: 94,
              value_text: null,
              target_value_snapshot: 93,
              target_operator_snapshot: 'gte',
              status: 'on_track',
              notes: null,
              created_by: null,
              updated_by: null,
              created_at: '2026-06-21T00:00:00Z',
              updated_at: '2026-06-21T00:00:00Z',
            },
          ],
        }),
      ],
      fallbackWeek,
    )

    expect(week).toBe(fallbackWeek)
  })
})
