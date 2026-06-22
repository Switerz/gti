import { describe, expect, it } from 'vitest'

import { getKpiSaveErrorMessage } from '@/features/kpis/hooks/useKpiWeeklyValues'

describe('KPI save errors', () => {
  it('includes the backend message when Supabase returns one', () => {
    expect(getKpiSaveErrorMessage({ message: 'new row violates row-level security policy' })).toBe(
      'Erro ao salvar valor semanal: new row violates row-level security policy',
    )
  })

  it('uses a safe fallback for unknown failures', () => {
    expect(getKpiSaveErrorMessage(null)).toBe('Erro ao salvar valor semanal.')
  })
})
