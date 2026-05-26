import { isAfter, parseISO, startOfToday, subDays } from 'date-fns'
import { Activity, AlertOctagon, CalendarClock, CheckCircle2, Clock, FolderKanban, Scale, Tag, TrendingUp, Users, Zap } from 'lucide-react'
import { Link } from 'react-router-dom'

import { TaskDueDateBadge } from '@/components/tasks/TaskDueDateBadge'
import { TaskPriorityBadge } from '@/components/tasks/TaskPriorityBadge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { useCurrentProfile } from '@/hooks/useCurrentProfile'
import { useProfiles } from '@/hooks/useProfiles'
import { useTaskStatuses } from '@/hooks/useTaskStatuses'
import { useTasks, useMyTasks } from '@/hooks/useTasks'
import { formatDate, isPastDue } from '@/lib/dates'
import { isLead } from '@/lib/permissions'
import type { Profile, TaskPriority, TaskWithRelations } from '@/types/domain'
import { PageHeader } from './PageHeader'

// ── helpers ───────────────────────────────────────────────────────────────────

function initials(name?: string | null) {
  return (
    name
      ?.split(' ')
      .slice(0, 2)
      .map((n) => n[0])
      .join('')
      .toUpperCase() ?? '?'
  )
}

function tasksBelongToMember(tasks: TaskWithRelations[], profileId: string) {
  return tasks.filter(
    (t) =>
      t.owner_id === profileId || t.assignees.some((a) => a.profile.id === profileId),
  )
}

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

function StatusDistribution({ tasks, loading }: { tasks: TaskWithRelations[]; loading: boolean }) {
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

// ── Manager: member workload ──────────────────────────────────────────────────

function MemberWorkload({
  profiles,
  tasks,
  loading,
}: {
  profiles: Profile[]
  tasks: TaskWithRelations[]
  loading: boolean
}) {
  const active = profiles.filter((p) => p.active)
  const openTasks = tasks.filter((t) => !t.status?.is_final && !t.is_archived)

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm font-semibold">
          <Users className="h-4 w-4 text-primary" />
          Carga por membro
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-24 w-full rounded-lg" />
            ))}
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {active.map((p) => {
              const memberTasks = tasksBelongToMember(openTasks, p.id)
              const overdue = memberTasks.filter((t) =>
                isPastDue(t.due_date, t.status?.is_final, t.is_archived),
              )
              const estHours = memberTasks.reduce(
                (sum, t) => sum + (t.estimated_hours ?? 0),
                0,
              )

              return (
                <div
                  key={p.id}
                  className="flex flex-col gap-2 rounded-lg border bg-card p-3 transition-colors hover:bg-muted/30"
                >
                  <div className="flex items-center gap-2">
                    <Avatar className="h-7 w-7 shrink-0">
                      <AvatarImage src={p.avatar_url ?? undefined} />
                      <AvatarFallback className="text-[10px]">
                        {initials(p.full_name)}
                      </AvatarFallback>
                    </Avatar>
                    <span className="min-w-0 flex-1 truncate text-sm font-medium">
                      {p.full_name?.split(' ')[0] ?? p.email}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">
                      {memberTasks.length} tarefa{memberTasks.length !== 1 ? 's' : ''}
                    </span>
                    {overdue.length > 0 && (
                      <span className="font-semibold text-destructive">
                        {overdue.length} atrasada{overdue.length !== 1 ? 's' : ''}
                      </span>
                    )}
                  </div>
                  {estHours > 0 && (
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      {estHours}h estimadas
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// ── Manager: overdue by member ────────────────────────────────────────────────

function OverdueByMember({
  profiles,
  tasks,
  loading,
}: {
  profiles: Profile[]
  tasks: TaskWithRelations[]
  loading: boolean
}) {
  const overdue = tasks.filter((t) =>
    isPastDue(t.due_date, t.status?.is_final, t.is_archived),
  )

  const byMember = profiles
    .map((p) => ({
      profile: p,
      tasks: overdue.filter(
        (t) =>
          t.owner_id === p.id || t.assignees.some((a) => a.profile.id === p.id),
      ),
    }))
    .filter((m) => m.tasks.length > 0)
    .sort((a, b) => b.tasks.length - a.tasks.length)

  return (
    <Card className="flex flex-col">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm font-semibold">
          <AlertOctagon className="h-4 w-4 text-destructive" />
          Tarefas em atraso
          {!loading && overdue.length > 0 && (
            <span className="ml-1 rounded-full bg-destructive/10 px-1.5 py-0.5 text-xs font-semibold text-destructive">
              {overdue.length}
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 space-y-4">
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-3/4" />
            </div>
          ))
        ) : byMember.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">
            Nenhuma tarefa em atraso.
          </p>
        ) : (
          byMember.map(({ profile: p, tasks: mt }) => (
            <div key={p.id} className="space-y-1.5">
              <div className="flex items-center gap-2">
                <Avatar className="h-5 w-5">
                  <AvatarImage src={p.avatar_url ?? undefined} />
                  <AvatarFallback className="text-[9px]">{initials(p.full_name)}</AvatarFallback>
                </Avatar>
                <span className="text-xs font-semibold">
                  {p.full_name?.split(' ')[0] ?? p.email}
                </span>
                <span className="text-xs text-muted-foreground">
                  ({mt.length} tarefa{mt.length !== 1 ? 's' : ''})
                </span>
              </div>
              <div className="ml-7 space-y-1">
                {mt.slice(0, 3).map((t) => (
                  <div key={t.id} className="flex items-center gap-2">
                    <Link
                      to={`/tasks/${t.id}`}
                      className="flex-1 truncate text-xs text-muted-foreground hover:text-foreground hover:underline"
                    >
                      {t.title}
                    </Link>
                    <span className="shrink-0 text-[10px] text-destructive">
                      {formatDate(t.due_date)}
                    </span>
                  </div>
                ))}
                {mt.length > 3 && (
                  <p className="text-[10px] text-muted-foreground">
                    +{mt.length - 3} mais
                  </p>
                )}
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  )
}

// ── Manager: category insights ────────────────────────────────────────────────

function CategoryInsights({
  tasks,
  loading,
}: {
  tasks: TaskWithRelations[]
  loading: boolean
}) {
  const openTasks = tasks.filter((t) => !t.status?.is_final && !t.is_archived)

  const categoryMap = new Map<
    string,
    { name: string; color: string | null; count: number; hours: number }
  >()

  for (const t of openTasks) {
    if (!t.category) continue
    const entry = categoryMap.get(t.category.id) ?? {
      name: t.category.name,
      color: t.category.color,
      count: 0,
      hours: 0,
    }
    entry.count++
    entry.hours += t.estimated_hours ?? 0
    categoryMap.set(t.category.id, entry)
  }

  const sorted = Array.from(categoryMap.values()).sort((a, b) => b.count - a.count)
  const maxCount = Math.max(...sorted.map((c) => c.count), 1)

  return (
    <Card className="flex flex-col">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm font-semibold">
          <Tag className="h-4 w-4 text-primary" />
          Top categorias
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 space-y-3">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="space-y-1">
              <Skeleton className="h-3 w-28" />
              <Skeleton className="h-2 w-full" />
            </div>
          ))
        ) : sorted.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">
            Nenhuma categoria com tarefas abertas.
          </p>
        ) : (
          sorted.map((c) => (
            <div key={c.name} className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5">
                  <div
                    className="h-2 w-2 shrink-0 rounded-full"
                    style={{ backgroundColor: c.color ?? '#888' }}
                  />
                  <span className="text-muted-foreground">{c.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  {c.hours > 0 && (
                    <span className="text-muted-foreground">{c.hours}h</span>
                  )}
                  <span className="font-medium">{c.count}</span>
                </div>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full transition-all"
                  style={{
                    width: `${(c.count / maxCount) * 100}%`,
                    backgroundColor: c.color ?? '#888',
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

// ── Manager: recently completed ───────────────────────────────────────────────

function RecentlyCompleted({
  tasks,
  loading,
}: {
  tasks: TaskWithRelations[]
  loading: boolean
}) {
  const weekAgo = subDays(startOfToday(), 7)
  const recent = tasks
    .filter((t) => t.completed_at && isAfter(parseISO(t.completed_at), weekAgo))
    .sort((a, b) => (b.completed_at ?? '').localeCompare(a.completed_at ?? ''))
    .slice(0, 10)

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm font-semibold">
          <TrendingUp className="h-4 w-4 text-primary" />
          Concluídas nos últimos 7 dias
          {!loading && recent.length > 0 && (
            <span className="ml-1 font-normal text-muted-foreground">({recent.length})</span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 py-2">
              <Skeleton className="h-5 w-5 rounded-full" />
              <Skeleton className="h-4 flex-1" />
              <Skeleton className="h-4 w-16" />
            </div>
          ))
        ) : recent.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">
            Nenhuma tarefa concluída nos últimos 7 dias.
          </p>
        ) : (
          <div className="divide-y">
            {recent.map((t) => (
              <div key={t.id} className="flex items-center gap-3 py-2">
                <Avatar className="h-5 w-5 shrink-0">
                  <AvatarImage src={t.owner?.avatar_url ?? undefined} />
                  <AvatarFallback className="text-[9px]">
                    {initials(t.owner?.full_name)}
                  </AvatarFallback>
                </Avatar>
                <Link
                  to={`/tasks/${t.id}`}
                  className="flex-1 truncate text-sm hover:text-primary hover:underline"
                >
                  {t.title}
                </Link>
                <div className="flex shrink-0 items-center gap-2">
                  {t.estimated_hours != null && (
                    <span className="text-xs text-muted-foreground">{t.estimated_hours}h</span>
                  )}
                  <TaskPriorityBadge priority={t.priority as TaskPriority} />
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// ── Manager: hours by category (top 5) ───────────────────────────────────────

function HoursByCategory({ tasks, loading }: { tasks: TaskWithRelations[]; loading: boolean }) {
  const openTasks = tasks.filter((t) => !t.status?.is_final && !t.is_archived)

  const map = new Map<string, { name: string; color: string | null; count: number; hours: number }>()
  for (const t of openTasks) {
    if (!t.category) continue
    const e = map.get(t.category.id) ?? { name: t.category.name, color: t.category.color, count: 0, hours: 0 }
    e.count++
    e.hours += t.estimated_hours ?? 0
    map.set(t.category.id, e)
  }

  const sorted = Array.from(map.values())
    .filter((c) => c.hours > 0)
    .sort((a, b) => b.hours - a.hours)
    .slice(0, 5)
  const maxHours = Math.max(...sorted.map((c) => c.hours), 1)

  return (
    <Card className="flex flex-col">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm font-semibold">
          <Tag className="h-4 w-4 text-primary" />
          Horas por categoria
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 space-y-3">
        {loading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="space-y-1">
              <Skeleton className="h-3 w-28" />
              <Skeleton className="h-2 w-full" />
            </div>
          ))
        ) : sorted.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">
            Nenhuma categoria com horas estimadas.
          </p>
        ) : (
          sorted.map((c) => (
            <div key={c.name} className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5">
                  <div
                    className="h-2 w-2 shrink-0 rounded-full"
                    style={{ backgroundColor: c.color ?? '#888' }}
                  />
                  <span className="text-muted-foreground">{c.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold">{c.hours}h</span>
                  <span className="text-muted-foreground">({c.count})</span>
                </div>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full transition-all"
                  style={{ width: `${(c.hours / maxHours) * 100}%`, backgroundColor: c.color ?? '#888' }}
                />
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  )
}

// ── Manager: hours by project (top 5) ────────────────────────────────────────

const PROJECT_COLORS = ['#6366f1', '#8b5cf6', '#06b6d4', '#10b981', '#f59e0b']

function HoursByProject({ tasks, loading }: { tasks: TaskWithRelations[]; loading: boolean }) {
  const openTasks = tasks.filter((t) => !t.status?.is_final && !t.is_archived)

  const map = new Map<string, { name: string; count: number; hours: number }>()
  for (const t of openTasks) {
    if (!t.project) continue
    const e = map.get(t.project.id) ?? { name: t.project.name, count: 0, hours: 0 }
    e.count++
    e.hours += t.estimated_hours ?? 0
    map.set(t.project.id, e)
  }

  const sorted = Array.from(map.values())
    .filter((p) => p.hours > 0)
    .sort((a, b) => b.hours - a.hours)
    .slice(0, 5)
  const maxHours = Math.max(...sorted.map((p) => p.hours), 1)

  return (
    <Card className="flex flex-col">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm font-semibold">
          <FolderKanban className="h-4 w-4 text-primary" />
          Horas por projeto
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 space-y-3">
        {loading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="space-y-1">
              <Skeleton className="h-3 w-28" />
              <Skeleton className="h-2 w-full" />
            </div>
          ))
        ) : sorted.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">
            Nenhum projeto com horas estimadas.
          </p>
        ) : (
          sorted.map((p, i) => (
            <div key={p.name} className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5">
                  <div
                    className="h-2 w-2 shrink-0 rounded-full"
                    style={{ backgroundColor: PROJECT_COLORS[i] }}
                  />
                  <span className="max-w-[160px] truncate text-muted-foreground">{p.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold">{p.hours}h</span>
                  <span className="text-muted-foreground">({p.count})</span>
                </div>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full transition-all"
                  style={{ width: `${(p.hours / maxHours) * 100}%`, backgroundColor: PROJECT_COLORS[i] }}
                />
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  )
}

// ── Manager: estimate vs actual per member ────────────────────────────────────

function EstimateVsActual({
  profiles,
  tasks,
  loading,
}: {
  profiles: Profile[]
  tasks: TaskWithRelations[]
  loading: boolean
}) {
  const tracked = tasks.filter((t) => t.estimated_hours != null && t.actual_hours != null)

  const byMember = profiles
    .map((p) => {
      const mt = tracked.filter(
        (t) => t.owner_id === p.id || t.assignees.some((a) => a.profile.id === p.id),
      )
      const estimated = mt.reduce((sum, t) => sum + (t.estimated_hours ?? 0), 0)
      const actual = mt.reduce((sum, t) => sum + (t.actual_hours ?? 0), 0)
      return { profile: p, estimated, actual, count: mt.length }
    })
    .filter((m) => m.count > 0)
    .sort((a, b) => b.estimated - a.estimated)

  const maxHours = Math.max(...byMember.flatMap((m) => [m.estimated, m.actual]), 1)

  return (
    <Card className="flex flex-col">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm font-semibold">
          <Scale className="h-4 w-4 text-primary" />
          Estimativa vs. real
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 space-y-4">
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="space-y-1.5">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-1.5 w-full" />
              <Skeleton className="h-1.5 w-3/4" />
            </div>
          ))
        ) : byMember.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">
            Nenhuma tarefa com horas estimadas e reais registradas.
          </p>
        ) : (
          <>
            {byMember.map(({ profile: p, estimated, actual }) => {
              const over = actual > estimated
              return (
                <div key={p.id} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <Avatar className="h-5 w-5">
                        <AvatarImage src={p.avatar_url ?? undefined} />
                        <AvatarFallback className="text-[9px]">{initials(p.full_name)}</AvatarFallback>
                      </Avatar>
                      <span className="font-medium">{p.full_name?.split(' ')[0] ?? p.email}</span>
                    </div>
                    <div className={`flex items-center gap-1 ${over ? 'text-destructive' : 'text-muted-foreground'}`}>
                      <span className="font-semibold">{actual}h</span>
                      <span className="opacity-60">/ {estimated}h</span>
                      {over && <Zap className="h-3 w-3" />}
                    </div>
                  </div>
                  <div className="space-y-0.5">
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full bg-primary/50 transition-all"
                        style={{ width: `${(estimated / maxHours) * 100}%` }}
                      />
                    </div>
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                      <div
                        className={`h-full rounded-full transition-all ${over ? 'bg-destructive' : 'bg-emerald-500'}`}
                        style={{ width: `${(actual / maxHours) * 100}%` }}
                      />
                    </div>
                  </div>
                </div>
              )
            })}
            <div className="flex flex-wrap items-center gap-3 pt-1 text-[10px] text-muted-foreground">
              <div className="flex items-center gap-1">
                <div className="h-1.5 w-4 rounded-full bg-primary/50" />
                Estimado
              </div>
              <div className="flex items-center gap-1">
                <div className="h-1.5 w-4 rounded-full bg-emerald-500" />
                Real
              </div>
              <div className="flex items-center gap-1">
                <div className="h-1.5 w-4 rounded-full bg-destructive" />
                Acima do estimado
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}

// ── Manager: priority distribution ───────────────────────────────────────────

const PRIORITY_CONFIG: Record<TaskPriority, { label: string; textColor: string; barColor: string }> = {
  urgent: { label: 'Urgente', textColor: 'text-destructive', barColor: 'bg-destructive' },
  high: { label: 'Alta', textColor: 'text-orange-500', barColor: 'bg-orange-500' },
  medium: { label: 'Média', textColor: 'text-amber-500', barColor: 'bg-amber-500' },
  low: { label: 'Baixa', textColor: 'text-slate-400', barColor: 'bg-slate-400' },
}

const PRIORITY_ORDER: TaskPriority[] = ['urgent', 'high', 'medium', 'low']

function PriorityDistribution({
  profiles,
  tasks,
  loading,
}: {
  profiles: Profile[]
  tasks: TaskWithRelations[]
  loading: boolean
}) {
  const openTasks = tasks.filter((t) => !t.status?.is_final && !t.is_archived)

  const byPriority = PRIORITY_ORDER.map((priority) => {
    const pt = openTasks.filter((t) => t.priority === priority)
    const memberIds = new Set<string>()
    for (const t of pt) {
      if (t.owner_id) memberIds.add(t.owner_id)
      for (const a of t.assignees) memberIds.add(a.profile.id)
    }
    const members = profiles.filter((p) => memberIds.has(p.id))
    return { priority, count: pt.length, members }
  })

  const maxCount = Math.max(...byPriority.map((p) => p.count), 1)

  return (
    <Card className="flex flex-col">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm font-semibold">
          <Zap className="h-4 w-4 text-primary" />
          Distribuição de prioridades
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 space-y-4">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="space-y-1">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-2 w-full" />
            </div>
          ))
        ) : (
          byPriority.map(({ priority, count, members }) => {
            const cfg = PRIORITY_CONFIG[priority]
            return (
              <div key={priority} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className={`font-medium ${cfg.textColor}`}>{cfg.label}</span>
                  <span className="font-semibold">{count}</span>
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className={`h-full rounded-full transition-all ${cfg.barColor}`}
                    style={{ width: `${(count / maxCount) * 100}%` }}
                  />
                </div>
                {members.length > 0 && (
                  <div className="flex items-center gap-1">
                    <div className="flex -space-x-1">
                      {members.slice(0, 7).map((p) => (
                        <Avatar key={p.id} className="h-4 w-4 ring-1 ring-background">
                          <AvatarImage src={p.avatar_url ?? undefined} />
                          <AvatarFallback className="text-[8px]">{initials(p.full_name)}</AvatarFallback>
                        </Avatar>
                      ))}
                    </div>
                    {members.length > 7 && (
                      <span className="text-[10px] text-muted-foreground">+{members.length - 7}</span>
                    )}
                  </div>
                )}
              </div>
            )
          })
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
  const { data: profiles = [], isLoading: profilesLoading } = useProfiles()

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

  const lead = isLead(currentProfile)
  const managerLoading = allLoading || profilesLoading

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

      {/* Personal panels */}
      <div className="grid gap-4 xl:grid-cols-[1.4fr_1fr]">
        <UpcomingTasks tasks={myTasks} loading={myLoading} />
        <StatusDistribution tasks={allTasks} loading={allLoading} />
      </div>

      {/* Manager section — lead only */}
      {lead && (
        <>
          <div className="flex items-center gap-3">
            <Separator className="flex-1" />
            <span className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              <Users className="h-3.5 w-3.5" />
              Visão Gerencial
            </span>
            <Separator className="flex-1" />
          </div>

          {/* Member workload */}
          <MemberWorkload
            profiles={profiles}
            tasks={allTasks}
            loading={managerLoading}
          />

          {/* Overdue + category insights */}
          <div className="grid gap-4 xl:grid-cols-[1.4fr_1fr]">
            <OverdueByMember
              profiles={profiles}
              tasks={allTasks}
              loading={managerLoading}
            />
            <CategoryInsights tasks={allTasks} loading={managerLoading} />
          </div>

          {/* Hours by category + by project */}
          <div className="grid gap-4 xl:grid-cols-2">
            <HoursByCategory tasks={allTasks} loading={managerLoading} />
            <HoursByProject tasks={allTasks} loading={managerLoading} />
          </div>

          {/* Estimate vs actual + priority distribution */}
          <div className="grid gap-4 xl:grid-cols-2">
            <EstimateVsActual profiles={profiles} tasks={allTasks} loading={managerLoading} />
            <PriorityDistribution profiles={profiles} tasks={allTasks} loading={managerLoading} />
          </div>

          {/* Recently completed */}
          <RecentlyCompleted tasks={allTasks} loading={managerLoading} />
        </>
      )}
    </section>
  )
}
