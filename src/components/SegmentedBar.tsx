import { cn } from '../lib/utils'

interface Segment {
  label: string
  value: number
  color: string
}

interface SegmentedBarProps {
  segments: Segment[]
  total: number
}

const COLORS = [
  'bg-purple-500',
  'bg-blue-500',
  'bg-gray-400',
  'bg-teal-500',
  'bg-pink-500',
  'bg-green-500',
  'bg-amber-500',
  'bg-red-500',
  'bg-indigo-500',
]

export function SegmentedBar({ segments, total }: SegmentedBarProps) {
  if (!segments.length || total === 0) {
    return (
      <div className="h-4 rounded-full bg-gray-100" />
    )
  }

  return (
    <div>
      {/* Bar */}
      <div className="flex h-4 overflow-hidden rounded-full">
        {segments.map((seg, i) => {
          const pct = (seg.value / total) * 100
          if (pct === 0) return null
          return (
            <div
              key={seg.label}
              className={cn('transition-all duration-500', seg.color || COLORS[i % COLORS.length])}
              style={{ width: `${pct}%` }}
              title={`${seg.label}: ${pct.toFixed(1)}%`}
            />
          )
        })}
      </div>

      {/* Legend */}
      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2">
        {segments.map((seg, i) => {
          const pct = total > 0 ? (seg.value / total) * 100 : 0
          if (pct === 0) return null
          return (
            <div key={seg.label} className="flex items-center gap-2">
              <div className={cn('h-2.5 w-2.5 rounded-full', seg.color || COLORS[i % COLORS.length])} />
              <span className="text-xs text-gray-600">{seg.label}</span>
              <span className="text-xs font-medium text-gray-900">{pct.toFixed(1)}%</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
