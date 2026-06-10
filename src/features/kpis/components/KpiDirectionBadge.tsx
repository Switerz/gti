import { ArrowDown, ArrowUp, Minus } from 'lucide-react'

import { cn } from '@/lib/utils'
import type { KpiTargetOperator } from '@/types/domain'

export function KpiDirectionBadge({
  operator,
  className,
}: {
  operator: KpiTargetOperator
  className?: string
}) {
  const Icon = operator === 'gte' ? ArrowUp : operator === 'lte' ? ArrowDown : Minus
  const label =
    operator === 'gte' ? 'Maior ou igual' : operator === 'lte' ? 'Menor ou igual' : operator === 'eq' ? 'Igual' : 'Informativo'

  return (
    <span
      className={cn(
        'inline-flex h-7 w-7 items-center justify-center rounded-md border bg-background text-muted-foreground',
        operator === 'gte' && 'text-green-600',
        operator === 'lte' && 'text-blue-600',
        className,
      )}
      title={label}
      aria-label={label}
    >
      <Icon className="h-3.5 w-3.5" />
    </span>
  )
}
