import { cn } from '@/lib/utils'

type Point = {
  value: number
  label: string
}

export function KpiTrendSparkline({
  points,
  className,
}: {
  points: Point[]
  className?: string
}) {
  if (points.length < 2) {
    return <span className="text-xs text-muted-foreground">—</span>
  }

  const width = 96
  const height = 28
  const values = points.map((point) => point.value)
  const min = Math.min(...values)
  const max = Math.max(...values)
  const spread = max - min || 1

  const coordinates = points.map((point, index) => {
    const x = points.length === 1 ? width / 2 : (index / (points.length - 1)) * width
    const y = height - ((point.value - min) / spread) * (height - 4) - 2
    return `${x},${y}`
  })

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
        points={coordinates.join(' ')}
        fill="none"
        stroke={stroke}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}
