import { ChevronRight } from 'lucide-react'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type {
  KpiFormatKind,
  KpiTargetOperator,
  KpiWeeklyValue,
  KpiWithRelations,
} from '@/types/domain'

import type { IsoWeek } from '../kpi-utils'
import { buildTrendPoints, formatKpiValue, formatWeekLabel } from '../kpi-utils'
import { getKpiCurrentStatus, getKpiValueForWeek, getWeekKey } from '../kpi-view-utils'
import { KpiDirectionBadge } from './KpiDirectionBadge'
import { KpiStatusDot } from './KpiStatusDot'
import { KpiTrendSparkline } from './KpiTrendSparkline'
import { KpiValueCell } from './KpiValueCell'

function KpiMeta({ kpi }: { kpi: KpiWithRelations }) {
  if (kpi.target_label) return <span>{kpi.target_label}</span>
  if (kpi.target_operator === 'informational') return <span>Informativo</span>
  return (
    <span>
      {formatKpiValue(
        kpi.target_value,
        kpi.format_kind as KpiFormatKind,
        kpi.decimal_places,
        kpi.unit_label,
      )}
    </span>
  )
}

function getInitials(name: string | null | undefined) {
  return (
    name
      ?.split(' ')
      .slice(0, 2)
      .map((n) => n[0])
      .join('')
      .toUpperCase() ?? '?'
  )
}

function KpiSecondary({ kpi }: { kpi: KpiWithRelations }) {
  const owner = kpi.owner
  const hasOwner = owner || kpi.owner_label
  const hasProduct = !!kpi.product

  return (
    <div className="mt-0.5 flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-xs text-muted-foreground">
      {!hasOwner && !hasProduct && <span>Sem responsável</span>}
      {hasProduct && <span>{kpi.product}</span>}
      {hasProduct && hasOwner && <span>·</span>}
      {owner ? (
        <>
          <Avatar className="h-4 w-4 shrink-0">
            <AvatarImage src={owner.avatar_url ?? undefined} />
            <AvatarFallback className="text-[8px]">{getInitials(owner.full_name)}</AvatarFallback>
          </Avatar>
          <span className="truncate">{owner.full_name}</span>
        </>
      ) : kpi.owner_label ? (
        <span className="truncate">{kpi.owner_label}</span>
      ) : null}
    </div>
  )
}

function KpiGroupRows({
  title,
  kpis,
  weeks,
  currentWeek,
  onSaveWeeklyValue,
  savingKey,
  onOpenDetail,
}: {
  title: string
  kpis: KpiWithRelations[]
  weeks: IsoWeek[]
  currentWeek: IsoWeek
  onSaveWeeklyValue?: (
    kpi: KpiWithRelations,
    week: IsoWeek,
    values: { value?: number; valueText?: string; notes?: string },
  ) => void
  savingKey?: string | null
  onOpenDetail?: (kpi: KpiWithRelations) => void
}) {
  return (
    <tbody>
      <tr>
        <th
          colSpan={weeks.length + 5}
          className="border-y bg-muted/50 px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground"
        >
          {title}
        </th>
      </tr>
      {kpis.map((kpi) => {
        const currentStatus = getKpiCurrentStatus(kpi, currentWeek)
        const trendPoints = buildTrendPoints(kpi.weekly_values as KpiWeeklyValue[])

        return (
          <tr key={kpi.id} className="border-b last:border-0 hover:bg-muted/25">
            <td className="min-w-[260px] px-4 py-3">
              <div className="flex items-start gap-2">
                <KpiStatusDot status={currentStatus} className="mt-1.5" />
                <div className="min-w-0">
                  <p className="line-clamp-1 text-sm font-medium">{kpi.name}</p>
                  <KpiSecondary kpi={kpi} />
                </div>
              </div>
            </td>
            <td className="px-2 py-3 text-center">
              <KpiDirectionBadge operator={kpi.target_operator as KpiTargetOperator} />
            </td>
            {weeks.map((week) => {
              const isCurrent = getWeekKey(week) === getWeekKey(currentWeek)
              return (
                <td
                  key={getWeekKey(week)}
                  className={cn('px-2 py-3', isCurrent && 'bg-primary/[0.04]')}
                >
                  <KpiValueCell
                    value={getKpiValueForWeek(kpi, week)}
                    formatKind={kpi.format_kind as KpiFormatKind}
                    decimalPlaces={kpi.decimal_places}
                    unitLabel={kpi.unit_label}
                    isCurrent={isCurrent}
                    editable={!!onSaveWeeklyValue}
                    isSaving={savingKey === `${kpi.id}-${week.isoYear}-${week.isoWeek}`}
                    onSave={(values) => onSaveWeeklyValue?.(kpi, week, values)}
                  />
                </td>
              )
            })}
            <td className="min-w-24 px-3 py-3 text-xs font-semibold">
              <KpiMeta kpi={kpi} />
            </td>
            <td className="px-3 py-3">
              <KpiTrendSparkline points={trendPoints} />
            </td>
            <td className="px-3 py-3 text-right">
              <Button
                variant="ghost"
                size="icon"
                aria-label={`Abrir KPI ${kpi.name}`}
                onClick={() => onOpenDetail?.(kpi)}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </td>
          </tr>
        )
      })}
    </tbody>
  )
}

function KpiMobileCard({
  kpi,
  currentWeek,
  onSaveWeeklyValue,
  savingKey,
  onOpenDetail,
}: {
  kpi: KpiWithRelations
  currentWeek: IsoWeek
  onSaveWeeklyValue?: (
    kpi: KpiWithRelations,
    week: IsoWeek,
    values: { value?: number; valueText?: string; notes?: string },
  ) => void
  savingKey?: string | null
  onOpenDetail?: (kpi: KpiWithRelations) => void
}) {
  const currentValue = getKpiValueForWeek(kpi, currentWeek)
  const currentStatus = getKpiCurrentStatus(kpi, currentWeek)
  const trendPoints = buildTrendPoints(kpi.weekly_values as KpiWeeklyValue[])

  return (
    <div className="rounded-lg border bg-card p-3 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <KpiStatusDot status={currentStatus} />
            <p className="line-clamp-2 text-sm font-semibold">{kpi.name}</p>
          </div>
          <div className="mt-1 pl-4">
            <KpiSecondary kpi={kpi} />
          </div>
        </div>
        <div className="flex items-center gap-1">
          <KpiDirectionBadge operator={kpi.target_operator as KpiTargetOperator} />
          <Button
            variant="ghost"
            size="icon"
            aria-label={`Abrir KPI ${kpi.name}`}
            onClick={() => onOpenDetail?.(kpi)}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="mt-3 grid grid-cols-[1fr_auto] items-end gap-3">
        <div className="space-y-1">
          <p className="text-[11px] font-medium text-muted-foreground">
            {formatWeekLabel(currentWeek.isoWeek)}
          </p>
          <KpiValueCell
            value={currentValue}
            formatKind={kpi.format_kind as KpiFormatKind}
            decimalPlaces={kpi.decimal_places}
            unitLabel={kpi.unit_label}
            isCurrent
            editable={!!onSaveWeeklyValue}
            isSaving={savingKey === `${kpi.id}-${currentWeek.isoYear}-${currentWeek.isoWeek}`}
            onSave={(values) => onSaveWeeklyValue?.(kpi, currentWeek, values)}
          />
        </div>
        <KpiTrendSparkline points={trendPoints} />
      </div>

      <div className="mt-3 flex items-center justify-between border-t pt-2 text-xs">
        <span className="text-muted-foreground">Meta</span>
        <span className="font-semibold">
          <KpiMeta kpi={kpi} />
        </span>
      </div>
    </div>
  )
}

export function KpiTable({
  kpis,
  weeks,
  currentWeek,
  onSaveWeeklyValue,
  savingKey,
  onOpenDetail,
}: {
  kpis: KpiWithRelations[]
  weeks: IsoWeek[]
  currentWeek: IsoWeek
  onSaveWeeklyValue?: (
    kpi: KpiWithRelations,
    week: IsoWeek,
    values: { value?: number; valueText?: string; notes?: string },
  ) => void
  savingKey?: string | null
  onOpenDetail?: (kpi: KpiWithRelations) => void
}) {
  const grouped = kpis.reduce<Record<string, { title: string; items: KpiWithRelations[] }>>(
    (acc, kpi) => {
      const key = kpi.group?.id ?? 'ungrouped'
      acc[key] ??= { title: kpi.group?.name ?? 'Sem grupo', items: [] }
      acc[key].items.push(kpi)
      return acc
    },
    {},
  )

  const groups = Object.values(grouped)

  return (
    <>
      <div className="hidden overflow-hidden rounded-lg border bg-card lg:block">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/40">
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Indicador</th>
                <th className="w-16 px-2 py-3 text-center font-medium text-muted-foreground">Dir.</th>
                {weeks.map((week) => {
                  const isCurrent = getWeekKey(week) === getWeekKey(currentWeek)
                  return (
                    <th
                      key={getWeekKey(week)}
                      className={cn(
                        'min-w-24 px-2 py-3 text-center font-medium text-muted-foreground',
                        isCurrent && 'bg-primary/[0.08] text-foreground',
                      )}
                    >
                      {formatWeekLabel(week.isoWeek)}
                    </th>
                  )
                })}
                <th className="px-3 py-3 text-left font-medium text-muted-foreground">Meta</th>
                <th className="px-3 py-3 text-left font-medium text-muted-foreground">Tendência</th>
                <th className="w-12 px-3 py-3" />
              </tr>
            </thead>
            {groups.map((group) => (
              <KpiGroupRows
                key={group.title}
                title={group.title}
                kpis={group.items}
                weeks={weeks}
                currentWeek={currentWeek}
                onSaveWeeklyValue={onSaveWeeklyValue}
                savingKey={savingKey}
                onOpenDetail={onOpenDetail}
              />
            ))}
          </table>
        </div>
      </div>

      <div className="grid gap-3 lg:hidden">
        {kpis.map((kpi) => (
          <KpiMobileCard
            key={kpi.id}
            kpi={kpi}
            currentWeek={currentWeek}
            onSaveWeeklyValue={onSaveWeeklyValue}
            savingKey={savingKey}
            onOpenDetail={onOpenDetail}
          />
        ))}
      </div>
    </>
  )
}
