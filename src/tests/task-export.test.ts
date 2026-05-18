import { describe, expect, it } from 'vitest'

import {
  buildTaskExportFilename,
  exportTasksToCSV,
  filterTasksForExport,
} from '@/features/tasks/task-export'
import type { TaskWithRelations } from '@/types/domain'

function task(overrides: Partial<TaskWithRelations> = {}): TaskWithRelations {
  return {
    id: 'task-1',
    title: 'Revisar SLA',
    status: { id: 's1', name: 'A Fazer', slug: 'todo', color: null, is_final: false },
    priority: 'high',
    owner: { id: 'u1', full_name: 'Maria Gomes', avatar_url: null },
    category: { id: 'c1', name: 'BI e Relatorios', color: null },
    project: { id: 'p1', name: 'Monitoramento' },
    start_date: '2026-05-01',
    due_date: '2026-05-20',
    created_at: '2026-05-10T12:00:00Z',
    updated_at: '2026-05-12T12:00:00Z',
    ...overrides,
  } as TaskWithRelations
}

describe('task export', () => {
  it('exports selected task columns to CSV', () => {
    const csv = exportTasksToCSV([
      task({ title: 'Titulo, com virgula', project: { id: 'p1', name: 'Projeto "A"' } }),
    ])

    expect(csv).toContain('ID,Titulo,Status,Prioridade,Responsavel')
    expect(csv).toContain('task-1,"Titulo, com virgula",A Fazer,high,Maria Gomes')
    expect(csv).toContain('"Projeto ""A"""')
  })

  it('filters by created date range', () => {
    const tasks = [
      task({ id: 'old', created_at: '2026-05-01T12:00:00Z' }),
      task({ id: 'inside', created_at: '2026-05-15T12:00:00Z' }),
      task({ id: 'future', created_at: '2026-06-01T12:00:00Z' }),
    ]

    expect(
      filterTasksForExport(tasks, {
        dateField: 'created_at',
        dateFrom: '2026-05-10',
        dateTo: '2026-05-31',
      }).map((item) => item.id),
    ).toEqual(['inside'])
  })

  it('filters by due date range and excludes tasks without due date', () => {
    const tasks = [
      task({ id: 'no-due', due_date: null }),
      task({ id: 'inside', due_date: '2026-05-20' }),
      task({ id: 'future', due_date: '2026-06-10' }),
    ]

    expect(
      filterTasksForExport(tasks, {
        dateField: 'due_date',
        dateFrom: '2026-05-01',
        dateTo: '2026-05-31',
      }).map((item) => item.id),
    ).toEqual(['inside'])
  })

  it('uses current date in the export filename', () => {
    expect(buildTaskExportFilename(new Date('2026-05-15T10:00:00Z'))).toBe(
      'tarefas-gti-2026-05-15.csv',
    )
  })
})
