import { AlertTriangle } from 'lucide-react'
import { createServerClient } from '@/lib/supabase'
import type { ModelMetrics, PipelineRun } from '@/lib/supabase'
import { fr } from '@/lib/fr'
import { Navbar } from '@/components/home/Navbar'
import { Footer } from '@/components/home/Footer'

// Server Component — loads model metrics and pipeline runs from Supabase.
export default async function MethodePage() {
  const { disclaimers, errors } = fr

  let metrics: ModelMetrics[] = []
  let runs: PipelineRun[] = []
  let supabaseAvailable = false

  const supabase = createServerClient()
  if (supabase) {
    const [metricsResult, runsResult] = await Promise.all([
      supabase
        .from('model_metrics')
        .select('*')
        .order('generated_at', { ascending: false })
        .limit(5),
      supabase
        .from('pipeline_runs')
        .select('*')
        .order('started_at', { ascending: false })
        .limit(10),
    ])

    if (!metricsResult.error && metricsResult.data) {
      metrics = metricsResult.data
      supabaseAvailable = true
    }
    if (!runsResult.error && runsResult.data) {
      runs = runsResult.data
    }
  }

  const latestMetrics = metrics[0] ?? null

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-kaolin">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <h1 className="font-display text-4xl font-bold text-lagune mb-4">
            Données et méthode
          </h1>

          {/* Primary disclaimer — always visible, styled prominently */}
          <div
            className="mb-10 flex items-start gap-3 bg-signal/10 border-2 border-signal rounded-xl p-5"
            role="alert"
          >
            <AlertTriangle className="w-6 h-6 text-signal shrink-0 mt-0.5" aria-hidden="true" />
            <p className="text-signal font-semibold leading-relaxed">
              {disclaimers.modelDisclaimer}
            </p>
          </div>

          {/* Metrics not available warning */}
          {!supabaseAvailable && (
            <div
              className="mb-8 rounded-xl border border-soleil/40 bg-soleil/5 p-4 text-sm text-lagune"
              role="status"
            >
              <strong>Métriques non disponibles</strong> — exécuter{' '}
              <code className="bg-brume px-1 rounded">ml/train_and_export_model.py</code> puis{' '}
              <code className="bg-brume px-1 rounded">ml/run_pipeline.py</code>, puis configurer
              les variables d'environnement Supabase.
            </div>
          )}

          {/* Model metrics table */}
          <section className="mb-12" aria-labelledby="metrics-heading">
            <h2 id="metrics-heading" className="font-display text-2xl font-bold text-lagune mb-6">
              Métriques du modèle
            </h2>

            {latestMetrics ? (
              <div className="overflow-x-auto rounded-xl border border-brume bg-white">
                <table className="min-w-full text-sm">
                  <thead className="bg-lagune/5">
                    <tr>
                      {['Indicateur', 'Valeur', 'Note'].map((h) => (
                        <th
                          key={h}
                          scope="col"
                          className="px-4 py-3 text-left font-semibold text-lagune"
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-brume">
                    <MetricRow
                      name="WAPE (test final)"
                      value={latestMetrics.test_wape != null ? `${(latestMetrics.test_wape * 100).toFixed(1)} %` : '—'}
                      note="Plus bas = meilleur"
                    />
                    <MetricRow
                      name="WAPE (validation croisée)"
                      value={latestMetrics.wape != null ? `${(latestMetrics.wape * 100).toFixed(1)} %` : '—'}
                      note="Moyenne sur plis glissants"
                    />
                    <MetricRow
                      name="MASE"
                      value={latestMetrics.mase != null ? latestMetrics.mase.toFixed(3) : '—'}
                      note="< 1 = meilleur que le naïf saisonnier"
                    />
                    <MetricRow
                      name="Couverture Q10–Q90"
                      value={
                        latestMetrics.coverage_q10_q90 != null
                          ? `${(latestMetrics.coverage_q10_q90 * 100).toFixed(1)} %`
                          : '—'
                      }
                      note="Cible nominale : 80 %"
                    />
                    <MetricRow
                      name="Version modèle"
                      value={latestMetrics.model_version}
                      note=""
                    />
                    <MetricRow
                      name="Statut"
                      value={latestMetrics.status}
                      note="Voir MODELE.md pour les critères de validation"
                    />
                    <MetricRow
                      name="Généré le"
                      value={new Date(latestMetrics.generated_at).toLocaleString('fr-FR')}
                      note=""
                    />
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-lagune/60 italic text-sm">
                {errors.metricsUnavailable}
              </p>
            )}
          </section>

          {/* Pipeline runs */}
          <section aria-labelledby="runs-heading">
            <h2 id="runs-heading" className="font-display text-2xl font-bold text-lagune mb-6">
              Historique des calculs
            </h2>

            {runs.length > 0 ? (
              <div className="overflow-x-auto rounded-xl border border-brume bg-white">
                <table className="min-w-full text-sm">
                  <thead className="bg-lagune/5">
                    <tr>
                      {['Démarré le', 'Terminé le', 'Statut', 'Version', 'Semaine pivot', 'Lignes écrites'].map(
                        (h) => (
                          <th key={h} scope="col" className="px-4 py-3 text-left font-semibold text-lagune">
                            {h}
                          </th>
                        )
                      )}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-brume">
                    {runs.map((run) => (
                      <tr key={run.run_id} className="hover:bg-kaolin/40 transition-colors">
                        <td className="px-4 py-3 text-lagune">
                          {new Date(run.started_at).toLocaleString('fr-FR')}
                        </td>
                        <td className="px-4 py-3 text-lagune/70">
                          {run.finished_at
                            ? new Date(run.finished_at).toLocaleString('fr-FR')
                            : '—'}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold ${
                              run.status === 'success'
                                ? 'bg-palme/10 text-palme'
                                : run.status === 'running'
                                ? 'bg-soleil/10 text-soleil'
                                : 'bg-signal/10 text-signal'
                            }`}
                          >
                            {run.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-lagune/70 font-mono text-xs">
                          {run.model_version}
                        </td>
                        <td className="px-4 py-3 text-lagune/70">{run.cutoff_week}</td>
                        <td className="px-4 py-3 text-lagune/70">
                          {run.rows_written ?? '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-lagune/60 italic text-sm">Aucun calcul enregistré.</p>
            )}
          </section>
        </div>
      </main>
      <Footer
        modelVersion={latestMetrics?.model_version}
        lastRunDate={
          runs[0]?.finished_at
            ? new Date(runs[0].finished_at).toLocaleDateString('fr-FR')
            : undefined
        }
      />
    </>
  )
}

function MetricRow({
  name,
  value,
  note,
}: {
  name: string
  value: string
  note: string
}) {
  return (
    <tr className="hover:bg-kaolin/40 transition-colors">
      <td className="px-4 py-3 font-medium text-lagune">{name}</td>
      <td className="px-4 py-3 font-mono text-lagune/80">{value}</td>
      <td className="px-4 py-3 text-lagune/50 text-xs">{note}</td>
    </tr>
  )
}

