import { render, screen } from '@testing-library/react'
import { vi } from 'vitest'

import App from '@/app/App'

// Unauthenticated users should always land on /login
vi.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: vi.fn().mockResolvedValue({ data: { session: null }, error: null }),
      onAuthStateChange: vi.fn().mockReturnValue({ data: { subscription: { unsubscribe: vi.fn() } } }),
    },
  },
  isSupabaseConfigured: false,
}))

describe('App', () => {
  it('redirects unauthenticated users to the login page', async () => {
    window.history.pushState({}, 'Dashboard', '/dashboard')

    render(<App />)

    expect(await screen.findByText('GTI')).toBeInTheDocument()
    expect(screen.getByText(/Gestão de Tarefas Inteligente/i)).toBeInTheDocument()
  })
})
