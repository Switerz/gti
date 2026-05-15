import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { UnauthorizedPage } from '@/pages/UnauthorizedPage'

// Minimal mock so the component renders without Supabase
vi.mock('@/features/auth/auth.service', () => ({
  authService: {
    signOut: vi.fn(),
  },
}))

describe('UnauthorizedPage', () => {
  it('renders the unauthorized heading', () => {
    render(<UnauthorizedPage />)
    expect(screen.getByText('Acesso não autorizado')).toBeInTheDocument()
  })

  it('shows the sign-out button', () => {
    render(<UnauthorizedPage />)
    expect(
      screen.getByRole('button', { name: /sair e tentar com outra conta/i }),
    ).toBeInTheDocument()
  })

  it('shows the contact admin message', () => {
    render(<UnauthorizedPage />)
    expect(screen.getByText(/entre em contato com o administrador/i)).toBeInTheDocument()
  })
})
