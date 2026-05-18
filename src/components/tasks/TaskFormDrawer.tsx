import { useEffect } from 'react'

import { zodResolver } from '@hookform/resolvers/zod'
import { type Resolver, useForm, useWatch } from 'react-hook-form'

import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Textarea } from '@/components/ui/textarea'
import { buildDuplicateTaskDefaults, buildEditTaskDefaults, getCreateTaskDefaults } from '@/features/tasks/task-payload'
import { RECURRENCE_LABELS } from '@/features/tasks/recurrence'
import { useCategories } from '@/hooks/useCategories'
import { useCreateTask } from '@/hooks/useCreateTask'
import { useProfiles } from '@/hooks/useProfiles'
import { useProjects } from '@/hooks/useProjects'
import { useTaskStatuses } from '@/hooks/useTaskStatuses'
import { useUpdateTask } from '@/hooks/useUpdateTask'
import { fromOptionalSelectValue, SELECT_NONE_VALUE, toSelectValue } from '@/lib/select-values'
import { taskFormSchema, type TaskFormValues } from '@/schemas/task.schema'
import type { Profile, TaskWithRelations } from '@/types/domain'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  currentProfile: Profile
  task?: TaskWithRelations
  duplicateFrom?: TaskWithRelations
  defaultProjectId?: string
}

const PRIORITY_OPTIONS = [
  { value: 'low', label: 'Baixa' },
  { value: 'medium', label: 'Média' },
  { value: 'high', label: 'Alta' },
  { value: 'urgent', label: 'Urgente' },
]

export function TaskFormDrawer({
  open,
  onOpenChange,
  currentProfile,
  task,
  duplicateFrom,
  defaultProjectId,
}: Props) {
  const isEdit = !!task && !duplicateFrom

  const { data: statuses = [] } = useTaskStatuses()
  const { data: categories = [] } = useCategories()
  const { data: projects = [] } = useProjects()
  const { data: profiles = [] } = useProfiles()
  const createTask = useCreateTask(currentProfile.id)
  const updateTask = useUpdateTask(currentProfile.id)

  const form = useForm<TaskFormValues>({
    resolver: zodResolver(taskFormSchema) as Resolver<TaskFormValues>,
    defaultValues: duplicateFrom
      ? buildDuplicateTaskDefaults(duplicateFrom)
      : isEdit
        ? buildEditTaskDefaults(task)
        : { ...getCreateTaskDefaults(currentProfile.id, statuses), projectId: defaultProjectId ?? '' },
  })

  // Edit mode: re-populate form when the task changes
  useEffect(() => {
    if (task && !duplicateFrom) form.reset(buildEditTaskDefaults(task))
  }, [task?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  // Duplicate mode: re-populate when duplicateFrom changes
  useEffect(() => {
    if (duplicateFrom) form.reset(buildDuplicateTaskDefaults(duplicateFrom))
  }, [duplicateFrom?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  const statusId = useWatch({ control: form.control, name: 'statusId' })
  const priority = useWatch({ control: form.control, name: 'priority' })
  const ownerId = useWatch({ control: form.control, name: 'ownerId' })
  const categoryId = useWatch({ control: form.control, name: 'categoryId' })
  const projectId = useWatch({ control: form.control, name: 'projectId' })
  const assigneeIds = useWatch({ control: form.control, name: 'assigneeIds' }) ?? []
  const recurrenceType = useWatch({ control: form.control, name: 'recurrenceType' }) ?? 'none'

  // Create mode: fill default status once statuses load
  useEffect(() => {
    if (!isEdit && !statusId && statuses.length > 0) {
      form.setValue('statusId', getCreateTaskDefaults(currentProfile.id, statuses).statusId)
    }
  }, [currentProfile.id, form, isEdit, statusId, statuses])

  function toggleAssignee(profileId: string) {
    const current = form.getValues('assigneeIds') ?? []
    form.setValue(
      'assigneeIds',
      current.includes(profileId) ? current.filter((id) => id !== profileId) : [...current, profileId],
    )
  }

  async function onSubmit(values: TaskFormValues) {
    if (isEdit) {
      await updateTask.mutateAsync({ id: task.id, values })
    } else {
      await createTask.mutateAsync(values)
      form.reset({
        ...getCreateTaskDefaults(currentProfile.id, statuses),
        projectId: defaultProjectId ?? '',
        recurrenceType: 'none',
      })
    }
    onOpenChange(false)
  }

  const isPending = isEdit ? updateTask.isPending : createTask.isPending

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full max-w-lg p-0">
        <SheetHeader className="border-b px-6 py-4">
          <SheetTitle>
            {isEdit ? 'Editar tarefa' : duplicateFrom ? 'Duplicar tarefa' : 'Nova tarefa'}
          </SheetTitle>
          <SheetDescription>
            {isEdit
              ? 'Altere os campos e clique em salvar.'
              : duplicateFrom
                ? 'Revise os campos e clique em criar.'
                : 'Preencha os dados e clique em criar.'}
          </SheetDescription>
        </SheetHeader>

        <ScrollArea className="h-[calc(100vh-8rem)]">
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5 px-6 py-5">
            {/* Title */}
            <div className="space-y-1.5">
              <Label htmlFor="task-title">
                Título <span className="text-destructive">*</span>
              </Label>
              <Input
                id="task-title"
                placeholder="Nome da tarefa..."
                {...form.register('title')}
              />
              {form.formState.errors.title && (
                <p className="text-xs text-destructive">{form.formState.errors.title.message}</p>
              )}
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <Label htmlFor="task-description">Descrição</Label>
              <Textarea
                id="task-description"
                placeholder="Detalhes, contexto, links..."
                rows={3}
                {...form.register('description')}
              />
            </div>

            {/* Status + Priority */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Status</Label>
                <Select value={statusId} onValueChange={(v) => form.setValue('statusId', v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione..." />
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
              </div>

              <div className="space-y-1.5">
                <Label>Prioridade</Label>
                <Select
                  value={priority}
                  onValueChange={(v) => form.setValue('priority', v as TaskFormValues['priority'])}
                >
                  <SelectTrigger>
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
              </div>
            </div>

            {/* Owner */}
            <div className="space-y-1.5">
              <Label>Responsável principal</Label>
              <Select value={ownerId ?? ''} onValueChange={(v) => form.setValue('ownerId', v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent>
                  {profiles.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.full_name ?? p.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Additional assignees */}
            {profiles.length > 1 && (
              <div className="space-y-2">
                <Label>Outros responsáveis</Label>
                <div className="rounded-md border p-3 space-y-2">
                  {profiles
                    .filter((p) => p.id !== ownerId)
                    .map((p) => (
                      <label key={p.id} className="flex items-center gap-2 cursor-pointer">
                        <Checkbox
                          checked={assigneeIds.includes(p.id)}
                          onCheckedChange={() => toggleAssignee(p.id)}
                        />
                        <span className="text-sm">{p.full_name ?? p.email}</span>
                      </label>
                    ))}
                </div>
              </div>
            )}

            {/* Category + Project */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Categoria</Label>
                <Select
                  value={toSelectValue(categoryId)}
                  onValueChange={(v) =>
                    form.setValue('categoryId', fromOptionalSelectValue(v) || undefined)
                  }
                >
                  <SelectTrigger>
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
              </div>

              <div className="space-y-1.5">
                <Label>Projeto</Label>
                <Select
                  value={toSelectValue(projectId)}
                  onValueChange={(v) =>
                    form.setValue('projectId', fromOptionalSelectValue(v) || undefined)
                  }
                >
                  <SelectTrigger>
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
              </div>
            </div>

            {/* Dates */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="task-startDate">Início</Label>
                <Input id="task-startDate" type="date" {...form.register('startDate')} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="task-dueDate">Prazo</Label>
                <Input id="task-dueDate" type="date" {...form.register('dueDate')} />
              </div>
            </div>

            {/* Recurrence */}
            <div className="space-y-1.5">
              <Label>Recorrência</Label>
              <Select
                value={recurrenceType}
                onValueChange={(v) =>
                  form.setValue('recurrenceType', v as TaskFormValues['recurrenceType'])
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.entries(RECURRENCE_LABELS) as [TaskFormValues['recurrenceType'], string][]).map(
                    ([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ),
                  )}
                </SelectContent>
              </Select>
            </div>

            {/* Actions */}
            <div className="flex gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => onOpenChange(false)}
              >
                Cancelar
              </Button>
              <Button type="submit" className="flex-1" disabled={isPending}>
                {isPending
                  ? isEdit
                    ? 'Salvando...'
                    : 'Criando...'
                  : isEdit
                    ? 'Salvar alterações'
                    : 'Criar tarefa'}
              </Button>
            </div>
          </form>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  )
}
