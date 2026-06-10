import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { kpiService } from '@/features/kpis/kpi.service'
import type { KpiWeeklyValueFormValues } from '@/features/kpis/kpi.schema'
import { evaluateKpiValue } from '@/features/kpis/kpi-utils'
import type { KpiTargetOperator, KpiWithRelations } from '@/types/domain'

import { KPI_QUERY_KEY } from './useKpis'

type UpsertContext = {
  previousKpiQueries: Array<[readonly unknown[], unknown]>
}

export function useKpiWeeklyValues(kpiId: string | undefined) {
  return useQuery({
    queryKey: [...KPI_QUERY_KEY, kpiId, 'weekly-values'],
    queryFn: () => kpiService.getWeeklyValues(kpiId!),
    enabled: !!kpiId,
    staleTime: 30_000,
  })
}

export function useUpsertKpiWeeklyValue(actorId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (values: KpiWeeklyValueFormValues) => kpiService.upsertWeeklyValue(values, actorId),
    onMutate: async (values): Promise<UpsertContext> => {
      await queryClient.cancelQueries({ queryKey: KPI_QUERY_KEY })
      const previousKpiQueries = queryClient.getQueriesData({ queryKey: KPI_QUERY_KEY })

      previousKpiQueries.forEach(([queryKey, cached]) => {
        if (!Array.isArray(cached)) return

        queryClient.setQueryData(
          queryKey,
          cached.map((kpi) => {
            const item = kpi as KpiWithRelations
            if (item.id !== values.kpiId) return item

            const status =
              item.format_kind === 'text'
                ? values.valueText
                  ? 'neutral'
                  : 'missing'
                : evaluateKpiValue(
                    values.value ?? null,
                    item.target_value,
                    item.target_operator as KpiTargetOperator,
                  )

            const optimisticValue = {
              id: `optimistic-${values.kpiId}-${values.isoYear}-${values.isoWeek}`,
              kpi_id: values.kpiId,
              iso_year: values.isoYear,
              iso_week: values.isoWeek,
              week_start: values.weekStart,
              week_end: values.weekEnd,
              value: item.format_kind === 'text' ? null : values.value ?? null,
              value_text: item.format_kind === 'text' ? values.valueText ?? null : null,
              target_value_snapshot: item.target_value,
              target_operator_snapshot: item.target_operator,
              status,
              notes: values.notes ?? null,
              created_by: actorId,
              updated_by: actorId,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            }

            return {
              ...item,
              weekly_values: [
                ...item.weekly_values.filter(
                  (value) =>
                    !(value.iso_year === values.isoYear && value.iso_week === values.isoWeek),
                ),
                optimisticValue,
              ],
            }
          }),
        )
      })

      return { previousKpiQueries }
    },
    onSuccess: (weeklyValue) => {
      queryClient.invalidateQueries({ queryKey: KPI_QUERY_KEY })
      queryClient.invalidateQueries({
        queryKey: [...KPI_QUERY_KEY, weeklyValue.kpi_id, 'weekly-values'],
      })
      toast.success('Valor semanal salvo.')
    },
    onError: (_error, _values, context) => {
      context?.previousKpiQueries.forEach(([queryKey, value]) => {
        queryClient.setQueryData(queryKey, value)
      })
      toast.error('Erro ao salvar valor semanal.')
    },
  })
}
