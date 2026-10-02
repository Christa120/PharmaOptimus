import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createServerClient } from '@/lib/supabase'
import { ForecastChart } from './ForecastChart'

interface PageProps {
  params: { id: string }
}

export default async function EtablissementPage({ params }: PageProps) {
  const supabase = createServerClient()

  if (!supabase) {
    return (
      <main className="min-h-screen bg-kaolin p-8 max-w-4xl mx-auto">
        <Link
          href="/app"
          className="text-sm text-palme hover:underline mb-6 inline-block"
        >
          ← Retour au tableau de bord
        </Link>
        <p className="text-lagune/60">Supabase non configuré — données non disponibles.</p>
      </main>
    )
  }

  // Resolve current run
  const { data: configData } = await supabase
    .from('app_config')
    .select('value')
    .eq('key', 'current_run_id')
    .single()

  const currentRunId: string | null = configData?.value ?? null

  // Fetch facility
  const { data: facility, error: facilityError } = await supabase
    .from('facilities')
    .select('*')
    .eq('id', params.id)
    .single()

  if (facilityError || !facility) {
    notFound()
  }

  // Parallel queries for this facility
  const [scoresResult, alertsResult, forecastsResult] = await Promise.all([
    currentRunId
      ? supabase
          .from('risk_scores')
          .select('*, products(name_fr)')
          .eq('facility_id', params.id)
          .eq('run_id', currentRunId)
          .order('priority_score', { ascending: false })
      : Promise.resolve({ data: [], error: null }),
    currentRunId
      ? supabase
          .from('alerts')
          .select('*, products(name_fr)')
          .eq('facility_id', params.id)
          .eq('run_id', currentRunId)
          .eq('acknowledged', false)
          .order('severity')
      : Promise.resolve({ data: [], error: null }),
    currentRunId
      ? supabase
          .from('forecasts')
          .select('*')
          .eq('facility_id', params.id)
          .eq('run_id', currentRunId)
          .order('week_start')
          .limit(80)
      : Promise.resolve({ data: [], error: null }),
  ])

  const scores = scoresResult.data ?? []
  const alerts = alertsResult.data ?? []
  const forecasts = forecastsResult.data ?? []

  // Group forecasts by product_id
  const forecastsByProduct = new Map<string, typeof forecasts>()
  for (const f of forecasts) {
    const list = forecastsByProduct.get(f.product_id) ?? []
    list.push(f)
    forecastsByProduct.set(f.product_id, list)
  }

  function severityBadgeClass(severity: string) {
    const map: Record<string, string> = {
      critical: 'bg-signal/10 text-signal border-signal/30',
      high: 'bg-alerte/10 text-alerte border-alerte/30',
      medium: 'bg-soleil/10 text-soleil border-soleil/30',
      low: 'bg-brume text-lagune/60 border-brume',
    }
    return map[severity] ?? 'bg-brume text-lagune/60 border-brume'
  }

  function severityLabel(severity: string) {
    const labels: Record<string, string> = {
      critical: 'Critique',
      high: 'Élevée',
      medium: 'Modérée',
      low: 'Faible',
    }
    return labels[severity] ?? severity
  }

  function stockStatusClass(days: number) {
    if (days < 14) return 'bg-signal/10 text-signal border border-signal/30'
    if (days < 30) return 'bg-alerte/10 text-alerte border border-alerte/30'
    return 'bg-palme/10 text-palme border border-palme/30'
  }

  function stockStatusLabel(days: number) {
    if (days < 14) return 'Critique'
    if (days < 30) return 'À surveiller'
    return 'Bon'
  }

  return (
    <main className="min-h-screen bg-kaolin">
      <div className="bg-lagune text-white px-4 sm:px-6 lg:px-8 py-4">
        <Link
          href="/app"
          className="text-brume hover:text-white text-sm transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-palme rounded"
        >
          ← Retour au tableau de bord
        </Link>
        <h1 className="font-display text-xl font-bold mt-1">{facility.name}</h1>
        <p className="text-white/60 text-xs">
          {facility.type} · {facility.department}
        </p>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Informations générales */}
        <section aria-labelledby="info-heading">
          <h2
            id="info-heading"
            className="font-display font-semibold text-lagune text-lg mb-4"
          >
            Informations générales
          </h2>
          <div className="bg-white rounded-xl border border-brume p-6 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="text-lagune/50 block mb-1">Type</span>
              <span className="font-medium text-lagune">{facility.type}</span>
            </div>
            <div>
              <span className="text-lagune/50 block mb-1">Département</span>
              <span className="font-medium text-lagune">{facility.department}</span>
            </div>
            <div>
              <span className="text-lagune/50 block mb-1">Population desservie</span>
              <span className="font-medium text-lagune">
                {facility.served_population?.toLocaleString('fr-FR') ?? '—'}
              </span>
            </div>
            <div>
              <span className="text-lagune/50 block mb-1">Chaîne du froid</span>
              <span
                className={`font-medium ${
                  facility.has_cold_chain ? 'text-palme' : 'text-signal'
                }`}
              >
                {facility.has_cold_chain ? 'Disponible' : 'Non disponible'}
              </span>
            </div>
          </div>
        </section>

        {/* Alertes actives */}
        {alerts.length > 0 && (
          <section aria-labelledby="alerts-heading">
            <h2
              id="alerts-heading"
              className="font-display font-semibold text-lagune text-lg mb-4"
            >
              Alertes actives ({alerts.length})
            </h2>
            <div className="space-y-2">
              {alerts.map((alert) => (
                <div
                  key={alert.id}
                  className="bg-white rounded-xl border border-brume p-4 flex items-start gap-3"
                >
                  <span
                    className={`text-xs font-semibold px-2 py-0.5 rounded-full border shrink-0 ${severityBadgeClass(alert.severity)}`}
                  >
                    {severityLabel(alert.severity)}
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm text-lagune">
                      {(alert.products as { name_fr?: string } | null)?.name_fr ?? '—'}
                    </p>
                    <p className="text-xs text-lagune/50 capitalize">{alert.alert_type.replace(/_/g, ' ')}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Couverture par produit */}
        {scores.length > 0 && (
          <section aria-labelledby="coverage-heading">
            <h2
              id="coverage-heading"
              className="font-display font-semibold text-lagune text-lg mb-4"
            >
              Couverture par produit
            </h2>
            <div className="bg-white rounded-xl border border-brume overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-brume bg-kaolin">
                    <th className="text-left px-4 py-3 text-lagune/60 font-medium">Produit</th>
                    <th className="text-right px-4 py-3 text-lagune/60 font-medium">Jours de couverture</th>
                    <th className="text-right px-4 py-3 text-lagune/60 font-medium">Score priorité</th>
                    <th className="text-center px-4 py-3 text-lagune/60 font-medium">Statut</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-brume">
                  {scores.map((score) => (
                    <tr key={score.id} className="hover:bg-kaolin/50">
                      <td className="px-4 py-3 text-lagune font-medium">
                        {(score.products as { name_fr?: string } | null)?.name_fr ?? score.product_id}
                      </td>
                      <td className="px-4 py-3 text-right text-lagune">
                        {score.days_coverage != null
                          ? Math.round(score.days_coverage)
                          : '—'}
                      </td>
                      <td className="px-4 py-3 text-right text-lagune">
                        {score.priority_score != null
                          ? (score.priority_score * 100).toFixed(0) + '%'
                          : '—'}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {score.days_coverage != null ? (
                          <span
                            className={`text-xs font-semibold px-2 py-0.5 rounded-full ${stockStatusClass(
                              score.days_coverage
                            )}`}
                          >
                            {stockStatusLabel(score.days_coverage)}
                          </span>
                        ) : (
                          '—'
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {/* Prévisions quantiles */}
        {forecastsByProduct.size > 0 && (
          <section aria-labelledby="forecast-heading">
            <h2
              id="forecast-heading"
              className="font-display font-semibold text-lagune text-lg mb-4"
            >
              Prévisions (8 semaines)
            </h2>
            <div className="space-y-6">
              {Array.from(forecastsByProduct.entries())
                .slice(0, 4) // limit to 4 products for readability
                .map(([productId, productForecasts]) => {
                  const productName =
                    scores.find((s) => s.product_id === productId)
                      ?.products as { name_fr?: string } | null

                  return (
                    <div
                      key={productId}
                      className="bg-white rounded-xl border border-brume p-4"
                    >
                      <h3 className="text-sm font-semibold text-lagune mb-3">
                        {productName?.name_fr ?? productId}
                      </h3>
                      <ForecastChart data={productForecasts.slice(0, 8)} />
                    </div>
                  )
                })}
            </div>
          </section>
        )}

        {/* Empty state */}
        {scores.length === 0 && alerts.length === 0 && forecastsResult.data?.length === 0 && (
          <div className="text-center py-16 text-lagune/50 text-sm">
            Aucune donnée disponible pour cet établissement dans le calcul courant.
          </div>
        )}
      </div>
    </main>
  )
}
