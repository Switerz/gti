import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { kpiService } from '@/features/kpis/kpi.service'
import type { KpiActionPlanFormValues } from '@/features/kpis/kpi.schema'

import { KPI_QUERY_KEY } from './useKpis'

export function useKpiActionPlans(kpiId: string | undefined) {
  return useQuery({
    queryKey: [...KPI_QUERY_KEY, kpiId, 'action-plans'],
    queryFn: () => kpiService.getActionPlans(kpiId!),
    enabled: !!kpiId,
    staleTime: 30_000,
  })
}

export function useCreateKpiActionPlan(actorId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (values: KpiActionPlanFormValues) => kpiService.createActionPlan(values, actorId),
    onSuccess: (plan) => {
      queryClient.invalidateQueries({ queryKey: [...KPI_QUERY_KEY, plan.kpi_id, 'action-plans'] })
      queryClient.invalidateQueries({ queryKey: KPI_QUERY_KEY })
      toast.success('Plano de ação criado.')
    },
    onError: () => toast.error('Erro ao criar plano de ação.'),
  })
}

export function useUpdateKpiActionPlan(actorId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      id,
      kpiId,
      values,
    }: {
      id: string
      kpiId: string
      values: Partial<KpiActionPlanFormValues>
    }) => kpiService.updateActionPlan(id, kpiId, values, actorId),
    onSuccess: (plan) => {
      queryClient.invalidateQueries({ queryKey: [...KPI_QUERY_KEY, plan.kpi_id, 'action-plans'] })
      toast.success('Plano de ação atualizado.')
    },
    onError: () => toast.error('Erro ao atualizar plano de ação.'),
  })
}

export function useDeleteKpiActionPlan() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => kpiService.deleteActionPlan(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: KPI_QUERY_KEY })
      toast.success('Plano de ação removido.')
    },
    onError: () => toast.error('Erro ao remover plano de ação.'),
  })
}
