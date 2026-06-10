import { cn } from '@/lib/utils'
import type { KpiFormatKind, KpiTargetOperator, KpiWeeklyValue } from '@/types/domain'

import { buildTrendPoints, evaluateKpiValue, formatKpiValue } from '../kpi-utils'

export function KpiHistoryChart({
  values,
  targetValue,
  targetOperator,
  formatKind,
  decimalPlaces,
  unitLabel,
  className,
}: {
  values: KpiWeeklyValue[]
  targetValue: number | null
  targetOperator: KpiTargetOperator
  formatKind: KpiFormatKind
  decimalPlaces: number
  unitLabel?: string | null
  className?: string
}) {
  const points = buildTrendPoints(values)

  if (points.length === 0) {
    return (
      <div className={cn('flex h-48 items-center justify-center rounded-lg border bg-muted/20 text-sm text-muted-foreground', className)}>
        Nenhum valor lançado.
      </div>
    )
  }

  const width = 640
  const height = 220
  const padding = 28
  const pointValues = points.map((point) => point.value)
  const allValues = targetValue == null ? pointValues : [...pointValues, targetValue]
  const min = Math.min(...allValues)
  const max = Math.max(...allValues)
  const spread = max - min || 1

  function x(index: number) {
    return padding + (index / Math.max(points.length - 1, 1)) * (width - padding * 2)
  }

  function y(value: number) {
    return height - padding - ((value - min) / spread) * (height - padding * 2)
  }

  const path = points.map((point, index) => `${x(index)},${y(point.value)}`).join(' ')
  const targetY = targetValue == null ? null : y(targetValue)

  return (
    <div className={cn('rounded-lg border bg-card p-3', className)}>
      <svg viewBox={`0 0 ${width} ${height}`} className="h-56 w-full" role="img" aria-label="Histórico semanal do KPI">
        <line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} stroke="currentColor" className="text-border" />
        {targetY != null && targetOperator !== 'informational' && (
          <line
            x1={padding}
            y1={targetY}
            x2={width - padding}
            y2={targetY}
            stroke="currentColor"
            strokeDasharray="6 6"
            className="text-primary"
          />
        )}
        <polyline
          points={path}
          fill="none"
          stroke="currentColor"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="text-blue-600"
        />
        {points.map((point, index) => {
          const status = evaluateKpiValue(point.value, targetValue, targetOperator)
          return (
            <g key={`${point.isoYear}-${point.isoWeek}`}>
              <circle
                cx={x(index)}
                cy={y(point.value)}
                r="4"
                className={status === 'off_track' ? 'fill-red-500' : status === 'on_track' ? 'fill-green-500' : 'fill-slate-400'}
              />
              <text x={x(index)} y={height - 8} textAnchor="middle" className="fill-muted-foreground text-[11px]">
                {point.label}
              </text>
            </g>
          )
        })}
      </svg>
      <div className="flex flex-wrap items-center justify-between gap-2 border-t pt-2 text-xs text-muted-foreground">
        <span>{points.length} semana{points.length !== 1 ? 's' : ''} com valor</span>
        {targetValue != null && targetOperator !== 'informational' && (
          <span>Meta: {formatKpiValue(targetValue, formatKind, decimalPlaces, unitLabel)}</span>
        )}
      </div>
    </div>
  )
}
