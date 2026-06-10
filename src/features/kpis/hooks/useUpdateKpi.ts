import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { kpiService } from '@/features/kpis/kpi.service'
import type { KpiFormValues } from '@/features/kpis/kpi.schema'

import { KPI_QUERY_KEY } from './useKpis'

export function useUpdateKpi(actorId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, values }: { id: string; values: Partial<KpiFormValues> }) =>
      kpiService.update(id, values, actorId),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: KPI_QUERY_KEY })
      queryClient.setQueryData([...KPI_QUERY_KEY, updated.id], updated)
      toast.success('KPI atualizado.')
    },
    onError: () => toast.error('Erro ao atualizar KPI.'),
  })
}

export function useArchiveKpi(actorId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => kpiService.archive(id, actorId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: KPI_QUERY_KEY })
      toast.success('KPI arquivado.')
    },
    onError: () => toast.error('Erro ao arquivar KPI.'),
  })
}
