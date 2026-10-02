import { ArrowUp, ArrowDown } from 'lucide-react'
import type { ReactNode } from 'react'

interface DataCardProps {
  title: string
  value: string | number
  secondaryValue?: string | number
  trend?: 'up' | 'down' | null
  /** Semantic meaning of a rising trend: 'positive' means up = good (green), 'negative' means up = bad (red) */
  trendSemantics?: 'positive' | 'negative'
  className?: string
  children?: ReactNode
}

/**
 * DataCard — displays a primary metric with optional secondary value and trend arrow.
 */
export function DataCard({
  title,
  value,
  secondaryValue,
  trend,
  trendSemantics = 'positive',
  className = '',
  children,
}: DataCardProps) {
  const trendColor =
    trend === null || trend === undefined
      ? ''
      : trend === 'up'
      ? trendSemantics === 'positive'
        ? 'text-palme'
        : 'text-signal'
      : trendSemantics === 'positive'
      ? 'text-signal'
      : 'text-palme'

  const TrendIcon = trend === 'up' ? ArrowUp : ArrowDown
  const trendLabel = trend === 'up' ? 'en hausse' : 'en baisse'

  return (
    <article
      className={`bg-white rounded-xl border border-brume p-4 flex flex-col gap-1 ${className}`}
    >
      <span className="text-xs text-lagune/60 font-medium leading-snug">{title}</span>

      <div className="flex items-end gap-2">
        <span className="font-display text-2xl font-bold text-lagune leading-none">{value}</span>

        {trend && (
          <span className={`flex items-center gap-0.5 text-xs font-semibold mb-0.5 ${trendColor}`}>
            <TrendIcon className="w-3.5 h-3.5" aria-hidden="true" />
            <span className="sr-only">{trendLabel}</span>
          </span>
        )}
      </div>

      {secondaryValue !== undefined && (
        <span className="text-xs text-lagune/50">{secondaryValue}</span>
      )}

      {children}
    </article>
  )
}
