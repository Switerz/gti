import { useState } from 'react'

import { ArrowLeft, Pencil, Plus } from 'lucide-react'
import { Link, useParams } from 'react-router-dom'

import { KanbanBoard } from '@/components/kanban/KanbanBoard'
import { ErrorState } from '@/components/shared/ErrorState'
import { LoadingState } from '@/components/shared/LoadingState'
import { TaskCreateDrawer } from '@/components/tasks/TaskCreateDrawer'
import { TaskEditDrawer } from '@/components/tasks/TaskEditDrawer'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { useCurrentProfile } from '@/hooks/useCurrentProfile'
import { useProject } from '@/hooks/useProject'
import { useTaskStatuses } from '@/hooks/useTaskStatuses'
import { useTasks } from '@/hooks/useTasks'
import { useUpdateProject } from '@/hooks/useUpdateProject'
import { formatDateTime } from '@/lib/dates'
import { canEditTask, canManageProjects } from '@/lib/permissions'
import type { TaskWithRelations } from '@/types/domain'

export function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { data: currentProfile } = useCurrentProfile()
  const { data: project, isLoading, isError } = useProject(id)
  const { data: statuses = [] } = useTaskStatuses()
  const { data: tasks = [], isLoading: tasksLoading } = useTasks({ projectId: id })
  const updateProject = useUpdateProject()

  const [drawerOpen, setDrawerOpen] = useState(false)
  const [editingTask, setEditingTask] = useState<TaskWithRelations | null>(null)

  const [editingName, setEditingName] = useState(false)
  const [nameDraft, setNameDraft] = useState('')
  const [editingDesc, setEditingDesc] = useState(false)
  const [descDraft, setDescDraft] = useState('')

  const canManage = canManageProjects(currentProfile)

  function handleTaskEdit(task: TaskWithRelations) {
    if (!currentProfile || !canEditTask(currentProfile, task)) return
    setEditingTask(task)
  }

  function startEditName() {
    if (!project || !canManage) return
    setNameDraft(project.name)
    setEditingName(true)
  }

  function saveName() {
    if (project && nameDraft.trim() && nameDraft.trim() !== project.name) {
      updateProject.mutate({ id: project.id, values: { name: nameDraft.trim() } })
    }
    setEditingName(false)
  }

  function startEditDesc() {
    if (!project || !canManage) return
    setDescDraft(project.description ?? '')
    setEditingDesc(true)
  }

  function saveDesc() {
    if (project) {
      const next = descDraft.trim() || null
      if (next !== (project.description ?? null)) {
        updateProject.mutate({ id: project.id, values: { description: next } })
      }
    }
    setEditingDesc(false)
  }

  const activeTasks = tasks.filter((t) => !t.is_archived)
  const doneTasks = activeTasks.filter((t) => t.status?.is_final)
  const openTasks = activeTasks.filter((t) => !t.status?.is_final)
  const today = new Date().toISOString().slice(0, 10)
  const overdueTasks = openTasks.filter((t) => t.due_date && t.due_date < today)

  if (isLoading) return <LoadingState />
  if (isError || !project) return <ErrorState title="Projeto não encontrado." description="Verifique o link ou volte à lista." />

  return (
    <div className="space-y-6">
      <Link
        to="/projects"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Projetos
      </Link>

      {/* Project header */}
      <div className="space-y-2">
        {editingName ? (
          <input
            autoFocus
            value={nameDraft}
            onChange={(e) => setNameDraft(e.target.value)}
            onBlur={saveName}
            onKeyDown={(e) => {
              if (e.key === 'Enter') saveName()
              if (e.key === 'Escape') { setNameDraft(project.name); setEditingName(false) }
            }}
            className="w-full rounded border-0 bg-transparent p-0 text-2xl font-bold outline-none ring-0 focus:ring-1 focus:ring-primary/30"
          />
        ) : (
          <div className="group flex items-start gap-2">
            <h1 className="text-2xl font-bold leading-tight">{project.name}</h1>
            {canManage && (
              <button
                onClick={startEditName}
                className="invisible mt-1.5 shrink-0 text-muted-foreground hover:text-foreground group-hover:visible"
                aria-label="Editar nome do projeto"
              >
                <Pencil className="h-4 w-4" />
              </button>
            )}
          </div>
        )}

        {project.category && (
          <span
            className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium"
            style={{
              backgroundColor: `${project.category.color}22`,
              color: project.category.color ?? undefined,
            }}
          >
            {project.category.name}
          </span>
        )}

        {editingDesc ? (
          <div className="space-y-2">
            <Textarea
              autoFocus
              rows={3}
              value={descDraft}
              onChange={(e) => setDescDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Escape') { setDescDraft(project.description ?? ''); setEditingDesc(false) }
              }}
              placeholder="Descrição do projeto..."
            />
            <div className="flex gap-2">
              <Button size="sm" onClick={saveDesc} disabled={updateProject.isPending}>Salvar</Button>
              <Button size="sm" variant="ghost" onClick={() => { setDescDraft(project.description ?? ''); setEditingDesc(false) }}>
                Cancelar
              </Button>
            </div>
          </div>
        ) : (
          <div className="group flex items-start gap-2">
            {project.description ? (
              <p className="text-sm text-muted-foreground">{project.description}</p>
            ) : (
              <p className="text-sm italic text-muted-foreground">Sem descrição.</p>
            )}
            {canManage && (
              <button
                onClick={startEditDesc}
                className="invisible mt-0.5 shrink-0 text-muted-foreground hover:text-foreground group-hover:visible"
                aria-label="Editar descrição do projeto"
              >
                <Pencil className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        )}

        <p className="text-xs text-muted-foreground">Criado em {formatDateTime(project.created_at)}</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {(
          [
            { label: 'Total', value: activeTasks.length },
            { label: 'Em aberto', value: openTasks.length },
            { label: 'Concluídas', value: doneTasks.length },
            { label: 'Atrasadas', value: overdueTasks.length, highlight: overdueTasks.length > 0 },
          ] as Array<{ label: string; value: number; highlight?: boolean }>
        ).map(({ label, value, highlight }) => (
          <div key={label} className="rounded-lg border bg-card p-4 text-center">
            <p className={`text-2xl font-bold ${highlight ? 'text-destructive' : ''}`}>{value}</p>
            <p className="mt-1 text-xs text-muted-foreground">{label}</p>
          </div>
        ))}
      </div>

      {/* New task action */}
      {currentProfile && (
        <div className="flex justify-end">
          <Button onClick={() => setDrawerOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Nova tarefa
          </Button>
        </div>
      )}

      {/* Kanban */}
      {currentProfile && (
        <KanbanBoard
          tasks={activeTasks}
          statuses={statuses}
          currentProfile={currentProfile}
          isLoading={tasksLoading}
          onTaskEdit={handleTaskEdit}
        />
      )}

      {currentProfile && (
        <TaskCreateDrawer
          open={drawerOpen}
          onOpenChange={setDrawerOpen}
          currentProfile={currentProfile}
          defaultProjectId={id}
        />
      )}

      {currentProfile && editingTask && (
        <TaskEditDrawer
          task={editingTask}
          open={!!editingTask}
          onOpenChange={(v) => { if (!v) setEditingTask(null) }}
          currentProfile={currentProfile}
        />
      )}
    </div>
  )
}
