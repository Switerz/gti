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
import { useCategories } from '@/hooks/useCategories'
import { useCreateTask } from '@/hooks/useCreateTask'
import { useProfiles } from '@/hooks/useProfiles'
import { useProjects } from '@/hooks/useProjects'
import { useTaskStatuses } from '@/hooks/useTaskStatuses'
import { getCreateTaskDefaults } from '@/features/tasks/task-payload'
import { fromOptionalSelectValue, SELECT_NONE_VALUE, toSelectValue } from '@/lib/select-values'
import { taskFormSchema, type TaskFormValues } from '@/schemas/task.schema'
import type { Profile } from '@/types/domain'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  currentProfile: Profile
}

const PRIORITY_OPTIONS = [
  { value: 'low', label: 'Baixa' },
  { value: 'medium', label: 'Média' },
  { value: 'high', label: 'Alta' },
  { value: 'urgent', label: 'Urgente' },
]

export function TaskCreateDrawer({ open, onOpenChange, currentProfile }: Props) {
  const { data: statuses = [] } = useTaskStatuses()
  const { data: categories = [] } = useCategories()
  const { data: projects = [] } = useProjects()
  const { data: profiles = [] } = useProfiles()
  const createTask = useCreateTask(currentProfile.id)

  const form = useForm<TaskFormValues>({
    resolver: zodResolver(taskFormSchema) as Resolver<TaskFormValues>,
    defaultValues: getCreateTaskDefaults(currentProfile.id, statuses),
  })

  const statusId = useWatch({ control: form.control, name: 'statusId' })
  const priority = useWatch({ control: form.control, name: 'priority' })
  const ownerId = useWatch({ control: form.control, name: 'ownerId' })
  const categoryId = useWatch({ control: form.control, name: 'categoryId' })
  const projectId = useWatch({ control: form.control, name: 'projectId' })
  const assigneeIds = useWatch({ control: form.control, name: 'assigneeIds' }) ?? []

  useEffect(() => {
    if (!statusId && statuses.length > 0) {
      form.setValue('statusId', getCreateTaskDefaults(currentProfile.id, statuses).statusId)
    }
  }, [currentProfile.id, form, statusId, statuses])

  function toggleAssignee(profileId: string) {
    const current = form.getValues('assigneeIds') ?? []
    if (current.includes(profileId)) {
      form.setValue('assigneeIds', current.filter((id) => id !== profileId))
    } else {
      form.setValue('assigneeIds', [...current, profileId])
    }
  }

  async function onSubmit(values: TaskFormValues) {
    await createTask.mutateAsync(values)
    form.reset(getCreateTaskDefaults(currentProfile.id, statuses))
    onOpenChange(false)
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full max-w-lg p-0">
        <SheetHeader className="border-b px-6 py-4">
          <SheetTitle>Nova tarefa</SheetTitle>
          <SheetDescription>Preencha os dados e clique em criar.</SheetDescription>
        </SheetHeader>

        <ScrollArea className="h-[calc(100vh-8rem)]">
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5 px-6 py-5">
            {/* Title */}
            <div className="space-y-1.5">
              <Label htmlFor="title">
                Título <span className="text-destructive">*</span>
              </Label>
              <Input
                id="title"
                placeholder="Nome da tarefa..."
                {...form.register('title')}
              />
              {form.formState.errors.title && (
                <p className="text-xs text-destructive">{form.formState.errors.title.message}</p>
              )}
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <Label htmlFor="description">Descrição</Label>
              <Textarea
                id="description"
                placeholder="Detalhes, contexto, links..."
                rows={3}
                {...form.register('description')}
              />
            </div>

            {/* Status + Priority */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Status</Label>
                <Select
                  value={statusId}
                  onValueChange={(v) => form.setValue('statusId', v)}
                >
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
              <Select
                value={ownerId}
                onValueChange={(v) => form.setValue('ownerId', v)}
              >
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

            {/* Assignees */}
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
                  onValueChange={(v) => form.setValue('categoryId', fromOptionalSelectValue(v) || undefined)}
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
                  onValueChange={(v) => form.setValue('projectId', fromOptionalSelectValue(v) || undefined)}
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
                <Label htmlFor="startDate">Início</Label>
                <Input id="startDate" type="date" {...form.register('startDate')} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="dueDate">Prazo</Label>
                <Input id="dueDate" type="date" {...form.register('dueDate')} />
              </div>
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
              <Button type="submit" className="flex-1" disabled={createTask.isPending}>
                {createTask.isPending ? 'Criando...' : 'Criar tarefa'}
              </Button>
            </div>
          </form>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  )
}
