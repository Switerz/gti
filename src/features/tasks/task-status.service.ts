import { supabase } from '@/lib/supabase'
import type { TaskStatus } from '@/types/domain'

export const taskStatusService = {
  async getAll(): Promise<TaskStatus[]> {
    const { data, error } = await supabase
      .from('task_statuses')
      .select('*')
      .order('position', { ascending: true })

    if (error) throw error
    return data ?? []
  },
}
