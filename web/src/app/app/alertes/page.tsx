'use client'
import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { CheckCircle, Filter, ArrowLeft } from 'lucide-react'
import { fr } from '@/lib/fr'
import type { Alert } from '@/lib/supabase'
import { LoadingSkeleton } from '@/components/ui/LoadingSkeleton'
import { EmptyState } from '@/components/ui/EmptyState'
import { ErrorState } from '@/components/ui/ErrorState'

interface AlertRow extends Alert { facility_name?: string; product_name?: string }
type SeverityFilter = 'all' | 'critical' | 'high' | 'medium' | 'low'

const SEV_BAR: Record<string, string> = {
  critical: 'bg-signal',
  high:     'bg-alerte',
  medium:   'bg-soleil',
  low:      'bg-brume',
}
const SEV_BADGE: Record<string, string> = {
  critical: 'bg-signal/10 text-signal border border-signal/20',
  high:     'bg-alerte/10 text-alerte border border-alerte/20',
  medium:   'bg-soleil/10 text-soleil border border-soleil/20',
  low:      'bg-brume text-lagune/50 border border-brume',
}
const SEV_LABELS: Record<string, string> = {
  critical: fr.alerts.severities.critical,
  high:     fr.alerts.severities.high,
  medium:   fr.alerts.severities.medium,
  low:      fr.alerts.severities.low,
}

export default function AlertesPage() {
  const [data, setData]     = useState<AlertRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError]   = useState<string | null>(null)
  const [filter, setFilter] = useState<SeverityFilter>('all')
  const [acking, setAcking] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/alerts')
      if (!res.ok) throw new Error(`Erreur ${res.status}`)
      const j = await res.json()
      setData(j.data ?? [])
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur inconnue')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  async function ack(id: string) {
    setAcking(id)
    try {
      await fetch('/api/alerts', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      })
      setData((prev) => prev.map((a) => (a.id === id ? { ...a, acknowledged: true } : a)))
    } catch {
      /* silent */
    } finally {
      setAcking(null)
    }
  }

  const filtered = data.filter((a) => filter === 'all' || a.severity === filter)
  const active   = filtered.filter((a) => !a.acknowledged)
  const done     = filtered.filter((a) => a.acknowledged)

  return (
    <div className="flex flex-col min-h-screen bg-kaolin" id="main-content">

      {/* Page header — not sticky */}
      <div className="bg-lagune text-white px-4 sm:px-6 lg:px-8 py-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-3 mb-1">
            <Link
              href="/app"
              className="text-white/50 hover:text-white transition-colors text-xs flex items-center gap-1"
              aria-label="Retour au tableau de bord"
            >
              <ArrowLeft className="w-3.5 h-3.5" aria-hidden="true" />
              Tableau de bord
            </Link>
          </div>
          <h1 className="font-display text-xl font-bold">{fr.alerts.title}</h1>
          <p className="text-white/50 text-xs mt-0.5">Ruptures imminentes, péremptions, surstock</p>
        </div>
      </div>

      <main className="flex-1">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

          {/* Severity filter */}
          <div className="flex items-center gap-3 mb-6 flex-wrap" role="group" aria-label="Filtrer par gravité">
            <Filter className="w-4 h-4 text-lagune/40 shrink-0" aria-hidden="true" />
            {(['all', 'critical', 'high', 'medium', 'low'] as const).map((s) => (
              <button
                key={s}
                onClick={() => setFilter(s)}
                aria-pressed={filter === s}
                className={`text-xs font-semibold px-3 py-1.5 rounded-full border transition-all ${
                  filter === s
                    ? 'bg-lagune text-white border-lagune'
                    : 'bg-white text-lagune/60 border-brume hover:border-lagune/30'
                }`}
              >
                {s === 'all' ? 'Toutes' : SEV_LABELS[s]}
              </button>
            ))}
          </div>

          {/* Content */}
          {loading ? (
            <LoadingSkeleton variant="row" count={5} />
          ) : error ? (
            <ErrorState message={error} onRetry={load} />
          ) : filtered.length === 0 ? (
            <EmptyState
              message={fr.empty.noAlerts}
              icon={<CheckCircle className="w-10 h-10 text-palme" aria-hidden="true" />}
            />
          ) : (
            <div className="space-y-8">
              {/* Active alerts */}
              {active.length > 0 && (
                <section aria-labelledby="active-h">
                  <h2 id="active-h" className="text-sm font-bold text-lagune mb-3 uppercase tracking-wide">
                    Actives ({active.length})
                  </h2>
                  <div className="space-y-2">
                    {active.map((a) => (
                      <article
                        key={a.id}
                        className="bg-white rounded-xl border border-brume/60 overflow-hidden flex shadow-sm"
                      >
                        {/* Severity side bar */}
                        <div
                          className={`w-1 shrink-0 ${SEV_BAR[a.severity] ?? 'bg-brume'}`}
                          aria-hidden="true"
                        />
                        <div className="flex-1 px-4 py-3 flex flex-wrap items-center gap-3">
                          <span
                            className={`text-xs font-semibold px-2.5 py-0.5 rounded-full shrink-0 ${SEV_BADGE[a.severity] ?? ''}`}
                          >
                            {SEV_LABELS[a.severity] ?? a.severity}
                          </span>
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-lagune text-sm truncate">
                              {a.facility_name ?? a.facility_id}
                            </p>
                            <p className="text-xs text-lagune/50">
                              {a.product_name ?? a.product_id} · {a.alert_type.replace(/_/g, ' ')}
                            </p>
                          </div>
                          <time
                            className="text-xs text-lagune/30 shrink-0 hidden sm:block"
                            dateTime={a.created_at}
                          >
                            {new Date(a.created_at).toLocaleDateString('fr-FR')}
                          </time>
                          <button
                            onClick={() => ack(a.id)}
                            disabled={acking === a.id}
                            aria-label={`Accusé de réception pour ${a.facility_name ?? a.facility_id}`}
                            className="shrink-0 flex items-center gap-1.5 text-xs font-semibold text-palme
                                       border border-palme/30 px-3 py-1.5 rounded-lg
                                       hover:bg-palme hover:text-white transition-all disabled:opacity-40"
                          >
                            <CheckCircle className="w-3.5 h-3.5" aria-hidden="true" />
                            {acking === a.id ? '…' : fr.alerts.acknowledge}
                          </button>
                        </div>
                      </article>
                    ))}
                  </div>
                </section>
              )}

              {/* Acknowledged */}
              {done.length > 0 && (
                <section aria-labelledby="done-h">
                  <h2 id="done-h" className="text-sm font-bold text-lagune/40 mb-3 uppercase tracking-wide">
                    Traitées ({done.length})
                  </h2>
                  <div className="space-y-2 opacity-50">
                    {done.map((a) => (
                      <div
                        key={a.id}
                        className="bg-white rounded-xl border border-brume/40 flex overflow-hidden"
                      >
                        <div className="w-1 shrink-0 bg-brume" aria-hidden="true" />
                        <div className="px-4 py-3 flex gap-3 items-center">
                          <CheckCircle className="w-4 h-4 text-palme shrink-0" aria-hidden="true" />
                          <div>
                            <p className="text-sm text-lagune line-through">
                              {a.facility_name ?? a.facility_id}
                            </p>
                            <p className="text-xs text-lagune/40">{a.product_name ?? a.product_id}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              )}
            </div>
          )}
        </div>
      </main>

      {/* Page footer */}
      <footer className="bg-lagune text-white/25 text-xs text-center py-3 px-4">
        PharmaOptimus · Données simulées
      </footer>

    </div>
  )
}
