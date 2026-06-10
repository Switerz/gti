import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { kpiService } from '@/features/kpis/kpi.service'
import type { KpiFormValues } from '@/features/kpis/kpi.schema'

import { KPI_QUERY_KEY } from './useKpis'

export function useCreateKpi(creatorId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (values: KpiFormValues) => kpiService.create(values, creatorId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: KPI_QUERY_KEY })
      toast.success('KPI criado com sucesso.')
    },
    onError: () => toast.error('Erro ao criar KPI.'),
  })
}
