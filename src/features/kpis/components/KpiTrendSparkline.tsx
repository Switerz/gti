import { useId } from 'react'

import type { KpiTargetOperator } from '@/types/domain'

import { cn } from '@/lib/utils'
import { evaluateKpiValue } from '../kpi-utils'

type Point = {
  value: number
  label: string
}

function statusToColor(status: string | null): string {
  if (status === 'on_track') return '#16a34a'
  if (status === 'off_track') return '#dc2626'
  return '#64748b'
}

export function KpiTrendSparkline({
  points,
  className,
  targetValue,
  targetOperator,
}: {
  points: Point[]
  className?: string
  targetValue?: number | null
  targetOperator?: KpiTargetOperator | null
}) {
  const uid = useId()

  if (points.length < 2) {
    return <span className="text-xs text-muted-foreground">—</span>
  }

  const width = 96
  const height = 28
  const values = points.map((p) => p.value)
  const min = Math.min(...values)
  const max = Math.max(...values)
  const spread = max - min || 1

  const coords = points.map((point, index) => ({
    x: points.length === 1 ? width / 2 : (index / (points.length - 1)) * width,
    y: height - ((point.value - min) / spread) * (height - 4) - 2,
  }))

  const linePoints = coords.map(({ x, y }) => `${x},${y}`).join(' ')

  const hasTarget =
    targetValue != null && targetOperator != null && targetOperator !== 'informational'

  if (!hasTarget) {
    const last = points.at(-1)
    const previous = points.at(-2)
    const stroke = last && previous && last.value >= previous.value ? '#16a34a' : '#dc2626'
    return (
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className={cn('h-7 w-24 overflow-visible', className)}
        role="img"
        aria-label="Tendência do KPI"
      >
        <polyline
          points={linePoints}
          fill="none"
          stroke={stroke}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    )
  }

  const pointStatuses = points.map((point) =>
    evaluateKpiValue(point.value, targetValue, targetOperator),
  )
  const pointColors = pointStatuses.map(statusToColor)

  const gradientId = `sg-${uid.replace(/[^a-zA-Z0-9]/g, '')}`
  const areaPolygonPoints = [
    `${coords[0].x},${height}`,
    ...coords.map(({ x, y }) => `${x},${y}`),
    `${coords[coords.length - 1].x},${height}`,
  ].join(' ')

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className={cn('h-7 w-24 overflow-visible', className)}
      role="img"
      aria-label="Tendência do KPI"
    >
      <defs>
        <linearGradient id={gradientId} gradientUnits="userSpaceOnUse" x1="0" y1="0" x2={width} y2="0">
          {coords.map(({ x }, i) => (
            <stop key={i} offset={`${(x / width) * 100}%`} stopColor={pointColors[i]} stopOpacity="0.3" />
          ))}
        </linearGradient>
      </defs>
      <polygon points={areaPolygonPoints} fill={`url(#${gradientId})`} />
      <polyline
        points={linePoints}
        fill="none"
        stroke="currentColor"
        strokeOpacity="0.2"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {coords.map(({ x, y }, i) => (
        <circle key={i} cx={x} cy={y} r="2.5" fill={pointColors[i]} />
      ))}
    </svg>
  )
}
