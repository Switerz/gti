import { useMemo, useState } from 'react'

import { Download } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  buildTaskExportFilename,
  exportTasksToCSV,
  filterTasksForExport,
  type TaskExportDateField,
} from '@/features/tasks/task-export'
import type { TaskWithRelations } from '@/types/domain'

interface TaskExportDialogProps {
  tasks: TaskWithRelations[]
}

function downloadCsv(csv: string, filename: string) {
  const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}

export function TaskExportDialog({ tasks }: TaskExportDialogProps) {
  const [open, setOpen] = useState(false)
  const [dateField, setDateField] = useState<TaskExportDateField>('created_at')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')

  const exportableTasks = useMemo(
    () =>
      filterTasksForExport(tasks, {
        dateField,
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined,
      }),
    [dateField, dateFrom, dateTo, tasks],
  )

  function handleExport() {
    downloadCsv(exportTasksToCSV(exportableTasks), buildTaskExportFilename())
    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button type="button" variant="outline">
          <Download className="mr-2 h-4 w-4" />
          Exportar CSV
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Exportar tarefas</DialogTitle>
          <DialogDescription>
            O arquivo usa os filtros ativos da lista e o periodo escolhido abaixo.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-2">
          <div className="grid gap-2">
            <Label htmlFor="task-export-date-field">Periodo por</Label>
            <Select
              value={dateField}
              onValueChange={(value) => setDateField(value as TaskExportDateField)}
            >
              <SelectTrigger id="task-export-date-field">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="created_at">Data de criacao</SelectItem>
                <SelectItem value="due_date">Prazo</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="task-export-date-from">De</Label>
              <Input
                id="task-export-date-from"
                type="date"
                value={dateFrom}
                onChange={(event) => setDateFrom(event.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="task-export-date-to">Ate</Label>
              <Input
                id="task-export-date-to"
                type="date"
                value={dateTo}
                onChange={(event) => setDateTo(event.target.value)}
              />
            </div>
          </div>

          <p className="rounded-md bg-muted/50 px-3 py-2 text-sm text-muted-foreground">
            {exportableTasks.length} tarefa{exportableTasks.length === 1 ? '' : 's'} ser
            {exportableTasks.length === 1 ? 'a' : 'ao'} exportada
            {exportableTasks.length === 1 ? '' : 's'}.
          </p>
        </div>

        <DialogFooter>
          <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
            Cancelar
          </Button>
          <Button type="button" onClick={handleExport} disabled={exportableTasks.length === 0}>
            Exportar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
