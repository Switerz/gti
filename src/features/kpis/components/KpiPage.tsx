import { useMemo, useState } from 'react'

import { EmptyState } from '@/components/shared/EmptyState'
import { ErrorState } from '@/components/shared/ErrorState'
import { LoadingState } from '@/components/shared/LoadingState'
import { Button } from '@/components/ui/button'
import { useCategories } from '@/hooks/useCategories'
import { useCurrentProfile } from '@/hooks/useCurrentProfile'
import { useProfiles } from '@/hooks/useProfiles'
import { cn } from '@/lib/utils'
import { PageHeader } from '@/pages/PageHeader'
import type { KpiWithRelations } from '@/types/domain'

import type { IsoWeek } from '../kpi-utils'
import { getCurrentIsoWeek, getVisibleWeeks } from '../kpi-utils'
import {
  EMPTY_KPI_FILTERS,
  getKpiCurrentStatus,
  getKpiOperationalWeek,
  type KpiFilterState,
} from '../kpi-view-utils'
import { useUpsertKpiWeeklyValue } from '../hooks/useKpiWeeklyValues'
import { KpiDetailDrawer } from './KpiDetailDrawer'
import { KpiFilters } from './KpiFilters'
import { KpiTable } from './KpiTable'
import { useKpiGroups, useKpiIdsWithOpenActionPlans, useKpis, useMyKpis } from '../hooks/useKpis'

type KpiTab = 'mine' | 'team'

function filterKpis(
  kpis: KpiWithRelations[],
  filters: KpiFilterState,
  currentWeek: ReturnType<typeof getCurrentIsoWeek>,
  openPlanIds: Set<string>,
) {
  const search = filters.search.trim().toLowerCase()

  return kpis.filter((kpi) => {
    if (search && !kpi.name.toLowerCase().includes(search)) return false
    if (filters.ownerId) {
      const isOwner = kpi.owner_id === filters.ownerId
      const isAssigned = kpi.assignments.some((assignment) => assignment.profile.id === filters.ownerId)
      if (!isOwner && !isAssigned) return false
    }
    if (filters.product && kpi.product !== filters.product) return false
    if (filters.groupId && kpi.group_id !== filters.groupId) return false
    if (filters.categoryId && kpi.category_id !== filters.categoryId) return false
    if (filters.status && getKpiCurrentStatus(kpi, currentWeek) !== filters.status) return false
    if (filters.hasOpenPlan === 'true' && !openPlanIds.has(kpi.id)) return false
    return true
  })
}

function hasFilters(filters: KpiFilterState) {
  return Object.values(filters).some(Boolean)
}

function TeamOverview({ kpis, currentWeek }: { kpis: KpiWithRelations[]; currentWeek: IsoWeek }) {
  const counts = useMemo(() => {
    const result = { on_track: 0, off_track: 0, missing: 0, neutral: 0 }
    for (const kpi of kpis) {
      const status = getKpiCurrentStatus(kpi, currentWeek)
      result[status] = (result[status] ?? 0) + 1
    }
    return result
  }, [kpis, currentWeek])

  const total = kpis.length
  if (total === 0) return null

  const onTrackPct = total > 0 ? Math.round((counts.on_track / total) * 100) : 0

  return (
    <div className="flex flex-wrap items-center gap-x-5 gap-y-1 rounded-lg border bg-muted/30 px-4 py-2.5 text-sm">
      <span className="font-medium">{total} indicadores</span>
      <span className="flex items-center gap-1.5 text-green-700">
        <span className="h-2 w-2 rounded-full bg-green-500" />
        {counts.on_track} dentro da meta
      </span>
      <span className="flex items-center gap-1.5 text-red-700">
        <span className="h-2 w-2 rounded-full bg-red-500" />
        {counts.off_track} fora da meta
      </span>
      <span className="flex items-center gap-1.5 text-amber-700">
        <span className="h-2 w-2 rounded-full bg-amber-400" />
        {counts.missing} sem valor
      </span>
      <span className="ml-auto text-xs text-muted-foreground">{onTrackPct}% conformidade</span>
    </div>
  )
}

export function KpiPage() {
  const { data: currentProfile } = useCurrentProfile()
  const [tab, setTab] = useState<KpiTab>('mine')
  const [filters, setFilters] = useState<KpiFilterState>(EMPTY_KPI_FILTERS)
  const [selectedKpiId, setSelectedKpiId] = useState<string | null>(null)

  const calendarWeek = useMemo(() => getCurrentIsoWeek(), [])

  const teamQuery = useKpis()
  const mineQuery = useMyKpis(currentProfile?.id)
  const upsertWeeklyValue = useUpsertKpiWeeklyValue(currentProfile?.id ?? '')
  const { data: groups = [] } = useKpiGroups()
  const { data: profiles = [] } = useProfiles()
  const { data: categories = [] } = useCategories()
  const { data: openPlanIdsList = [] } = useKpiIdsWithOpenActionPlans()

  const openPlanIds = useMemo(() => new Set(openPlanIdsList), [openPlanIdsList])

  const sourceKpis = useMemo(
    () => (tab === 'mine' ? mineQuery.data ?? [] : teamQuery.data ?? []),
    [mineQuery.data, tab, teamQuery.data],
  )
  const currentWeek = useMemo(
    () => getKpiOperationalWeek(sourceKpis, calendarWeek),
    [calendarWeek, sourceKpis],
  )
  const visibleWeeks = useMemo(
    () => getVisibleWeeks(new Date(`${currentWeek.weekStart}T12:00:00`), 5),
    [currentWeek.weekStart],
  )
  const isLoading = tab === 'mine' ? mineQuery.isLoading : teamQuery.isLoading
  const isError = tab === 'mine' ? mineQuery.isError : teamQuery.isError

  const products = useMemo(
    () =>
      Array.from(
        new Set((teamQuery.data ?? []).map((kpi) => kpi.product).filter(Boolean) as string[]),
      ).sort((a, b) => a.localeCompare(b, 'pt-BR')),
    [teamQuery.data],
  )

  const filteredKpis = useMemo(
    () => filterKpis(sourceKpis, filters, currentWeek, openPlanIds),
    [currentWeek, filters, openPlanIds, sourceKpis],
  )
  const selectedKpi = sourceKpis.find((kpi) => kpi.id === selectedKpiId) ?? null

  const outOfTargetCount = sourceKpis.filter(
    (kpi) => getKpiCurrentStatus(kpi, currentWeek) === 'off_track',
  ).length
  const missingCount = sourceKpis.filter(
    (kpi) => getKpiCurrentStatus(kpi, currentWeek) === 'missing',
  ).length

  function handleFilterChange(key: keyof KpiFilterState, value: string) {
    setFilters((prev) => ({ ...prev, [key]: value }))
  }

  function handleSaveWeeklyValue(
    kpi: KpiWithRelations,
    week: IsoWeek,
    values: { value?: number; valueText?: string; notes?: string },
  ) {
    if (!currentProfile) return

    upsertWeeklyValue.mutate({
      kpiId: kpi.id,
      isoYear: week.isoYear,
      isoWeek: week.isoWeek,
      weekStart: week.weekStart,
      weekEnd: week.weekEnd,
      value: values.value,
      valueText: values.valueText,
      notes: values.notes,
    })
  }

  const savingKey = upsertWeeklyValue.variables
    ? `${upsertWeeklyValue.variables.kpiId}-${upsertWeeklyValue.variables.isoYear}-${upsertWeeklyValue.variables.isoWeek}`
    : null

  return (
    <section className="space-y-5">
      <PageHeader
        title="KPIs"
        description="Acompanhamento semanal dos indicadores de Transportes"
      />

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-lg border bg-card p-3">
          <p className="text-xs text-muted-foreground">KPIs visíveis</p>
          <p className="mt-1 text-2xl font-semibold">{sourceKpis.length}</p>
        </div>
        <div className="rounded-lg border bg-card p-3">
          <p className="text-xs text-muted-foreground">Fora da meta</p>
          <p className="mt-1 text-2xl font-semibold text-red-600">{outOfTargetCount}</p>
        </div>
        <div className="rounded-lg border bg-card p-3">
          <p className="text-xs text-muted-foreground">Sem valor na semana</p>
          <p className="mt-1 text-2xl font-semibold text-amber-600">{missingCount}</p>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="inline-flex rounded-md border bg-muted/30 p-1">
          {(
            [
              ['mine', 'Meus KPIs'],
              ['team', 'Equipe'],
            ] as const
          ).map(([value, label]) => (
            <button
              key={value}
              type="button"
              onClick={() => setTab(value)}
              className={cn(
                'rounded px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors',
                tab === value && 'bg-background text-foreground shadow-sm',
              )}
            >
              {label}
            </button>
          ))}
        </div>

        {hasFilters(filters) && (
          <Button variant="ghost" size="sm" onClick={() => setFilters(EMPTY_KPI_FILTERS)}>
            Limpar filtros
          </Button>
        )}
      </div>

      {tab === 'team' && !isLoading && !isError && (
        <TeamOverview kpis={sourceKpis} currentWeek={currentWeek} />
      )}

      <KpiFilters
        filters={filters}
        groups={groups}
        profiles={profiles}
        categories={categories}
        products={products}
        onChange={handleFilterChange}
      />

      {isLoading ? (
        <LoadingState />
      ) : isError ? (
        <ErrorState title="Erro ao carregar KPIs." description="Tente recarregar a página." />
      ) : filteredKpis.length === 0 ? (
        <EmptyState
          title={hasFilters(filters) ? 'Nenhum KPI para os filtros selecionados.' : 'Nenhum KPI cadastrado ainda.'}
          description={hasFilters(filters) ? 'Limpe os filtros ou ajuste os critérios.' : undefined}
          action={
            hasFilters(filters) ? (
              <Button variant="outline" onClick={() => setFilters(EMPTY_KPI_FILTERS)}>
                Limpar filtros
              </Button>
            ) : undefined
          }
        />
      ) : (
        <KpiTable
          kpis={filteredKpis}
          weeks={visibleWeeks}
          currentWeek={currentWeek}
          onSaveWeeklyValue={currentProfile ? handleSaveWeeklyValue : undefined}
          savingKey={upsertWeeklyValue.isPending ? savingKey : null}
          onOpenDetail={(kpi) => setSelectedKpiId(kpi.id)}
        />
      )}

      <KpiDetailDrawer
        kpi={selectedKpi}
        currentProfile={currentProfile}
        currentWeek={currentWeek}
        open={selectedKpiId !== null}
        onOpenChange={(open) => {
          if (!open) setSelectedKpiId(null)
        }}
      />
    </section>
  )
}
