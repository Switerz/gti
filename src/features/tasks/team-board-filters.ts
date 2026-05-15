import { addDays, isBefore, isEqual, parseISO, startOfDay } from 'date-fns'

import type { TaskWithRelations } from '@/types/domain'

export type DueDateFilter = '' | 'overdue' | 'today' | 'next_7_days' | 'no_due'

export type TeamTaskFilters = {
  search?: string
  priority?: string
  categoryId?: string
  ownerId?: string
  creatorId?: string
  projectId?: string
  statusId?: string
  due?: DueDateFilter
}

function normalize(value: string) {
  return value.trim().toLowerCase()
}

export function hasActiveTeamFilters(filters: TeamTaskFilters) {
  return Boolean(
    filters.search ||
      filters.priority ||
      filters.categoryId ||
      filters.ownerId ||
      filters.creatorId ||
      filters.projectId ||
      filters.statusId ||
      filters.due,
  )
}

export function filterTasksForTeamBoard(
  tasks: TaskWithRelations[],
  filters: TeamTaskFilters,
  today = startOfDay(new Date()),
) {
  const todayStart = startOfDay(today)
  const nextSevenDays = addDays(todayStart, 7)
  const search = normalize(filters.search ?? '')

  return tasks.filter((task) => {
    if (task.is_archived) return false
    if (search && !normalize(task.title).includes(search)) return false
    if (filters.priority && task.priority !== filters.priority) return false
    if (filters.categoryId && task.category_id !== filters.categoryId) return false
    if (filters.ownerId && task.owner_id !== filters.ownerId) return false
    if (filters.creatorId && task.creator_id !== filters.creatorId) return false
    if (filters.projectId && task.project_id !== filters.projectId) return false
    if (filters.statusId && task.status_id !== filters.statusId) return false

    if (filters.due === 'no_due') return !task.due_date
    if (!filters.due) return true
    if (!task.due_date) return false

    const dueDate = startOfDay(parseISO(task.due_date))

    if (filters.due === 'overdue') {
      return isBefore(dueDate, todayStart) && !task.status?.is_final
    }

    if (filters.due === 'today') {
      return isEqual(dueDate, todayStart)
    }

    if (filters.due === 'next_7_days') {
      return !isBefore(dueDate, todayStart) && !isBefore(nextSevenDays, dueDate)
    }

    return true
  })
}
