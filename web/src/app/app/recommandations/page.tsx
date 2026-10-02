'use client'
import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { Check, X, ArrowLeft } from 'lucide-react'
import { fr } from '@/lib/fr'
import type { TransferRecommendation } from '@/lib/supabase'
import { LoadingSkeleton } from '@/components/ui/LoadingSkeleton'
import { EmptyState } from '@/components/ui/EmptyState'
import { ErrorState } from '@/components/ui/ErrorState'

interface Rec extends TransferRecommendation {
  from_facility_name?: string
  to_facility_name?: string
  product_name?: string
}

export default function RecommandationsPage() {
  const { recommendations } = fr
  const [data, setData]       = useState<Rec[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState<string | null>(null)
  const [acting, setActing]   = useState<string | null>(null)
  const [rejectId, setRejectId] = useState<string | null>(null)
  const [reason, setReason]   = useState('')
  const [reasonErr, setReasonErr] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const r = await fetch('/api/recommendations')
      if (!r.ok) throw new Error(`${r.status}`)
      const j = await r.json()
      setData(j.data ?? [])
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur inconnue')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  async function accept(id: string) {
    setActing(id)
    try {
      await fetch('/api/recommendations', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status: 'accepted' }),
      })
      setData((p) => p.map((r) => (r.id === id ? { ...r, status: 'accepted' } : r)))
    } catch {
      /* silent */
    } finally {
      setActing(null)
    }
  }

  async function submitReject() {
    if (!rejectId) return
    if (!reason.trim()) {
      setReasonErr(recommendations.rejectionReasonRequired)
      return
    }
    setReasonErr('')
    setActing(rejectId)
    try {
      await fetch('/api/recommendations', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: rejectId, status: 'rejected', rejection_reason: reason.trim() }),
      })
      setData((p) =>
        p.map((r) =>
          r.id === rejectId ? { ...r, status: 'rejected', rejection_reason: reason.trim() } : r
        )
      )
      setRejectId(null)
      setReason('')
    } catch {
      /* silent */
    } finally {
      setActing(null)
    }
  }

  const pending = data.filter((r) => r.status === 'pending')
  const decided = data.filter((r) => r.status !== 'pending')

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
          <h1 className="font-display text-xl font-bold">{recommendations.title}</h1>
          <p className="text-white/50 text-xs mt-0.5">Redistribution de stocks entre établissements</p>
        </div>
      </div>

      <main className="flex-1">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {loading ? (
            <LoadingSkeleton variant="row" count={4} />
          ) : error ? (
            <ErrorState message={error} onRetry={load} />
          ) : data.length === 0 ? (
            <EmptyState message={fr.empty.noRecommendations} />
          ) : (
            <div className="space-y-10">

              {/* Pending */}
              {pending.length > 0 && (
                <section aria-labelledby="pending-h">
                  <h2
                    id="pending-h"
                    className="text-sm font-bold text-lagune uppercase tracking-wide mb-3"
                  >
                    En attente de décision ({pending.length})
                  </h2>
                  <div className="space-y-3">
                    {pending.map((rec) => (
                      <article
                        key={rec.id}
                        className="bg-white rounded-2xl border border-brume/60 shadow-sm overflow-hidden"
                      >
                        <div className="px-5 py-4">
                          {/* Route */}
                          <div className="flex items-center gap-2 text-sm mb-3 flex-wrap">
                            <span className="font-semibold text-lagune">
                              {rec.from_facility_name ?? rec.from_facility_id}
                            </span>
                            <svg
                              className="w-4 h-4 text-palme shrink-0"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                              aria-hidden="true"
                            >
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                            </svg>
                            <span className="font-semibold text-lagune">
                              {rec.to_facility_name ?? rec.to_facility_id}
                            </span>
                          </div>

                          {/* Product + qty */}
                          <div className="flex items-center gap-2 mb-4 flex-wrap">
                            <span className="bg-palme/10 text-palme text-xs font-semibold px-2.5 py-1 rounded-full">
                              {rec.product_name ?? rec.product_id}
                            </span>
                            <span className="bg-lagune/8 text-lagune text-xs font-semibold px-2.5 py-1 rounded-full">
                              {rec.qty_recommended} unités
                            </span>
                          </div>

                          {/* Action buttons */}
                          {rejectId !== rec.id && (
                            <div className="flex gap-3">
                              <button
                                onClick={() => accept(rec.id)}
                                disabled={acting === rec.id}
                                className="flex items-center gap-2 bg-palme hover:bg-palme/90 text-white
                                           text-sm font-semibold px-4 py-2 rounded-xl transition-all
                                           disabled:opacity-40 active:scale-95"
                              >
                                <Check className="w-4 h-4" aria-hidden="true" />
                                {recommendations.accept}
                              </button>
                              <button
                                onClick={() => { setRejectId(rec.id); setReason(''); setReasonErr('') }}
                                disabled={acting === rec.id}
                                className="flex items-center gap-2 border-2 border-signal/30 text-signal
                                           hover:bg-signal hover:text-white text-sm font-semibold px-4 py-2
                                           rounded-xl transition-all disabled:opacity-40"
                              >
                                <X className="w-4 h-4" aria-hidden="true" />
                                {recommendations.reject}
                              </button>
                            </div>
                          )}

                          {/* Rejection form — inline */}
                          {rejectId === rec.id && (
                            <div className="animate-slide-down border-t border-brume/50 pt-4 mt-2 space-y-3">
                              <label
                                htmlFor={`r-${rec.id}`}
                                className="block text-sm font-semibold text-lagune"
                              >
                                Motif du refus{' '}
                                <span className="text-signal" aria-hidden="true">*</span>
                              </label>
                              <textarea
                                id={`r-${rec.id}`}
                                value={reason}
                                onChange={(e) => { setReason(e.target.value); setReasonErr('') }}
                                rows={2}
                                aria-required="true"
                                placeholder={recommendations.rejectionReasonPlaceholder}
                                className="w-full border border-brume rounded-xl px-3 py-2 text-sm
                                           text-lagune resize-none focus:outline-none
                                           focus:ring-2 focus:ring-palme/30 focus:border-palme"
                              />
                              {reasonErr && (
                                <p className="text-signal text-xs" role="alert">
                                  {reasonErr}
                                </p>
                              )}
                              <div className="flex gap-3">
                                <button
                                  onClick={submitReject}
                                  disabled={acting === rec.id}
                                  className="bg-signal hover:bg-signal/90 text-white text-sm font-semibold
                                             px-4 py-2 rounded-xl transition-all disabled:opacity-40"
                                >
                                  Confirmer le refus
                                </button>
                                <button
                                  onClick={() => { setRejectId(null); setReason('') }}
                                  className="text-sm text-lagune/50 hover:text-lagune px-4 py-2 rounded-xl"
                                >
                                  Annuler
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      </article>
                    ))}
                  </div>
                </section>
              )}

              {/* Decided */}
              {decided.length > 0 && (
                <section aria-labelledby="decided-h">
                  <h2
                    id="decided-h"
                    className="text-sm font-bold text-lagune/40 uppercase tracking-wide mb-3"
                  >
                    Traitées ({decided.length})
                  </h2>
                  <div className="space-y-2 opacity-60">
                    {decided.map((rec) => (
                      <div
                        key={rec.id}
                        className="bg-white rounded-xl border border-brume/40 px-5 py-3 flex items-center gap-3"
                      >
                        <span
                          className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                            rec.status === 'accepted'
                              ? 'bg-palme/10 text-palme'
                              : 'bg-signal/10 text-signal'
                          }`}
                        >
                          {rec.status === 'accepted'
                            ? recommendations.statuses.accepted
                            : recommendations.statuses.rejected}
                        </span>
                        <span className="text-sm text-lagune flex-1 truncate">
                          {rec.from_facility_name ?? rec.from_facility_id} →{' '}
                          {rec.to_facility_name ?? rec.to_facility_id} · {rec.product_name ?? rec.product_id}
                        </span>
                        {rec.rejection_reason && (
                          <span className="text-xs text-lagune/40 truncate hidden sm:block max-w-[200px]">
                            {rec.rejection_reason}
                          </span>
                        )}
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
