import { isAfter, parseISO, startOfToday, subDays } from 'date-fns'
import { Activity, AlertOctagon, CalendarClock, CheckCircle2 } from 'lucide-react'
import { Link } from 'react-router-dom'

import { TaskDueDateBadge } from '@/components/tasks/TaskDueDateBadge'
import { TaskPriorityBadge } from '@/components/tasks/TaskPriorityBadge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { useCurrentProfile } from '@/hooks/useCurrentProfile'
import { useTaskStatuses } from '@/hooks/useTaskStatuses'
import { useTasks } from '@/hooks/useTasks'
import { useMyTasks } from '@/hooks/useTasks'
import { isPastDue } from '@/lib/dates'
import type { TaskPriority, TaskWithRelations } from '@/types/domain'
import { PageHeader } from './PageHeader'

// ── KPI card ──────────────────────────────────────────────────────────────────

interface KpiProps {
  label: string
  value: number | string
  icon: React.ComponentType<{ className?: string }>
  loading?: boolean
  highlight?: 'warning' | 'danger'
}

function KpiCard({ label, value, icon: Icon, loading, highlight }: KpiProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
        <Icon
          className={
            highlight === 'danger'
              ? 'h-4 w-4 text-destructive'
              : highlight === 'warning'
                ? 'h-4 w-4 text-amber-500'
                : 'h-4 w-4 text-primary'
          }
        />
      </CardHeader>
      <CardContent>
        {loading ? (
          <Skeleton className="h-9 w-16" />
        ) : (
          <div
            className={
              'text-3xl font-semibold' +
              (highlight === 'danger' ? ' text-destructive' : '') +
              (highlight === 'warning' ? ' text-amber-600' : '')
            }
          >
            {value}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// ── Upcoming tasks ────────────────────────────────────────────────────────────

function UpcomingTasks({ tasks, loading }: { tasks: TaskWithRelations[]; loading: boolean }) {
  const upcoming = tasks
    .filter((t) => t.due_date && !t.status?.is_final)
    .sort((a, b) => (a.due_date ?? '').localeCompare(b.due_date ?? ''))
    .slice(0, 7)

  return (
    <Card className="flex flex-col">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-semibold">Meus prazos próximos</CardTitle>
      </CardHeader>
      <CardContent className="flex-1 space-y-1">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 py-1.5">
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-4 flex-1" />
              <Skeleton className="h-4 w-12" />
            </div>
          ))
        ) : upcoming.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">
            Nenhuma tarefa com prazo pendente.
          </p>
        ) : (
          upcoming.map((t) => (
            <div
              key={t.id}
              className="flex items-center gap-3 rounded-md px-1 py-1.5 hover:bg-muted/40"
            >
              <TaskDueDateBadge
                dueDate={t.due_date}
                isFinal={t.status?.is_final}
                isArchived={t.is_archived}
              />
              <Link
                to={`/tasks/${t.id}`}
                className="flex-1 truncate text-sm hover:text-primary hover:underline"
              >
                {t.title}
              </Link>
              <TaskPriorityBadge priority={t.priority as TaskPriority} />
            </div>
          ))
        )}
      </CardContent>
    </Card>
  )
}

// ── Status distribution ───────────────────────────────────────────────────────

function StatusDistribution({
  tasks,
  loading,
}: {
  tasks: TaskWithRelations[]
  loading: boolean
}) {
  const { data: statuses = [] } = useTaskStatuses()

  const distribution = statuses
    .filter((s) => s.slug !== 'archived')
    .map((s) => ({
      ...s,
      count: tasks.filter((t) => t.status_id === s.id).length,
    }))

  const total = distribution.reduce((sum, d) => sum + d.count, 0)
  const maxCount = Math.max(...distribution.map((d) => d.count), 1)

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-semibold">
          Distribuição por status
          {!loading && total > 0 && (
            <span className="ml-2 font-normal text-muted-foreground">
              ({total} tarefa{total !== 1 ? 's' : ''})
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {loading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="space-y-1">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-2 w-full" />
            </div>
          ))
        ) : (
          distribution.map((d) => (
            <div key={d.id} className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5">
                  <div
                    className="h-2 w-2 rounded-full"
                    style={{ backgroundColor: d.color ?? '#888' }}
                  />
                  <span className="text-muted-foreground">{d.name}</span>
                </div>
                <span className="font-medium">{d.count}</span>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full transition-all"
                  style={{
                    width: `${(d.count / maxCount) * 100}%`,
                    backgroundColor: d.color ?? '#888',
                  }}
                />
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export function DashboardPage() {
  const { data: currentProfile } = useCurrentProfile()
  const { data: myTasks = [], isLoading: myLoading } = useMyTasks(currentProfile?.id)
  const { data: allTasks = [], isLoading: allLoading } = useTasks()

  const today = startOfToday()
  const weekAgo = subDays(today, 7)

  const openCount = myTasks.filter((t) => !t.status?.is_final).length
  const overdueCount = myTasks.filter((t) =>
    isPastDue(t.due_date, t.status?.is_final, t.is_archived),
  ).length
  const blockedCount = allTasks.filter((t) => t.status?.slug === 'blocked').length
  const completedThisWeek = allTasks.filter(
    (t) => t.completed_at && isAfter(parseISO(t.completed_at), weekAgo),
  ).length

  return (
    <section className="space-y-6">
      <PageHeader
        title="Dashboard"
        description="Visão executiva das tarefas da equipe de Transportes."
      />

      {/* KPI row */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          label="Minhas abertas"
          value={openCount}
          icon={Activity}
          loading={myLoading}
        />
        <KpiCard
          label="Atrasadas (minhas)"
          value={overdueCount}
          icon={CalendarClock}
          loading={myLoading}
          highlight={overdueCount > 0 ? 'danger' : undefined}
        />
        <KpiCard
          label="Bloqueadas (equipe)"
          value={blockedCount}
          icon={AlertOctagon}
          loading={allLoading}
          highlight={blockedCount > 0 ? 'warning' : undefined}
        />
        <KpiCard
          label="Concluídas na semana"
          value={completedThisWeek}
          icon={CheckCircle2}
          loading={allLoading}
        />
      </div>

      {/* Bottom panels */}
      <div className="grid gap-4 xl:grid-cols-[1.4fr_1fr]">
        <UpcomingTasks tasks={myTasks} loading={myLoading} />
        <StatusDistribution tasks={allTasks} loading={allLoading} />
      </div>
    </section>
  )
}
