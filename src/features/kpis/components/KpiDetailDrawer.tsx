import { useMemo, useState } from 'react'

import { Archive, Pencil, Save, X } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Textarea } from '@/components/ui/textarea'
import { useArchiveKpi, useUpdateKpi } from '@/features/kpis/hooks/useUpdateKpi'
import { calculateKpiDelta, formatKpiValue } from '@/features/kpis/kpi-utils'
import { canArchiveKpi, canEditKpi } from '@/lib/permissions'
import type {
  KpiFormatKind,
  KpiTargetOperator,
  KpiWeeklyValue,
  KpiWithRelations,
  Profile,
} from '@/types/domain'

import { KpiActionPlanSection } from './KpiActionPlanSection'
import { KpiDirectionBadge } from './KpiDirectionBadge'
import { KpiHistoryChart } from './KpiHistoryChart'
import { KpiOffenderSection } from './KpiOffenderSection'
import { KpiStatusDot } from './KpiStatusDot'
import { getKpiCurrentStatus } from '../kpi-view-utils'

function sortedValues(kpi: KpiWithRelations) {
  return [...kpi.weekly_values].sort((a, b) => a.iso_year - b.iso_year || a.iso_week - b.iso_week)
}

function SummaryCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-lg border bg-card p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 text-lg font-semibold">{value}</p>
    </div>
  )
}

function pickBestAndWorst(values: KpiWeeklyValue[], targetOperator: KpiTargetOperator) {
  const numericValues = values.filter((value) => value.value != null)

  if (numericValues.length === 0) {
    return { best: null, worst: null }
  }

  const lowerIsBetter = targetOperator === 'lte'
  const sorted = [...numericValues].sort((a, b) => {
    const aValue = a.value ?? 0
    const bValue = b.value ?? 0
    return lowerIsBetter ? aValue - bValue : bValue - aValue
  })

  return {
    best: sorted[0],
    worst: sorted.at(-1) ?? null,
  }
}

export function KpiDetailDrawer({
  kpi,
  currentProfile,
  currentWeek,
  open,
  onOpenChange,
}: {
  kpi: KpiWithRelations | null
  currentProfile: Profile | null | undefined
  currentWeek: { isoYear: number; isoWeek: number }
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const [editing, setEditing] = useState(false)
  const [confirmArchive, setConfirmArchive] = useState(false)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [targetValue, setTargetValue] = useState('')
  const [targetLabel, setTargetLabel] = useState('')

  const updateKpi = useUpdateKpi(currentProfile?.id ?? '')
  const archiveKpi = useArchiveKpi(currentProfile?.id ?? '')

  const values = useMemo(() => (kpi ? sortedValues(kpi) : []), [kpi])
  if (!kpi) return null
  const detailKpi = kpi

  const canEdit = canEditKpi(currentProfile, detailKpi)
  const canArchive = canArchiveKpi(currentProfile, detailKpi)
  const formatKind = detailKpi.format_kind as KpiFormatKind
  const targetOperator = detailKpi.target_operator as KpiTargetOperator
  const latest = values.at(-1)
  const previous = values.at(-2)
  const delta = calculateKpiDelta(latest?.value, previous?.value)
  const offTrackCount = values.filter((value) => value.status === 'off_track').length
  const { best, worst } = pickBestAndWorst(values, targetOperator)
  const currentStatus = getKpiCurrentStatus(detailKpi, currentWeek)

  function startEdit() {
    setName(detailKpi.name)
    setDescription(detailKpi.description ?? '')
    setTargetValue(detailKpi.target_value?.toString() ?? '')
    setTargetLabel(detailKpi.target_label ?? '')
    setEditing(true)
  }

  async function saveEdit() {
    await updateKpi.mutateAsync({
      id: detailKpi.id,
      values: {
        name,
        description,
        targetValue: targetValue === '' ? undefined : Number(targetValue),
        targetLabel,
      },
    })
    setEditing(false)
  }

  async function handleArchive() {
    await archiveKpi.mutateAsync(detailKpi.id)
    setConfirmArchive(false)
    onOpenChange(false)
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full overflow-y-auto p-0 sm:max-w-3xl">
        <SheetHeader className="border-b px-6 py-4 text-left">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <SheetTitle className="flex items-center gap-2">
                <KpiStatusDot status={currentStatus} />
                <span className="truncate">{kpi.name}</span>
              </SheetTitle>
              <SheetDescription>
                {[kpi.product, kpi.owner?.full_name ?? kpi.owner_label].filter(Boolean).join(' · ') || 'KPI de Transportes'}
              </SheetDescription>
            </div>
            <KpiDirectionBadge operator={targetOperator} />
          </div>
        </SheetHeader>

        <div className="space-y-5 px-6 py-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs text-muted-foreground">Meta</p>
              <p className="text-lg font-semibold">
                {kpi.target_label ||
                  (kpi.target_value == null
                    ? 'Informativo'
                    : formatKpiValue(kpi.target_value, formatKind, kpi.decimal_places, kpi.unit_label))}
              </p>
            </div>
            <div className="flex gap-2">
              {canEdit && !editing && (
                <Button variant="outline" size="sm" onClick={startEdit}>
                  <Pencil className="h-4 w-4" />
                  Editar
                </Button>
              )}
              {canArchive && (
                <Button variant="ghost" size="sm" onClick={() => setConfirmArchive(true)}>
                  <Archive className="h-4 w-4" />
                  Arquivar
                </Button>
              )}
            </div>
          </div>

          {editing && (
            <div className="rounded-lg border bg-muted/20 p-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1.5 sm:col-span-2">
                  <Label htmlFor="kpi-detail-name">Nome</Label>
                  <Input id="kpi-detail-name" value={name} onChange={(event) => setName(event.target.value)} />
                </div>
                <div className="space-y-1.5 sm:col-span-2">
                  <Label htmlFor="kpi-detail-description">Descrição</Label>
                  <Textarea
                    id="kpi-detail-description"
                    value={description}
                    onChange={(event) => setDescription(event.target.value)}
                    rows={3}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="kpi-detail-target">Meta</Label>
                  <Input
                    id="kpi-detail-target"
                    type="number"
                    value={targetValue}
                    onChange={(event) => setTargetValue(event.target.value)}
                    disabled={targetOperator === 'informational'}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="kpi-detail-target-label">Rótulo da meta</Label>
                  <Input
                    id="kpi-detail-target-label"
                    value={targetLabel}
                    onChange={(event) => setTargetLabel(event.target.value)}
                  />
                </div>
              </div>
              <div className="mt-3 flex justify-end gap-2">
                <Button variant="ghost" size="sm" onClick={() => setEditing(false)}>
                  <X className="h-4 w-4" />
                  Cancelar
                </Button>
                <Button size="sm" onClick={saveEdit} disabled={updateKpi.isPending}>
                  <Save className="h-4 w-4" />
                  Salvar
                </Button>
              </div>
            </div>
          )}

          {confirmArchive && (
            <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4">
              <p className="text-sm font-medium text-destructive">Arquivar este KPI?</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Ele deixará de aparecer na listagem principal, mas o histórico será preservado.
              </p>
              <div className="mt-3 flex justify-end gap-2">
                <Button variant="outline" size="sm" onClick={() => setConfirmArchive(false)}>
                  Cancelar
                </Button>
                <Button variant="destructive" size="sm" onClick={handleArchive} disabled={archiveKpi.isPending}>
                  Arquivar
                </Button>
              </div>
            </div>
          )}

          <KpiHistoryChart
            values={values}
            targetValue={kpi.target_value}
            targetOperator={targetOperator}
            formatKind={formatKind}
            decimalPlaces={kpi.decimal_places}
            unitLabel={kpi.unit_label}
          />

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <SummaryCard
              label="Valor atual"
              value={formatKind === 'text' ? latest?.value_text || '—' : formatKpiValue(latest?.value, formatKind, kpi.decimal_places, kpi.unit_label)}
            />
            <SummaryCard
              label="Variação"
              value={delta == null ? '—' : `${delta.absolute > 0 ? '+' : ''}${delta.absolute.toLocaleString('pt-BR', { maximumFractionDigits: 2 })}`}
            />
            <SummaryCard label="Semanas fora" value={offTrackCount} />
            <SummaryCard
              label="Melhor / pior"
              value={`${best?.iso_week ? `S${best.iso_week}` : '—'} / ${worst?.iso_week ? `S${worst.iso_week}` : '—'}`}
            />
          </div>

          <div className="border-t pt-5">
            <KpiActionPlanSection
              kpiId={detailKpi.id}
              currentProfile={currentProfile}
              canEdit={canEdit}
            />
          </div>

          <div className="border-t pt-5">
            <KpiOffenderSection
              kpiId={detailKpi.id}
              currentProfile={currentProfile}
              canEdit={canEdit}
              formatKind={formatKind}
              decimalPlaces={kpi.decimal_places}
              unitLabel={kpi.unit_label}
            />
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
