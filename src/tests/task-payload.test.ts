import { describe, expect, it } from 'vitest'

import {
  buildCreateTaskPayload,
  buildTaskAssigneeRows,
  buildUpdateTaskPayload,
  getCreateTaskDefaults,
} from '@/features/tasks/task-payload'
import type { TaskFormValues, TaskStatus } from '@/types/domain'

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
