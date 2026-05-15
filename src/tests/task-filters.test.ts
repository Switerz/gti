import { describe, expect, it } from 'vitest'

import type { TaskPriority, TaskWithRelations } from '@/types/domain'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeTask(overrides: Partial<TaskWithRelations> = {}): TaskWithRelations {
  return {
    id: 'task-1',
    title: 'Test task',
    description: null,
    status_id: 'status-1',
    status: { id: 'status-1', name: 'Em andamento', slug: 'in-progress', color: '#888', is_final: false },
    category_id: null,
    category: null,
    project_id: null,
    project: null,
    creator_id: 'user-1',
    creator: null,
    owner_id: 'user-1',
    owner: { id: 'user-1', full_name: 'Alice', avatar_url: null },
    priority: 'medium' as TaskPriority,
    due_date: null,
    start_date: null,
    position: 0,
    is_archived: false,
    completed_at: null,
    created_at: '2025-01-01T10:00:00.000Z',
    updated_at: '2025-01-01T10:00:00.000Z',
    assignees: [],
    _comments: [],
    _checklist: [],
    ...overrides,
  } as unknown as TaskWithRelations
}

// ─── Client-side filtering logic (mirrors MyBoardPage) ────────────────────────

function clientFilter(
  tasks: TaskWithRelations[],
  opts: { search?: string; priority?: string; categoryId?: string },
) {
  return tasks.filter((t) => {
    if (t.is_archived) return false
    if (opts.search && !t.title.toLowerCase().includes(opts.search.toLowerCase())) return false
    if (opts.priority && t.priority !== opts.priority) return false
    if (opts.categoryId && t.category_id !== opts.categoryId) return false
    return true
  })
}

// ─── Sort logic (mirrors TaskListPage) ────────────────────────────────────────

const PRIORITY_ORDER: Record<string, number> = { urgent: 0, high: 1, medium: 2, low: 3 }

function sortTasks(
  tasks: TaskWithRelations[],
  key: 'title' | 'status' | 'priority' | 'owner' | 'due_date' | 'updated_at',
  dir: 'asc' | 'desc',
) {
  return [...tasks].sort((a, b) => {
    let cmp = 0
    if (key === 'title') cmp = (a.title ?? '').localeCompare(b.title ?? '', 'pt-BR')
    else if (key === 'status') cmp = (a.status?.name ?? '').localeCompare(b.status?.name ?? '', 'pt-BR')
    else if (key === 'priority') cmp = (PRIORITY_ORDER[a.priority] ?? 4) - (PRIORITY_ORDER[b.priority] ?? 4)
    else if (key === 'owner') cmp = (a.owner?.full_name ?? '').localeCompare(b.owner?.full_name ?? '', 'pt-BR')
    else if (key === 'due_date') cmp = (a.due_date ?? '').localeCompare(b.due_date ?? '')
    else if (key === 'updated_at') cmp = (a.updated_at ?? '').localeCompare(b.updated_at ?? '')
    return dir === 'asc' ? cmp : -cmp
  })
}

// ─── getMyTasks deduplication (mirrors task.service) ─────────────────────────

function deduplicateTasks(tasks: Array<{ id: string }>): Array<{ id: string }> {
  const seen = new Set<string>()
  return tasks.filter((t) => {
    if (seen.has(t.id)) return false
    seen.add(t.id)
    return true
  })
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('clientFilter', () => {
  const tasks = [
    makeTask({ id: '1', title: 'Deploy app', priority: 'high', category_id: 'cat-a' }),
    makeTask({ id: '2', title: 'Review PR', priority: 'low', category_id: 'cat-b' }),
    makeTask({ id: '3', title: 'Fix bug', priority: 'urgent', is_archived: true }),
  ]

  it('excludes archived tasks', () => {
    const result = clientFilter(tasks, {})
    expect(result.map((t) => t.id)).not.toContain('3')
  })

  it('filters by case-insensitive search', () => {
    const result = clientFilter(tasks, { search: 'deploy' })
    expect(result).toHaveLength(1)
    expect(result[0].id).toBe('1')
  })

  it('filters by priority', () => {
    const result = clientFilter(tasks, { priority: 'low' })
    expect(result).toHaveLength(1)
    expect(result[0].id).toBe('2')
  })

  it('filters by categoryId', () => {
    const result = clientFilter(tasks, { categoryId: 'cat-a' })
    expect(result).toHaveLength(1)
    expect(result[0].id).toBe('1')
  })

  it('returns empty array when no tasks match search', () => {
    expect(clientFilter(tasks, { search: 'xxxxxx' })).toHaveLength(0)
  })

  it('applies multiple filters conjunctively', () => {
    const result = clientFilter(tasks, { search: 'Deploy', priority: 'high' })
    expect(result).toHaveLength(1)
    expect(result[0].id).toBe('1')
  })
})

describe('sortTasks', () => {
  const a = makeTask({ id: 'a', title: 'Alfa', priority: 'low', updated_at: '2025-01-01T00:00:00Z' })
  const b = makeTask({ id: 'b', title: 'Beta', priority: 'urgent', updated_at: '2025-06-01T00:00:00Z' })
  const c = makeTask({ id: 'c', title: 'Zeta', priority: 'medium', updated_at: '2025-03-01T00:00:00Z' })

  it('sorts by title ascending', () => {
    const result = sortTasks([c, a, b], 'title', 'asc')
    expect(result.map((t) => t.id)).toEqual(['a', 'b', 'c'])
  })

  it('sorts by title descending', () => {
    const result = sortTasks([a, b, c], 'title', 'desc')
    expect(result.map((t) => t.id)).toEqual(['c', 'b', 'a'])
  })

  it('sorts by priority ascending (urgent first)', () => {
    const result = sortTasks([a, b, c], 'priority', 'asc')
    expect(result[0].id).toBe('b') // urgent
    expect(result[result.length - 1].id).toBe('a') // low
  })

  it('sorts by priority descending (low first)', () => {
    const result = sortTasks([a, b, c], 'priority', 'desc')
    expect(result[0].id).toBe('a') // low
  })

  it('sorts by updated_at descending (newest first)', () => {
    const result = sortTasks([a, b, c], 'updated_at', 'desc')
    expect(result[0].id).toBe('b') // 2025-06-01
    expect(result[result.length - 1].id).toBe('a') // 2025-01-01
  })

  it('does not mutate the original array', () => {
    const original = [c, a, b]
    sortTasks(original, 'title', 'asc')
    expect(original[0].id).toBe('c')
  })
})

describe('deduplicateTasks', () => {
  it('removes duplicate task ids', () => {
    const input = [{ id: 'x' }, { id: 'y' }, { id: 'x' }]
    expect(deduplicateTasks(input)).toHaveLength(2)
  })

  it('preserves order of first occurrence', () => {
    const input = [{ id: 'b' }, { id: 'a' }, { id: 'b' }]
    expect(deduplicateTasks(input).map((t) => t.id)).toEqual(['b', 'a'])
  })

  it('returns empty array for empty input', () => {
    expect(deduplicateTasks([])).toHaveLength(0)
  })

  it('returns the same items when no duplicates exist', () => {
    const input = [{ id: '1' }, { id: '2' }, { id: '3' }]
    expect(deduplicateTasks(input)).toHaveLength(3)
  })
})
