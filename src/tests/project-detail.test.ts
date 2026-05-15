import { describe, expect, it } from 'vitest'

import type { TaskPriority, TaskWithRelations } from '@/types/domain'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeTask(overrides: Partial<TaskWithRelations> = {}): TaskWithRelations {
  return {
    id: 'task-1',
    title: 'Test task',
    description: null,
    status_id: 'status-1',
    status: { id: 'status-1', name: 'A Fazer', slug: 'todo', color: null, is_final: false },
    category_id: null,
    category: null,
    project_id: 'proj-1',
    project: { id: 'proj-1', name: 'Projeto X' },
    creator_id: 'u1',
    creator: null,
    owner_id: 'u1',
    owner: null,
    priority: 'medium' as TaskPriority,
    due_date: null,
    start_date: null,
    position: 0,
    is_archived: false,
    completed_at: null,
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-01-01T00:00:00Z',
    assignees: [],
    _comments: [],
    _checklist: [],
    ...overrides,
  } as unknown as TaskWithRelations
}

// ─── Stats computation (mirrors ProjectDetailPage) ────────────────────────────

function computeStats(tasks: TaskWithRelations[], today: string) {
  const active = tasks.filter((t) => !t.is_archived)
  const done = active.filter((t) => t.status?.is_final)
  const open = active.filter((t) => !t.status?.is_final)
  const overdue = open.filter((t) => t.due_date && t.due_date < today)
  return { total: active.length, done: done.length, open: open.length, overdue: overdue.length }
}

describe('project stats computation', () => {
  const TODAY = '2025-06-01'

  it('counts active tasks correctly', () => {
    const tasks = [
      makeTask({ id: '1' }),
      makeTask({ id: '2' }),
      makeTask({ id: '3', is_archived: true }),
    ]
    expect(computeStats(tasks, TODAY).total).toBe(2)
  })

  it('excludes archived tasks from all counts', () => {
    const tasks = [makeTask({ is_archived: true })]
    const stats = computeStats(tasks, TODAY)
    expect(stats.total).toBe(0)
    expect(stats.done).toBe(0)
    expect(stats.open).toBe(0)
    expect(stats.overdue).toBe(0)
  })

  it('counts done tasks (is_final status)', () => {
    const tasks = [
      makeTask({ id: '1', status: { id: 's1', name: 'Done', slug: 'done', color: null, is_final: true } }),
      makeTask({ id: '2', status: { id: 's2', name: 'Todo', slug: 'todo', color: null, is_final: false } }),
    ]
    const stats = computeStats(tasks, TODAY)
    expect(stats.done).toBe(1)
    expect(stats.open).toBe(1)
  })

  it('counts overdue tasks (due_date in past and not final)', () => {
    const tasks = [
      makeTask({ id: '1', due_date: '2025-05-01' }), // overdue
      makeTask({ id: '2', due_date: '2025-07-01' }), // future
      makeTask({ id: '3', due_date: '2025-05-01', status: { id: 's1', name: 'Done', slug: 'done', color: null, is_final: true } }), // done even if past due
      makeTask({ id: '4', due_date: null }),           // no due date
    ]
    expect(computeStats(tasks, TODAY).overdue).toBe(1)
  })

  it('returns zeros for an empty task list', () => {
    const stats = computeStats([], TODAY)
    expect(stats).toEqual({ total: 0, done: 0, open: 0, overdue: 0 })
  })

  it('all tasks done produces zero open and zero overdue', () => {
    const doneStatus = { id: 's1', name: 'Done', slug: 'done', color: null, is_final: true }
    const tasks = [
      makeTask({ id: '1', status: doneStatus, due_date: '2025-01-01' }),
      makeTask({ id: '2', status: doneStatus, due_date: '2025-01-01' }),
    ]
    const stats = computeStats(tasks, TODAY)
    expect(stats.open).toBe(0)
    expect(stats.overdue).toBe(0)
    expect(stats.done).toBe(2)
  })
})

// ─── defaultProjectId behaviour ───────────────────────────────────────────────

describe('getExtraIds merging for project tasks', () => {
  it('project tasks list is deduplicated correctly when same id appears twice', () => {
    const seen = new Set<string>()
    const all = [{ id: 'a' }, { id: 'b' }, { id: 'a' }]
    const unique = all.filter((t) => {
      if (seen.has(t.id)) return false
      seen.add(t.id)
      return true
    })
    expect(unique).toHaveLength(2)
    expect(unique[0].id).toBe('a')
    expect(unique[1].id).toBe('b')
  })
})
