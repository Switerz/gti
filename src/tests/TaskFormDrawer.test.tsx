import React from 'react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { TaskFormDrawer } from '@/components/tasks/TaskFormDrawer'
import type { Profile, TaskStatus, TaskWithRelations } from '@/types/domain'

// ─── Stub heavy UI primitives ─────────────────────────────────────────────────

vi.mock('@/components/ui/sheet', () => ({
  Sheet: ({ open, children }: { open: boolean; children: React.ReactNode }) =>
    open ? <div data-testid="sheet">{children}</div> : null,
  SheetContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  SheetHeader: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  SheetTitle: ({ children }: { children: React.ReactNode }) => <h2>{children}</h2>,
  SheetDescription: ({ children }: { children: React.ReactNode }) => <p>{children}</p>,
}))

vi.mock('@/components/ui/scroll-area', () => ({
  ScrollArea: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}))

vi.mock('@/components/ui/select', () => ({
  Select: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  SelectTrigger: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  SelectValue: ({ placeholder }: { placeholder?: string }) => (
    <span>{placeholder ?? ''}</span>
  ),
  SelectContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  SelectItem: ({ value, children }: { value: string; children: React.ReactNode }) => (
    <div data-value={value}>{children}</div>
  ),
}))

vi.mock('@/components/ui/checkbox', () => ({
  Checkbox: ({ checked, onCheckedChange }: { checked: boolean; onCheckedChange: () => void }) => (
    <input type="checkbox" checked={checked} onChange={onCheckedChange} />
  ),
}))

// ─── Hook mocks ───────────────────────────────────────────────────────────────

const todoStatus: TaskStatus = {
  id: 's-todo',
  name: 'A Fazer',
  slug: 'todo',
  color: null,
  is_final: false,
  position: 1,
  created_at: '2026-01-01T00:00:00Z',
}

vi.mock('@/hooks/useTaskStatuses', () => ({
  useTaskStatuses: () => ({ data: [todoStatus] }),
}))

vi.mock('@/hooks/useCategories', () => ({
  useCategories: () => ({ data: [] }),
}))

vi.mock('@/hooks/useProjects', () => ({
  useProjects: () => ({ data: [] }),
}))

vi.mock('@/hooks/useProfiles', () => ({
  useProfiles: () => ({
    data: [
      { id: 'u1', full_name: 'Alice', email: 'alice@test.com', role: 'admin', active: true, avatar_url: null, created_at: '2026-01-01T00:00:00Z' },
      { id: 'u2', full_name: 'Bob', email: 'bob@test.com', role: 'member', active: true, avatar_url: null, created_at: '2026-01-01T00:00:00Z' },
    ],
  }),
}))

const mutateAsync = vi.fn().mockResolvedValue({})

vi.mock('@/hooks/useCreateTask', () => ({
  useCreateTask: () => ({ mutateAsync, isPending: false }),
}))

vi.mock('@/hooks/useUpdateTask', () => ({
  useUpdateTask: () => ({ mutateAsync, isPending: false }),
}))

// ─── Helpers ──────────────────────────────────────────────────────────────────

const currentProfile: Profile = {
  id: 'u1',
  full_name: 'Alice',
  email: 'alice@test.com',
  role: 'admin',
  active: true,
  avatar_url: null,
  created_at: '2026-01-01T00:00:00Z',
}

function makeTask(overrides: Partial<TaskWithRelations> = {}): TaskWithRelations {
  return {
    id: 'task-1',
    title: 'Tarefa existente',
    description: null,
    status_id: 's-todo',
    owner_id: 'u1',
    creator_id: 'u1',
    category_id: null,
    project_id: null,
    priority: 'medium',
    start_date: null,
    due_date: null,
    completed_at: null,
    archived_at: null,
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
    position: 0,
    status: todoStatus,
    category: null,
    project: null,
    creator: currentProfile,
    owner: currentProfile,
    assignees: [],
    comments: [],
    checklist_items: [],
    ...overrides,
  }
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('TaskFormDrawer — create mode', () => {
  it('shows create mode title when no task is provided', () => {
    render(<TaskFormDrawer open currentProfile={currentProfile} onOpenChange={vi.fn()} />)
    expect(screen.getByText('Nova tarefa')).toBeInTheDocument()
  })

  it('shows "Criar tarefa" submit button in create mode', () => {
    render(<TaskFormDrawer open currentProfile={currentProfile} onOpenChange={vi.fn()} />)
    expect(screen.getByRole('button', { name: 'Criar tarefa' })).toBeInTheDocument()
  })

  it('renders nothing when closed', () => {
    render(<TaskFormDrawer open={false} currentProfile={currentProfile} onOpenChange={vi.fn()} />)
    expect(screen.queryByText('Nova tarefa')).not.toBeInTheDocument()
  })

  it('shows cancel button', () => {
    render(<TaskFormDrawer open currentProfile={currentProfile} onOpenChange={vi.fn()} />)
    expect(screen.getByRole('button', { name: 'Cancelar' })).toBeInTheDocument()
  })

  it('calls onOpenChange(false) when cancel is clicked', async () => {
    const onOpenChange = vi.fn()
    render(<TaskFormDrawer open currentProfile={currentProfile} onOpenChange={onOpenChange} />)
    await userEvent.click(screen.getByRole('button', { name: 'Cancelar' }))
    expect(onOpenChange).toHaveBeenCalledWith(false)
  })

  it('shows title validation error on empty submit', async () => {
    render(<TaskFormDrawer open currentProfile={currentProfile} onOpenChange={vi.fn()} />)
    await userEvent.click(screen.getByRole('button', { name: 'Criar tarefa' }))
    expect(await screen.findByText('Informe um título.')).toBeInTheDocument()
  })

  it('shows additional assignees section when multiple profiles exist', () => {
    render(<TaskFormDrawer open currentProfile={currentProfile} onOpenChange={vi.fn()} />)
    expect(screen.getByText('Outros responsáveis')).toBeInTheDocument()
  })
})

describe('TaskFormDrawer — edit mode', () => {
  it('shows edit mode title when a task is provided', () => {
    render(<TaskFormDrawer open task={makeTask()} currentProfile={currentProfile} onOpenChange={vi.fn()} />)
    expect(screen.getByText('Editar tarefa')).toBeInTheDocument()
  })

  it('shows "Salvar alterações" submit button in edit mode', () => {
    render(<TaskFormDrawer open task={makeTask()} currentProfile={currentProfile} onOpenChange={vi.fn()} />)
    expect(screen.getByRole('button', { name: 'Salvar alterações' })).toBeInTheDocument()
  })

  it('pre-fills the title field from the task', () => {
    render(<TaskFormDrawer open task={makeTask()} currentProfile={currentProfile} onOpenChange={vi.fn()} />)
    expect(screen.getByDisplayValue('Tarefa existente')).toBeInTheDocument()
  })

  it('pre-fills description when task has one', () => {
    render(
      <TaskFormDrawer
        open
        task={makeTask({ description: 'Desc detalhada' })}
        currentProfile={currentProfile}
        onOpenChange={vi.fn()}
      />,
    )
    expect(screen.getByDisplayValue('Desc detalhada')).toBeInTheDocument()
  })

  it('calls onOpenChange(false) when cancel is clicked', async () => {
    const onOpenChange = vi.fn()
    render(<TaskFormDrawer open task={makeTask()} currentProfile={currentProfile} onOpenChange={onOpenChange} />)
    await userEvent.click(screen.getByRole('button', { name: 'Cancelar' }))
    expect(onOpenChange).toHaveBeenCalledWith(false)
  })
})
