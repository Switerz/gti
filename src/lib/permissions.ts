import type { Profile, TaskWithRelations } from '@/types/domain'

function isActive(profile: Profile | null | undefined) {
  return Boolean(profile?.active)
}

export function isAdmin(profile: Profile | null | undefined) {
  return isActive(profile) && profile?.role === 'admin'
}

export function isLeadOrAdmin(profile: Profile | null | undefined) {
  return isActive(profile) && (profile?.role === 'admin' || profile?.role === 'lead')
}

export function canManageAllowlist(profile: Profile | null | undefined) {
  return isAdmin(profile)
}

export function canCreateProject(profile: Profile | null | undefined) {
  return isActive(profile)
}

export function canManageProjects(profile: Profile | null | undefined) {
  return isLeadOrAdmin(profile)
}

export function canDeleteProject(profile: Profile | null | undefined) {
  return isLeadOrAdmin(profile)
}

export function canViewTeamTasks(profile: Profile | null | undefined) {
  return isActive(profile)
}

export function canExportTasks(profile: Profile | null | undefined) {
  return isLeadOrAdmin(profile)
}

function isTaskAssignee(profile: Profile, task: Pick<TaskWithRelations, 'assignees'>) {
  return task.assignees.some((assignee) => assignee.profile.id === profile.id)
}

export function canEditTask(profile: Profile | null | undefined, task: TaskWithRelations) {
  if (!profile || !profile.active) return false
  if (profile.role === 'admin' || profile.role === 'lead') return true

  return task.creator_id === profile.id || task.owner_id === profile.id || isTaskAssignee(profile, task)
}

export function canArchiveTask(profile: Profile | null | undefined, task: TaskWithRelations) {
  if (!profile || !profile.active) return false
  if (profile.role === 'admin') return true

  return task.creator_id === profile.id || task.owner_id === profile.id || isTaskAssignee(profile, task)
}

export function canManageCategories(profile: Profile | null | undefined) {
  return isAdmin(profile)
}
