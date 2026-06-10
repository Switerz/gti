import { useState } from 'react'

import { CalendarDays, Pencil, Plus, Save, Trash2, X } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import type { KpiActionPlan, KpiActionPlanStatus, Profile } from '@/types/domain'

import {
  useCreateKpiActionPlan,
  useDeleteKpiActionPlan,
  useKpiActionPlans,
  useUpdateKpiActionPlan,
} from '../hooks/useKpiActionPlans'

const STATUS_CONFIG: Record<KpiActionPlanStatus, { label: string; className: string }> = {
  not_started: { label: 'Não iniciado', className: 'bg-slate-100 text-slate-600' },
  in_progress: { label: 'Em andamento', className: 'bg-blue-100 text-blue-700' },
  blocked: { label: 'Bloqueado', className: 'bg-red-100 text-red-700' },
  done: { label: 'Concluído', className: 'bg-green-100 text-green-700' },
  cancelled: { label: 'Cancelado', className: 'bg-slate-100 text-slate-400 line-through' },
}

function StatusBadge({ status }: { status: KpiActionPlanStatus }) {
  const cfg = STATUS_CONFIG[status]
  return (
    <span className={`inline-flex items-center rounded px-1.5 py-0.5 text-xs font-medium ${cfg.className}`}>
      {cfg.label}
    </span>
  )
}

type PlanFormState = {
  restrictionText: string
  actionText: string
  dueDate: string
  status: KpiActionPlanStatus
}

const EMPTY_FORM: PlanFormState = {
  restrictionText: '',
  actionText: '',
  dueDate: '',
  status: 'in_progress',
}

function PlanForm({
  initial,
  onSave,
  onCancel,
  isPending,
}: {
  initial?: PlanFormState
  onSave: (values: PlanFormState) => void
  onCancel: () => void
  isPending: boolean
}) {
  const [form, setForm] = useState<PlanFormState>(initial ?? EMPTY_FORM)

  function set(key: keyof PlanFormState, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  function handleSave() {
    if (!form.restrictionText.trim() && !form.actionText.trim()) {
      toast.error('Informe a restrição ou a ação.')
      return
    }
    onSave(form)
  }

  return (
    <div className="rounded-lg border bg-muted/20 p-3 space-y-3">
      <div className="space-y-1.5">
        <Label className="text-xs">Restrição</Label>
        <Textarea
          rows={2}
          placeholder="Descreva o problema ou restrição..."
          value={form.restrictionText}
          onChange={(e) => set('restrictionText', e.target.value)}
        />
      </div>
      <div className="space-y-1.5">
        <Label className="text-xs">Ação</Label>
        <Textarea
          rows={2}
          placeholder="Descreva a ação a ser tomada..."
          value={form.actionText}
          onChange={(e) => set('actionText', e.target.value)}
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label className="text-xs">Prazo</Label>
          <Input
            type="date"
            value={form.dueDate}
            onChange={(e) => set('dueDate', e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Status</Label>
          <Select value={form.status} onValueChange={(v) => set('status', v as KpiActionPlanStatus)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {(Object.keys(STATUS_CONFIG) as KpiActionPlanStatus[]).map((s) => (
                <SelectItem key={s} value={s}>
                  {STATUS_CONFIG[s].label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
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

function PlanRow({
  plan,
  canEdit,
  actorId,
  kpiId,
}: {
  plan: KpiActionPlan
  canEdit: boolean
  actorId: string
  kpiId: string
}) {
  const [editing, setEditing] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const update = useUpdateKpiActionPlan(actorId)
  const remove = useDeleteKpiActionPlan()

  const status = plan.status as KpiActionPlanStatus

  async function handleUpdate(values: PlanFormState) {
    await update.mutateAsync({
      id: plan.id,
      kpiId,
      values: {
        restrictionText: values.restrictionText,
        actionText: values.actionText,
        dueDate: values.dueDate || undefined,
        status: values.status,
      },
    })
    setEditing(false)
  }

  async function handleDelete() {
    await remove.mutateAsync(plan.id)
  }

  if (editing) {
    return (
      <PlanForm
        initial={{
          restrictionText: plan.restriction_text ?? '',
          actionText: plan.action_text ?? '',
          dueDate: plan.due_date ?? '',
          status,
        }}
        onSave={handleUpdate}
        onCancel={() => setEditing(false)}
        isPending={update.isPending}
      />
    )
  }

  return (
    <div className="rounded-lg border bg-card p-3 space-y-2">
      <div className="flex items-start justify-between gap-2">
        <StatusBadge status={status} />
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
      </div>

      {plan.restriction_text && (
        <div>
          <p className="text-xs font-medium text-muted-foreground">Restrição</p>
          <p className="text-sm whitespace-pre-wrap">{plan.restriction_text}</p>
        </div>
      )}
      {plan.action_text && (
        <div>
          <p className="text-xs font-medium text-muted-foreground">Ação</p>
          <p className="text-sm whitespace-pre-wrap">{plan.action_text}</p>
        </div>
      )}
      {plan.due_date && (
        <p className="flex items-center gap-1 text-xs text-muted-foreground">
          <CalendarDays className="h-3.5 w-3.5" />
          {new Date(plan.due_date + 'T12:00:00').toLocaleDateString('pt-BR')}
        </p>
      )}

      {confirmDelete && (
        <div className="rounded border border-destructive/30 bg-destructive/5 p-2 text-sm">
          <p className="font-medium text-destructive">Remover este plano?</p>
          <div className="mt-2 flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setConfirmDelete(false)}>
              Cancelar
            </Button>
            <Button variant="destructive" size="sm" onClick={handleDelete} disabled={remove.isPending}>
              Remover
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

export function KpiActionPlanSection({
  kpiId,
  currentProfile,
  canEdit,
}: {
  kpiId: string
  currentProfile: Profile | null | undefined
  canEdit: boolean
}) {
  const [adding, setAdding] = useState(false)
  const { data: plans = [], isLoading } = useKpiActionPlans(kpiId)
  const create = useCreateKpiActionPlan(currentProfile?.id ?? '')

  const openCount = plans.filter((p) => p.status !== 'done' && p.status !== 'cancelled').length

  async function handleCreate(values: PlanFormState) {
    await create.mutateAsync({
      kpiId,
      restrictionText: values.restrictionText,
      actionText: values.actionText,
      dueDate: values.dueDate || undefined,
      status: values.status,
      position: plans.length,
    })
    setAdding(false)
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold">Planos de Ação</h3>
          {openCount > 0 && (
            <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700">
              {openCount} aberto{openCount !== 1 ? 's' : ''}
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
        <PlanForm
          onSave={handleCreate}
          onCancel={() => setAdding(false)}
          isPending={create.isPending}
        />
      )}

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Carregando...</p>
      ) : plans.length === 0 && !adding ? (
        <p className="text-sm text-muted-foreground">Nenhum plano de ação cadastrado.</p>
      ) : (
        <div className="space-y-2">
          {plans.map((plan) => (
            <PlanRow
              key={plan.id}
              plan={plan}
              canEdit={canEdit}
              actorId={currentProfile?.id ?? ''}
              kpiId={kpiId}
            />
          ))}
        </div>
      )}
    </div>
  )
}
