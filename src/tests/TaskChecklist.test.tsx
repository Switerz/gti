import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { TaskChecklist } from '@/components/tasks/detail/TaskChecklist'

const mocks = vi.hoisted(() => ({
  createMutateAsync: vi.fn(),
  toggleMutate: vi.fn(),
  updateMutateAsync: vi.fn(),
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
  useUpdateChecklistItem: () => ({ mutateAsync: mocks.updateMutateAsync, isPending: false }),
  useDeleteChecklistItem: () => ({ mutate: mocks.deleteMutate }),
}))

describe('TaskChecklist', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('sends actor id when marking an item as done', async () => {
    render(<TaskChecklist taskId="task-1" currentProfileId="user-1" />)

    await userEvent.click(screen.getByRole('checkbox'))

    expect(mocks.toggleMutate).toHaveBeenCalledWith({
      id: 'item-1',
      isDone: true,
      actorId: 'user-1',
    })
  })

  it('edits an existing checklist item', async () => {
    const user = userEvent.setup()
    mocks.updateMutateAsync.mockResolvedValueOnce({})

    render(<TaskChecklist taskId="task-1" currentProfileId="user-1" />)

    await user.click(screen.getByRole('button', { name: 'Editar Conferir transportadora' }))
    const input = screen.getByRole('textbox', { name: 'Editar Conferir transportadora' })
    await user.clear(input)
    await user.type(input, 'Validar prazo da transportadora')
    await user.click(screen.getByRole('button', { name: 'Salvar Conferir transportadora' }))

    expect(mocks.updateMutateAsync).toHaveBeenCalledWith({
      id: 'item-1',
      title: 'Validar prazo da transportadora',
      actorId: 'user-1',
    })
  })
})
