import type { TaskWithRelations } from '@/types/domain'

export type TaskListSortKey = 'title' | 'status' | 'priority' | 'owner' | 'due_date' | 'updated_at'
export type TaskListSortDir = 'asc' | 'desc'

export const TASK_LIST_COLUMNS: Array<{ key: TaskListSortKey | null; label: string }> = [
  { key: 'title', label: 'Título' },
  { key: 'status', label: 'Status' },
  { key: 'priority', label: 'Prioridade' },
  { key: 'owner', label: 'Responsável' },
  { key: null, label: 'Horas' },
  { key: null, label: 'Categoria' },
  { key: 'due_date', label: 'Prazo' },
  { key: 'updated_at', label: 'Atualizado' },
]

const PRIORITY_ORDER: Record<string, number> = { urgent: 0, high: 1, medium: 2, low: 3 }

export function sortTasks(
  tasks: TaskWithRelations[],
  key: TaskListSortKey,
  dir: TaskListSortDir,
): TaskWithRelations[] {
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
