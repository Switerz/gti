import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { TaskChecklist } from '@/components/tasks/detail/TaskChecklist'

const mocks = vi.hoisted(() => ({
  createMutateAsync: vi.fn(),
  toggleMutate: vi.fn(),
  deleteMutate: vi.fn(),
}))

vi.mock('@/hooks/useTaskChecklist', () => ({
  useTaskChecklist: () => ({
    data: [
      {
        id: 'item-1',
        task_id: 'task-1',
        title: 'Conferir transportadora',
        is_done: false,
        position: 0,
        created_at: '2026-05-15T12:00:00Z',
        updated_at: '2026-05-15T12:00:00Z',
      },
    ],
    isLoading: false,
  }),
  useCreateChecklistItem: () => ({ mutateAsync: mocks.createMutateAsync, isPending: false }),
  useToggleChecklistItem: () => ({ mutate: mocks.toggleMutate }),
  useDeleteChecklistItem: () => ({ mutate: mocks.deleteMutate }),
}))

describe('TaskChecklist', () => {
  it('sends actor id when marking an item as done', async () => {
    render(<TaskChecklist taskId="task-1" currentProfileId="user-1" />)

    await userEvent.click(screen.getByRole('checkbox'))

    expect(mocks.toggleMutate).toHaveBeenCalledWith({
      id: 'item-1',
      isDone: true,
      actorId: 'user-1',
    })
  })
})
