import { useState } from 'react'

import { Plus } from 'lucide-react'

import { KanbanBoard } from '@/components/kanban/KanbanBoard'
import { KanbanFilters } from '@/components/kanban/KanbanFilters'
import { TaskFormDrawer } from '@/components/tasks/TaskFormDrawer'
import { Button } from '@/components/ui/button'
import { useCurrentProfile } from '@/hooks/useCurrentProfile'
import { useMyTasks } from '@/hooks/useTasks'
import { useTaskStatuses } from '@/hooks/useTaskStatuses'
import { canEditTask } from '@/lib/permissions'
import type { TaskWithRelations } from '@/types/domain'

import { PageHeader } from './PageHeader'

export function MyBoardPage() {
  const { data: currentProfile } = useCurrentProfile()
  const { data: tasks = [], isLoading } = useMyTasks(currentProfile?.id)
  const { data: statuses = [] } = useTaskStatuses()

  const [drawerOpen, setDrawerOpen] = useState(false)
  const [editingTask, setEditingTask] = useState<TaskWithRelations | null>(null)
  const [search, setSearch] = useState('')

  function handleTaskEdit(task: TaskWithRelations) {
    if (!currentProfile || !canEditTask(currentProfile, task)) return
    setEditingTask(task)
  }
  const [priority, setPriority] = useState('')
  const [categoryId, setCategoryId] = useState('')

  const filtered = tasks.filter((t) => {
    if (t.is_archived) return false
    if (search && !t.title.toLowerCase().includes(search.toLowerCase())) return false
    if (priority && t.priority !== priority) return false
    if (categoryId && t.category_id !== categoryId) return false
    return true
  })

  return (
    <section className="space-y-5">
      <PageHeader
        title="Meu Kanban"
        description="Tarefas criadas por você, recebidas ou em que você é responsável."
        actions={
          currentProfile ? (
            <Button onClick={() => setDrawerOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Nova tarefa
            </Button>
          ) : undefined
        }
      />

      <KanbanFilters
        search={search}
        onSearchChange={setSearch}
        priority={priority}
        onPriorityChange={setPriority}
        categoryId={categoryId}
        onCategoryChange={setCategoryId}
      />

      {currentProfile && (
        <KanbanBoard
          tasks={filtered}
          statuses={statuses}
          currentProfile={currentProfile}
          isLoading={isLoading}
          onTaskEdit={handleTaskEdit}
        />
      )}

      {currentProfile && (
        <TaskFormDrawer
          open={drawerOpen}
          onOpenChange={setDrawerOpen}
          currentProfile={currentProfile}
        />
      )}

      {currentProfile && editingTask && (
        <TaskFormDrawer
          task={editingTask}
          open={!!editingTask}
          onOpenChange={(v) => { if (!v) setEditingTask(null) }}
          currentProfile={currentProfile}
        />
      )}
    </section>
  )
}
