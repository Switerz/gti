import { Search } from 'lucide-react'

import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useCategories } from '@/hooks/useCategories'
import { fromOptionalSelectValue, SELECT_ALL_VALUE, toSelectValue } from '@/lib/select-values'

interface Props {
  search: string
  onSearchChange: (v: string) => void
  priority: string
  onPriorityChange: (v: string) => void
  categoryId: string
  onCategoryChange: (v: string) => void
}

export function KanbanFilters({
  search,
  onSearchChange,
  priority,
  onPriorityChange,
  categoryId,
  onCategoryChange,
}: Props) {
  const { data: categories = [] } = useCategories()

  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="relative min-w-[180px]">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Buscar tarefas..."
          className="pl-9"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </div>

      <Select
        value={toSelectValue(priority, SELECT_ALL_VALUE)}
        onValueChange={(value) => onPriorityChange(fromOptionalSelectValue(value, SELECT_ALL_VALUE))}
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
        onValueChange={(value) => onCategoryChange(fromOptionalSelectValue(value, SELECT_ALL_VALUE))}
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
  )
}
