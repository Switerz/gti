import { cn } from '@/lib/utils'

interface Props {
  name: string
  color?: string | null
  className?: string
}

export function TaskStatusBadge({ name, color, className }: Props) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium',
        'bg-muted text-muted-foreground',
        className,
      )}
    >
      <span
        className="h-1.5 w-1.5 rounded-full flex-shrink-0"
        style={{ backgroundColor: color ?? '#94a3b8' }}
      />
      {name}
    </span>
  )
}
