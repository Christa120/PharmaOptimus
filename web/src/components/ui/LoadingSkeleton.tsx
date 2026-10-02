/**
 * LoadingSkeleton — animated loading placeholders.
 * Variants: card, row, map.
 * Respects prefers-reduced-motion via Tailwind's motion-safe: modifier.
 */

interface LoadingSkeletonProps {
  variant?: 'card' | 'row' | 'map'
  count?: number
  className?: string
}

function SkeletonBlock({ className = '' }: { className?: string }) {
  return (
    <div
      className={`bg-brume/60 rounded motion-safe:animate-pulse ${className}`}
      aria-hidden="true"
    />
  )
}

function CardSkeleton() {
  return (
    <div className="bg-white rounded-xl border border-brume p-4 space-y-3">
      <SkeletonBlock className="h-3 w-1/3" />
      <SkeletonBlock className="h-7 w-2/3" />
      <SkeletonBlock className="h-3 w-1/2" />
    </div>
  )
}

function RowSkeleton() {
  return (
    <div className="bg-white rounded-xl border border-brume p-4 flex items-center gap-4">
      <SkeletonBlock className="w-8 h-8 rounded-full shrink-0" />
      <div className="flex-1 space-y-2">
        <SkeletonBlock className="h-3 w-1/2" />
        <SkeletonBlock className="h-3 w-1/3" />
      </div>
      <SkeletonBlock className="w-24 h-8 rounded-lg shrink-0" />
    </div>
  )
}

function MapSkeleton() {
  return (
    <div
      className="bg-brume/30 rounded-xl border border-brume h-96 flex items-center justify-center motion-safe:animate-pulse"
      aria-hidden="true"
    >
      <div className="space-y-3 w-32 opacity-40">
        <SkeletonBlock className="h-4 w-full" />
        <SkeletonBlock className="h-4 w-3/4 mx-auto" />
        <SkeletonBlock className="h-4 w-1/2 mx-auto" />
      </div>
    </div>
  )
}

export function LoadingSkeleton({
  variant = 'card',
  count = 3,
  className = '',
}: LoadingSkeletonProps) {
  return (
    <div
      role="status"
      aria-label="Chargement en cours…"
      aria-live="polite"
      className={className}
    >
      <span className="sr-only">Chargement en cours…</span>

      {variant === 'map' ? (
        <MapSkeleton />
      ) : (
        <div className={variant === 'card' ? 'grid sm:grid-cols-2 lg:grid-cols-3 gap-4' : 'space-y-3'}>
          {Array.from({ length: count }).map((_, i) =>
            variant === 'card' ? (
              <CardSkeleton key={i} />
            ) : (
              <RowSkeleton key={i} />
            )
          )}
        </div>
      )}
    </div>
  )
}
