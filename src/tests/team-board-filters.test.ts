import { describe, expect, it } from 'vitest'

import { filterTasksForTeamBoard, hasActiveTeamFilters } from '@/features/tasks/team-board-filters'
import type { TaskWithRelations } from '@/types/domain'

function task(overrides: Partial<TaskWithRelations> = {}): TaskWithRelations {
  return {
    id: 'task-1',
    title: 'Revisar SLA',
    status_id: 'todo',
    creator_id: 'creator-1',
    owner_id: 'owner-1',
    category_id: 'cat-1',
    project_id: 'project-1',
    priority: 'medium',
    due_date: '2026-05-15',
    is_archived: false,
    status: { id: 'todo', name: 'A Fazer', slug: 'todo', color: null, is_final: false },
    assignees: [],
    _comments: [],
    _checklist: [],
    ...overrides,
  } as TaskWithRelations
}

describe('filterTasksForTeamBoard', () => {
  const today = new Date('2026-05-15T12:00:00Z')

  it('combines owner, creator, status, category, project and priority filters', () => {
    const tasks = [
      task({ id: 'match' }),
      task({ id: 'wrong-creator', creator_id: 'creator-2' }),
      task({ id: 'wrong-status', status_id: 'done' }),
    ]

    expect(
      filterTasksForTeamBoard(
        tasks,
        {
          ownerId: 'owner-1',
          creatorId: 'creator-1',
          statusId: 'todo',
          categoryId: 'cat-1',
          projectId: 'project-1',
          priority: 'medium',
        },
        today,
      ).map((item) => item.id),
    ).toEqual(['match'])
  })

  it('filters overdue tasks excluding final statuses', () => {
    const tasks = [
      task({ id: 'overdue', due_date: '2026-05-14' }),
      task({
        id: 'done-overdue',
        due_date: '2026-05-14',
        status: { id: 'done', name: 'Concluido', slug: 'done', color: null, is_final: true },
      }),
      task({ id: 'future', due_date: '2026-05-20' }),
    ]

    expect(filterTasksForTeamBoard(tasks, { due: 'overdue' }, today).map((item) => item.id)).toEqual([
      'overdue',
    ])
  })

  it('filters tasks due today and in the next seven days', () => {
    const tasks = [
      task({ id: 'today', due_date: '2026-05-15' }),
      task({ id: 'week', due_date: '2026-05-22' }),
      task({ id: 'later', due_date: '2026-05-23' }),
    ]

    expect(filterTasksForTeamBoard(tasks, { due: 'today' }, today).map((item) => item.id)).toEqual([
      'today',
    ])
    expect(filterTasksForTeamBoard(tasks, { due: 'next_7_days' }, today).map((item) => item.id)).toEqual([
      'today',
      'week',
    ])
  })

  it('filters tasks with no due date', () => {
    expect(
      filterTasksForTeamBoard(
        [task({ id: 'no-due', due_date: null }), task({ id: 'with-due', due_date: '2026-05-15' })],
        { due: 'no_due' },
        today,
      ).map((item) => item.id),
    ).toEqual(['no-due'])
  })
})

describe('hasActiveTeamFilters', () => {
  it('returns true when any advanced filter is set', () => {
    expect(hasActiveTeamFilters({ statusId: 'todo' })).toBe(true)
    expect(hasActiveTeamFilters({ due: 'overdue' })).toBe(true)
    expect(hasActiveTeamFilters({})).toBe(false)
  })
})
