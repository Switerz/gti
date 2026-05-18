import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { NotificationBell } from '@/components/layout/NotificationBell'
import { useTaskNotifications } from '@/hooks/useTaskNotifications'

vi.mock('@/hooks/useCurrentProfile', () => ({
  useCurrentProfile: () => ({
    data: { id: 'user-1', full_name: 'Maria', role: 'member', avatar_url: null },
  }),
}))

vi.mock('@/hooks/useTaskNotifications', () => ({
  useTaskNotifications: vi.fn(),
}))

const markAsRead = vi.fn()
const markAllAsRead = vi.fn()
const clear = vi.fn()

function renderBell() {
  return render(
    <MemoryRouter>
      <NotificationBell />
    </MemoryRouter>,
  )
}

describe('NotificationBell', () => {
  beforeEach(() => {
    vi.mocked(useTaskNotifications).mockReturnValue({
      notifications: [],
      unreadCount: 0,
      markAsRead,
      markAllAsRead,
      clear,
    })
    markAsRead.mockClear()
    markAllAsRead.mockClear()
    clear.mockClear()
  })

  it('renders an empty notification state', async () => {
    renderBell()

    await userEvent.click(screen.getByRole('button', { name: /abrir notificacoes/i }))

    expect(screen.getByText('Sem novidades')).toBeInTheDocument()
  })

  it('shows unread count and notification content', async () => {
    vi.mocked(useTaskNotifications).mockReturnValue({
      notifications: [
        {
          id: 'n1',
          taskId: 'task-1',
          profileId: 'user-1',
          assignedBy: 'user-2',
          createdAt: '2026-05-15T10:00:00Z',
          taskTitle: 'Revisar SLA da Jadlog',
          projectName: 'Monitoramento',
          read: false,
        },
      ],
      unreadCount: 1,
      markAsRead,
      markAllAsRead,
      clear,
    })

    renderBell()

    expect(screen.getByRole('button', { name: /1 notificacoes nao lidas/i })).toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: /1 notificacoes nao lidas/i }))

    expect(screen.getByText('Revisar SLA da Jadlog')).toBeInTheDocument()
    expect(screen.getByText('Monitoramento')).toBeInTheDocument()
  })
})
