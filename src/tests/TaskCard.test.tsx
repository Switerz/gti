import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'

import { TaskCard } from '@/components/tasks/TaskCard'
import type { TaskWithRelations } from '@/types/domain'

function makeTask(overrides: Partial<TaskWithRelations> = {}): TaskWithRelations {
  return {
    id: 'task-abc',
    title: 'Título da tarefa de teste',
    description: null,
    status_id: 's1',
    status: { id: 's1', name: 'A fazer', slug: 'todo', color: '#3b82f6', is_final: false },
    category_id: 'cat-1',
    category: { id: 'cat-1', name: 'Backend', color: '#6366f1' },
    project_id: null,
    project: null,
    creator_id: 'u1',
    creator: null,
    owner_id: 'u1',
    owner: { id: 'u1', full_name: 'Carlos Silva', avatar_url: null },
    priority: 'high',
    due_date: null,
    start_date: null,
    position: 0,
    is_archived: false,
    completed_at: null,
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-01-01T00:00:00Z',
    assignees: [{ profile: { id: 'u1', full_name: 'Carlos Silva', avatar_url: null } }],
    _comments: [{ id: 'c1' }, { id: 'c2' }],
    _checklist: [
      { id: 'ch1', is_done: true },
      { id: 'ch2', is_done: false },
    ],
    ...overrides,
  } as unknown as TaskWithRelations
}

function renderCard(task: TaskWithRelations, onEdit?: () => void) {
  return render(
    <MemoryRouter>
      <TaskCard task={task} onEdit={onEdit} />
    </MemoryRouter>,
  )
}

// ─── Rendering ────────────────────────────────────────────────────────────────

describe('TaskCard rendering', () => {
  it('renders the task title', () => {
    renderCard(makeTask())
    expect(screen.getByText('Título da tarefa de teste')).toBeInTheDocument()
  })

  it('renders the category badge', () => {
    renderCard(makeTask())
    expect(screen.getByText('Backend')).toBeInTheDocument()
  })

  it('renders the priority badge', () => {
    renderCard(makeTask())
    expect(screen.getByText('Alta')).toBeInTheDocument()
  })

  it('renders the comment count', () => {
    renderCard(makeTask())
    expect(screen.getByText('2')).toBeInTheDocument()
  })

  it('renders the checklist progress', () => {
    renderCard(makeTask())
    expect(screen.getByText('1/2')).toBeInTheDocument()
  })

  it('uses blocked styling without repeating the column status as text', () => {
    const task = makeTask({
      status: { id: 's-blocked', name: 'Bloqueado', slug: 'blocked', color: '#ef4444', is_final: false },
    })
    renderCard(task)
    expect(screen.queryByText('Bloqueado')).not.toBeInTheDocument()
    expect(screen.getByRole('link')).toHaveClass('border-red-500/50')
  })

  it('does not show category badge when category is null', () => {
    renderCard(makeTask({ category: null }))
    expect(screen.queryByText('Backend')).not.toBeInTheDocument()
  })

  it('links to the task detail page', () => {
    renderCard(makeTask())
    const link = screen.getByRole('link')
    expect(link).toHaveAttribute('href', '/tasks/task-abc')
  })
})

// ─── Edit button ──────────────────────────────────────────────────────────────

describe('TaskCard edit button', () => {
  it('does not render the edit button when onEdit is not provided', () => {
    renderCard(makeTask())
    expect(screen.queryByRole('button', { name: /editar/i })).not.toBeInTheDocument()
  })

  it('renders an edit button when onEdit is provided', () => {
    renderCard(makeTask(), vi.fn())
    expect(screen.getByRole('button', { name: /editar/i })).toBeInTheDocument()
  })

  it('calls onEdit when the edit button is clicked', async () => {
    const onEdit = vi.fn()
    renderCard(makeTask(), onEdit)
    await userEvent.click(screen.getByRole('button', { name: /editar/i }))
    expect(onEdit).toHaveBeenCalledOnce()
  })
})

// ─── Assignee avatars ─────────────────────────────────────────────────────────

describe('TaskCard assignee avatars', () => {
  it('renders avatar initials when no avatar_url', () => {
    renderCard(makeTask())
    expect(screen.getByText('CS')).toBeInTheDocument()
  })

  it('shows overflow count when more than 2 assignees', () => {
    const manyAssignees = Array.from({ length: 6 }, (_, i) => ({
      profile: { id: `u${i}`, full_name: `User ${i}`, avatar_url: null },
    }))
    renderCard(makeTask({ assignees: manyAssignees }))
    expect(screen.getByText('+4')).toBeInTheDocument()
  })
})
