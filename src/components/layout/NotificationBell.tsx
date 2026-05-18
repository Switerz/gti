import { Bell, CheckCheck } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useCurrentProfile } from '@/hooks/useCurrentProfile'
import { useTaskNotifications } from '@/hooks/useTaskNotifications'
import { cn } from '@/lib/utils'

function formatNotificationTime(value: string) {
  const formatter = new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })

  return formatter.format(new Date(value))
}

export function NotificationBell() {
  const navigate = useNavigate()
  const { data: currentProfile } = useCurrentProfile()
  const { notifications, unreadCount, markAsRead, markAllAsRead, clear } =
    useTaskNotifications(currentProfile?.id)

  function openTask(notificationId: string, taskId: string) {
    markAsRead(notificationId)
    navigate(`/tasks/${taskId}`)
  }

  return (
    <Popover
      onOpenChange={(open) => {
        if (!open) markAllAsRead()
      }}
    >
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="relative"
          aria-label={
            unreadCount > 0
              ? `${unreadCount} notificacoes nao lidas`
              : 'Abrir notificacoes'
          }
        >
          <Bell />
          {unreadCount > 0 && (
            <span className="absolute right-1.5 top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-semibold leading-none text-primary-foreground">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-[min(22rem,calc(100vw-2rem))] p-0">
        <div className="flex items-center justify-between border-b px-3 py-2">
          <div>
            <p className="text-sm font-semibold">Notificacoes</p>
            <p className="text-xs text-muted-foreground">
              Tarefas atribuidas a voce
            </p>
          </div>
          <div className="flex items-center gap-1">
            {unreadCount > 0 && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                aria-label="Marcar todas como lidas"
                onClick={markAllAsRead}
              >
                <CheckCheck />
              </Button>
            )}
            {notifications.length > 0 && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-8 px-2 text-xs"
                onClick={clear}
              >
                Limpar
              </Button>
            )}
          </div>
        </div>

        {notifications.length === 0 ? (
          <div className="px-4 py-8 text-center">
            <p className="text-sm font-medium">Sem novidades</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Novas atribuicoes aparecem aqui.
            </p>
          </div>
        ) : (
          <ScrollArea className="max-h-80">
            <div className="p-2">
              {notifications.map((notification) => (
                <button
                  key={notification.id}
                  type="button"
                  className={cn(
                    'w-full rounded-md px-3 py-2 text-left transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                    !notification.read && 'bg-primary/5',
                  )}
                  onClick={() => openTask(notification.id, notification.taskId)}
                >
                  <div className="flex items-start gap-2">
                    <span
                      className={cn(
                        'mt-1.5 h-2 w-2 shrink-0 rounded-full',
                        notification.read ? 'bg-muted-foreground/30' : 'bg-primary',
                      )}
                    />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium">
                        {notification.taskTitle}
                      </span>
                      <span className="mt-0.5 block truncate text-xs text-muted-foreground">
                        {notification.projectName ?? 'Tarefa sem projeto'}
                      </span>
                      <span className="mt-1 block text-[11px] text-muted-foreground/80">
                        {formatNotificationTime(notification.createdAt)}
                      </span>
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </ScrollArea>
        )}
      </PopoverContent>
    </Popover>
  )
}
