import { Link } from 'react-router-dom'

import { CheckSquare, MessageSquare, Pencil } from 'lucide-react'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { cn } from '@/lib/utils'
import type { TaskPriority, TaskWithRelations } from '@/types/domain'

import { TaskDueDateBadge } from './TaskDueDateBadge'
import { TaskPriorityBadge } from './TaskPriorityBadge'

interface Props {
  task: TaskWithRelations
  className?: string
  onEdit?: () => void
}

export function TaskCard({ task, className, onEdit }: Props) {
  const commentCount = task._comments?.length ?? 0
  const checklistTotal = task._checklist?.length ?? 0
  const checklistDone = task._checklist?.filter((c) => c.is_done).length ?? 0
  const isBlocked = task.status?.slug === 'blocked'
  const assigneeProfiles = task.assignees?.map((a) => a.profile).filter((profile) => !!profile) ?? []
  const displayProfiles = assigneeProfiles.length > 0 ? assigneeProfiles : task.owner ? [task.owner] : []
  const visibleAssignees = displayProfiles.slice(0, 2)
  const categoryColor = task.category?.color ?? '#64748b'

  return (
    <Link
      to={`/tasks/${task.id}`}
      className={cn(
        'group relative block rounded-lg border bg-card/95 p-2.5 shadow-sm outline-none transition-colors hover:border-primary/35 hover:bg-card focus-visible:ring-2 focus-visible:ring-ring/40',
        isBlocked && 'border-red-500/50 bg-red-950/[0.04] dark:bg-red-950/15',
        className,
      )}
    >
      {onEdit && (
        <button
          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
            onEdit()
          }}
          className="invisible absolute right-2 top-2 rounded-md border bg-background/90 p-1 text-muted-foreground opacity-0 shadow-sm transition hover:text-foreground group-hover:visible group-hover:opacity-100"
          aria-label="Editar tarefa"
        >
          <Pencil className="h-3 w-3" />
        </button>
      )}

      <div className="mb-2 flex items-center gap-1.5 pr-6">
        {task.category && (
          <span
            className="inline-flex min-w-0 max-w-full items-center gap-1 rounded-full px-1.5 py-0.5 text-[10px] font-semibold leading-none"
            style={{
              backgroundColor: `${categoryColor}1f`,
              color: categoryColor,
            }}
          >
            <span
              className="h-1.5 w-1.5 shrink-0 rounded-full"
              style={{ backgroundColor: categoryColor }}
            />
            <span className="truncate">{task.category.name}</span>
          </span>
        )}
      </div>

      <p className="mb-1.5 line-clamp-3 text-[12px] font-semibold leading-snug text-foreground group-hover:text-primary">
        {task.title}
      </p>

      {task.project && (
        <p className="mb-2 line-clamp-2 text-[10.5px] leading-snug text-muted-foreground">
          {task.project.name}
        </p>
      )}

      <div className="flex items-end justify-between gap-2">
        <div className="flex min-w-0 flex-wrap items-center gap-1">
          <TaskPriorityBadge
            priority={task.priority as TaskPriority}
            className="px-1.5 text-[10px]"
          />
          <TaskDueDateBadge
            dueDate={task.due_date}
            isFinal={task.status?.is_final}
            isArchived={task.is_archived}
            className="px-1.5 text-[10px]"
          />
          {commentCount > 0 && (
            <span className="inline-flex items-center gap-0.5 rounded-full px-1 text-[10px] text-muted-foreground">
              <MessageSquare className="h-3 w-3" />
              {commentCount}
            </span>
          )}
          {checklistTotal > 0 && (
            <span className="inline-flex items-center gap-0.5 rounded-full px-1 text-[10px] text-muted-foreground">
              <CheckSquare className="h-3 w-3" />
              {checklistDone}/{checklistTotal}
            </span>
          )}
        </div>

        <div className="flex shrink-0 -space-x-1">
          {visibleAssignees.map((profile) => {
            const initials = profile.full_name
              ?.split(' ')
              .slice(0, 2)
              .map((n) => n[0])
              .join('')
              .toUpperCase() ?? '?'
            return (
              <Avatar key={profile.id} className="h-5 w-5 border border-card shadow-sm">
                <AvatarImage src={profile.avatar_url ?? undefined} />
                <AvatarFallback className="text-[9px]">{initials}</AvatarFallback>
              </Avatar>
            )
          })}
          {displayProfiles.length > 2 && (
            <div className="flex h-5 w-5 items-center justify-center rounded-full border border-card bg-muted text-[9px] font-medium text-muted-foreground">
              +{displayProfiles.length - 2}
            </div>
          )}
        </div>
      </div>
    </Link>
  )
}

// Skeleton version for loading state
export function TaskCardSkeleton() {
  return (
    <div className="rounded-lg border bg-card/90 p-2.5 shadow-sm">
      <div className="mb-2 h-3 w-20 animate-pulse rounded-full bg-muted" />
      <div className="mb-1 h-3.5 w-full animate-pulse rounded bg-muted" />
      <div className="mb-2.5 h-3.5 w-3/4 animate-pulse rounded bg-muted" />
      <div className="flex gap-1">
        <div className="h-4 w-11 animate-pulse rounded-full bg-muted" />
        <div className="h-4 w-14 animate-pulse rounded-full bg-muted" />
      </div>
    </div>
  )
}
