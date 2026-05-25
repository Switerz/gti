import { useState } from 'react'

import { Check, ChevronDown, ChevronUp, Info, Pencil, X } from 'lucide-react'

import { LoadingState } from '@/components/shared/LoadingState'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { useCurrentProfile } from '@/hooks/useCurrentProfile'
import { useOkrs, useUpdateKeyResult } from '@/hooks/useOkrs'
import { canManageProjects } from '@/lib/permissions'
import type { OkrKeyResult, OkrObjectiveWithKRs } from '@/types/domain'

import { PageHeader } from './PageHeader'

// ── Score helpers ─────────────────────────────────────────────────────────────

function calcProgress(kr: OkrKeyResult): number {
  if (kr.grade_target === 0) return 0
  return Math.min(kr.current_value / kr.grade_target, 1)
}

function progressColor(p: number): string {
  if (p >= 0.7) return 'bg-green-500'
  if (p >= 0.3) return 'bg-amber-400'
  return 'bg-red-500'
}

function progressTextColor(p: number): string {
  if (p >= 0.7) return 'text-green-600 dark:text-green-400'
  if (p >= 0.3) return 'text-amber-600 dark:text-amber-400'
  return 'text-red-600 dark:text-red-400'
}

function progressLabel(p: number): string {
  if (p >= 1.0) return 'Concluído'
  if (p >= 0.7) return 'No prazo'
  if (p >= 0.3) return 'Em risco'
  return 'Atrasado'
}

function objectiveProgress(obj: OkrObjectiveWithKRs): number {
  const totalTarget = obj.key_results.reduce((s, kr) => s + kr.grade_target, 0)
  if (totalTarget === 0) return 0
  const totalCurrent = obj.key_results.reduce((s, kr) => s + Math.min(kr.current_value, kr.grade_target), 0)
  return Math.min(totalCurrent / totalTarget, 1)
}

function isBinary(kr: OkrKeyResult): boolean {
  return kr.grade_target === 1
}

// ── KR edit row ───────────────────────────────────────────────────────────────

interface KRRowProps {
  kr: OkrKeyResult
  canEdit: boolean
}

function KRRow({ kr, canEdit }: KRRowProps) {
  const updateKR = useUpdateKeyResult()
  const [editing, setEditing] = useState(false)
  const [valueDraft, setValueDraft] = useState(kr.current_value)
  const [notesDraft, setNotesDraft] = useState(kr.notes ?? '')
  const [showSource, setShowSource] = useState(false)

  const progress = calcProgress(kr)

  function startEdit() {
    setValueDraft(kr.current_value)
    setNotesDraft(kr.notes ?? '')
    setEditing(true)
  }

  function cancelEdit() {
    setEditing(false)
  }

  async function saveEdit() {
    await updateKR.mutateAsync({
      id: kr.id,
      values: {
        current_value: valueDraft,
        notes: notesDraft.trim() || null,
      },
    })
    setEditing(false)
  }

  async function toggleBinary() {
    const next = kr.current_value >= 1 ? 0 : 1
    await updateKR.mutateAsync({ id: kr.id, values: { current_value: next } })
  }

  return (
    <div className="border-b last:border-0">
      {/* Main row */}
      <div className="flex items-start gap-3 px-4 py-3">
        {/* Code badge */}
        <span className="mt-0.5 shrink-0 rounded bg-muted px-1.5 py-0.5 text-[11px] font-semibold text-muted-foreground">
          {kr.code}
        </span>

        {/* Title + meta */}
        <div className="min-w-0 flex-1 space-y-1">
          <p className="text-sm leading-snug">{kr.title}</p>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
            {kr.owner && <span>Dono: <span className="font-medium text-foreground">{kr.owner}</span></span>}
            {kr.updater && kr.updater !== kr.owner && (
              <span>Atualiza: <span className="font-medium text-foreground">{kr.updater}</span></span>
            )}
            {kr.data_source && (
              <button
                onClick={() => setShowSource((v) => !v)}
                className="inline-flex items-center gap-0.5 text-muted-foreground hover:text-foreground"
                title="Fonte do dado"
              >
                <Info className="h-3 w-3" />
                Fonte
              </button>
            )}
          </div>
          {showSource && kr.data_source && (
            <p className="rounded bg-muted/50 px-2 py-1 text-xs text-muted-foreground">{kr.data_source}</p>
          )}
          {kr.notes && !editing && (
            <p className="rounded bg-muted/40 px-2 py-1 text-xs italic text-muted-foreground">
              {kr.notes}
            </p>
          )}
        </div>

        {/* Progress */}
        <div className="flex shrink-0 items-center gap-2">
          {isBinary(kr) ? (
            /* Binary: toggle button */
            canEdit ? (
              <button
                onClick={toggleBinary}
                disabled={updateKR.isPending}
                className={`flex h-7 w-7 items-center justify-center rounded-full border-2 transition-colors ${
                  kr.current_value >= 1
                    ? 'border-green-500 bg-green-500 text-white'
                    : 'border-muted-foreground/30 text-transparent hover:border-green-400'
                }`}
                title={kr.current_value >= 1 ? 'Marcar como não concluído' : 'Marcar como concluído'}
              >
                <Check className="h-3.5 w-3.5" />
              </button>
            ) : (
              <div className={`flex h-7 w-7 items-center justify-center rounded-full border-2 ${
                kr.current_value >= 1
                  ? 'border-green-500 bg-green-500 text-white'
                  : 'border-muted-foreground/30 text-transparent'
              }`}>
                <Check className="h-3.5 w-3.5" />
              </div>
            )
          ) : (
            /* Numeric: progress bar + value */
            <div className="flex items-center gap-2">
              <div className="hidden sm:block">
                <div className="h-1.5 w-24 overflow-hidden rounded-full bg-muted">
                  <div
                    className={`h-full rounded-full transition-all ${progressColor(progress)}`}
                    style={{ width: `${Math.round(progress * 100)}%` }}
                  />
                </div>
              </div>
              <span className={`text-xs font-semibold tabular-nums ${progressTextColor(progress)}`}>
                {kr.current_value % 1 === 0 ? kr.current_value.toFixed(0) : kr.current_value.toFixed(1)}
                <span className="font-normal text-muted-foreground">
                  /{kr.grade_target % 1 === 0 ? kr.grade_target.toFixed(0) : kr.grade_target.toFixed(1)}
                </span>
              </span>
            </div>
          )}

          {/* Edit button */}
          {canEdit && !isBinary(kr) && !editing && (
            <button
              onClick={startEdit}
              className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
              title="Editar valor"
            >
              <Pencil className="h-3.5 w-3.5" />
            </button>
          )}
          {canEdit && !isBinary(kr) && editing && (
            <button
              onClick={cancelEdit}
              className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-destructive"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Edit panel */}
      {editing && (
        <div className="border-t bg-muted/20 px-4 py-3 space-y-3">
          <div className="flex flex-wrap items-end gap-3">
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">
                Valor atual <span className="text-muted-foreground">(meta: {kr.grade_target})</span>
              </label>
              <input
                type="number"
                min={0}
                max={kr.grade_target}
                step={kr.grade_target <= 1 ? 0.1 : 1}
                value={valueDraft}
                onChange={(e) => setValueDraft(Number(e.target.value))}
                className="h-8 w-28 rounded-md border bg-background px-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                autoFocus
              />
            </div>
            <div className="min-w-[180px] flex-1 space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Observação</label>
              <Textarea
                rows={2}
                value={notesDraft}
                onChange={(e) => setNotesDraft(e.target.value)}
                placeholder="Contexto ou justificativa..."
                className="text-sm"
              />
            </div>
            <div className="flex gap-2">
              <Button size="sm" onClick={saveEdit} disabled={updateKR.isPending}>
                Salvar
              </Button>
              <Button size="sm" variant="ghost" onClick={cancelEdit}>
                Cancelar
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Objective card ────────────────────────────────────────────────────────────

interface ObjectiveCardProps {
  objective: OkrObjectiveWithKRs
  canEdit: boolean
  index: number
}

function ObjectiveCard({ objective, canEdit, index }: ObjectiveCardProps) {
  const [open, setOpen] = useState(true)
  const progress = objectiveProgress(objective)
  const pct = Math.round(progress * 100)

  const COLORS = [
    'from-blue-500/10 to-blue-500/5 border-blue-200 dark:border-blue-900',
    'from-violet-500/10 to-violet-500/5 border-violet-200 dark:border-violet-900',
    'from-emerald-500/10 to-emerald-500/5 border-emerald-200 dark:border-emerald-900',
    'from-orange-500/10 to-orange-500/5 border-orange-200 dark:border-orange-900',
    'from-pink-500/10 to-pink-500/5 border-pink-200 dark:border-pink-900',
  ]
  const colorClass = COLORS[index % COLORS.length]

  return (
    <div className={`overflow-hidden rounded-xl border bg-gradient-to-br ${colorClass}`}>
      {/* Header */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-start gap-3 px-5 py-4 text-left"
      >
        <div className="flex-1 space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-background/60 px-2 py-0.5 text-[11px] font-semibold text-muted-foreground">
              MacroOKR {index + 1}
            </span>
            <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${progressTextColor(progress)} bg-background/60`}>
              {progressLabel(progress)} · {pct}%
            </span>
          </div>
          <h3 className="font-semibold leading-snug">{objective.macro_title}</h3>
          {objective.description && (
            <p className="text-sm text-muted-foreground">{objective.description}</p>
          )}
        </div>

        <div className="flex shrink-0 items-center gap-3 pt-1">
          {/* Mini progress ring */}
          <div className="relative h-10 w-10">
            <svg className="h-10 w-10 -rotate-90" viewBox="0 0 36 36">
              <circle cx="18" cy="18" r="15" fill="none" stroke="currentColor" strokeWidth="3" className="text-muted/30" />
              <circle
                cx="18" cy="18" r="15" fill="none" strokeWidth="3"
                strokeDasharray={`${pct * 0.942} 94.2`}
                strokeLinecap="round"
                className={progress >= 0.7 ? 'text-green-500' : progress >= 0.3 ? 'text-amber-400' : 'text-red-500'}
                stroke="currentColor"
              />
            </svg>
            <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold">
              {pct}%
            </span>
          </div>
          {open ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
        </div>
      </button>

      {/* KR list */}
      {open && (
        <div className="border-t bg-background/60">
          {/* Column headers */}
          <div className="hidden grid-cols-[auto_1fr_auto] items-center gap-3 border-b bg-muted/30 px-4 py-2 sm:grid">
            <span className="w-8 text-[11px] font-medium text-muted-foreground">#</span>
            <span className="text-[11px] font-medium text-muted-foreground">Key Result</span>
            <span className="text-[11px] font-medium text-muted-foreground">Progresso</span>
          </div>
          {objective.key_results.map((kr) => (
            <KRRow key={kr.id} kr={kr} canEdit={canEdit} />
          ))}
        </div>
      )}
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export function OKRPage() {
  const { data: currentProfile } = useCurrentProfile()
  const { data: objectives = [], isLoading } = useOkrs()
  const canEdit = canManageProjects(currentProfile) // lead ou admin

  const totalTarget = objectives.reduce(
    (s, obj) => s + obj.key_results.reduce((ss, kr) => ss + kr.grade_target, 0),
    0,
  )
  const totalCurrent = objectives.reduce(
    (s, obj) =>
      s + obj.key_results.reduce((ss, kr) => ss + Math.min(kr.current_value, kr.grade_target), 0),
    0,
  )
  const overallPct = totalTarget === 0 ? 0 : Math.round((totalCurrent / totalTarget) * 100)

  if (isLoading) return <LoadingState fullPage />

  return (
    <section className="space-y-6">
      <PageHeader
        title="OKRs — 1S26"
        description="Objetivos e Key Results da equipe de Transportes para o 1º semestre de 2026."
        actions={
          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-xs text-muted-foreground">Progresso geral</p>
              <p className={`text-lg font-bold tabular-nums ${progressTextColor(overallPct / 100)}`}>
                {overallPct}%
              </p>
            </div>
            <div className="h-12 w-12">
              <svg className="h-12 w-12 -rotate-90" viewBox="0 0 36 36">
                <circle cx="18" cy="18" r="15" fill="none" stroke="currentColor" strokeWidth="3" className="text-muted/30" />
                <circle
                  cx="18" cy="18" r="15" fill="none" strokeWidth="3"
                  strokeDasharray={`${overallPct * 0.942} 94.2`}
                  strokeLinecap="round"
                  className={overallPct >= 70 ? 'text-green-500' : overallPct >= 30 ? 'text-amber-400' : 'text-red-500'}
                  stroke="currentColor"
                />
              </svg>
            </div>
          </div>
        }
      />

      {objectives.length === 0 ? (
        <p className="py-12 text-center text-sm text-muted-foreground">Nenhum OKR cadastrado.</p>
      ) : (
        <div className="space-y-4">
          {objectives.map((obj, i) => (
            <ObjectiveCard key={obj.id} objective={obj} canEdit={canEdit} index={i} />
          ))}
        </div>
      )}
    </section>
  )
}
