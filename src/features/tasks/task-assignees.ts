import type { TaskWithRelations } from '@/types/domain'

export function getTaskAssigneeIds(task: Pick<TaskWithRelations, 'assignees'>) {
  return Array.from(new Set(task.assignees.map(({ profile }) => profile.id).filter(Boolean)))
}

export function getAdditionalAssigneeIds(task: Pick<TaskWithRelations, 'assignees' | 'owner_id'>) {
  return getTaskAssigneeIds(task).filter((id) => id !== task.owner_id)
}

export function toggleAssigneeId(currentIds: string[], profileId: string) {
  return currentIds.includes(profileId)
    ? currentIds.filter((id) => id !== profileId)
    : [...currentIds, profileId]
}

export function buildAdditionalAssigneeIdsForOwnerChange(
  task: Pick<TaskWithRelations, 'assignees' | 'owner_id'>,
  nextOwnerId: string,
) {
  return getTaskAssigneeIds(task).filter((id) => id !== nextOwnerId)
}

export function diffAssigneeIds(previousIds: string[], nextIds: string[]) {
  const previous = new Set(previousIds)
  const next = new Set(nextIds)

  return {
    added: Array.from(next).filter((id) => !previous.has(id)),
    removed: Array.from(previous).filter((id) => !next.has(id)),
  }
}
