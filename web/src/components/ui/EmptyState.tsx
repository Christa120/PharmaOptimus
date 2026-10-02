import type { ReactNode } from 'react'
import { Inbox } from 'lucide-react'

interface EmptyStateProps {
  message: string
  description?: string
  icon?: ReactNode
  action?: {
    label: string
    onClick: () => void
  }
  className?: string
}

/**
 * EmptyState — shown when a list or data view has no items to display.
 */
export function EmptyState({
  message,
  description,
  icon,
  action,
  className = '',
}: EmptyStateProps) {
  return (
    <div
      className={`flex flex-col items-center justify-center py-16 px-6 text-center ${className}`}
      role="status"
      aria-live="polite"
    >
      <div className="mb-4 text-brume">
        {icon ?? <Inbox className="w-10 h-10" aria-hidden="true" />}
      </div>

      <p className="font-display font-semibold text-lagune mb-1">{message}</p>

      {description && (
        <p className="text-sm text-lagune/60 max-w-xs">{description}</p>
      )}

      {action && (
        <button
          onClick={action.onClick}
          className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-palme border border-palme/40 hover:bg-palme hover:text-white px-4 py-2 rounded-lg transition-colors focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-palme"
        >
          {action.label}
        </button>
      )}
    </div>
  )
}
