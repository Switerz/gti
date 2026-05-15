import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { KanbanColumn } from '@/components/kanban/KanbanColumn'
import type { TaskStatus, TaskWithRelations } from '@/types/domain'

// dnd-kit needs a DndContext; mock useDroppable to avoid that dependency
vi.mock('@dnd-kit/core', () => ({
  useDroppable: vi.fn(() => ({ setNodeRef: vi.fn(), isOver: false })),
  useDraggable: vi.fn(() => ({
    attributes: {},
    listeners: {},
    setNodeRef: vi.fn(),
    isDragging: false,
  })),
}))

// DraggableTaskCard wraps TaskCard — mock it to keep tests focused on the column
vi.mock('@/components/kanban/DraggableTaskCard', () => ({
  DraggableTaskCard: ({ task }: { task: { title: string } }) => (
    <div data-testid="task-card">{task.title}</div>
  ),
}))

const STATUS: TaskStatus = {
  id: 'status-1',
  name: 'Em andamento',
  slug: 'in-progress',
  color: '#3b82f6',
  is_final: false,
  position: 1,
  created_at: '2025-01-01T00:00:00Z',
}

function makeTask(id: string, title: string): TaskWithRelations {
  return {
    id,
    title,
    status_id: STATUS.id,
    status: { id: STATUS.id, name: STATUS.name, slug: STATUS.slug, color: STATUS.color, is_final: false },
    priority: 'medium',
    is_archived: false,
    category: null,
    project: null,
    assignees: [],
    _comments: [],
    _checklist: [],
  } as unknown as TaskWithRelations
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('KanbanColumn', () => {
  it('renders the status name as the column header', () => {
    render(<KanbanColumn status={STATUS} tasks={[]} isLoading={false} />)
    expect(screen.getByText('Em andamento')).toBeInTheDocument()
  })

  it('shows task count badge when tasks are present', () => {
    const tasks = [makeTask('t1', 'Task one'), makeTask('t2', 'Task two')]
    render(<KanbanColumn status={STATUS} tasks={tasks} isLoading={false} />)
    expect(screen.getByText('2')).toBeInTheDocument()
  })

  it('shows "—" in count badge while loading', () => {
    render(<KanbanColumn status={STATUS} tasks={[]} isLoading={true} />)
    expect(screen.getByText('—')).toBeInTheDocument()
  })

  it('shows "Sem tarefas" when task list is empty and not loading', () => {
    render(<KanbanColumn status={STATUS} tasks={[]} isLoading={false} />)
    expect(screen.getByText('Sem tarefas')).toBeInTheDocument()
  })

  it('does not show "Sem tarefas" when there are tasks', () => {
    const tasks = [makeTask('t1', 'Alguma tarefa')]
    render(<KanbanColumn status={STATUS} tasks={tasks} isLoading={false} />)
    expect(screen.queryByText('Sem tarefas')).not.toBeInTheDocument()
  })

  it('renders a DraggableTaskCard for each task', () => {
    const tasks = [makeTask('t1', 'Alfa'), makeTask('t2', 'Beta')]
    render(<KanbanColumn status={STATUS} tasks={tasks} isLoading={false} />)
    expect(screen.getAllByTestId('task-card')).toHaveLength(2)
    expect(screen.getByText('Alfa')).toBeInTheDocument()
    expect(screen.getByText('Beta')).toBeInTheDocument()
  })

  it('renders skeleton cards during loading', () => {
    render(<KanbanColumn status={STATUS} tasks={[]} isLoading={true} />)
    // Loading state shows skeleton elements (animate-pulse divs), no task cards
    expect(screen.queryByTestId('task-card')).not.toBeInTheDocument()
    expect(screen.queryByText('Sem tarefas')).not.toBeInTheDocument()
  })
})
