import { AlertCircle, ClipboardList, Search } from 'lucide-react'

import { cn } from '@/lib/utils'
import type { Category, KpiGroup, Profile } from '@/types/domain'

import type { KpiFilterState } from '../kpi-view-utils'

function QuickChip({
  active,
  icon: Icon,
  label,
  onClick,
}: {
  active: boolean
  icon: React.ComponentType<{ className?: string }>
  label: string
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition-colors',
        active
          ? 'border-primary bg-primary text-primary-foreground'
          : 'border-border bg-background text-muted-foreground hover:border-primary/60 hover:text-foreground',
      )}
    >
      <Icon className="h-3.5 w-3.5" />
      {label}
    </button>
  )
}

export function KpiFilters({
  filters,
  groups,
  profiles,
  categories,
  products,
  onChange,
}: {
  filters: KpiFilterState
  groups: KpiGroup[]
  profiles: Profile[]
  categories: Category[]
  products: string[]
  onChange: (key: keyof KpiFilterState, value: string) => void
}) {
  function toggleOffTrack() {
    onChange('status', filters.status === 'off_track' ? '' : 'off_track')
  }

  function toggleOpenPlan() {
    onChange('hasOpenPlan', filters.hasOpenPlan === 'true' ? '' : 'true')
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        <QuickChip
          active={filters.status === 'off_track'}
          icon={AlertCircle}
          label="Fora da meta"
          onClick={toggleOffTrack}
        />
        <QuickChip
          active={filters.hasOpenPlan === 'true'}
          icon={ClipboardList}
          label="Com plano aberto"
          onClick={toggleOpenPlan}
        />
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="relative min-w-[220px] flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={filters.search}
            onChange={(event) => onChange('search', event.target.value)}
            placeholder="Buscar KPIs..."
            className="h-9 w-full rounded-md border bg-background pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        <select
          value={filters.ownerId}
          onChange={(event) => onChange('ownerId', event.target.value)}
          className="h-9 min-w-44 rounded-md border bg-background px-3 text-sm"
          aria-label="Responsável"
        >
          <option value="">Responsáveis</option>
          {profiles.map((profile) => (
            <option key={profile.id} value={profile.id}>
              {profile.full_name ?? profile.email}
            </option>
          ))}
        </select>

        <select
          value={filters.product}
          onChange={(event) => onChange('product', event.target.value)}
          className="h-9 min-w-44 rounded-md border bg-background px-3 text-sm"
          aria-label="Produto"
        >
          <option value="">Produtos</option>
          {products.map((product) => (
            <option key={product} value={product}>
              {product}
            </option>
          ))}
        </select>

        <select
          value={filters.groupId}
          onChange={(event) => onChange('groupId', event.target.value)}
          className="h-9 min-w-40 rounded-md border bg-background px-3 text-sm"
          aria-label="Grupo"
        >
          <option value="">Grupos</option>
          {groups.map((group) => (
            <option key={group.id} value={group.id}>
              {group.name}
            </option>
          ))}
        </select>

        <select
          value={filters.categoryId}
          onChange={(event) => onChange('categoryId', event.target.value)}
          className="h-9 min-w-44 rounded-md border bg-background px-3 text-sm"
          aria-label="Categoria"
        >
          <option value="">Categorias</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>

        <select
          value={filters.status}
          onChange={(event) => onChange('status', event.target.value)}
          className="h-9 min-w-40 rounded-md border bg-background px-3 text-sm"
          aria-label="Status"
        >
          <option value="">Status</option>
          <option value="on_track">Dentro da meta</option>
          <option value="off_track">Fora da meta</option>
          <option value="missing">Sem valor</option>
          <option value="neutral">Informativo</option>
        </select>
      </div>
    </div>
  )
}
