import { useDraggable } from '@dnd-kit/core'

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

  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      aria-label={task.title}
      className={isDragging ? 'opacity-30' : undefined}
      style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
    >
      <TaskCard task={task} onEdit={onEdit} />
    </div>
  )
}
