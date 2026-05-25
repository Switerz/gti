import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { okrService } from '@/features/okrs/okr.service'

export function useOkrs() {
  return useQuery({
    queryKey: ['okrs'],
    queryFn: okrService.getAll,
    staleTime: 5 * 60 * 1000,
  })
}

export function useUpdateKeyResult() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      id,
      values,
    }: {
      id: string
      values: { current_value?: number; notes?: string | null }
    }) => okrService.updateKeyResult(id, values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['okrs'] })
      toast.success('KR atualizado.')
    },
    onError: () => toast.error('Erro ao atualizar KR.'),
  })
}
