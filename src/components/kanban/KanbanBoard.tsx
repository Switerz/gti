import { useState } from 'react'

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
import type { Profile, TaskStatus, TaskWithRelations } from '@/types/domain'

import { KanbanColumn } from './KanbanColumn'

interface Props {
  tasks: TaskWithRelations[]
  statuses: TaskStatus[]
  currentProfile: Profile
  isLoading?: boolean
  onTaskEdit?: (task: TaskWithRelations) => void
}

// Prefer pointer position; fall back to rect intersection when pointer is in a gap
const collisionDetection: CollisionDetection = (args) => {
  const hits = pointerWithin(args)
  return hits.length > 0 ? hits : rectIntersection(args)
}

export function KanbanBoard({ tasks, statuses, currentProfile, isLoading, onTaskEdit }: Props) {
  const [activeTask, setActiveTask] = useState<TaskWithRelations | null>(null)
  const moveTask = useMoveTask(currentProfile.id)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
  )

  const visibleStatuses = statuses.filter((s) => s.slug !== 'archived')

  function onDragStart({ active }: DragStartEvent) {
    setActiveTask(tasks.find((t) => t.id === active.id) ?? null)
  }

  function onDragEnd({ active, over }: DragEndEvent) {
    setActiveTask(null)
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
      <div className="flex gap-4 overflow-x-auto pb-6">
        {visibleStatuses.map((status) => (
          <KanbanColumn
            key={status.id}
            status={status}
            tasks={tasks.filter((t) => t.status_id === status.id)}
            isLoading={isLoading}
            onTaskEdit={onTaskEdit}
          />
        ))}
      </div>

      <DragOverlay dropAnimation={null}>
        {activeTask && (
          <div className="w-72 rotate-1 opacity-95 shadow-2xl">
            <TaskCard task={activeTask} />
          </div>
        )}
      </DragOverlay>
    </DndContext>
  )
}
