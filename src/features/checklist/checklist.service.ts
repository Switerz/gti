/* eslint-disable @typescript-eslint/no-explicit-any */
import { supabase } from '@/lib/supabase'
import type { TaskChecklistItem } from '@/types/domain'

export const checklistService = {
  async getByTaskId(taskId: string): Promise<TaskChecklistItem[]> {
    const { data, error } = await supabase
      .from('task_checklist_items')
      .select('*')
      .eq('task_id', taskId)
      .order('position', { ascending: true })
      .order('created_at', { ascending: true })
    if (error) throw error
    return (data ?? []) as unknown as TaskChecklistItem[]
  },

  async create(
    taskId: string,
    title: string,
    position: number,
    actorId?: string,
  ): Promise<TaskChecklistItem> {
    const { data, error } = await (supabase.from('task_checklist_items') as any)
      .insert({ task_id: taskId, title, position })
      .select('*')
      .single()
    if (error) throw error

    if (actorId) {
      await (supabase.from('task_activity_logs') as any).insert({
        task_id: taskId,
        actor_id: actorId,
        action: 'task_updated',
        metadata: { checklist_item_id: data.id, checklist_item_title: title },
      })
    }

    return data as unknown as TaskChecklistItem
  },

  async toggle(id: string, isDone: boolean, actorId?: string): Promise<TaskChecklistItem> {
    const { data, error } = await (supabase.from('task_checklist_items') as any)
      .update({ is_done: isDone })
      .eq('id', id)
      .select('*')
      .single()
    if (error) throw error

    if (actorId && isDone) {
      await (supabase.from('task_activity_logs') as any).insert({
        task_id: data.task_id,
        actor_id: actorId,
        action: 'checklist_item_done',
        metadata: { checklist_item_id: data.id, checklist_item_title: data.title },
      })
    }

    return data as unknown as TaskChecklistItem
  },

  async delete(id: string): Promise<void> {
    const { error } = await (supabase.from('task_checklist_items') as any).delete().eq('id', id)
    if (error) throw error
  },
}
