import { cn } from '@/lib/utils'
import type { TaskPriority } from '@/types/domain'

const CONFIG: Record<TaskPriority, { label: string; className: string }> = {
  low:    { label: 'Baixa',   className: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300' },
  medium: { label: 'Média',   className: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300' },
  high:   { label: 'Alta',    className: 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300' },
  urgent: { label: 'Urgente', className: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300' },
}

interface Props {
  priority: TaskPriority
  className?: string
}

export function TaskPriorityBadge({ priority, className }: Props) {
  const { label, className: colorClass } = CONFIG[priority] ?? CONFIG.medium
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium',
        colorClass,
        className,
      )}
    >
      {label}
    </span>
  )
}
