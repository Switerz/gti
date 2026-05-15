import { useEffect, useState } from 'react'

import { Plus } from 'lucide-react'

import { KanbanBoard } from '@/components/kanban/KanbanBoard'
import {
  TeamBoardFilters,
  type TeamBoardFilterState,
} from '@/components/kanban/TeamBoardFilters'
import { TaskCreateDrawer } from '@/components/tasks/TaskCreateDrawer'
import { TaskEditDrawer } from '@/components/tasks/TaskEditDrawer'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/shared/EmptyState'
import { filterTasksForTeamBoard, hasActiveTeamFilters } from '@/features/tasks/team-board-filters'
import { useCurrentProfile } from '@/hooks/useCurrentProfile'
import { useTaskStatuses } from '@/hooks/useTaskStatuses'
import { useTasks } from '@/hooks/useTasks'
import type { TaskWithRelations } from '@/types/domain'

import { PageHeader } from './PageHeader'

const EMPTY_FILTERS: TeamBoardFilterState = {
  search: '',
  priority: '',
  categoryId: '',
  ownerId: '',
  creatorId: '',
  projectId: '',
  statusId: '',
  due: '',
}

// Debounce search input to avoid a query per keystroke
function useDebounce(value: string, delay = 350) {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(t)
  }, [value, delay])
  return debounced
}

export function TeamBoardPage() {
  const { data: currentProfile } = useCurrentProfile()
  const { data: statuses = [] } = useTaskStatuses()
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [editingTask, setEditingTask] = useState<TaskWithRelations | null>(null)
  const [filters, setFilters] = useState<TeamBoardFilterState>(EMPTY_FILTERS)

  const debouncedSearch = useDebounce(filters.search)

  const { data: tasks = [], isLoading } = useTasks({
    search: debouncedSearch || undefined,
    priority: filters.priority || undefined,
    categoryId: filters.categoryId || undefined,
    ownerId: filters.ownerId || undefined,
    creatorId: filters.creatorId || undefined,
    projectId: filters.projectId || undefined,
    statusId: filters.statusId || undefined,
  })

  const filteredTasks = filterTasksForTeamBoard(tasks, {
    ...filters,
    search: debouncedSearch,
  })
  const hasFilters = hasActiveTeamFilters(filters)

  function handleFilterChange(key: keyof TeamBoardFilterState, value: string) {
    setFilters((prev) => ({ ...prev, [key]: value }))
  }

  return (
    <section className="space-y-5">
      <PageHeader
        title="Kanban da Equipe"
        description="Visão por status de todas as tarefas ativas da equipe de Transportes."
        actions={
          currentProfile ? (
            <Button onClick={() => setDrawerOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Nova tarefa
            </Button>
          ) : undefined
        }
      />

      {currentProfile && (
        <TeamBoardFilters
          filters={filters}
          onFilterChange={handleFilterChange}
          currentProfileId={currentProfile.id}
        />
      )}

      {currentProfile && (
        !isLoading && filteredTasks.length === 0 && hasFilters ? (
          <EmptyState
            title="Nenhuma tarefa para os filtros selecionados"
            description="Limpe os filtros ou ajuste os critérios para ver outras tarefas da equipe."
            action={
              <Button variant="outline" onClick={() => setFilters(EMPTY_FILTERS)}>
                Limpar filtros
              </Button>
            }
          />
        ) : (
          <KanbanBoard
            tasks={filteredTasks}
            statuses={statuses}
            currentProfile={currentProfile}
            isLoading={isLoading}
            onTaskEdit={setEditingTask}
          />
        )
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
    </section>
  )
}
