import { describe, expect, it } from 'vitest'

import {
  buildCreateTaskPayload,
  buildEditTaskDefaults,
  buildTaskAssigneeRows,
  buildUpdateTaskPayload,
  getCreateTaskDefaults,
} from '@/features/tasks/task-payload'
import type { Profile, TaskFormValues, TaskStatus, TaskWithRelations } from '@/types/domain'

const todoStatus: TaskStatus = {
  id: 'status-todo',
  name: 'A Fazer',
  slug: 'todo',
  position: 2,
  color: null,
  is_final: false,
  created_at: '2026-01-01T00:00:00Z',
}

const doneStatus: TaskStatus = {
  ...todoStatus,
  id: 'status-done',
  name: 'Concluido',
  slug: 'done',
  is_final: true,
}

const baseProfile: Profile = {
  id: 'user-1',
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
    title: 'Tarefa teste',
    description: null,
    status_id: todoStatus.id,
    owner_id: 'user-1',
    creator_id: 'user-1',
    category_id: null,
    project_id: null,
    priority: 'high',
    start_date: '2026-05-01',
    due_date: '2026-05-31',
    completed_at: null,
    archived_at: null,
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
    position: 0,
    status: todoStatus,
    category: null,
    project: null,
    creator: baseProfile,
    owner: baseProfile,
    assignees: [],
    comments: [],
    checklist_items: [],
    ...overrides,
  }
}

const baseValues: TaskFormValues = {
  title: '  Conferir faturamento  ',
  description: '',
  statusId: 'status-todo',
  ownerId: '',
  assigneeIds: [],
  categoryId: '',
  projectId: '',
  priority: 'medium',
  startDate: '',
  dueDate: '',
}

describe('task payload helpers', () => {
  it('defaults create form to todo status and current user owner after statuses load', () => {
    expect(getCreateTaskDefaults('user-1', [todoStatus])).toMatchObject({
      statusId: 'status-todo',
      ownerId: 'user-1',
      priority: 'medium',
      assigneeIds: [],
    })
  })

  it('falls back to first non-archived status when todo is unavailable', () => {
    expect(getCreateTaskDefaults('user-1', [{ ...todoStatus, slug: 'backlog' }]).statusId).toBe(
      'status-todo',
    )
  })

  it('builds create payload with creator and owner fallback', () => {
    expect(buildCreateTaskPayload(baseValues, 'creator-1')).toEqual({
      title: 'Conferir faturamento',
      description: null,
      status_id: 'status-todo',
      category_id: null,
      project_id: null,
      creator_id: 'creator-1',
      owner_id: 'creator-1',
      priority: 'medium',
      due_date: null,
      start_date: null,
      recurrence_type: 'none',
      estimated_hours: null,
      actual_hours: null,
    })
  })

  it('deduplicates assignee rows and always includes owner', () => {
    expect(
      buildTaskAssigneeRows({
        taskId: 'task-1',
        actorId: 'creator-1',
        ownerId: 'owner-1',
        assigneeIds: ['owner-1', 'user-2', 'user-2'],
      }),
    ).toEqual([
      { task_id: 'task-1', profile_id: 'owner-1', assigned_by: 'creator-1' },
      { task_id: 'task-1', profile_id: 'user-2', assigned_by: 'creator-1' },
    ])
  })

  it('sets completed_at when moving into final status', () => {
    const now = '2026-05-15T10:00:00.000Z'
    expect(buildUpdateTaskPayload({ statusId: doneStatus.id }, doneStatus, now)).toEqual({
      status_id: 'status-done',
      completed_at: now,
    })
  })

  it('clears completed_at when moving out of final status', () => {
    expect(buildUpdateTaskPayload({ statusId: todoStatus.id }, todoStatus, 'now')).toEqual({
      status_id: 'status-todo',
      completed_at: null,
    })
  })
})

describe('buildEditTaskDefaults', () => {
  it('maps task fields to form values', () => {
    const defaults = buildEditTaskDefaults(makeTask())
    expect(defaults).toMatchObject({
      title: 'Tarefa teste',
      priority: 'high',
      statusId: todoStatus.id,
      ownerId: 'user-1',
      startDate: '2026-05-01',
      dueDate: '2026-05-31',
    })
  })

  it('excludes owner from additional assignees list', () => {
    const task = makeTask({
      owner_id: 'user-1',
      assignees: [
        { profile: { ...baseProfile, id: 'user-1' } },
        { profile: { ...baseProfile, id: 'user-2' } },
      ],
    })
    expect(buildEditTaskDefaults(task).assigneeIds).toEqual(['user-2'])
  })

  it('returns empty assigneeIds when task has no extra assignees', () => {
    expect(buildEditTaskDefaults(makeTask()).assigneeIds).toEqual([])
  })

  it('coerces null description to empty string', () => {
    expect(buildEditTaskDefaults(makeTask({ description: null })).description).toBe('')
  })

  it('coerces null category_id to empty string', () => {
    expect(buildEditTaskDefaults(makeTask({ category_id: null })).categoryId).toBe('')
  })

  it('coerces null project_id to empty string', () => {
    expect(buildEditTaskDefaults(makeTask({ project_id: null })).projectId).toBe('')
  })
})
