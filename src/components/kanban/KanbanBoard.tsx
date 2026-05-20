import { useMemo, useState } from 'react'
import { flushSync } from 'react-dom'

import {
  DndContext,
  DragOverlay,
  PointerSensor,
  pointerWithin,
  rectIntersection,
  useSensor,
  useSensors,
  type CollisionDetection,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core'

import { TaskCard } from '@/components/tasks/TaskCard'
import { resolveKanbanMove } from '@/features/tasks/kanban-utils'
import { useMoveTask } from '@/hooks/useMoveTask'
import { cn } from '@/lib/utils'
import type { Profile, TaskStatus, TaskWithRelations } from '@/types/domain'

import { KanbanColumn, KanbanColumnHeader } from './KanbanColumn'

interface Props {
  tasks: TaskWithRelations[]
  statuses: TaskStatus[]
  currentProfile: Profile
  isLoading?: boolean
  onTaskEdit?: (task: TaskWithRelations) => void
}

export function KanbanBoard({ tasks, statuses, currentProfile, isLoading, onTaskEdit }: Props) {
  const [activeTask, setActiveTask] = useState<TaskWithRelations | null>(null)
  const moveTask = useMoveTask(currentProfile.id)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
  )

  const visibleStatuses = useMemo(
    () => statuses.filter((s) => s.slug !== 'archived'),
    [statuses],
  )
  const statusIds = useMemo(
    () => new Set(visibleStatuses.map((status) => status.id)),
    [visibleStatuses],
  )
  const collisionDetection = useMemo<CollisionDetection>(
    () => (args) => {
      if (args.pointerCoordinates) {
        const columnHits = args.droppableContainers.flatMap((container) => {
          if (!statusIds.has(String(container.id))) return []

          const rect = args.droppableRects.get(container.id)
          if (!rect) return []

          const insideColumn =
            args.pointerCoordinates!.x >= rect.left &&
            args.pointerCoordinates!.x <= rect.right &&
            args.pointerCoordinates!.y >= rect.top &&
            args.pointerCoordinates!.y <= rect.bottom

          return insideColumn
            ? [{ id: container.id, data: { droppableContainer: container, value: 0 } }]
            : []
        })

        if (columnHits.length > 0) return columnHits
      }

      const hits = pointerWithin(args)
      return hits.length > 0 ? hits : rectIntersection(args)
    },
    [statusIds],
  )
  const tasksByStatus = new Map(
    visibleStatuses.map((status) => [
      status.id,
      tasks.filter((task) => task.status_id === status.id),
    ]),
  )

  function onDragStart({ active }: DragStartEvent) {
    setActiveTask(tasks.find((t) => t.id === active.id) ?? null)
  }

  function onDragEnd(event: DragEndEvent) {
    // flushSync ensures the DragOverlay unmounts synchronously before the
    // optimistic update in useMoveTask runs. Without this, React 18's
    // concurrent renderer processes both updates at the same time and the
    // reconciler fails with "removeChild: node is not a child of this node".
    const { active, over } = event
    flushSync(() => setActiveTask(null))
    if (!over) return

    const move = resolveKanbanMove({
      tasks,
      statuses,
      activeId: String(active.id),
      overId: String(over.id),
    })
    if (!move) return

    moveTask.mutate(move)
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={collisionDetection}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onDragCancel={() => setActiveTask(null)}
    >
      <div className="rounded-xl border bg-card/70 p-2 shadow-sm">
        <div className="sticky top-14 z-30 -mx-2 -mt-2 rounded-t-xl border-b bg-card/95 px-2 pt-2 backdrop-blur">
          <div
            className="grid gap-2"
            style={{
              gridTemplateColumns: `repeat(${visibleStatuses.length}, minmax(0, 1fr))`,
            }}
          >
            {visibleStatuses.map((status, index) => (
              <div
                key={status.id}
                className={cn(
                  'min-w-0',
                  index > 0 && 'pl-2',
                  index < visibleStatuses.length - 1 && 'border-r border-border/70 pr-2',
                )}
              >
                <KanbanColumnHeader
                  status={status}
                  count={tasksByStatus.get(status.id)?.length ?? 0}
                  isLoading={isLoading}
                />
              </div>
            ))}
          </div>
        </div>

        <div
          className="grid gap-2"
          style={{
            gridTemplateColumns: `repeat(${visibleStatuses.length}, minmax(0, 1fr))`,
          }}
        >
          {visibleStatuses.map((status, index) => (
            <div
              key={status.id}
              className={cn(
                'min-w-0 self-stretch',
                index > 0 && 'pl-2',
                index < visibleStatuses.length - 1 && 'border-r border-border/70 pr-2',
              )}
            >
              <KanbanColumn
                status={status}
                tasks={tasksByStatus.get(status.id) ?? []}
                isLoading={isLoading}
                onTaskEdit={onTaskEdit}
                showHeader={false}
              />
            </div>
          ))}
        </div>
      </div>

      <DragOverlay dropAnimation={null}>
        {activeTask && (
          <div className="w-56 rotate-1 opacity-95 shadow-2xl">
            <TaskCard task={activeTask} />
          </div>
        )}
      </DragOverlay>
    </DndContext>
  )
}
