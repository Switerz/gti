import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { KpiOffenderSection } from '@/features/kpis/components/KpiOffenderSection'
import type { KpiOffender, Profile } from '@/types/domain'

const state = vi.hoisted(() => ({
  offenders: [] as KpiOffender[],
  isLoading: false,
  createMutateAsync: vi.fn(),
  updateMutateAsync: vi.fn(),
  deleteMutate: vi.fn(),
}))

vi.mock('@/features/kpis/hooks/useKpiOffenders', () => ({
  useKpiOffenders: () => ({ data: state.offenders, isLoading: state.isLoading }),
  useCreateKpiOffender: () => ({ mutateAsync: state.createMutateAsync, isPending: false }),
  useUpdateKpiOffender: () => ({ mutateAsync: state.updateMutateAsync, isPending: false }),
  useDeleteKpiOffender: () => ({ mutate: state.deleteMutate, isPending: false }),
}))

const profile: Profile = {
  id: 'user-1',
  email: 'mario@gocase.com',
  full_name: 'Mário',
  avatar_url: null,
  role: 'admin',
  active: true,
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-01T00:00:00Z',
}

function offender(overrides: Partial<KpiOffender> = {}): KpiOffender {
  return {
    id: 'offender-1',
    kpi_id: 'kpi-1',
    kpi_weekly_value_id: null,
    label: 'Transportadora Ápice',
    impact_value: 2.3,
    impact_label: 'pp de SLA',
    description: null,
    position: 0,
    created_by: 'user-1',
    created_at: '2026-06-01T00:00:00Z',
    updated_at: '2026-06-01T00:00:00Z',
    ...overrides,
  }
}

describe('KpiOffenderSection', () => {
  it('renders empty state when no offenders exist', () => {
    state.offenders = []
    render(
      <KpiOffenderSection
        kpiId="kpi-1"
        currentProfile={profile}
        canEdit={false}
        formatKind="percent"
        decimalPlaces={1}
        unitLabel="%"
      />,
    )

    expect(screen.getByText('Ofensores')).toBeInTheDocument()
    expect(screen.getByText('Nenhum ofensor cadastrado.')).toBeInTheDocument()
  })

  it('shows Adicionar button when canEdit is true', () => {
    state.offenders = []
    render(
      <KpiOffenderSection
        kpiId="kpi-1"
        currentProfile={profile}
        canEdit={true}
        formatKind="percent"
        decimalPlaces={1}
        unitLabel="%"
      />,
    )

    expect(screen.getByRole('button', { name: /Adicionar/ })).toBeInTheDocument()
  })

  it('renders offender label, impact value and impact label', () => {
    state.offenders = [offender()]
    render(
      <KpiOffenderSection
        kpiId="kpi-1"
        currentProfile={profile}
        canEdit={false}
        formatKind="percent"
        decimalPlaces={1}
        unitLabel="%"
      />,
    )

    expect(screen.getAllByText('Transportadora Ápice').length).toBeGreaterThan(0)
    expect(screen.getAllByText(/2,3%/).length).toBeGreaterThan(0)
    expect(screen.getByText(/pp de SLA/)).toBeInTheDocument()
  })

  it('shows count badge when offenders exist', () => {
    state.offenders = [
      offender({ id: 'off-1', label: 'Transportadora X' }),
      offender({ id: 'off-2', label: 'Transportadora B' }),
    ]
    render(
      <KpiOffenderSection
        kpiId="kpi-1"
        currentProfile={profile}
        canEdit={false}
        formatKind="percent"
        decimalPlaces={1}
        unitLabel="%"
      />,
    )

    expect(screen.getByText('2')).toBeInTheDocument()
  })

  it('renders impact chart when offenders have positive impact values', () => {
    state.offenders = [offender({ impact_value: 2.3 })]
    render(
      <KpiOffenderSection
        kpiId="kpi-1"
        currentProfile={profile}
        canEdit={false}
        formatKind="percent"
        decimalPlaces={1}
        unitLabel="%"
      />,
    )

    expect(screen.getByText('Impacto por ofensor')).toBeInTheDocument()
  })

  it('does not render chart when all impact values are zero or negative', () => {
    state.offenders = [offender({ impact_value: 0 })]
    render(
      <KpiOffenderSection
        kpiId="kpi-1"
        currentProfile={profile}
        canEdit={false}
        formatKind="percent"
        decimalPlaces={1}
        unitLabel="%"
      />,
    )

    expect(screen.queryByText('Impacto por ofensor')).not.toBeInTheDocument()
  })
})
