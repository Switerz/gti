import { useState } from 'react'

import { Pencil, Plus, Save, Trash2, X } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import type { KpiFormatKind, KpiOffender, Profile } from '@/types/domain'

import {
  useCreateKpiOffender,
  useDeleteKpiOffender,
  useKpiOffenders,
  useUpdateKpiOffender,
} from '../hooks/useKpiOffenders'
import { formatKpiValue } from '../kpi-utils'

type OffenderFormState = {
  label: string
  impactValue: string
  impactLabel: string
  description: string
}

const EMPTY_FORM: OffenderFormState = {
  label: '',
  impactValue: '',
  impactLabel: '',
  description: '',
}

function OffenderForm({
  initial,
  formatKind,
  decimalPlaces,
  unitLabel,
  onSave,
  onCancel,
  isPending,
}: {
  initial?: OffenderFormState
  formatKind: KpiFormatKind
  decimalPlaces: number
  unitLabel?: string | null
  onSave: (values: OffenderFormState) => void
  onCancel: () => void
  isPending: boolean
}) {
  const [form, setForm] = useState<OffenderFormState>(initial ?? EMPTY_FORM)

  function set(key: keyof OffenderFormState, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  function handleSave() {
    if (!form.label.trim()) {
      toast.error('Informe o nome do ofensor.')
      return
    }
    if (form.impactValue === '' || isNaN(Number(form.impactValue))) {
      toast.error('Informe um valor de impacto numérico.')
      return
    }
    onSave(form)
  }

  const impactNum = Number(form.impactValue)
  const preview = !isNaN(impactNum) && form.impactValue !== ''
    ? formatKpiValue(impactNum, formatKind, decimalPlaces, unitLabel)
    : null

  return (
    <div className="rounded-lg border bg-muted/20 p-3 space-y-3">
      <div className="space-y-1.5">
        <Label className="text-xs">Ofensor</Label>
        <Input
          placeholder="Ex: Transportadora X"
          value={form.label}
          onChange={(e) => set('label', e.target.value)}
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label className="text-xs">
            Impacto{preview ? ` (${preview})` : ''}
          </Label>
          <Input
            type="number"
            placeholder="0"
            value={form.impactValue}
            onChange={(e) => set('impactValue', e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Rótulo do impacto</Label>
          <Input
            placeholder="Ex: pedidos atrasados"
            value={form.impactLabel}
            onChange={(e) => set('impactLabel', e.target.value)}
          />
        </div>
      </div>
      <div className="space-y-1.5">
        <Label className="text-xs">Descrição (opcional)</Label>
        <Textarea
          rows={2}
          placeholder="Contexto adicional..."
          value={form.description}
          onChange={(e) => set('description', e.target.value)}
        />
      </div>
      <div className="flex justify-end gap-2">
        <Button variant="ghost" size="sm" onClick={onCancel} type="button">
          <X className="h-4 w-4" />
          Cancelar
        </Button>
        <Button size="sm" onClick={handleSave} disabled={isPending} type="button">
          <Save className="h-4 w-4" />
          Salvar
        </Button>
      </div>
    </div>
  )
}

function OffenderRow({
  offender,
  canEdit,
  actorId,
  formatKind,
  decimalPlaces,
  unitLabel,
}: {
  offender: KpiOffender
  canEdit: boolean
  actorId: string
  formatKind: KpiFormatKind
  decimalPlaces: number
  unitLabel?: string | null
}) {
  const [editing, setEditing] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const update = useUpdateKpiOffender(actorId)
  const remove = useDeleteKpiOffender()

  async function handleUpdate(values: OffenderFormState) {
    await update.mutateAsync({
      id: offender.id,
      kpiId: offender.kpi_id ?? '',
      values: {
        label: values.label,
        impactValue: Number(values.impactValue),
        impactLabel: values.impactLabel || undefined,
        description: values.description || undefined,
      },
    })
    setEditing(false)
  }

  if (editing) {
    return (
      <OffenderForm
        initial={{
          label: offender.label,
          impactValue: String(offender.impact_value),
          impactLabel: offender.impact_label ?? '',
          description: offender.description ?? '',
        }}
        formatKind={formatKind}
        decimalPlaces={decimalPlaces}
        unitLabel={unitLabel}
        onSave={handleUpdate}
        onCancel={() => setEditing(false)}
        isPending={update.isPending}
      />
    )
  }

  const formattedImpact = formatKpiValue(offender.impact_value, formatKind, decimalPlaces, unitLabel)

  return (
    <div className="flex items-start justify-between gap-3 rounded-lg border bg-card p-3">
      <div className="min-w-0 space-y-0.5">
        <p className="text-sm font-medium truncate">{offender.label}</p>
        <p className="text-sm text-muted-foreground">
          {formattedImpact}
          {offender.impact_label ? ` ${offender.impact_label}` : ''}
        </p>
        {offender.description && (
          <p className="text-xs text-muted-foreground whitespace-pre-wrap">{offender.description}</p>
        )}
      </div>
      {canEdit && (
        <div className="flex shrink-0 gap-1">
          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setEditing(true)}>
            <Pencil className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 text-destructive hover:text-destructive"
            onClick={() => setConfirmDelete(true)}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      )}
      {confirmDelete && (
        <div className="absolute inset-x-3 rounded border border-destructive/30 bg-destructive/5 p-2 text-sm">
          <p className="font-medium text-destructive">Remover este ofensor?</p>
          <div className="mt-2 flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setConfirmDelete(false)}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => remove.mutate(offender.id)}
              disabled={remove.isPending}
            >
              Remover
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

function OffenderChart({
  offenders,
  formatKind,
  decimalPlaces,
  unitLabel,
}: {
  offenders: KpiOffender[]
  formatKind: KpiFormatKind
  decimalPlaces: number
  unitLabel?: string | null
}) {
  const sorted = [...offenders]
    .filter((o) => o.impact_value > 0)
    .sort((a, b) => b.impact_value - a.impact_value)
    .slice(0, 8)

  if (sorted.length === 0) return null

  const max = sorted[0].impact_value

  return (
    <div className="rounded-lg border bg-card p-3 space-y-2">
      <p className="text-xs font-medium text-muted-foreground">Impacto por ofensor</p>
      <div className="space-y-2">
        {sorted.map((o) => {
          const pct = Math.round((o.impact_value / max) * 100)
          return (
            <div key={o.id} className="space-y-0.5">
              <div className="flex items-center justify-between gap-2 text-xs">
                <span className="truncate font-medium">{o.label}</span>
                <span className="shrink-0 text-muted-foreground">
                  {formatKpiValue(o.impact_value, formatKind, decimalPlaces, unitLabel)}
                </span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-orange-400 transition-all"
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export function KpiOffenderSection({
  kpiId,
  currentProfile,
  canEdit,
  formatKind,
  decimalPlaces,
  unitLabel,
}: {
  kpiId: string
  currentProfile: Profile | null | undefined
  canEdit: boolean
  formatKind: KpiFormatKind
  decimalPlaces: number
  unitLabel?: string | null
}) {
  const [adding, setAdding] = useState(false)
  const { data: offenders = [], isLoading } = useKpiOffenders(kpiId)
  const create = useCreateKpiOffender(currentProfile?.id ?? '')

  async function handleCreate(values: OffenderFormState) {
    await create.mutateAsync({
      kpiId,
      label: values.label,
      impactValue: Number(values.impactValue),
      impactLabel: values.impactLabel || undefined,
      description: values.description || undefined,
      position: offenders.length,
    })
    setAdding(false)
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold">Ofensores</h3>
          {offenders.length > 0 && (
            <span className="rounded-full bg-orange-100 px-2 py-0.5 text-xs font-medium text-orange-700">
              {offenders.length}
            </span>
          )}
        </div>
        {canEdit && !adding && (
          <Button variant="outline" size="sm" onClick={() => setAdding(true)}>
            <Plus className="h-4 w-4" />
            Adicionar
          </Button>
        )}
      </div>

      {adding && (
        <OffenderForm
          formatKind={formatKind}
          decimalPlaces={decimalPlaces}
          unitLabel={unitLabel}
          onSave={handleCreate}
          onCancel={() => setAdding(false)}
          isPending={create.isPending}
        />
      )}

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Carregando...</p>
      ) : offenders.length === 0 && !adding ? (
        <p className="text-sm text-muted-foreground">Nenhum ofensor cadastrado.</p>
      ) : (
        <>
          <div className="space-y-2">
            {offenders.map((offender) => (
              <OffenderRow
                key={offender.id}
                offender={offender}
                canEdit={canEdit}
                actorId={currentProfile?.id ?? ''}
                formatKind={formatKind}
                decimalPlaces={decimalPlaces}
                unitLabel={unitLabel}
              />
            ))}
          </div>
          <OffenderChart
            offenders={offenders}
            formatKind={formatKind}
            decimalPlaces={decimalPlaces}
            unitLabel={unitLabel}
          />
        </>
      )}
    </div>
  )
}
