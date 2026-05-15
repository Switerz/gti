import { describe, expect, it } from 'vitest'

import {
  canArchiveTask,
  canEditTask,
  canManageAllowlist,
  canManageCategories,
  canManageProjects,
  canViewTeamTasks,
} from '@/lib/permissions'
import type { Profile, TaskWithRelations } from '@/types/domain'

function profile(overrides: Partial<Profile> = {}): Profile {
  return {
    id: 'user-1',
    email: 'user@gogroup.com',
    full_name: 'User',
    avatar_url: null,
    role: 'member',
    active: true,
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
    ...overrides,
  }
}

function task(overrides: Partial<TaskWithRelations> = {}): TaskWithRelations {
  return {
    id: 'task-1',
    title: 'Task',
    description: null,
    status_id: 'status-1',
    category_id: null,
    project_id: null,
    creator_id: 'creator-1',
    owner_id: 'owner-1',
    priority: 'medium',
    due_date: null,
    start_date: null,
    completed_at: null,
    position: 0,
    is_archived: false,
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
    status: { id: 'status-1', name: 'A Fazer', slug: 'todo', color: null, is_final: false },
    category: null,
    project: null,
    creator: null,
    owner: null,
    assignees: [],
    _comments: [],
    _checklist: [],
    ...overrides,
  } as TaskWithRelations
}

describe('permission helpers', () => {
  it('allows only admins to manage allowlist', () => {
    expect(canManageAllowlist(profile({ role: 'admin' }))).toBe(true)
    expect(canManageAllowlist(profile({ role: 'lead' }))).toBe(false)
    expect(canManageAllowlist(profile({ role: 'member' }))).toBe(false)
  })

  it('allows active users to view team tasks', () => {
    expect(canViewTeamTasks(profile({ active: true }))).toBe(true)
    expect(canViewTeamTasks(profile({ active: false }))).toBe(false)
    expect(canViewTeamTasks(null)).toBe(false)
  })

  it('allows lead and admin to manage projects', () => {
    expect(canManageProjects(profile({ role: 'admin' }))).toBe(true)
    expect(canManageProjects(profile({ role: 'lead' }))).toBe(true)
    expect(canManageProjects(profile({ role: 'member' }))).toBe(false)
  })

  it('allows task editing for admin, lead, creator, owner and assignee', () => {
    expect(canEditTask(profile({ id: 'admin', role: 'admin' }), task())).toBe(true)
    expect(canEditTask(profile({ id: 'lead', role: 'lead' }), task())).toBe(true)
    expect(canEditTask(profile({ id: 'creator-1' }), task())).toBe(true)
    expect(canEditTask(profile({ id: 'owner-1' }), task())).toBe(true)
    expect(
      canEditTask(
        profile({ id: 'assignee-1' }),
        task({ assignees: [{ profile: { id: 'assignee-1', full_name: 'A', avatar_url: null } }] }),
      ),
    ).toBe(true)
    expect(canEditTask(profile({ id: 'other' }), task())).toBe(false)
  })

  it('does not allow inactive users to edit or archive tasks', () => {
    const inactiveAdmin = profile({ id: 'admin', role: 'admin', active: false })
    expect(canEditTask(inactiveAdmin, task())).toBe(false)
    expect(canArchiveTask(inactiveAdmin, task())).toBe(false)
  })

  it('allows archiving for admin, creator, owner and assignee, but not lead by role alone', () => {
    expect(canArchiveTask(profile({ id: 'admin', role: 'admin' }), task())).toBe(true)
    expect(canArchiveTask(profile({ id: 'creator-1' }), task())).toBe(true)
    expect(canArchiveTask(profile({ id: 'owner-1' }), task())).toBe(true)
    expect(canArchiveTask(profile({ id: 'lead', role: 'lead' }), task())).toBe(false)
  })

  it('allows only admins to manage categories', () => {
    expect(canManageCategories(profile({ role: 'admin' }))).toBe(true)
    expect(canManageCategories(profile({ role: 'lead' }))).toBe(false)
    expect(canManageCategories(profile({ role: 'member' }))).toBe(false)
    expect(canManageCategories(null)).toBe(false)
  })

  it('blocks inactive admin from managing categories', () => {
    expect(canManageCategories(profile({ role: 'admin', active: false }))).toBe(false)
  })
})
