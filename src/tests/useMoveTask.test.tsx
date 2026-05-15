import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { taskService } from '@/features/tasks/task.service'
import { useMoveTask } from '@/hooks/useMoveTask'
import type { TaskWithRelations } from '@/types/domain'

vi.mock('@/features/tasks/task.service', () => ({
  taskService: {
    moveStatus: vi.fn(),
  },
}))

vi.mock('sonner', () => ({
  toast: {
    error: vi.fn(),
  },
}))

function task(id: string, statusId: string, position: number): TaskWithRelations {
  return {
    id,
    title: id,
    status_id: statusId,
    position,
    priority: 'medium',
    is_archived: false,
    assignees: [],
    _comments: [],
    _checklist: [],
  } as TaskWithRelations
}

function createWrapper(queryClient: QueryClient) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  }
}

describe('useMoveTask', () => {
  beforeEach(() => {
    vi.mocked(taskService.moveStatus).mockReset()
  })

  it('optimistically moves task in all task list caches', async () => {
    vi.mocked(taskService.moveStatus).mockResolvedValue(undefined)
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    queryClient.setQueryData(['tasks', {}], [task('a', 'todo', 0), task('b', 'doing', 0)])
    queryClient.setQueryData(['tasks', 'mine', 'user-1'], [task('a', 'todo', 0)])

    const { result } = renderHook(() => useMoveTask('user-1'), {
      wrapper: createWrapper(queryClient),
    })

    result.current.mutate({ taskId: 'a', statusId: 'doing', position: 1 })

    await waitFor(() => expect(taskService.moveStatus).toHaveBeenCalled())

    expect(queryClient.getQueryData<TaskWithRelations[]>(['tasks', {}])?.[0]).toMatchObject({
      id: 'a',
      status_id: 'doing',
      position: 1,
    })
    expect(queryClient.getQueryData<TaskWithRelations[]>(['tasks', 'mine', 'user-1'])?.[0]).toMatchObject({
      id: 'a',
      status_id: 'doing',
      position: 1,
    })
  })

  it('rolls back optimistic cache changes when persistence fails', async () => {
    vi.mocked(taskService.moveStatus).mockRejectedValue(new Error('nope'))
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    const original = [task('a', 'todo', 0), task('b', 'doing', 0)]
    queryClient.setQueryData(['tasks', {}], original)

    const { result } = renderHook(() => useMoveTask('user-1'), {
      wrapper: createWrapper(queryClient),
    })

    result.current.mutate({ taskId: 'a', statusId: 'doing', position: 1 })

    await waitFor(() => expect(result.current.isError).toBe(true))

    expect(queryClient.getQueryData(['tasks', {}])).toEqual(original)
  })
})
