import { useState } from 'react'

import { MessageSquare, Trash2 } from 'lucide-react'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import {
  useCreateComment,
  useDeleteComment,
  useTaskComments,
} from '@/hooks/useTaskComments'
import { formatRelative } from '@/lib/dates'
import type { Profile } from '@/types/domain'

interface Props {
  taskId: string
  currentProfile: Profile
}

export function TaskComments({ taskId, currentProfile }: Props) {
  const { data: comments = [], isLoading } = useTaskComments(taskId)
  const createComment = useCreateComment(taskId, currentProfile.id)
  const deleteComment = useDeleteComment(taskId)

  const [draft, setDraft] = useState('')

  async function handleSubmit() {
    const body = draft.trim()
    if (!body) return
    await createComment.mutateAsync(body)
    setDraft('')
  }

  const initials = (name?: string | null) =>
    name
      ?.split(' ')
      .slice(0, 2)
      .map((n) => n[0])
      .join('')
      .toUpperCase() ?? '?'

  return (
    <section className="space-y-4">
      <div className="flex items-center gap-2">
        <MessageSquare className="h-4 w-4 text-muted-foreground" />
        <h3 className="text-sm font-semibold">
          Comentários {comments.length > 0 && `(${comments.length})`}
        </h3>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="flex gap-3">
              <div className="h-8 w-8 shrink-0 animate-pulse rounded-full bg-muted" />
              <div className="flex-1 space-y-1.5">
                <div className="h-3 w-24 animate-pulse rounded bg-muted" />
                <div className="h-10 w-full animate-pulse rounded bg-muted" />
              </div>
            </div>
          ))}
        </div>
      ) : comments.length === 0 ? (
        <p className="text-sm text-muted-foreground">Nenhum comentário ainda.</p>
      ) : (
        <ul className="space-y-4">
          {comments.map((c) => (
            <li key={c.id} className="group flex gap-3">
              <Avatar className="h-8 w-8 shrink-0">
                <AvatarImage src={c.author?.avatar_url ?? undefined} />
                <AvatarFallback className="text-xs">
                  {initials(c.author?.full_name)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 space-y-1">
                <div className="flex items-baseline gap-2">
                  <span className="text-sm font-medium">
                    {c.author?.full_name ?? 'Usuário'}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {formatRelative(c.created_at)}
                  </span>
                  {c.author_id === currentProfile.id && (
                    <button
                      onClick={() => deleteComment.mutate(c.id)}
                      aria-label="Excluir comentário"
                      className="invisible ml-auto text-muted-foreground hover:text-destructive group-hover:visible"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
                <p className="whitespace-pre-wrap text-sm text-foreground">{c.body}</p>
              </div>
            </li>
          ))}
        </ul>
      )}

      {/* New comment form */}
      <div className="flex gap-3">
        <Avatar className="h-8 w-8 shrink-0">
          <AvatarImage src={currentProfile.avatar_url ?? undefined} />
          <AvatarFallback className="text-xs">{initials(currentProfile.full_name)}</AvatarFallback>
        </Avatar>
        <div className="flex flex-1 flex-col gap-2">
          <Textarea
            placeholder="Escreva um comentário..."
            rows={3}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) handleSubmit()
            }}
          />
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Ctrl+Enter para enviar</span>
            <Button
              size="sm"
              onClick={handleSubmit}
              disabled={!draft.trim() || createComment.isPending}
            >
              Comentar
            </Button>
          </div>
        </div>
      </div>
    </section>
  )
}
