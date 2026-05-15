import { Activity } from 'lucide-react'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { useTaskActivity } from '@/hooks/useTaskActivity'
import { formatDateTime } from '@/lib/dates'

const ACTION_LABELS: Record<string, string> = {
  task_created: 'criou a tarefa',
  task_updated: 'atualizou a tarefa',
  status_changed: 'mudou o status',
  assignee_added: 'adicionou um responsável',
  assignee_removed: 'removeu um responsável',
  comment_added: 'adicionou um comentário',
  checklist_item_done: 'marcou item no checklist',
  task_archived: 'arquivou a tarefa',
  task_deleted: 'excluiu a tarefa',
}

interface Props {
  taskId: string
}

export function TaskActivityLog({ taskId }: Props) {
  const { data: events = [], isLoading } = useTaskActivity(taskId)

  const initials = (name?: string | null) =>
    name
      ?.split(' ')
      .slice(0, 2)
      .map((n) => n[0])
      .join('')
      .toUpperCase() ?? '?'

  return (
    <section className="space-y-3">
      <div className="flex items-center gap-2">
        <Activity className="h-4 w-4 text-muted-foreground" />
        <h3 className="text-sm font-semibold">Histórico</h3>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-4 w-full animate-pulse rounded bg-muted" />
          ))}
        </div>
      ) : events.length === 0 ? (
        <p className="text-xs text-muted-foreground">Nenhuma atividade registrada.</p>
      ) : (
        <ul className="space-y-2.5">
          {events.map((e) => (
            <li key={e.id} className="flex items-center gap-2 text-xs text-muted-foreground">
              <Avatar className="h-5 w-5 shrink-0">
                <AvatarImage src={e.actor?.avatar_url ?? undefined} />
                <AvatarFallback className="text-[9px]">{initials(e.actor?.full_name)}</AvatarFallback>
              </Avatar>
              <span>
                <span className="font-medium text-foreground">
                  {e.actor?.full_name ?? 'Sistema'}
                </span>{' '}
                {ACTION_LABELS[e.action] ?? e.action}
              </span>
              <span className="ml-auto shrink-0">{formatDateTime(e.created_at)}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
