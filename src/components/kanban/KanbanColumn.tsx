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
  showHeader?: boolean
}

export function KanbanColumnHeader({
  status,
  count,
  isLoading,
}: {
  status: TaskStatus
  count: number
  isLoading?: boolean
}) {
  const columnColor = status.color ?? '#64748b'

  return (
    <div className="flex min-h-9 items-center gap-2 px-1.5 py-2">
      <div
        className="h-2 w-2 shrink-0 rounded-full"
        style={{ backgroundColor: columnColor }}
      />
      <span className="min-w-0 truncate text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
        {status.name}
      </span>
      <span className="ml-auto shrink-0 rounded-full border bg-background px-1.5 py-0.5 text-[11px] font-semibold tabular-nums text-muted-foreground">
        {isLoading ? '—' : count}
      </span>
    </div>
  )
}

export function KanbanColumn({ status, tasks, isLoading, onTaskEdit, showHeader = true }: Props) {
  const { setNodeRef, isOver } = useDroppable({ id: status.id })

  return (
    <div className="flex h-full min-w-0 flex-col">
      {showHeader && <KanbanColumnHeader status={status} count={tasks.length} isLoading={isLoading} />}

      <div
        ref={setNodeRef}
        role="region"
        aria-label={status.name}
        className={cn(
          'flex min-h-[340px] flex-1 flex-col gap-2 rounded-b-lg px-1 py-2 transition-colors',
          'bg-background/45',
          isOver && 'border-primary/40 bg-primary/5 ring-2 ring-primary/15',
        )}
      >
        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => <TaskCardSkeleton key={i} />)
        ) : tasks.length === 0 ? (
          <div className="flex flex-1 items-center justify-center rounded-md border border-dashed border-border/70 px-3 text-center text-[11px] text-muted-foreground/70">
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
