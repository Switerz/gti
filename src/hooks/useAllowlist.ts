import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { allowlistService } from '@/features/allowlist/allowlist.service'
import { profileService } from '@/features/profiles/profile.service'
import type { UserRole } from '@/types/domain'

export function useAllowlist() {
  return useQuery({
    queryKey: ['allowlist'],
    queryFn: allowlistService.getAll,
    staleTime: 60_000,
  })
}

export function useAddAllowlistEntry() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ email, role }: { email: string; role: UserRole }) =>
      allowlistService.add(email, role),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['allowlist'] })
      toast.success('Email adicionado à allowlist.')
    },
    onError: () => toast.error('Erro ao adicionar email. Verifique se já existe.'),
  })
}

export function useUpdateAllowlistEntry() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({
      id,
      email,
      ...values
    }: {
      id: string
      email: string
      role?: UserRole
      active?: boolean
    }) => {
      await allowlistService.update(id, values)
      await profileService.updateByEmail(email, values)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['allowlist'] })
      queryClient.invalidateQueries({ queryKey: ['profiles'] })
      toast.success('Perfil atualizado.')
    },
    onError: () => toast.error('Erro ao atualizar perfil.'),
  })
}

export function useRemoveAllowlistEntry() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => allowlistService.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['allowlist'] })
      toast.success('Email removido da allowlist.')
    },
    onError: () => toast.error('Erro ao remover email.'),
  })
}
