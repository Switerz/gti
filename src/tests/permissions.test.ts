import { describe, expect, it } from 'vitest'

import {
  canArchiveTask,
  canArchiveKpi,
  canEditTask,
  canEditKpi,
  canExportTasks,
  canManageAllowlist,
  canManageCategories,
  canManageProjects,
  canViewTeamTasks,
} from '@/lib/permissions'
import type { KpiWithRelations, Profile, TaskWithRelations } from '@/types/domain'

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

function kpi(overrides: Partial<KpiWithRelations> = {}): KpiWithRelations {
  return {
    id: 'kpi-1',
    name: 'SLA Cliente',
    slug: 'sla-cliente',
    description: null,
    group_id: null,
    category_id: null,
    project_id: null,
    owner_id: 'owner-1',
    created_by: 'creator-1',
    owner_label: null,
    product: null,
    format_kind: 'percent',
    decimal_places: 1,
    target_operator: 'gte',
    target_value: 93,
    target_label: '>= 93%',
    unit_label: '%',
    chart_type: 'line',
    active: true,
    position: 1,
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
    group: null,
    category: null,
    project: null,
    owner: null,
    created_by_profile: null,
    assignments: [],
    weekly_values: [],
    ...overrides,
  } as KpiWithRelations
}

describe('permission helpers', () => {
  // Covers the same role boundary enforced where KPI mutations reach Supabase.
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

  it('allows lead and admin to export tasks', () => {
    expect(canExportTasks(profile({ role: 'admin' }))).toBe(true)
    expect(canExportTasks(profile({ role: 'lead' }))).toBe(true)
    expect(canExportTasks(profile({ role: 'member' }))).toBe(false)
    expect(canExportTasks(profile({ role: 'admin', active: false }))).toBe(false)
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

  it('allows lead and admin to manage categories', () => {
    expect(canManageCategories(profile({ role: 'admin' }))).toBe(true)
    expect(canManageCategories(profile({ role: 'lead' }))).toBe(true)
    expect(canManageCategories(profile({ role: 'member' }))).toBe(false)
    expect(canManageCategories(null)).toBe(false)
  })

  it('blocks inactive admin from managing categories', () => {
    expect(canManageCategories(profile({ role: 'admin', active: false }))).toBe(false)
  })

  it('allows every active role to edit and archive KPIs', () => {
    const assignedKpi = kpi({
      assignments: [{ profile: { id: 'assignee-1', full_name: 'Assignee', avatar_url: null } }],
    })

    expect(canEditKpi(profile({ id: 'assignee-1' }), assignedKpi)).toBe(true)
    expect(canArchiveKpi(profile({ id: 'assignee-1' }), assignedKpi)).toBe(true)
    expect(canEditKpi(profile({ id: 'other', role: 'member' }), assignedKpi)).toBe(true)
    expect(canEditKpi(profile({ id: 'lead', role: 'lead' }), assignedKpi)).toBe(true)
    expect(canEditKpi(profile({ id: 'admin', role: 'admin' }), assignedKpi)).toBe(true)
  })

  it('blocks inactive and unauthenticated profiles from editing KPIs', () => {
    expect(canEditKpi(profile({ active: false }), kpi())).toBe(false)
    expect(canArchiveKpi(profile({ active: false }), kpi())).toBe(false)
    expect(canEditKpi(null, kpi())).toBe(false)
  })
})
