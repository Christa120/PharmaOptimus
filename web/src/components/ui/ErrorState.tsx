import { AlertTriangle, RefreshCw } from 'lucide-react'

interface ErrorStateProps {
  message?: string
  description?: string
  onRetry?: () => void
  className?: string
}

/**
 * ErrorState — displayed when a data fetch or action fails.
 */
export function ErrorState({
  message,
  description,
  onRetry,
  className = '',
}: ErrorStateProps) {
  return (
    <div
      role="alert"
      className={`flex flex-col items-center justify-center py-16 px-6 text-center ${className}`}
    >
      <div className="mb-4 w-12 h-12 rounded-full bg-signal/10 flex items-center justify-center">
        <AlertTriangle className="w-6 h-6 text-signal" aria-hidden="true" />
      </div>

      <p className="font-display font-semibold text-lagune mb-1">
        {message ?? 'Une erreur est survenue'}
      </p>

      {description && (
        <p className="text-sm text-lagune/60 max-w-xs mb-4">{description}</p>
      )}

      {onRetry && (
        <button
          onClick={onRetry}
          className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-lagune border border-brume hover:border-lagune/40 px-4 py-2 rounded-lg transition-colors focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-palme"
        >
          <RefreshCw className="w-4 h-4" aria-hidden="true" />
          Réessayer
        </button>
      )}
    </div>
  )
}
