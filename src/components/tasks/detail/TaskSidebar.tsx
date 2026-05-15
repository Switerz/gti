import { useState } from 'react'

import { Archive, Lock, Users } from 'lucide-react'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import {
  buildAdditionalAssigneeIdsForOwnerChange,
  getAdditionalAssigneeIds,
  toggleAssigneeId,
} from '@/features/tasks/task-assignees'
import { useArchiveTask } from '@/hooks/useArchiveTask'
import { useCategories } from '@/hooks/useCategories'
import { useProfiles } from '@/hooks/useProfiles'
import { useProjects } from '@/hooks/useProjects'
import { useTaskStatuses } from '@/hooks/useTaskStatuses'
import { useUpdateTask } from '@/hooks/useUpdateTask'
import { formatDateTime } from '@/lib/dates'
import { canArchiveTask, canEditTask } from '@/lib/permissions'
import { fromOptionalSelectValue, SELECT_NONE_VALUE, toSelectValue } from '@/lib/select-values'
import type { Profile, TaskFormValues, TaskWithRelations } from '@/types/domain'

interface Props {
  task: TaskWithRelations
  currentProfile: Profile
  onArchived: () => void
}

const PRIORITY_OPTIONS = [
  { value: 'low', label: 'Baixa' },
  { value: 'medium', label: 'Média' },
  { value: 'high', label: 'Alta' },
  { value: 'urgent', label: 'Urgente' },
]

function SidebarField({
  label,
  children,
  isLoading = false,
}: {
  label: string
  children: React.ReactNode
  isLoading?: boolean
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-medium text-muted-foreground">{label}</Label>
      {isLoading ? <Skeleton className="h-8 w-full" /> : children}
    </div>
  )
}

export function TaskSidebar({ task, currentProfile, onArchived }: Props) {
  const { data: statuses = [], isLoading: statusesLoading } = useTaskStatuses()
  const { data: categories = [], isLoading: categoriesLoading } = useCategories()
  const { data: projects = [], isLoading: projectsLoading } = useProjects()
  const { data: profiles = [], isLoading: profilesLoading } = useProfiles()
  const isRefDataLoading = statusesLoading || categoriesLoading || projectsLoading || profilesLoading
  const updateTask = useUpdateTask(currentProfile.id)
  const archiveTask = useArchiveTask(currentProfile.id)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const additionalAssigneeIds = getAdditionalAssigneeIds(task)

  const canEdit = canEditTask(currentProfile, task)
  const canArchive = canArchiveTask(currentProfile, task)

  function update(values: Partial<TaskFormValues>) {
    if (!canEdit) return
    updateTask.mutate({ id: task.id, values })
  }

  async function handleArchive() {
    await archiveTask.mutateAsync(task.id)
    setConfirmOpen(false)
    onArchived()
  }

  function handleOwnerChange(ownerId: string) {
    update({
      ownerId,
      assigneeIds: buildAdditionalAssigneeIdsForOwnerChange(task, ownerId),
    })
  }

  function handleAdditionalAssigneeToggle(profileId: string) {
    update({
      ownerId: task.owner_id ?? currentProfile.id,
      assigneeIds: toggleAssigneeId(additionalAssigneeIds, profileId),
    })
  }

  const initials = (name?: string | null) =>
    name
      ?.split(' ')
      .slice(0, 2)
      .map((n) => n[0])
      .join('')
      .toUpperCase() ?? '?'

  return (
    <aside className="space-y-4 rounded-xl border bg-card p-4">
      {/* Readonly notice */}
      {!canEdit && (
        <div className="flex items-center gap-2 rounded-lg border border-muted bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
          <Lock className="h-3.5 w-3.5 shrink-0" />
          Visualização apenas. Você não tem permissão para editar esta tarefa.
        </div>
      )}

      <SidebarField label="Status" isLoading={isRefDataLoading}>
        <Select
          value={task.status_id}
          onValueChange={(v) => update({ statusId: v })}
          disabled={!canEdit || updateTask.isPending}
        >
          <SelectTrigger className="h-8 text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {statuses
              .filter((s) => s.slug !== 'archived')
              .map((s) => (
                <SelectItem key={s.id} value={s.id}>
                  {s.name}
                </SelectItem>
              ))}
          </SelectContent>
        </Select>
      </SidebarField>

      <SidebarField label="Prioridade" isLoading={isRefDataLoading}>
        <Select
          value={task.priority}
          onValueChange={(v) => update({ priority: v as TaskFormValues['priority'] })}
          disabled={!canEdit || updateTask.isPending}
        >
          <SelectTrigger className="h-8 text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {PRIORITY_OPTIONS.map((p) => (
              <SelectItem key={p.value} value={p.value}>
                {p.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </SidebarField>

      <SidebarField label="Responsável principal" isLoading={isRefDataLoading}>
        <Select
          value={task.owner_id ?? ''}
          onValueChange={handleOwnerChange}
          disabled={!canEdit || updateTask.isPending}
        >
          <SelectTrigger className="h-8 text-sm">
            <SelectValue placeholder="Sem responsável" />
          </SelectTrigger>
          <SelectContent>
            {profiles.map((p) => (
              <SelectItem key={p.id} value={p.id}>
                {p.full_name ?? p.email}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </SidebarField>

      <SidebarField label="Responsáveis adicionais" isLoading={isRefDataLoading}>
        <div className="space-y-2 rounded-md border bg-background/50 p-2">
          {profiles.length === 0 ? (
            <p className="text-xs text-muted-foreground">Nenhum membro disponível.</p>
          ) : (
            profiles.map((profile) => {
              const isOwner = profile.id === task.owner_id
              const isChecked = isOwner || additionalAssigneeIds.includes(profile.id)

              return (
                <label key={profile.id} className="flex items-center gap-2 text-xs">
                  <Checkbox
                    checked={isChecked}
                    disabled={isOwner || !canEdit || updateTask.isPending}
                    onCheckedChange={() => handleAdditionalAssigneeToggle(profile.id)}
                    aria-label={`Alternar responsável ${profile.full_name ?? profile.email}`}
                  />
                  <Avatar className="h-5 w-5">
                    <AvatarImage src={profile.avatar_url ?? undefined} />
                    <AvatarFallback className="text-[9px]">
                      {initials(profile.full_name)}
                    </AvatarFallback>
                  </Avatar>
                  <span className="min-w-0 flex-1 truncate">
                    {profile.full_name ?? profile.email}
                  </span>
                  {isOwner && <span className="text-[10px] text-muted-foreground">principal</span>}
                </label>
              )
            })
          )}
        </div>
        <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
          <Users className="h-3 w-3" />
          O responsável principal sempre fica incluído.
        </div>
      </SidebarField>

      <SidebarField label="Categoria" isLoading={isRefDataLoading}>
        <Select
          value={toSelectValue(task.category_id)}
          onValueChange={(v) => update({ categoryId: fromOptionalSelectValue(v) || undefined })}
          disabled={!canEdit || updateTask.isPending}
        >
          <SelectTrigger className="h-8 text-sm">
            <SelectValue placeholder="Nenhuma" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={SELECT_NONE_VALUE}>Nenhuma</SelectItem>
            {categories.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </SidebarField>

      <SidebarField label="Projeto" isLoading={isRefDataLoading}>
        <Select
          value={toSelectValue(task.project_id)}
          onValueChange={(v) => update({ projectId: fromOptionalSelectValue(v) || undefined })}
          disabled={!canEdit || updateTask.isPending}
        >
          <SelectTrigger className="h-8 text-sm">
            <SelectValue placeholder="Nenhum" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={SELECT_NONE_VALUE}>Nenhum</SelectItem>
            {projects.map((p) => (
              <SelectItem key={p.id} value={p.id}>
                {p.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </SidebarField>

      <div className="grid grid-cols-2 gap-3">
        <SidebarField label="Início">
          <Input
            type="date"
            className="h-8 text-sm"
            defaultValue={task.start_date ?? ''}
            disabled={!canEdit || updateTask.isPending}
            onBlur={(e) => update({ startDate: e.target.value || undefined })}
          />
        </SidebarField>
        <SidebarField label="Prazo">
          <Input
            type="date"
            className="h-8 text-sm"
            defaultValue={task.due_date ?? ''}
            disabled={!canEdit || updateTask.isPending}
            onBlur={(e) => update({ dueDate: e.target.value || undefined })}
          />
        </SidebarField>
      </div>

      <Separator />

      <div className="space-y-1 text-xs text-muted-foreground">
        <p>
          Criado por{' '}
          <span className="font-medium text-foreground">
            {task.creator?.full_name ?? 'Desconhecido'}
          </span>
        </p>
        <p>{formatDateTime(task.created_at)}</p>
      </div>

      <Separator />

      <Button
        variant="outline"
        size="sm"
        className="w-full text-destructive hover:bg-destructive/10 hover:text-destructive"
        onClick={() => setConfirmOpen(true)}
        disabled={task.is_archived || !canArchive}
        aria-label="Arquivar tarefa"
      >
        <Archive className="mr-2 h-3.5 w-3.5" />
        {task.is_archived ? 'Já arquivada' : 'Arquivar tarefa'}
      </Button>

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Arquivar tarefa?</DialogTitle>
            <DialogDescription>
              A tarefa será removida dos boards e listas. Essa ação pode ser revertida pelo
              administrador.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmOpen(false)}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={handleArchive}
              disabled={archiveTask.isPending}
            >
              {archiveTask.isPending ? 'Arquivando...' : 'Arquivar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </aside>
  )
}
