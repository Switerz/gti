import { supabase } from '@/lib/supabase'

import type { TaskAssignmentSummary } from './notification-utils'

type TaskSummaryRow = {
  title: string | null
  project: { name: string | null } | null
}

export const notificationService = {
  async getTaskAssignmentSummary(taskId: string): Promise<TaskAssignmentSummary | null> {
    const { data, error } = await supabase
      .from('tasks')
      .select('title, project:projects(name)')
      .eq('id', taskId)
      .maybeSingle()

    if (error) throw error

    const row = data as unknown as TaskSummaryRow | null
    if (!row) return null

    return {
      title: row.title,
      projectName: row.project?.name ?? null,
    }
  },
}
