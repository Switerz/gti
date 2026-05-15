import { describe, expect, it } from 'vitest'

import {
  buildAdditionalAssigneeIdsForOwnerChange,
  diffAssigneeIds,
  getAdditionalAssigneeIds,
  getTaskAssigneeIds,
  toggleAssigneeId,
} from '@/features/tasks/task-assignees'
import type { TaskWithRelations } from '@/types/domain'

function task(assigneeIds: string[], ownerId: string | null = 'owner-1') {
  return {
    owner_id: ownerId,
    assignees: assigneeIds.map((id) => ({
      profile: { id, full_name: id, avatar_url: null },
    })),
  } as TaskWithRelations
}

describe('task assignee helpers', () => {
  it('returns unique task assignee ids preserving order', () => {
    expect(getTaskAssigneeIds(task(['owner-1', 'user-2', 'user-2']))).toEqual([
      'owner-1',
      'user-2',
    ])
  })

  it('returns only assignees that are not the owner', () => {
    expect(getAdditionalAssigneeIds(task(['owner-1', 'user-2', 'user-3']))).toEqual([
      'user-2',
      'user-3',
    ])
  })

  it('toggles an assignee id without duplicates', () => {
    expect(toggleAssigneeId(['user-2'], 'user-3')).toEqual(['user-2', 'user-3'])
    expect(toggleAssigneeId(['user-2', 'user-3'], 'user-2')).toEqual(['user-3'])
  })

  it('removes the next owner from additional assignees on owner change', () => {
    expect(buildAdditionalAssigneeIdsForOwnerChange(task(['owner-1', 'user-2']), 'user-2')).toEqual([
      'owner-1',
    ])
  })

  it('diffs added and removed assignees', () => {
    expect(diffAssigneeIds(['user-1', 'user-2'], ['user-2', 'user-3'])).toEqual({
      added: ['user-3'],
      removed: ['user-1'],
    })
  })
})
