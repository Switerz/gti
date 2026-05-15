import { useDroppable } from '@dnd-kit/core'

import { TaskCardSkeleton } from '@/components/tasks/TaskCard'
import { cn } from '@/lib/utils'
import type { TaskStatus, TaskWithRelations } from '@/types/domain'

import { DraggableTaskCard } from './DraggableTaskCard'

interface Props {
  status: TaskStatus
  tasks: TaskWithRelations[]
  isLoading?: boolean
  onTaskEdit?: (task: TaskWithRelations) => void
}

export function KanbanColumn({ status, tasks, isLoading, onTaskEdit }: Props) {
  const { setNodeRef, isOver } = useDroppable({ id: status.id })

  return (
    <div className="flex w-72 shrink-0 flex-col">
      <div className="mb-3 flex items-center gap-2 px-1">
        <div
          className="h-2.5 w-2.5 rounded-full"
          style={{ backgroundColor: status.color ?? '#888' }}
        />
        <span className="text-sm font-medium">{status.name}</span>
        <span className="ml-auto rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
          {isLoading ? '—' : tasks.length}
        </span>
      </div>

      <div
        ref={setNodeRef}
        className={cn(
          'flex min-h-24 flex-1 flex-col gap-2 rounded-xl border bg-muted/30 p-2 transition-colors',
          isOver && 'bg-primary/5 ring-2 ring-primary/20',
        )}
      >
        {isLoading ? (
          Array.from({ length: 2 }).map((_, i) => <TaskCardSkeleton key={i} />)
        ) : tasks.length === 0 ? (
          <div className="flex flex-1 items-center justify-center py-8 text-xs text-muted-foreground">
            Sem tarefas
          </div>
        ) : (
          tasks.map((task) => (
            <DraggableTaskCard
              key={task.id}
              task={task}
              onEdit={onTaskEdit ? () => onTaskEdit(task) : undefined}
            />
          ))
        )}
      </div>
    </div>
  )
}
