import { useState } from 'react'

import { cn } from '@/lib/utils'
import type { KpiFormatKind, KpiStatus, KpiWeeklyValue } from '@/types/domain'

import { formatKpiValue } from '../kpi-utils'

const STATUS_CLASS: Record<KpiStatus, string> = {
  on_track: 'bg-green-50 text-green-700 ring-green-200 dark:bg-green-950/30 dark:text-green-300 dark:ring-green-900',
  off_track: 'bg-red-50 text-red-700 ring-red-200 dark:bg-red-950/30 dark:text-red-300 dark:ring-red-900',
  neutral: 'bg-muted text-muted-foreground ring-border',
  missing: 'bg-background text-muted-foreground ring-border',
}

export function KpiValueCell({
  value,
  formatKind,
  decimalPlaces,
  unitLabel,
  isCurrent,
  editable,
  isSaving,
  onSave,
}: {
  value?: KpiWeeklyValue
  formatKind: KpiFormatKind
  decimalPlaces: number
  unitLabel?: string | null
  isCurrent?: boolean
  editable?: boolean
  isSaving?: boolean
  onSave?: (values: { value?: number; valueText?: string; notes?: string }) => void
}) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState('')
  const [notes, setNotes] = useState('')
  const status = (value?.status ?? 'missing') as KpiStatus
  const displayValue =
    formatKind === 'text'
      ? value?.value_text || '—'
      : formatKpiValue(value?.value, formatKind, decimalPlaces, unitLabel)

  function startEditing() {
    setDraft(formatKind === 'text' ? value?.value_text ?? '' : value?.value?.toString() ?? '')
    setNotes(value?.notes ?? '')
    setEditing(true)
  }

  function save() {
    if (!onSave) return

    if (formatKind === 'text') {
      onSave({ valueText: draft, notes })
    } else {
      const numericValue = Number(draft.replace(',', '.'))
      if (Number.isNaN(numericValue)) return
      onSave({ value: numericValue, notes })
    }
    setEditing(false)
  }

  if (editing) {
    return (
      <span className="flex min-w-24 flex-col gap-1 rounded-md border bg-background p-1 shadow-sm">
        <input
          autoFocus
          value={draft}
          type={formatKind === 'text' ? 'text' : 'number'}
          step={formatKind === 'integer' ? 1 : 0.1}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') save()
            if (event.key === 'Escape') setEditing(false)
          }}
          className="h-7 w-full rounded border bg-background px-2 text-center text-xs font-semibold outline-none focus:ring-1 focus:ring-ring"
          aria-label="Valor do KPI"
        />
        <input
          value={notes}
          onChange={(event) => setNotes(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') save()
            if (event.key === 'Escape') setEditing(false)
          }}
          className="h-6 w-full rounded border bg-background px-2 text-[11px] outline-none focus:ring-1 focus:ring-ring"
          placeholder="Nota opcional"
          aria-label="Nota do valor semanal"
        />
      </span>
    )
  }

  return (
    <button
      type="button"
      disabled={!editable || isSaving}
      onClick={() => {
        if (editable) startEditing()
      }}
      className={cn(
        'inline-flex min-h-8 w-full min-w-20 items-center justify-center rounded-md px-2 text-center text-xs font-semibold tabular-nums ring-1',
        STATUS_CLASS[status],
        isCurrent && 'ring-2 ring-primary/40',
        editable && 'cursor-pointer hover:ring-primary/50',
        isSaving && 'opacity-70',
      )}
    >
      {isSaving ? '...' : displayValue}
    </button>
  )
}
