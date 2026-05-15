import { supabase } from '@/lib/supabase'
import type { ActivityLogWithActor } from '@/types/domain'

const SELECT = `*, actor:profiles!actor_id(id, full_name, avatar_url)` as const

export const activityService = {
  async getByTaskId(taskId: string): Promise<ActivityLogWithActor[]> {
    const { data, error } = await supabase
      .from('task_activity_logs')
      .select(SELECT)
      .eq('task_id', taskId)
      .order('created_at', { ascending: false })
      .limit(50)
    if (error) throw error
    return (data ?? []) as unknown as ActivityLogWithActor[]
  },
}
