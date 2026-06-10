import { cn } from '@/lib/utils'
import type { KpiStatus } from '@/types/domain'

const STATUS_CLASS: Record<KpiStatus, string> = {
  on_track: 'bg-green-500',
  off_track: 'bg-red-500',
  neutral: 'bg-slate-400',
  missing: 'bg-amber-400',
}

export function KpiStatusDot({ status, className }: { status: KpiStatus; className?: string }) {
  return (
    <span
      className={cn('inline-block h-2.5 w-2.5 shrink-0 rounded-full', STATUS_CLASS[status], className)}
      aria-label={status}
    />
  )
}
