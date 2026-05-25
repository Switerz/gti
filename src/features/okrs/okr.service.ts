/* eslint-disable @typescript-eslint/no-explicit-any */
import { supabase } from '@/lib/supabase'
import type { OkrObjectiveWithKRs } from '@/types/domain'

export const okrService = {
  async getAll(): Promise<OkrObjectiveWithKRs[]> {
    const { data, error } = await supabase
      .from('okr_objectives')
      .select('*, key_results:okr_key_results(*, milestones:okr_milestones(*))')
      .order('position', { ascending: true })

    if (error) throw error

    const sorted = (data ?? []) as unknown as OkrObjectiveWithKRs[]
    sorted.forEach((obj) => {
      obj.key_results.sort((a, b) => a.position - b.position)
      obj.key_results.forEach((kr) => {
        kr.milestones.sort((a, b) => a.position - b.position)
      })
    })
    return sorted
  },

  async updateKeyResult(
    id: string,
    values: { current_value?: number; notes?: string | null },
  ): Promise<void> {
    const { error } = await (supabase.from('okr_key_results') as any)
      .update({ ...values, updated_at: new Date().toISOString() })
      .eq('id', id)

    if (error) throw error
  },

  async updateMilestone(
    id: string,
    values: { current_value: number },
  ): Promise<void> {
    const { error } = await (supabase.from('okr_milestones') as any)
      .update({ ...values, updated_at: new Date().toISOString() })
      .eq('id', id)

    if (error) throw error
  },

  async addMilestone(params: {
    kr_id: string
    label: string
    current_value: number
    position: number
  }): Promise<void> {
    const { error } = await (supabase.from('okr_milestones') as any)
      .insert({
        kr_id: params.kr_id,
        label: params.label,
        current_value: params.current_value,
        target_value: params.current_value,
        position: params.position,
      })

    if (error) throw error
  },

  async deleteMilestone(id: string): Promise<void> {
    const { error } = await (supabase.from('okr_milestones') as any)
      .delete()
      .eq('id', id)

    if (error) throw error
  },
}
