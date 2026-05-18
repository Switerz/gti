import { cn } from '@/lib/utils'
import { formatDate, isPastDue } from '@/lib/dates'

interface Props {
  dueDate?: string | null
  isFinal?: boolean
  isArchived?: boolean
  className?: string
}

export function TaskDueDateBadge({ dueDate, isFinal = false, isArchived = false, className }: Props) {
  if (!dueDate) return null

  const overdue = isPastDue(dueDate, isFinal, isArchived)

  return (
    <span
      className={cn(
        'inline-flex items-center whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-medium',
        overdue
          ? 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400'
          : 'bg-muted text-muted-foreground',
        className,
      )}
    >
      {overdue ? '⚠ ' : ''}{formatDate(dueDate)}
    </span>
  )
}
