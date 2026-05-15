import { useState } from 'react'

import { ArrowLeft, Pencil } from 'lucide-react'
import { Link, useNavigate, useParams } from 'react-router-dom'

import { TaskActivityLog } from '@/components/tasks/detail/TaskActivityLog'
import { TaskChecklist } from '@/components/tasks/detail/TaskChecklist'
import { TaskComments } from '@/components/tasks/detail/TaskComments'
import { TaskSidebar } from '@/components/tasks/detail/TaskSidebar'
import { TaskPriorityBadge } from '@/components/tasks/TaskPriorityBadge'
import { TaskStatusBadge } from '@/components/tasks/TaskStatusBadge'
import { ErrorState } from '@/components/shared/ErrorState'
import { LoadingState } from '@/components/shared/LoadingState'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Textarea } from '@/components/ui/textarea'
import { useCurrentProfile } from '@/hooks/useCurrentProfile'
import { useTask } from '@/hooks/useTask'
import { useUpdateTask } from '@/hooks/useUpdateTask'
import { canEditTask } from '@/lib/permissions'
import type { TaskPriority } from '@/types/domain'

export function TaskDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { data: currentProfile } = useCurrentProfile()
  const { data: task, isLoading, isError } = useTask(id)
  const updateTask = useUpdateTask(currentProfile?.id ?? '')

  // Inline title editing
  const [editingTitle, setEditingTitle] = useState(false)
  const [titleDraft, setTitleDraft] = useState('')

  // Inline description editing
  const [editingDesc, setEditingDesc] = useState(false)
  const [descDraft, setDescDraft] = useState('')

  const canEdit = !!(task && currentProfile && canEditTask(currentProfile, task))

  function startEditTitle() {
    if (!task || !canEdit) return
    setTitleDraft(task.title)
    setEditingTitle(true)
  }

  function saveTitle() {
    if (task && titleDraft.trim() && titleDraft.trim() !== task.title) {
      updateTask.mutate({ id: task.id, values: { title: titleDraft.trim() } })
    }
    setEditingTitle(false)
  }

  function startEditDesc() {
    if (!task || !canEdit) return
    setDescDraft(task.description ?? '')
    setEditingDesc(true)
  }

  function saveDesc() {
    if (task) {
      const next = descDraft.trim() || undefined
      if (next !== (task.description ?? undefined)) {
        updateTask.mutate({ id: task.id, values: { description: next } })
      }
    }
    setEditingDesc(false)
  }

  if (isLoading) return <LoadingState />
  if (isError || !task) return <ErrorState title="Tarefa não encontrada." description="Verifique o link ou volte à lista." />

  return (
    <div className="space-y-6">
      {/* Back navigation */}
      <Link
        to="/tasks"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Tarefas
      </Link>

      {/* Title row */}
      <div className="space-y-2">
        {editingTitle ? (
          <input
            autoFocus
            value={titleDraft}
            onChange={(e) => setTitleDraft(e.target.value)}
            onBlur={saveTitle}
            onKeyDown={(e) => {
              if (e.key === 'Enter') saveTitle()
              if (e.key === 'Escape') { setTitleDraft(task.title); setEditingTitle(false) }
            }}
            className="w-full rounded border-0 bg-transparent p-0 text-2xl font-bold outline-none ring-0 focus:ring-1 focus:ring-primary/30"
          />
        ) : (
          <div className="group flex items-start gap-2">
            <h1 className="text-2xl font-bold leading-tight">{task.title}</h1>
            {canEdit && (
              <button
                onClick={startEditTitle}
                className="invisible mt-1.5 shrink-0 text-muted-foreground hover:text-foreground group-hover:visible"
                aria-label="Editar título"
              >
                <Pencil className="h-4 w-4" />
              </button>
            )}
          </div>
        )}

        {/* Status + priority badges */}
        <div className="flex flex-wrap items-center gap-2">
          <TaskStatusBadge name={task.status?.name ?? ''} color={task.status?.color} />
          <TaskPriorityBadge priority={task.priority as TaskPriority} />
          {task.project && (
            <span className="text-xs text-muted-foreground">{task.project.name}</span>
          )}
        </div>
      </div>

      {/* Two-column layout */}
      <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
        {/* ── Main content ── */}
        <div className="space-y-8">
          {/* Description */}
          <section className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold">Descrição</h3>
              {canEdit && !editingDesc && (
                <Button variant="ghost" size="sm" onClick={startEditDesc}>
                  <Pencil className="mr-1 h-3 w-3" />
                  Editar
                </Button>
              )}
            </div>

            {editingDesc ? (
              <div className="space-y-2">
                <Textarea
                  autoFocus
                  rows={5}
                  value={descDraft}
                  onChange={(e) => setDescDraft(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Escape') { setDescDraft(task.description ?? ''); setEditingDesc(false) }
                  }}
                  placeholder="Adicione uma descrição..."
                />
                <div className="flex gap-2">
                  <Button size="sm" onClick={saveDesc} disabled={updateTask.isPending}>
                    Salvar
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => { setDescDraft(task.description ?? ''); setEditingDesc(false) }}
                  >
                    Cancelar
                  </Button>
                </div>
              </div>
            ) : task.description ? (
              <p className="whitespace-pre-wrap text-sm text-foreground">{task.description}</p>
            ) : (
              <p className="text-sm text-muted-foreground italic">Sem descrição. Clique em Editar para adicionar.</p>
            )}
          </section>

          <Separator />

          {/* Checklist */}
          {currentProfile && <TaskChecklist taskId={task.id} currentProfileId={currentProfile.id} />}

          <Separator />

          {/* Comments */}
          {currentProfile && <TaskComments taskId={task.id} currentProfile={currentProfile} />}

          <Separator />

          {/* Activity */}
          <TaskActivityLog taskId={task.id} />
        </div>

        {/* ── Sidebar ── */}
        {currentProfile && (
          <TaskSidebar
            task={task}
            currentProfile={currentProfile}
            onArchived={() => navigate('/tasks')}
          />
        )}
      </div>
    </div>
  )
}
