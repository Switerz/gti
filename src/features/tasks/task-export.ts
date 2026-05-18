import type { TaskWithRelations } from '@/types/domain'

export type TaskExportDateField = 'created_at' | 'due_date'

export type TaskExportFilters = {
  dateField: TaskExportDateField
  dateFrom?: string
  dateTo?: string
}

const CSV_HEADERS = [
  'ID',
  'Titulo',
  'Status',
  'Prioridade',
  'Responsavel',
  'Categoria',
  'Projeto',
  'Data de inicio',
  'Prazo',
  'Criado em',
  'Atualizado em',
]

function normalizeDate(value?: string | null) {
  return value?.slice(0, 10) ?? ''
}

function isDateInsideRange(value: string, from?: string, to?: string) {
  if (!value) return false
  if (from && value < from) return false
  if (to && value > to) return false
  return true
}

export function filterTasksForExport(tasks: TaskWithRelations[], filters: TaskExportFilters) {
  if (!filters.dateFrom && !filters.dateTo) return tasks

  return tasks.filter((task) => {
    const value = normalizeDate(task[filters.dateField])
    return isDateInsideRange(value, filters.dateFrom, filters.dateTo)
  })
}

function escapeCsvCell(value: unknown) {
  const text = value == null ? '' : String(value)
  if (!/[",\n\r]/.test(text)) return text
  return `"${text.replaceAll('"', '""')}"`
}

export function exportTasksToCSV(tasks: TaskWithRelations[]) {
  const rows = tasks.map((task) => [
    task.id,
    task.title,
    task.status?.name ?? '',
    task.priority,
    task.owner?.full_name ?? '',
    task.category?.name ?? '',
    task.project?.name ?? '',
    normalizeDate(task.start_date),
    normalizeDate(task.due_date),
    normalizeDate(task.created_at),
    normalizeDate(task.updated_at),
  ])

  return [CSV_HEADERS, ...rows].map((row) => row.map(escapeCsvCell).join(',')).join('\n')
}

export function buildTaskExportFilename(now = new Date()) {
  return `tarefas-gti-${now.toISOString().slice(0, 10)}.csv`
}
