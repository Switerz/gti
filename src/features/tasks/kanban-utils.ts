import type { TaskStatus, TaskWithRelations } from '@/types/domain'

export type KanbanMove = {
  taskId: string
  statusId: string
  position: number
}

type ResolveKanbanMoveParams = {
  tasks: TaskWithRelations[]
  statuses: TaskStatus[]
  activeId: string
  overId: string
}

export function resolveKanbanMove({
  tasks,
  statuses,
  activeId,
  overId,
}: ResolveKanbanMoveParams): KanbanMove | null {
  const activeTask = tasks.find((task) => task.id === activeId)
  if (!activeTask) return null

  const overStatus = statuses.find((status) => status.id === overId)
  const overTask = tasks.find((task) => task.id === overId)
  const targetStatusId = overStatus?.id ?? overTask?.status_id
  if (!targetStatusId || activeTask.status_id === targetStatusId) return null

  const targetColumnTasks = tasks
    .filter((task) => task.id !== activeId && task.status_id === targetStatusId)
    .sort((a, b) => Number(a.position ?? 0) - Number(b.position ?? 0))

  const overTaskIndex = overTask
    ? targetColumnTasks.findIndex((task) => task.id === overTask.id)
    : -1

  return {
    taskId: activeTask.id,
    statusId: targetStatusId,
    position: overTaskIndex >= 0 ? overTaskIndex : targetColumnTasks.length,
  }
}

export function applyTaskMove(tasks: TaskWithRelations[], move: KanbanMove): TaskWithRelations[] {
  return tasks.map((task) =>
    task.id === move.taskId
      ? {
          ...task,
          status_id: move.statusId,
          position: move.position,
          status:
            task.status && task.status.id === move.statusId
              ? task.status
              : task.status
                ? { ...task.status, id: move.statusId }
                : task.status,
        }
      : task,
  )
}
