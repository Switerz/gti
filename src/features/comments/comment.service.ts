/* eslint-disable @typescript-eslint/no-explicit-any */
import { supabase } from '@/lib/supabase'
import type { CommentWithAuthor } from '@/types/domain'

const SELECT = `*, author:profiles!author_id(id, full_name, avatar_url)` as const

export const commentService = {
  async getByTaskId(taskId: string): Promise<CommentWithAuthor[]> {
    const { data, error } = await supabase
      .from('task_comments')
      .select(SELECT)
      .eq('task_id', taskId)
      .order('created_at', { ascending: true })
    if (error) throw error
    return (data ?? []) as unknown as CommentWithAuthor[]
  },

  async create(taskId: string, authorId: string, body: string): Promise<CommentWithAuthor> {
    const { data, error } = await (supabase.from('task_comments') as any)
      .insert({ task_id: taskId, author_id: authorId, body })
      .select(SELECT)
      .single()
    if (error) throw error

    // Best-effort activity log
    void (supabase.from('task_activity_logs') as any).insert({
      task_id: taskId,
      actor_id: authorId,
      action: 'comment_added',
      metadata: null,
    })

    return data as unknown as CommentWithAuthor
  },

  async delete(id: string): Promise<void> {
    const { error } = await (supabase.from('task_comments') as any).delete().eq('id', id)
    if (error) throw error
  },
}
