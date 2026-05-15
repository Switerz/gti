import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { categoryService } from '@/features/categories/category.service'

const QK = ['categories'] as const

export function useCategories() {
  return useQuery({
    queryKey: QK,
    queryFn: categoryService.getAll,
    staleTime: Infinity,
  })
}

export function useCategoriesAdmin() {
  return useQuery({
    queryKey: [...QK, 'admin'],
    queryFn: categoryService.getAllForAdmin,
    staleTime: 30_000,
  })
}

export function useCreateCategory() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ name, color }: { name: string; color: string | null }) =>
      categoryService.create(name, color),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QK })
      toast.success('Categoria criada.')
    },
    onError: () => toast.error('Erro ao criar categoria.'),
  })
}

export function useUpdateCategory() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({
      id,
      ...values
    }: { id: string; name?: string; color?: string | null; active?: boolean }) =>
      categoryService.update(id, values),
    onSuccess: () => qc.invalidateQueries({ queryKey: QK }),
    onError: () => toast.error('Erro ao atualizar categoria.'),
  })
}

export function useRemoveCategory() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => categoryService.remove(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QK })
      toast.success('Categoria removida.')
    },
    onError: () =>
      toast.error('Não foi possível remover. A categoria pode estar em uso por tarefas.'),
  })
}
