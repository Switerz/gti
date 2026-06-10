import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { KpiValueCell } from '@/features/kpis/components/KpiValueCell'

describe('KpiValueCell', () => {
  it('edits numeric value with Enter', async () => {
    const user = userEvent.setup()
    const onSave = vi.fn()

    render(
      <KpiValueCell
        formatKind="percent"
        decimalPlaces={1}
        editable
        onSave={onSave}
      />,
    )

    await user.click(screen.getByRole('button'))
    await user.type(screen.getByLabelText('Valor do KPI'), '96.5{Enter}')

    expect(onSave).toHaveBeenCalledWith({ value: 96.5, notes: '' })
  })

  it('edits text value', async () => {
    const user = userEvent.setup()
    const onSave = vi.fn()

    render(
      <KpiValueCell
        formatKind="text"
        decimalPlaces={0}
        editable
        onSave={onSave}
      />,
    )

    await user.click(screen.getByRole('button'))
    await user.type(screen.getByLabelText('Valor do KPI'), 'Sem desvio{Enter}')

    expect(onSave).toHaveBeenCalledWith({ valueText: 'Sem desvio', notes: '' })
  })
})
