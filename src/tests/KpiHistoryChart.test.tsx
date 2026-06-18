import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { KpiHistoryChart } from '@/features/kpis/components/KpiHistoryChart'
import type { KpiWeeklyValue } from '@/types/domain'

function weeklyValue(overrides: Partial<KpiWeeklyValue> = {}): KpiWeeklyValue {
  return {
    id: 'value-1',
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
    ...overrides,
  }
}

describe('KpiHistoryChart', () => {
  it('renders an empty state when there are no weekly values', () => {
    render(
      <KpiHistoryChart
        values={[]}
        targetValue={93}
        targetOperator="gte"
        formatKind="percent"
        decimalPlaces={1}
        unitLabel="%"
      />,
    )

    expect(screen.getByText(/Nenhum valor/)).toBeInTheDocument()
  })

  it('renders weekly history and target label', () => {
    render(
      <KpiHistoryChart
        values={[
          weeklyValue({ id: 'value-1', iso_week: 19, value: 94, status: 'on_track' }),
          weeklyValue({ id: 'value-2', iso_week: 20, value: 92, status: 'off_track' }),
        ]}
        targetValue={93}
        targetOperator="gte"
        formatKind="percent"
        decimalPlaces={1}
        unitLabel="%"
      />,
    )

    expect(screen.getByRole('img', { name: /semanal do KPI/ })).toBeInTheDocument()
    expect(screen.getByText('94,0%')).toBeInTheDocument()
    expect(screen.getByText('92,0%')).toBeInTheDocument()
    expect(screen.getByText('2 semanas com valor')).toBeInTheDocument()
    expect(screen.getByText('Meta: 93,0%')).toBeInTheDocument()
  })
})
