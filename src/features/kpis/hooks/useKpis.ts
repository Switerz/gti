import { useQuery } from '@tanstack/react-query'

import { kpiService, type KpiFilters } from '@/features/kpis/kpi.service'

export const KPI_QUERY_KEY = ['kpis'] as const

export function useKpiGroups() {
  return useQuery({
    queryKey: ['kpi-groups'],
    queryFn: kpiService.getGroups,
    staleTime: 5 * 60 * 1000,
  })
}

export function useKpis(filters: KpiFilters = {}) {
  return useQuery({
    queryKey: [...KPI_QUERY_KEY, filters],
    queryFn: () => kpiService.getAll(filters),
    staleTime: 30_000,
  })
}

export function useKpiIdsWithOpenActionPlans() {
  return useQuery({
    queryKey: [...KPI_QUERY_KEY, 'open-action-plans'],
    queryFn: kpiService.getKpiIdsWithOpenActionPlans,
    staleTime: 30_000,
  })
}

export function useMyKpis(profileId: string | undefined) {
  return useQuery({
    queryKey: [...KPI_QUERY_KEY, 'mine', profileId],
    queryFn: () => kpiService.getMine(profileId!),
    enabled: !!profileId,
    staleTime: 30_000,
  })
}
