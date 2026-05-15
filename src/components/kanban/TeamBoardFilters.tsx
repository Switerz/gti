import { Search } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useCategories } from '@/hooks/useCategories'
import { useProfiles } from '@/hooks/useProfiles'
import { useProjects } from '@/hooks/useProjects'
import { useTaskStatuses } from '@/hooks/useTaskStatuses'
import { fromOptionalSelectValue, SELECT_ALL_VALUE, toSelectValue } from '@/lib/select-values'
import type { DueDateFilter } from '@/features/tasks/team-board-filters'

export interface TeamBoardFilterState {
  search: string
  priority: string
  categoryId: string
  ownerId: string
  creatorId: string
  projectId: string
  statusId: string
  due: DueDateFilter
}

interface Props {
  filters: TeamBoardFilterState
  onFilterChange: (key: keyof TeamBoardFilterState, value: string) => void
  currentProfileId: string
}

export function TeamBoardFilters({ filters, onFilterChange, currentProfileId }: Props) {
  const { data: categories = [] } = useCategories()
  const { data: profiles = [] } = useProfiles()
  const { data: projects = [] } = useProjects()
  const { data: statuses = [] } = useTaskStatuses()

  const onlyMine = filters.ownerId === currentProfileId

  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="relative min-w-[200px] flex-1">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Buscar tarefas..."
          className="pl-9"
          value={filters.search}
          onChange={(e) => onFilterChange('search', e.target.value)}
        />
      </div>

      <Button
        variant={onlyMine ? 'default' : 'outline'}
        size="sm"
        onClick={() => onFilterChange('ownerId', onlyMine ? '' : currentProfileId)}
      >
        Apenas minhas
      </Button>

      <Select
        value={toSelectValue(filters.priority, SELECT_ALL_VALUE)}
        onValueChange={(v) => onFilterChange('priority', fromOptionalSelectValue(v, SELECT_ALL_VALUE))}
      >
        <SelectTrigger aria-label="Filtrar por prioridade" className="w-36">
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
        value={toSelectValue(filters.ownerId, SELECT_ALL_VALUE)}
        onValueChange={(v) => onFilterChange('ownerId', fromOptionalSelectValue(v, SELECT_ALL_VALUE))}
      >
        <SelectTrigger aria-label="Filtrar por responsável" className="w-44">
          <SelectValue placeholder="Responsável" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={SELECT_ALL_VALUE}>Todos</SelectItem>
          {profiles.map((p) => (
            <SelectItem key={p.id} value={p.id}>
              {p.full_name ?? p.email}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={toSelectValue(filters.creatorId, SELECT_ALL_VALUE)}
        onValueChange={(v) => onFilterChange('creatorId', fromOptionalSelectValue(v, SELECT_ALL_VALUE))}
      >
        <SelectTrigger aria-label="Filtrar por criador" className="w-44">
          <SelectValue placeholder="Criador" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={SELECT_ALL_VALUE}>Todos</SelectItem>
          {profiles.map((p) => (
            <SelectItem key={p.id} value={p.id}>
              {p.full_name ?? p.email}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={toSelectValue(filters.categoryId, SELECT_ALL_VALUE)}
        onValueChange={(v) => onFilterChange('categoryId', fromOptionalSelectValue(v, SELECT_ALL_VALUE))}
      >
        <SelectTrigger aria-label="Filtrar por categoria" className="w-44">
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

      <Select
        value={toSelectValue(filters.projectId, SELECT_ALL_VALUE)}
        onValueChange={(v) => onFilterChange('projectId', fromOptionalSelectValue(v, SELECT_ALL_VALUE))}
      >
        <SelectTrigger aria-label="Filtrar por projeto" className="w-44">
          <SelectValue placeholder="Projeto" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={SELECT_ALL_VALUE}>Todos</SelectItem>
          {projects.map((p) => (
            <SelectItem key={p.id} value={p.id}>
              {p.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={toSelectValue(filters.statusId, SELECT_ALL_VALUE)}
        onValueChange={(v) => onFilterChange('statusId', fromOptionalSelectValue(v, SELECT_ALL_VALUE))}
      >
        <SelectTrigger aria-label="Filtrar por status" className="w-44">
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
        value={toSelectValue(filters.due, SELECT_ALL_VALUE)}
        onValueChange={(v) =>
          onFilterChange('due', fromOptionalSelectValue(v, SELECT_ALL_VALUE) as DueDateFilter)
        }
      >
        <SelectTrigger aria-label="Filtrar por vencimento" className="w-44">
          <SelectValue placeholder="Vencimento" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={SELECT_ALL_VALUE}>Todos</SelectItem>
          <SelectItem value="overdue">Atrasadas</SelectItem>
          <SelectItem value="today">Hoje</SelectItem>
          <SelectItem value="next_7_days">Próximos 7 dias</SelectItem>
          <SelectItem value="no_due">Sem prazo</SelectItem>
        </SelectContent>
      </Select>

      {(filters.search ||
        filters.priority ||
        filters.categoryId ||
        filters.ownerId ||
        filters.creatorId ||
        filters.projectId ||
        filters.statusId ||
        filters.due) && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            onFilterChange('search', '')
            onFilterChange('priority', '')
            onFilterChange('categoryId', '')
            onFilterChange('ownerId', '')
            onFilterChange('creatorId', '')
            onFilterChange('projectId', '')
            onFilterChange('statusId', '')
            onFilterChange('due', '')
          }}
        >
          Limpar filtros
        </Button>
      )}
    </div>
  )
}
