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
    <div className="flex min-w-0 flex-col gap-2">
      {/* Column header */}
      <div className="flex items-center gap-2 rounded-lg px-2 py-1.5">
        <div
          className="h-2 w-2 shrink-0 rounded-full"
          style={{ backgroundColor: status.color ?? '#888' }}
        />
        <span className="min-w-0 truncate text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          {status.name}
        </span>
        <span className="ml-auto shrink-0 rounded-full bg-muted px-1.5 py-0.5 text-xs font-medium tabular-nums text-muted-foreground">
          {isLoading ? '—' : tasks.length}
        </span>
      </div>

      {/* Drop zone */}
      <div
        ref={setNodeRef}
        className={cn(
          'flex flex-col gap-2 rounded-xl border bg-muted/20 p-2 transition-colors',
          'min-h-[120px] overflow-y-auto',
          'max-h-[calc(100svh-300px)]',
          isOver && 'bg-primary/8 ring-2 ring-primary/25',
        )}
      >
        {isLoading ? (
          Array.from({ length: 2 }).map((_, i) => <TaskCardSkeleton key={i} />)
        ) : tasks.length === 0 ? (
          <div className="flex flex-1 items-center justify-center py-10 text-xs text-muted-foreground/60">
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
