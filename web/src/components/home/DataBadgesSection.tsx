import Link from 'next/link'
import { fr } from '@/lib/fr'

const STATUS_STYLES: Record<string, { pill: string; dot: string }> = {
  real:       { pill: 'bg-palme/10 text-palme border border-palme/20',   dot: 'bg-palme'  },
  calibrated: { pill: 'bg-soleil/10 text-soleil border border-soleil/20', dot: 'bg-soleil' },
  simulated:  { pill: 'bg-alerte/10 text-alerte border border-alerte/20', dot: 'bg-alerte' },
}

export function DataBadgesSection() {
  const { dataMethod, disclaimers } = fr
  return (
    <section id="donnees" className="py-14 sm:py-20 bg-kaolin">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Header */}
        <div className="mb-8 sm:mb-12">
          <p className="section-label mb-3">Transparence</p>
          <h2 className="font-display text-2xl sm:text-3xl font-bold text-lagune leading-tight">
            Données et méthode
          </h2>
        </div>

        {/* Status badges */}
        <div className="flex flex-wrap gap-3 mb-8">
          {Object.entries(dataMethod.statusLabels).map(([key, label]) => {
            const style = STATUS_STYLES[key]
            return (
              <div
                key={key}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold ${style.pill}`}
              >
                <span className={`w-2 h-2 rounded-full shrink-0 ${style.dot}`} aria-hidden="true" />
                {label}
              </div>
            )
          })}
        </div>

        {/* Sources table */}
        <div className="bg-white rounded-2xl border border-brume/60 overflow-hidden mb-6">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <caption className="sr-only">
                Sources de données utilisées dans PharmaOptimus
              </caption>
              <thead>
                <tr className="bg-kaolin border-b border-brume/60">
                  {dataMethod.sourceTableHeaders.map((h) => (
                    <th
                      key={h}
                      scope="col"
                      className="text-left text-xs font-bold text-lagune/50 uppercase tracking-wider px-4 py-3"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-brume/40">
                {dataMethod.sources.map((source) => {
                  const style = STATUS_STYLES[source.status] ?? STATUS_STYLES['simulated']
                  return (
                    <tr key={source.name} className="hover:bg-kaolin/50 transition-colors">
                      <td className="px-4 py-3 font-medium text-lagune text-sm">{source.name}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center gap-1.5 text-xs font-semibold
                                     px-2.5 py-0.5 rounded-full ${style.pill}`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${style.dot}`} aria-hidden="true" />
                          {dataMethod.statusLabels[source.status as keyof typeof dataMethod.statusLabels] ?? source.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-lagune/55">{source.notes}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Disclaimer */}
        <div
          className="flex items-start gap-3 bg-signal/8 border border-signal/20 rounded-xl px-4 py-3 mb-6"
          role="note"
        >
          <span className="text-signal text-base shrink-0" aria-hidden="true">⚠️</span>
          <p className="text-sm text-lagune">
            <strong className="text-signal">{disclaimers.notValidated}</strong> —{' '}
            {disclaimers.trainedOnSimulated}
          </p>
        </div>

        <Link href="/methode" className="btn-primary inline-flex">
          Voir la méthode complète →
        </Link>

      </div>
    </section>
  )
}
