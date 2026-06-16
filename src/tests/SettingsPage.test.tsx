import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi } from 'vitest'

import { SettingsPage } from '@/pages/SettingsPage'

const mocks = vi.hoisted(() => ({
  refetch: vi.fn(),
  refreshSession: vi.fn(),
  session: {
    access_token: 'mock-access-token',
    expires_at: Math.floor(Date.now() / 1000) + 3600,
  } as { access_token: string; expires_at: number },
  writeText: vi.fn(),
}))

vi.mock('@/hooks/useCurrentProfile', () => ({
  useCurrentProfile: () => ({
    data: {
      id: 'profile-1',
      email: 'mario@example.com',
      full_name: 'Mario Monteiro',
      avatar_url: null,
      role: 'member',
      active: true,
      created_at: null,
      updated_at: null,
    },
  }),
}))

vi.mock('@/hooks/useSession', () => ({
  useSession: () => ({
    data: mocks.session,
    refetch: mocks.refetch,
    isFetching: false,
  }),
}))

vi.mock('@/hooks/useAllowlist', () => ({
  useAddAllowlistEntry: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useAllowlist: () => ({ data: [], isLoading: false }),
  useRemoveAllowlistEntry: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useUpdateAllowlistEntry: () => ({ mutate: vi.fn(), isPending: false }),
}))

vi.mock('@/hooks/useCategories', () => ({
  useCategoriesAdmin: () => ({ data: [], isLoading: false }),
  useCreateCategory: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useRemoveCategory: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useUpdateCategory: () => ({ mutate: vi.fn(), mutateAsync: vi.fn(), isPending: false }),
}))

vi.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      refreshSession: mocks.refreshSession,
    },
  },
}))

Object.assign(navigator, {
  clipboard: {
    writeText: mocks.writeText,
  },
})

describe('SettingsPage MCP card', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.session = {
      access_token: 'mock-access-token',
      expires_at: Math.floor(Date.now() / 1000) + 3600,
    }
  })

  it('copies the remote Codex config using the current session token', async () => {
    render(<SettingsPage />)

    await userEvent.click(screen.getByRole('button', { name: /codex/i }))

    expect(mocks.writeText).toHaveBeenCalledWith(
      expect.stringContaining('http_headers = { Authorization = "Bearer mock-access-token" }'),
    )
    expect(mocks.writeText).toHaveBeenCalledWith(expect.stringContaining('/api/mcp'))
  })

  it('refreshes the current session', async () => {
    render(<SettingsPage />)

    await userEvent.click(screen.getByRole('button', { name: /atualizar sessão/i }))

    expect(mocks.refreshSession).toHaveBeenCalled()
    expect(mocks.refetch).toHaveBeenCalled()
  })

  it('copies the Claude Code remote command', async () => {
    render(<SettingsPage />)

    await userEvent.click(screen.getByRole('button', { name: /claude code/i }))

    expect(mocks.writeText).toHaveBeenCalledWith(expect.stringContaining('claude mcp add --transport http gti'))
    expect(mocks.writeText).toHaveBeenCalledWith(expect.stringContaining('Authorization: Bearer mock-access-token'))
  })

  it('copies the remote MCP URL', async () => {
    render(<SettingsPage />)

    await userEvent.click(screen.getByRole('button', { name: /url remota/i }))

    expect(mocks.writeText).toHaveBeenCalledWith(expect.stringContaining('/api/mcp'))
  })

  it('warns when the session token is expired', () => {
    mocks.session = {
      access_token: 'expired-token',
      expires_at: Math.floor(Date.now() / 1000) - 60,
    }

    render(<SettingsPage />)

    expect(screen.getByText(/sessão expirada/i)).toBeInTheDocument()
    expect(screen.getByText(/atualize a sessão antes de copiar/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /token/i })).toBeDisabled()
  })
})
