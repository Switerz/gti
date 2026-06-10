import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { kpiService } from '@/features/kpis/kpi.service'
import type { KpiOffenderFormValues } from '@/features/kpis/kpi.schema'

import { KPI_QUERY_KEY } from './useKpis'

export function useKpiOffenders(kpiId: string | undefined) {
  return useQuery({
    queryKey: [...KPI_QUERY_KEY, kpiId, 'offenders'],
    queryFn: () => kpiService.getOffenders(kpiId!),
    enabled: !!kpiId,
    staleTime: 30_000,
  })
}

export function useCreateKpiOffender(actorId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (values: KpiOffenderFormValues) => kpiService.createOffender(values, actorId),
    onSuccess: (offender) => {
      queryClient.invalidateQueries({ queryKey: [...KPI_QUERY_KEY, offender.kpi_id, 'offenders'] })
      queryClient.invalidateQueries({ queryKey: KPI_QUERY_KEY })
      toast.success('Ofensor adicionado.')
    },
    onError: () => toast.error('Erro ao adicionar ofensor.'),
  })
}

export function useUpdateKpiOffender(actorId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      id,
      kpiId,
      values,
    }: {
      id: string
      kpiId: string
      values: Partial<KpiOffenderFormValues>
    }) => kpiService.updateOffender(id, kpiId, values, actorId),
    onSuccess: (offender) => {
      queryClient.invalidateQueries({ queryKey: [...KPI_QUERY_KEY, offender.kpi_id, 'offenders'] })
      toast.success('Ofensor atualizado.')
    },
    onError: () => toast.error('Erro ao atualizar ofensor.'),
  })
}

export function useDeleteKpiOffender() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => kpiService.deleteOffender(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: KPI_QUERY_KEY })
      toast.success('Ofensor removido.')
    },
    onError: () => toast.error('Erro ao remover ofensor.'),
  })
}
