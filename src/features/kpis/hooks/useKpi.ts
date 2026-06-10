import { useQuery } from '@tanstack/react-query'

import { kpiService } from '@/features/kpis/kpi.service'

import { KPI_QUERY_KEY } from './useKpis'

export function useKpi(id: string | undefined) {
  return useQuery({
    queryKey: [...KPI_QUERY_KEY, id],
    queryFn: () => kpiService.getById(id!),
    enabled: !!id,
    staleTime: 30_000,
  })
}
