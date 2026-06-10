import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { KpiActionPlanSection } from '@/features/kpis/components/KpiActionPlanSection'
import type { KpiActionPlan, Profile } from '@/types/domain'

const state = vi.hoisted(() => ({
  plans: [] as KpiActionPlan[],
  isLoading: false,
  createMutateAsync: vi.fn(),
  updateMutateAsync: vi.fn(),
  deleteMutate: vi.fn(),
}))

vi.mock('@/features/kpis/hooks/useKpiActionPlans', () => ({
  useKpiActionPlans: () => ({ data: state.plans, isLoading: state.isLoading }),
  useCreateKpiActionPlan: () => ({ mutateAsync: state.createMutateAsync, isPending: false }),
  useUpdateKpiActionPlan: () => ({ mutateAsync: state.updateMutateAsync, isPending: false }),
  useDeleteKpiActionPlan: () => ({ mutate: state.deleteMutate, isPending: false }),
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

function plan(overrides: Partial<KpiActionPlan> = {}): KpiActionPlan {
  return {
    id: 'plan-1',
    kpi_id: 'kpi-1',
    kpi_weekly_value_id: null,
    restriction_text: 'Transportadora X com alto índice de atraso',
    restriction_doc: null,
    action_text: 'Negociar SLA com transportadora',
    action_doc: null,
    due_date: '2026-06-30',
    status: 'in_progress',
    owner_id: null,
    created_by: 'user-1',
    position: 0,
    created_at: '2026-06-01T00:00:00Z',
    updated_at: '2026-06-01T00:00:00Z',
    ...overrides,
  }
}

describe('KpiActionPlanSection', () => {
  it('renders empty state when no plans exist', () => {
    state.plans = []
    render(<KpiActionPlanSection kpiId="kpi-1" currentProfile={profile} canEdit={false} />)

    expect(screen.getByText('Planos de Ação')).toBeInTheDocument()
    expect(screen.getByText('Nenhum plano de ação cadastrado.')).toBeInTheDocument()
  })

  it('shows Adicionar button when canEdit is true', () => {
    state.plans = []
    render(<KpiActionPlanSection kpiId="kpi-1" currentProfile={profile} canEdit={true} />)

    expect(screen.getByRole('button', { name: /Adicionar/ })).toBeInTheDocument()
  })

  it('hides Adicionar button when canEdit is false', () => {
    state.plans = []
    render(<KpiActionPlanSection kpiId="kpi-1" currentProfile={profile} canEdit={false} />)

    expect(screen.queryByRole('button', { name: /Adicionar/ })).not.toBeInTheDocument()
  })

  it('renders plan restriction, action text and status badge', () => {
    state.plans = [plan()]
    render(<KpiActionPlanSection kpiId="kpi-1" currentProfile={profile} canEdit={false} />)

    expect(screen.getByText('Em andamento')).toBeInTheDocument()
    expect(screen.getByText('Transportadora X com alto índice de atraso')).toBeInTheDocument()
    expect(screen.getByText('Negociar SLA com transportadora')).toBeInTheDocument()
  })

  it('shows open plan count badge excluding done and cancelled', () => {
    state.plans = [
      plan({ id: 'plan-1', status: 'in_progress' }),
      plan({ id: 'plan-2', status: 'done' }),
      plan({ id: 'plan-3', status: 'cancelled' }),
    ]
    render(<KpiActionPlanSection kpiId="kpi-1" currentProfile={profile} canEdit={false} />)

    expect(screen.getByText('1 aberto')).toBeInTheDocument()
  })

  it('shows plural badge when multiple plans are open', () => {
    state.plans = [
      plan({ id: 'plan-1', status: 'in_progress' }),
      plan({ id: 'plan-2', status: 'blocked' }),
    ]
    render(<KpiActionPlanSection kpiId="kpi-1" currentProfile={profile} canEdit={false} />)

    expect(screen.getByText('2 abertos')).toBeInTheDocument()
  })
})
