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
    mutationFn: ({ id, values }: { id: string; values: { current_value?: number; notes?: string | null } }) =>
      okrService.updateKeyResult(id, values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['okrs'] })
      toast.success('KR atualizado.')
    },
    onError: () => toast.error('Erro ao atualizar KR.'),
  })
}

export function useUpdateMilestone() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, current_value }: { id: string; current_value: number }) =>
      okrService.updateMilestone(id, { current_value }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['okrs'] }),
    onError: () => toast.error('Erro ao atualizar marco.'),
  })
}

export function useAddMilestone() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (params: { kr_id: string; label: string; current_value: number; position: number }) =>
      okrService.addMilestone(params),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['okrs'] })
      toast.success('Projeto adicionado.')
    },
    onError: () => toast.error('Erro ao adicionar projeto.'),
  })
}

export function useDeleteMilestone() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => okrService.deleteMilestone(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['okrs'] })
      toast.success('Projeto removido.')
    },
    onError: () => toast.error('Erro ao remover projeto.'),
  })
}
