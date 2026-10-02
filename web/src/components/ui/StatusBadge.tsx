import { AlertTriangle, CheckCircle, Info, XCircle } from 'lucide-react'
import type { ReactNode } from 'react'

type Variant = 'critical' | 'warning' | 'ok' | 'info'

const VARIANT_CONFIG: Record<
  Variant,
  { bg: string; text: string; Icon: React.ComponentType<{ className?: string }> }
> = {
  critical: {
    bg: 'bg-signal/10',
    text: 'text-signal',
    Icon: XCircle,
  },
  warning: {
    bg: 'bg-alerte/10',
    text: 'text-alerte',
    Icon: AlertTriangle,
  },
  ok: {
    bg: 'bg-palme/10',
    text: 'text-palme',
    Icon: CheckCircle,
  },
  info: {
    bg: 'bg-lagune/10',
    text: 'text-lagune',
    Icon: Info,
  },
}

interface StatusBadgeProps {
  variant: Variant
  children: ReactNode
  className?: string
}

/**
 * StatusBadge — always shows colour + icon + text (never colour alone)
 * to meet WCAG 1.4.1 (use of colour).
 */
export function StatusBadge({ variant, children, className = '' }: StatusBadgeProps) {
  const { bg, text, Icon } = VARIANT_CONFIG[variant]

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold ${bg} ${text} ${className}`}
    >
      <Icon className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
      {children}
    </span>
  )
}
