import { Link } from 'react-router-dom'

import { AlertOctagon, CheckSquare, MessageSquare, Pencil } from 'lucide-react'

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
  const assigneeProfiles = task.assignees?.map((a) => a.profile) ?? []

  return (
    <Link
      to={`/tasks/${task.id}`}
      className={cn(
        'group relative block rounded-lg border bg-card p-3.5 shadow-sm transition-shadow hover:shadow-md',
        isBlocked && 'border-red-300 bg-red-50/30 dark:border-red-800 dark:bg-red-950/20',
        className,
      )}
    >
      {onEdit && (
        <button
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); onEdit() }}
          className="absolute right-2 top-2 invisible rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground group-hover:visible"
          aria-label="Editar tarefa"
        >
          <Pencil className="h-3 w-3" />
        </button>
      )}
      {/* Category + blocked indicator */}
      <div className="mb-2 flex items-center gap-2">
        {task.category && (
          <span
            className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium"
            style={{
              backgroundColor: `${task.category.color}22`,
              color: task.category.color ?? undefined,
            }}
          >
            {task.category.name}
          </span>
        )}
        {isBlocked && (
          <span className="ml-auto flex items-center gap-1 text-xs font-medium text-red-600 dark:text-red-400">
            <AlertOctagon className="h-3 w-3" />
            Bloqueado
          </span>
        )}
      </div>

      {/* Title */}
      <p className="mb-3 line-clamp-2 text-sm font-medium leading-snug text-foreground group-hover:text-primary">
        {task.title}
      </p>

      {/* Priority + Due date */}
      <div className="mb-3 flex flex-wrap items-center gap-1.5">
        <TaskPriorityBadge priority={task.priority as TaskPriority} />
        <TaskDueDateBadge
          dueDate={task.due_date}
          isFinal={task.status?.is_final}
          isArchived={task.is_archived}
        />
      </div>

      {/* Footer: assignees + counters */}
      <div className="flex items-center justify-between">
        {/* Assignee avatars */}
        <div className="flex -space-x-1.5">
          {assigneeProfiles.slice(0, 4).map((profile) => {
            const initials = profile.full_name
              ?.split(' ')
              .slice(0, 2)
              .map((n) => n[0])
              .join('')
              .toUpperCase() ?? '?'
            return (
              <Avatar key={profile.id} className="h-6 w-6 border-2 border-card">
                <AvatarImage src={profile.avatar_url ?? undefined} />
                <AvatarFallback className="text-[9px]">{initials}</AvatarFallback>
              </Avatar>
            )
          })}
          {assigneeProfiles.length > 4 && (
            <div className="flex h-6 w-6 items-center justify-center rounded-full border-2 border-card bg-muted text-[9px] font-medium text-muted-foreground">
              +{assigneeProfiles.length - 4}
            </div>
          )}
        </div>

        {/* Counters */}
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          {commentCount > 0 && (
            <span className="flex items-center gap-0.5">
              <MessageSquare className="h-3 w-3" />
              {commentCount}
            </span>
          )}
          {checklistTotal > 0 && (
            <span className="flex items-center gap-0.5">
              <CheckSquare className="h-3 w-3" />
              {checklistDone}/{checklistTotal}
            </span>
          )}
        </div>
      </div>
    </Link>
  )
}

// Skeleton version for loading state
export function TaskCardSkeleton() {
  return (
    <div className="rounded-lg border bg-card p-3.5 shadow-sm">
      <div className="mb-2 h-4 w-20 animate-pulse rounded-full bg-muted" />
      <div className="mb-1 h-4 w-full animate-pulse rounded bg-muted" />
      <div className="mb-3 h-4 w-3/4 animate-pulse rounded bg-muted" />
      <div className="flex gap-1.5">
        <div className="h-5 w-12 animate-pulse rounded-full bg-muted" />
        <div className="h-5 w-16 animate-pulse rounded-full bg-muted" />
      </div>
    </div>
  )
}
