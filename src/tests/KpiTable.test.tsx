import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { KpiTable } from '@/features/kpis/components/KpiTable'
import type { IsoWeek } from '@/features/kpis/kpi-utils'
import type { KpiWithRelations } from '@/types/domain'

const currentWeek: IsoWeek = {
  isoYear: 2026,
  isoWeek: 20,
  weekStart: '2026-05-11',
  weekEnd: '2026-05-17',
}

const weeks: IsoWeek[] = [
  { isoYear: 2026, isoWeek: 18, weekStart: '2026-04-27', weekEnd: '2026-05-03' },
  { isoYear: 2026, isoWeek: 19, weekStart: '2026-05-04', weekEnd: '2026-05-10' },
  currentWeek,
]

function kpi(overrides: Partial<KpiWithRelations> = {}): KpiWithRelations {
  return {
    id: 'kpi-1',
    name: 'SLA Cliente',
    slug: 'sla-cliente',
    description: null,
    group_id: 'group-1',
    category_id: null,
    project_id: null,
    owner_id: null,
    created_by: null,
    owner_label: 'Lucas & Welis',
    product: 'Gocase e Gobeaute',
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
    group: { id: 'group-1', name: 'Principal', slug: 'principal', position: 1 },
    category: null,
    project: null,
    owner: null,
    created_by_profile: null,
    assignments: [],
    weekly_values: [
      {
        id: 'value-1',
        kpi_id: 'kpi-1',
        iso_year: 2026,
        iso_week: 19,
        week_start: '2026-05-04',
        week_end: '2026-05-10',
        value: 94,
        value_text: null,
        target_value_snapshot: 93,
        target_operator_snapshot: 'gte',
        status: 'on_track',
        notes: null,
        created_by: null,
        updated_by: null,
        created_at: '2026-05-10T00:00:00Z',
        updated_at: '2026-05-10T00:00:00Z',
      },
      {
        id: 'value-2',
        kpi_id: 'kpi-1',
        iso_year: 2026,
        iso_week: 20,
        week_start: '2026-05-11',
        week_end: '2026-05-17',
        value: 92,
        value_text: null,
        target_value_snapshot: 93,
        target_operator_snapshot: 'gte',
        status: 'off_track',
        notes: null,
        created_by: null,
        updated_by: null,
        created_at: '2026-05-17T00:00:00Z',
        updated_at: '2026-05-17T00:00:00Z',
      },
    ],
    ...overrides,
  } as KpiWithRelations
}

describe('KpiTable', () => {
  it('renders KPI groups, week columns and formatted values', () => {
    render(<KpiTable kpis={[kpi()]} weeks={weeks} currentWeek={currentWeek} />)

    expect(screen.getByText('Principal')).toBeInTheDocument()
    expect(screen.getAllByText('SLA Cliente').length).toBeGreaterThan(0)
    expect(screen.getAllByText('S20').length).toBeGreaterThan(0)
    expect(screen.getAllByText('92,0%').length).toBeGreaterThan(0)
    expect(screen.getAllByText('>= 93%').length).toBeGreaterThan(0)
  })

  it('renders missing values as a dash', () => {
    render(<KpiTable kpis={[kpi({ weekly_values: [] })]} weeks={weeks} currentWeek={currentWeek} />)

    expect(screen.getAllByText('—').length).toBeGreaterThan(0)
  })
})
