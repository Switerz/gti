import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { TeamBoardPage } from '@/pages/TeamBoardPage'

const useTasksMock = vi.fn(() => ({ data: [], isLoading: false }))

vi.mock('@/hooks/useCurrentProfile', () => ({
  useCurrentProfile: () => ({
    data: { id: 'user-1', email: 'user@gogroup.com', full_name: 'User', role: 'admin', active: true },
  }),
}))

vi.mock('@/hooks/useTasks', () => ({
  useTasks: (filters: unknown) => useTasksMock(filters),
}))

vi.mock('@/hooks/useTaskStatuses', () => ({
  useTaskStatuses: () => ({
    data: [
      { id: 'todo', name: 'A Fazer', slug: 'todo', color: null, is_final: false, position: 1 },
      { id: 'done', name: 'Concluido', slug: 'done', color: null, is_final: true, position: 2 },
    ],
  }),
}))

vi.mock('@/hooks/useCategories', () => ({
  useCategories: () => ({ data: [{ id: 'cat-1', name: 'BI', color: null }] }),
}))

vi.mock('@/hooks/useProfiles', () => ({
  useProfiles: () => ({
    data: [
      { id: 'user-1', email: 'user@gogroup.com', full_name: 'User' },
      { id: 'user-2', email: 'lead@gogroup.com', full_name: 'Lead' },
    ],
  }),
}))

vi.mock('@/hooks/useProjects', () => ({
  useProjects: () => ({ data: [{ id: 'project-1', name: 'Projeto' }] }),
}))

vi.mock('@/components/tasks/TaskCreateDrawer', () => ({
  TaskCreateDrawer: () => null,
}))

vi.mock('@/components/tasks/TaskEditDrawer', () => ({
  TaskEditDrawer: () => null,
}))

vi.mock('@/components/kanban/KanbanBoard', () => ({
  KanbanBoard: () => <div data-testid="kanban-board" />,
}))

function renderPage() {
  return render(
    <MemoryRouter>
      <TeamBoardPage />
    </MemoryRouter>,
  )
}

describe('TeamBoardPage', () => {
  beforeEach(() => {
    useTasksMock.mockClear()
  })

  it('renders advanced team filters', () => {
    renderPage()

    expect(screen.getByPlaceholderText('Buscar tarefas...')).toBeInTheDocument()
    expect(screen.getByText('Apenas minhas')).toBeInTheDocument()
    expect(screen.getByRole('combobox', { name: 'Filtrar por prioridade' })).toBeInTheDocument()
    expect(screen.getByRole('combobox', { name: 'Filtrar por responsável' })).toBeInTheDocument()
    expect(screen.getByRole('combobox', { name: 'Filtrar por criador' })).toBeInTheDocument()
    expect(screen.getByRole('combobox', { name: 'Filtrar por categoria' })).toBeInTheDocument()
    expect(screen.getByRole('combobox', { name: 'Filtrar por projeto' })).toBeInTheDocument()
    expect(screen.getByRole('combobox', { name: 'Filtrar por status' })).toBeInTheDocument()
    expect(screen.getByRole('combobox', { name: 'Filtrar por vencimento' })).toBeInTheDocument()
  })

  it('queries team tasks with the default active filter shape', () => {
    renderPage()

    expect(useTasksMock).toHaveBeenCalledWith({
      search: undefined,
      priority: undefined,
      categoryId: undefined,
      ownerId: undefined,
      creatorId: undefined,
      projectId: undefined,
      statusId: undefined,
    })
  })
})
