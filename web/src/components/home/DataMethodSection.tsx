import Link from "next/link"
import { AlertTriangle } from "lucide-react"
import { fr } from "@/lib/fr"
import type { ModelMetrics } from "@/lib/supabase"

interface Props { metrics?: ModelMetrics | null }

const STATUS_STYLE: Record<string, string> = {
  real:       "bg-palme/15 text-palme border border-palme/20",
  calibrated: "bg-soleil/15 text-soleil border border-soleil/20",
  simulated:  "bg-alerte/15 text-alerte border border-alerte/20",
}

export function DataMethodSection({ metrics }: Props) {
  const { dataMethod, disclaimers } = fr
  return (
    <section id="donnees-methode" className="py-20 bg-lagune text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Header */}
        <div className="text-center mb-12">
          <p className="section-tag text-palme mb-3">{dataMethod.title}</p>
          <h2 className="font-display text-3xl md:text-4xl font-bold mb-4">Transparence totale sur les données</h2>
          <p className="text-white/55 max-w-xl mx-auto">
            Nous distinguons ce qui est réel, ce qui est calibré, et ce qui est simulé. Aucune confusion.
          </p>
        </div>

        {/* Disclaimer */}
        <div className="max-w-2xl mx-auto mb-10">
          <div className="flex items-start gap-3 bg-signal/15 border border-signal/30 rounded-xl p-4" role="alert">
            <AlertTriangle className="w-5 h-5 text-signal shrink-0 mt-0.5" aria-hidden="true" />
            <p className="text-signal text-sm leading-relaxed font-medium">{disclaimers.modelDisclaimer}</p>
          </div>
        </div>

        {/* Sources table */}
        <div className="overflow-x-auto rounded-xl border border-white/10 mb-10">
          <table className="min-w-full text-sm">
            <thead className="bg-white/5">
              <tr>
                {dataMethod.sourceTableHeaders.map((h) => (
                  <th key={h} scope="col" className="px-5 py-3 text-left text-white/50 font-semibold text-xs uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {dataMethod.sources.map((s) => (
                <tr key={s.name} className="hover:bg-white/5 transition-colors">
                  <td className="px-5 py-4 text-white font-medium">{s.name}</td>
                  <td className="px-5 py-4">
                    <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold ${STATUS_STYLE[s.status]}`}>
                      {dataMethod.statusLabels[s.status as keyof typeof dataMethod.statusLabels]}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-white/50 text-xs">{s.notes}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Metrics */}
        {metrics ? (
          <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {[
              { label: "WAPE test", value: metrics.test_wape != null ? `${(metrics.test_wape * 100).toFixed(1)} %` : "—", note: "Erreur relative" },
              { label: "MASE",      value: metrics.mase != null ? metrics.mase.toFixed(2) : "—",                          note: "vs naïf saisonnier" },
              { label: "Couverture Q10–Q90", value: metrics.coverage_q10_q90 != null ? `${(metrics.coverage_q10_q90 * 100).toFixed(1)} %` : "—", note: "Cible : 80 %" },
              { label: "Modèle",    value: metrics.model_version,                                                           note: metrics.status },
            ].map((m) => (
              <div key={m.label} className="bg-white/5 border border-white/10 rounded-xl p-4 text-center">
                <span className="text-white/45 text-xs block mb-1">{m.label}</span>
                <span className="font-display text-2xl font-bold text-white block">{m.value}</span>
                <span className="text-white/25 text-xs">{m.note}</span>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center text-white/30 text-sm mb-8">
            Métriques non disponibles — <Link href="/methode" className="underline hover:text-white/50 transition-colors">voir la page Données et méthode</Link>
          </div>
        )}

        <div className="text-center">
          <Link href="/methode" className="btn-ghost-white">Rapport complet</Link>
        </div>
      </div>
    </section>
  )
}
