import { useState } from 'react'

import { ArrowUpDown, ChevronDown, ChevronUp, Plus, Search } from 'lucide-react'
import { Link } from 'react-router-dom'

import { TaskCreateDrawer } from '@/components/tasks/TaskCreateDrawer'
import { TaskDueDateBadge } from '@/components/tasks/TaskDueDateBadge'
import { TaskEditDrawer } from '@/components/tasks/TaskEditDrawer'
import { TaskPriorityBadge } from '@/components/tasks/TaskPriorityBadge'
import { TaskStatusBadge } from '@/components/tasks/TaskStatusBadge'
import { ErrorState } from '@/components/shared/ErrorState'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { useCategories } from '@/hooks/useCategories'
import { useCurrentProfile } from '@/hooks/useCurrentProfile'
import { useTaskStatuses } from '@/hooks/useTaskStatuses'
import { useTasks } from '@/hooks/useTasks'
import { formatDate } from '@/lib/dates'
import { canEditTask } from '@/lib/permissions'
import { fromOptionalSelectValue, SELECT_ALL_VALUE, toSelectValue } from '@/lib/select-values'
import type { TaskPriority, TaskWithRelations } from '@/types/domain'
import { PageHeader } from './PageHeader'

type SortKey = 'title' | 'status' | 'priority' | 'owner' | 'due_date' | 'updated_at'
type SortDir = 'asc' | 'desc'

const PRIORITY_ORDER: Record<string, number> = { urgent: 0, high: 1, medium: 2, low: 3 }

function sortTasks(tasks: TaskWithRelations[], key: SortKey, dir: SortDir): TaskWithRelations[] {
  return [...tasks].sort((a, b) => {
    let cmp = 0
    if (key === 'title') {
      cmp = (a.title ?? '').localeCompare(b.title ?? '', 'pt-BR')
    } else if (key === 'status') {
      cmp = (a.status?.name ?? '').localeCompare(b.status?.name ?? '', 'pt-BR')
    } else if (key === 'priority') {
      cmp = (PRIORITY_ORDER[a.priority] ?? 4) - (PRIORITY_ORDER[b.priority] ?? 4)
    } else if (key === 'owner') {
      cmp = (a.owner?.full_name ?? '').localeCompare(b.owner?.full_name ?? '', 'pt-BR')
    } else if (key === 'due_date') {
      cmp = (a.due_date ?? '').localeCompare(b.due_date ?? '')
    } else if (key === 'updated_at') {
      cmp = (a.updated_at ?? '').localeCompare(b.updated_at ?? '')
    }
    return dir === 'asc' ? cmp : -cmp
  })
}

export function TaskListPage() {
  const { data: currentProfile } = useCurrentProfile()
  const [search, setSearch] = useState('')
  const [statusId, setStatusId] = useState('')
  const [priority, setPriority] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [editingTask, setEditingTask] = useState<TaskWithRelations | null>(null)
  const [sortKey, setSortKey] = useState<SortKey>('updated_at')
  const [sortDir, setSortDir] = useState<SortDir>('desc')

  const { data: statuses = [] } = useTaskStatuses()
  const { data: categories = [] } = useCategories()
  const { data: tasks = [], isLoading, isError } = useTasks({
    search: search || undefined,
    statusId: statusId || undefined,
    priority: priority || undefined,
    categoryId: categoryId || undefined,
  })

  const filtered = sortTasks(
    tasks.filter((t) => !t.is_archived),
    sortKey,
    sortDir,
  )

  function handleSort(key: SortKey) {
    if (key === sortKey) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortKey(key)
      setSortDir('asc')
    }
  }

  function handleTaskEdit(task: TaskWithRelations) {
    if (!currentProfile || !canEditTask(currentProfile, task)) return
    setEditingTask(task)
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Lista de Tarefas"
        description="Visão tabular de todas as tarefas ativas."
        actions={
          currentProfile ? (
            <Button onClick={() => setDrawerOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Nova tarefa
            </Button>
          ) : undefined
        }
      />

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative min-w-[200px] flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar tarefas..."
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <Select
          value={toSelectValue(statusId, SELECT_ALL_VALUE)}
          onValueChange={(value) => setStatusId(fromOptionalSelectValue(value, SELECT_ALL_VALUE))}
        >
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={SELECT_ALL_VALUE}>Todos</SelectItem>
            {statuses
              .filter((s) => s.slug !== 'archived')
              .map((s) => (
                <SelectItem key={s.id} value={s.id}>
                  {s.name}
                </SelectItem>
              ))}
          </SelectContent>
        </Select>

        <Select
          value={toSelectValue(priority, SELECT_ALL_VALUE)}
          onValueChange={(value) => setPriority(fromOptionalSelectValue(value, SELECT_ALL_VALUE))}
        >
          <SelectTrigger className="w-36">
            <SelectValue placeholder="Prioridade" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={SELECT_ALL_VALUE}>Todas</SelectItem>
            <SelectItem value="urgent">Urgente</SelectItem>
            <SelectItem value="high">Alta</SelectItem>
            <SelectItem value="medium">Média</SelectItem>
            <SelectItem value="low">Baixa</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={toSelectValue(categoryId, SELECT_ALL_VALUE)}
          onValueChange={(value) => setCategoryId(fromOptionalSelectValue(value, SELECT_ALL_VALUE))}
        >
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Categoria" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={SELECT_ALL_VALUE}>Todas</SelectItem>
            {categories.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      {isError ? (
        <ErrorState title="Erro ao carregar tarefas." description="Tente recarregar a página." />
      ) : (
        <div className="overflow-hidden rounded-lg border bg-card">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/40">
                  {(
                    [
                      { key: 'title', label: 'Título' },
                      { key: 'status', label: 'Status' },
                      { key: 'priority', label: 'Prioridade' },
                      { key: 'owner', label: 'Responsável' },
                      { key: null, label: 'Categoria' },
                      { key: 'due_date', label: 'Prazo' },
                      { key: 'updated_at', label: 'Atualizado' },
                    ] as Array<{ key: SortKey | null; label: string }>
                  ).map(({ key, label }) =>
                    key ? (
                      <th
                        key={label}
                        className="cursor-pointer select-none px-4 py-3 text-left font-medium text-muted-foreground hover:text-foreground"
                        onClick={() => handleSort(key)}
                      >
                        <span className="inline-flex items-center gap-1">
                          {label}
                          {sortKey === key ? (
                            sortDir === 'asc' ? (
                              <ChevronUp className="h-3.5 w-3.5" />
                            ) : (
                              <ChevronDown className="h-3.5 w-3.5" />
                            )
                          ) : (
                            <ArrowUpDown className="h-3.5 w-3.5 opacity-40" />
                          )}
                        </span>
                      </th>
                    ) : (
                      <th
                        key={label}
                        className="px-4 py-3 text-left font-medium text-muted-foreground"
                      >
                        {label}
                      </th>
                    ),
                  )}
                  <th className="w-10 px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  Array.from({ length: 6 }).map((_, i) => (
                    <tr key={i} className="border-b last:border-0">
                      {Array.from({ length: 8 }).map((_, j) => (
                        <td key={j} className="px-4 py-3">
                          <Skeleton className="h-4 w-full" />
                        </td>
                      ))}
                    </tr>
                  ))
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-12 text-center text-muted-foreground">
                      {search || statusId || priority || categoryId
                        ? 'Nenhuma tarefa para os filtros selecionados.'
                        : 'Nenhuma tarefa ainda. Crie a primeira!'}
                    </td>
                  </tr>
                ) : (
                  filtered.map((task) => (
                    <TaskRow
                      key={task.id}
                      task={task}
                      onEdit={currentProfile ? () => handleTaskEdit(task) : undefined}
                    />
                  ))
                )}
              </tbody>
            </table>
          </div>
          {!isLoading && filtered.length > 0 && (
            <div className="border-t px-4 py-2 text-xs text-muted-foreground">
              {filtered.length} tarefa{filtered.length !== 1 ? 's' : ''}
            </div>
          )}
        </div>
      )}

      {currentProfile && (
        <TaskCreateDrawer
          open={drawerOpen}
          onOpenChange={setDrawerOpen}
          currentProfile={currentProfile}
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

interface TaskRowProps {
  task: TaskWithRelations
  onEdit?: () => void
}

function TaskRow({ task, onEdit }: TaskRowProps) {
  return (
    <tr className="group border-b last:border-0 transition-colors hover:bg-muted/30">
      <td className="px-4 py-3">
        <Link
          to={`/tasks/${task.id}`}
          className="line-clamp-1 block max-w-xs font-medium hover:text-primary hover:underline"
        >
          {task.title}
        </Link>
        {task.project && (
          <span className="text-xs text-muted-foreground">{task.project.name}</span>
        )}
      </td>
      <td className="px-4 py-3">
        <TaskStatusBadge name={task.status?.name ?? ''} color={task.status?.color} />
      </td>
      <td className="px-4 py-3">
        <TaskPriorityBadge priority={task.priority as TaskPriority} />
      </td>
      <td className="px-4 py-3 text-muted-foreground">{task.owner?.full_name ?? '—'}</td>
      <td className="px-4 py-3">
        {task.category ? (
          <span
            className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium"
            style={{
              backgroundColor: `${task.category.color}22`,
              color: task.category.color ?? undefined,
            }}
          >
            {task.category.name}
          </span>
        ) : (
          <span className="text-muted-foreground">—</span>
        )}
      </td>
      <td className="px-4 py-3">
        <TaskDueDateBadge
          dueDate={task.due_date}
          isFinal={task.status?.is_final}
          isArchived={task.is_archived}
        />
      </td>
      <td className="px-4 py-3 text-xs text-muted-foreground">{formatDate(task.updated_at)}</td>
      <td className="px-4 py-3">
        {onEdit && (
          <button
            onClick={onEdit}
            className="invisible rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground group-hover:visible"
            aria-label="Editar tarefa"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-3.5 w-3.5"
            >
              <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" />
            </svg>
          </button>
        )}
      </td>
    </tr>
  )
}
