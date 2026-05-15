import React from 'react'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'

import { TaskListPage } from '@/pages/TaskListPage'
import type { TaskWithRelations } from '@/types/domain'

// ─── Module mocks ─────────────────────────────────────────────────────────────

vi.mock('@/hooks/useCurrentProfile', () => ({
  useCurrentProfile: vi.fn(() => ({
    data: { id: 'u1', full_name: 'Alice', role: 'admin', avatar_url: null },
  })),
}))

vi.mock('@/hooks/useTaskStatuses', () => ({
  useTaskStatuses: vi.fn(() => ({
    data: [
      { id: 's1', name: 'A fazer', slug: 'todo', color: '#888', is_final: false },
      { id: 's2', name: 'Concluído', slug: 'done', color: '#22c55e', is_final: true },
    ],
  })),
}))

vi.mock('@/hooks/useCategories', () => ({
  useCategories: vi.fn(() => ({ data: [] })),
}))

vi.mock('@/hooks/useTasks', () => ({
  useTasks: vi.fn(() => ({ data: [], isLoading: false, isError: false })),
}))

// TaskCreateDrawer and TaskEditDrawer are heavy — stub them
vi.mock('@/components/tasks/TaskCreateDrawer', () => ({
  TaskCreateDrawer: () => null,
}))

vi.mock('@/components/tasks/TaskEditDrawer', () => ({
  TaskEditDrawer: () => null,
}))

// Radix UI Select throws for value="" in dev/jsdom — use native selects in tests
vi.mock('@/components/ui/select', () => ({
  Select: ({ value, onValueChange, children }: { value: string; onValueChange: (v: string) => void; children: React.ReactNode }) => (
    <select value={value} onChange={(e) => onValueChange(e.target.value)}>{children}</select>
  ),
  SelectTrigger: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  SelectValue: ({ placeholder }: { placeholder?: string }) => <span>{placeholder}</span>,
  SelectContent: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  SelectItem: ({ value, children }: { value: string; children: React.ReactNode }) => (
    <option value={value}>{children}</option>
  ),
}))

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeTask(overrides: Partial<TaskWithRelations> = {}): TaskWithRelations {
  return {
    id: 'task-1',
    title: 'Deploy ao prod',
    description: null,
    status_id: 's1',
    status: { id: 's1', name: 'A fazer', slug: 'todo', color: '#888', is_final: false },
    category_id: null,
    category: null,
    project_id: null,
    project: null,
    creator_id: 'u1',
    creator: null,
    owner_id: 'u1',
    owner: { id: 'u1', full_name: 'Alice', avatar_url: null },
    priority: 'high',
    due_date: null,
    start_date: null,
    position: 0,
    is_archived: false,
    completed_at: null,
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-06-01T00:00:00Z',
    assignees: [],
    _comments: [],
    _checklist: [],
    ...overrides,
  } as unknown as TaskWithRelations
}

function renderPage() {
  return render(
    <MemoryRouter>
      <TaskListPage />
    </MemoryRouter>,
  )
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('TaskListPage', () => {
  it('renders the page header title', () => {
    renderPage()
    expect(screen.getByText('Lista de Tarefas')).toBeInTheDocument()
  })

  it('renders the search input', () => {
    renderPage()
    expect(screen.getByPlaceholderText('Buscar tarefas...')).toBeInTheDocument()
  })

  it('shows empty state message when there are no tasks', () => {
    renderPage()
    expect(screen.getByText(/nenhuma tarefa ainda/i)).toBeInTheDocument()
  })

  it('shows "Nova tarefa" button when profile is loaded', () => {
    renderPage()
    expect(screen.getByRole('button', { name: /nova tarefa/i })).toBeInTheDocument()
  })

  it('renders a row for each non-archived task', async () => {
    const { useTasks } = await import('@/hooks/useTasks')
    vi.mocked(useTasks).mockReturnValue({
      data: [
        makeTask({ id: '1', title: 'Alpha task' }),
        makeTask({ id: '2', title: 'Beta task' }),
      ],
      isLoading: false,
      isError: false,
    } as ReturnType<typeof useTasks>)

    renderPage()
    expect(screen.getByText('Alpha task')).toBeInTheDocument()
    expect(screen.getByText('Beta task')).toBeInTheDocument()
  })

  it('excludes archived tasks from the table', async () => {
    const { useTasks } = await import('@/hooks/useTasks')
    vi.mocked(useTasks).mockReturnValue({
      data: [
        makeTask({ id: '1', title: 'Visible task', is_archived: false }),
        makeTask({ id: '2', title: 'Archived task', is_archived: true }),
      ],
      isLoading: false,
      isError: false,
    } as ReturnType<typeof useTasks>)

    renderPage()
    expect(screen.getByText('Visible task')).toBeInTheDocument()
    expect(screen.queryByText('Archived task')).not.toBeInTheDocument()
  })

  it('shows the task count footer', async () => {
    const { useTasks } = await import('@/hooks/useTasks')
    vi.mocked(useTasks).mockReturnValue({
      data: [makeTask({ id: '1' }), makeTask({ id: '2' })],
      isLoading: false,
      isError: false,
    } as ReturnType<typeof useTasks>)

    renderPage()
    expect(screen.getByText(/2 tarefas/i)).toBeInTheDocument()
  })

  it('shows loading skeleton rows when isLoading is true', async () => {
    const { useTasks } = await import('@/hooks/useTasks')
    vi.mocked(useTasks).mockReturnValue({
      data: [],
      isLoading: true,
      isError: false,
    } as ReturnType<typeof useTasks>)

    renderPage()
    expect(screen.queryByText(/nenhuma tarefa/i)).not.toBeInTheDocument()
    // Skeleton cells are rendered — table body has rows without task content
    const tbody = screen.getByRole('table').querySelector('tbody')
    expect(tbody?.querySelectorAll('tr').length).toBeGreaterThan(0)
  })

  it('shows error state when isError is true', async () => {
    const { useTasks } = await import('@/hooks/useTasks')
    vi.mocked(useTasks).mockReturnValue({
      data: [],
      isLoading: false,
      isError: true,
    } as ReturnType<typeof useTasks>)

    renderPage()
    expect(screen.getByText(/erro ao carregar tarefas/i)).toBeInTheDocument()
  })
})

// ─── Sorting ──────────────────────────────────────────────────────────────────

describe('TaskListPage column sorting', () => {
  async function renderWithTasks(tasks: TaskWithRelations[]) {
    const { useTasks } = await import('@/hooks/useTasks')
    vi.mocked(useTasks).mockReturnValue({
      data: tasks,
      isLoading: false,
      isError: false,
    } as ReturnType<typeof useTasks>)
    renderPage()
  }

  it('renders sortable column headers', async () => {
    await renderWithTasks([])
    expect(screen.getByRole('columnheader', { name: /título/i })).toBeInTheDocument()
    expect(screen.getByRole('columnheader', { name: /prioridade/i })).toBeInTheDocument()
  })

  it('sorts by title asc when the Título header is clicked', async () => {
    await renderWithTasks([
      makeTask({ id: '1', title: 'Zeta' }),
      makeTask({ id: '2', title: 'Alpha' }),
    ])

    await userEvent.click(screen.getByRole('columnheader', { name: /título/i }))

    const rows = screen.getAllByRole('row').slice(1) // skip header row
    expect(within(rows[0]).getByText('Alpha')).toBeInTheDocument()
    expect(within(rows[1]).getByText('Zeta')).toBeInTheDocument()
  })

  it('reverses sort when clicking the active column header again', async () => {
    await renderWithTasks([
      makeTask({ id: '1', title: 'Alfa' }),
      makeTask({ id: '2', title: 'Zeta' }),
    ])

    const header = screen.getByRole('columnheader', { name: /título/i })
    await userEvent.click(header) // asc
    await userEvent.click(header) // desc

    const rows = screen.getAllByRole('row').slice(1)
    expect(within(rows[0]).getByText('Zeta')).toBeInTheDocument()
  })
})
