import { useDraggable, useDroppable } from '@dnd-kit/core'

import { TaskCard } from '@/components/tasks/TaskCard'
import type { TaskWithRelations } from '@/types/domain'

interface Props {
  task: TaskWithRelations
  onEdit?: () => void
}

export function DraggableTaskCard({ task, onEdit }: Props) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: task.id,
    data: { statusId: task.status_id },
  })
  const { setNodeRef: setDropNodeRef, isOver } = useDroppable({
    id: task.id,
    data: { type: 'task', statusId: task.status_id },
  })

  function setRefs(node: HTMLDivElement | null) {
    setNodeRef(node)
    setDropNodeRef(node)
  }

  return (
    <div
      ref={setRefs}
      {...attributes}
      {...listeners}
      aria-label={task.title}
      className={
        isDragging
          ? 'opacity-30'
          : isOver
            ? 'rounded-lg ring-2 ring-primary/20 ring-offset-2 ring-offset-background'
            : undefined
      }
      style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
    >
      <TaskCard task={task} onEdit={onEdit} />
    </div>
  )
}
