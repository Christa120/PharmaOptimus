import Link from 'next/link'
import { createServerClient } from '@/lib/supabase'
import type { Scenario } from '@/lib/supabase'

// Helper to render a JSONB params/results object as a readable table
function JsonTable({ data }: { data: Record<string, unknown> }) {
  const entries = Object.entries(data)
  if (entries.length === 0) return <span className="text-lagune/40 text-xs">—</span>
  return (
    <table className="text-xs w-full">
      <tbody className="divide-y divide-brume">
        {entries.map(([key, value]) => (
          <tr key={key}>
            <td className="py-1 pr-3 text-lagune/50 font-medium whitespace-nowrap">{key}</td>
            <td className="py-1 text-lagune">
              {typeof value === 'object' ? JSON.stringify(value) : String(value)}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

// Extracts known result fields for display
interface ScenarioResults {
  service_rate?: number
  stockout_days?: number
  cost_xof?: number
  baseline_service_rate?: number
  baseline_stockout_days?: number
  baseline_cost_xof?: number
  [key: string]: unknown
}

export default async function SimulateurPage() {
  const supabase = createServerClient()

  let scenarios: Scenario[] = []
  let dbError: string | null = null

  if (supabase) {
    const { data, error } = await supabase
      .from('scenarios')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      dbError = error.message
    } else {
      scenarios = (data ?? []) as Scenario[]
    }
  }

  return (
    <main className="flex flex-col min-h-screen bg-kaolin">
      {/* Header */}
      <div className="bg-lagune text-white px-4 sm:px-6 lg:px-8 py-4">
        <Link
          href="/app"
          className="text-brume hover:text-white text-sm transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-palme rounded"
        >
          ← Retour au tableau de bord
        </Link>
        <h1 className="font-display text-xl font-bold mt-1">Simulateur « et si ? »</h1>
        <p className="text-white/60 text-xs">
          Scénarios précalculés par le pipeline
        </p>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Error state */}
        {dbError && (
          <div
            className="mb-6 bg-signal/10 border border-signal/30 rounded-xl px-4 py-3 text-sm text-signal"
            role="alert"
          >
            Erreur de chargement : {dbError}
          </div>
        )}

        {/* No Supabase */}
        {!supabase && (
          <div
            className="mb-6 bg-soleil/10 border border-soleil/30 rounded-xl px-4 py-3 text-sm text-lagune"
            role="status"
          >
            Supabase non configuré — les scénarios ne sont pas disponibles.
          </div>
        )}

        {/* Empty state */}
        {supabase && !dbError && scenarios.length === 0 && (
          <div className="bg-white rounded-xl border border-brume p-8 text-center">
            <p className="text-lagune font-medium mb-2">Aucun scénario disponible</p>
            <p className="text-sm text-lagune/60 max-w-md mx-auto">
              Les scénarios sont précalculés par le pipeline. Lancer{' '}
              <code className="font-mono bg-kaolin px-1 rounded">run_pipeline.py</code>{' '}
              pour les générer.
            </p>
          </div>
        )}

        {/* Scenarios list */}
        {scenarios.length > 0 && (
          <div className="space-y-6">
            {scenarios.map((scenario) => {
              const results = scenario.results as ScenarioResults

              return (
                <article
                  key={scenario.id}
                  className="bg-white rounded-xl border border-brume overflow-hidden"
                >
                  <div className="px-6 py-4 border-b border-brume bg-kaolin">
                    <h2 className="font-display font-semibold text-lagune">{scenario.name}</h2>
                    <p className="text-xs text-lagune/50 mt-0.5">
                      Créé le{' '}
                      {new Date(scenario.created_at).toLocaleDateString('fr-FR', {
                        day: '2-digit',
                        month: 'long',
                        year: 'numeric',
                      })}
                    </p>
                  </div>

                  <div className="px-6 py-4 grid md:grid-cols-3 gap-6">
                    {/* Params */}
                    <div className="md:col-span-1">
                      <h3 className="text-xs font-semibold text-lagune/50 uppercase tracking-wide mb-2">
                        Paramètres
                      </h3>
                      <JsonTable data={scenario.params} />
                    </div>

                    {/* Comparison: without vs with platform */}
                    <div className="md:col-span-2">
                      <h3 className="text-xs font-semibold text-lagune/50 uppercase tracking-wide mb-2">
                        Résultats
                      </h3>
                      <div className="grid grid-cols-2 gap-4">
                        {/* Without platform (baseline) */}
                        <div className="bg-signal/5 border border-signal/20 rounded-lg p-3">
                          <p className="text-xs font-semibold text-signal mb-2">Sans la plateforme</p>
                          <dl className="space-y-1 text-xs">
                            <div className="flex justify-between">
                              <dt className="text-lagune/50">Taux de service</dt>
                              <dd className="font-medium text-lagune">
                                {results.baseline_service_rate != null
                                  ? `${(results.baseline_service_rate * 100).toFixed(1)} %`
                                  : '—'}
                              </dd>
                            </div>
                            <div className="flex justify-between">
                              <dt className="text-lagune/50">Jours de rupture</dt>
                              <dd className="font-medium text-lagune">
                                {results.baseline_stockout_days ?? '—'}
                              </dd>
                            </div>
                            <div className="flex justify-between">
                              <dt className="text-lagune/50">Coût (XOF)</dt>
                              <dd className="font-medium text-lagune">
                                {results.baseline_cost_xof != null
                                  ? results.baseline_cost_xof.toLocaleString('fr-FR')
                                  : '—'}
                              </dd>
                            </div>
                          </dl>
                        </div>

                        {/* With platform */}
                        <div className="bg-palme/5 border border-palme/20 rounded-lg p-3">
                          <p className="text-xs font-semibold text-palme mb-2">Avec la plateforme</p>
                          <dl className="space-y-1 text-xs">
                            <div className="flex justify-between">
                              <dt className="text-lagune/50">Taux de service</dt>
                              <dd className="font-medium text-lagune">
                                {results.service_rate != null
                                  ? `${(results.service_rate * 100).toFixed(1)} %`
                                  : '—'}
                              </dd>
                            </div>
                            <div className="flex justify-between">
                              <dt className="text-lagune/50">Jours de rupture</dt>
                              <dd className="font-medium text-lagune">
                                {results.stockout_days ?? '—'}
                              </dd>
                            </div>
                            <div className="flex justify-between">
                              <dt className="text-lagune/50">Coût (XOF)</dt>
                              <dd className="font-medium text-lagune">
                                {results.cost_xof != null
                                  ? results.cost_xof.toLocaleString('fr-FR')
                                  : '—'}
                              </dd>
                            </div>
                          </dl>
                        </div>
                      </div>

                      {/* Other result fields */}
                      {Object.keys(results).filter(
                        (k) =>
                          ![
                            'service_rate',
                            'stockout_days',
                            'cost_xof',
                            'baseline_service_rate',
                            'baseline_stockout_days',
                            'baseline_cost_xof',
                          ].includes(k)
                      ).length > 0 && (
                        <div className="mt-4">
                          <h4 className="text-xs font-semibold text-lagune/50 uppercase tracking-wide mb-2">
                            Autres résultats
                          </h4>
                          <JsonTable
                            data={Object.fromEntries(
                              Object.entries(results).filter(
                                ([k]) =>
                                  ![
                                    'service_rate',
                                    'stockout_days',
                                    'cost_xof',
                                    'baseline_service_rate',
                                    'baseline_stockout_days',
                                    'baseline_cost_xof',
                                  ].includes(k)
                              )
                            )}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </article>
              )
            })}
          </div>
        )}
      </div>
    </main>
  )
}

