import { describe, expect, it } from 'vitest'

import { applyTaskMove, resolveKanbanMove } from '@/features/tasks/kanban-utils'
import type { TaskStatus, TaskWithRelations } from '@/types/domain'

const statuses: TaskStatus[] = [
  {
    id: 'todo',
    name: 'A Fazer',
    slug: 'todo',
    position: 1,
    color: null,
    is_final: false,
    created_at: '2026-01-01T00:00:00Z',
  },
  {
    id: 'doing',
    name: 'Em andamento',
    slug: 'in_progress',
    position: 2,
    color: null,
    is_final: false,
    created_at: '2026-01-01T00:00:00Z',
  },
]

function task(id: string, statusId: string, position: number): TaskWithRelations {
  return {
    id,
    title: id,
    status_id: statusId,
    position,
    status: statuses.find((status) => status.id === statusId),
    priority: 'medium',
    is_archived: false,
    assignees: [],
    _comments: [],
    _checklist: [],
  } as TaskWithRelations
}

describe('kanban move helpers', () => {
  const tasks = [task('a', 'todo', 0), task('b', 'todo', 1), task('c', 'doing', 0)]

  it('resolves a drop over a column to the end of that column', () => {
    expect(resolveKanbanMove({ tasks, statuses, activeId: 'a', overId: 'doing' })).toEqual({
      taskId: 'a',
      statusId: 'doing',
      position: 1,
    })
  })

  it('resolves a drop over another card to that card status and index', () => {
    expect(resolveKanbanMove({ tasks, statuses, activeId: 'a', overId: 'c' })).toEqual({
      taskId: 'a',
      statusId: 'doing',
      position: 0,
    })
  })

  it('returns null when the target does not change status', () => {
    expect(resolveKanbanMove({ tasks, statuses, activeId: 'a', overId: 'b' })).toBeNull()
  })

  it('applies a move without mutating the original task array', () => {
    const moved = applyTaskMove(tasks, {
      taskId: 'a',
      statusId: 'doing',
      position: 1,
    })

    expect(moved.find((item) => item.id === 'a')).toMatchObject({
      status_id: 'doing',
      position: 1,
    })
    expect(tasks.find((item) => item.id === 'a')).toMatchObject({
      status_id: 'todo',
      position: 0,
    })
  })
})
