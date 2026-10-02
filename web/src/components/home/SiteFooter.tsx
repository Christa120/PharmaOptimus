import Link from 'next/link'

const OPEN_SOURCES = [
  'geoBoundaries (CC BY 4.0)',
  'OpenStreetMap contributors (ODbL)',
  'Open-Meteo (CC BY 4.0)',
  "OMS — liste des médicaments essentiels",
]

const NAV_LINKS = [
  { label: 'Accueil',             href: '/'          },
  { label: 'Démo',                href: '/app'       },
  { label: 'Données et méthode',  href: '/methode'   },
  { label: 'Connexion',           href: '/connexion' },
]

export function SiteFooter() {
  return (
    <footer className="bg-lagune text-white border-t border-white/5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 lg:py-16">

        <div className="grid grid-cols-1 md:grid-cols-4 gap-12">

          {/* Col 1 — Brand */}
          <div className="md:col-span-2 space-y-5">
            <Link href="/" className="font-display font-black text-2xl tracking-tight text-white inline-block">
              PharmaOptimus<span className="text-palme">.</span>
            </Link>
            <p className="text-sm leading-relaxed text-white/55 max-w-xs">
              Plateforme nationale d'aide à la décision pour la logistique pharmaceutique au Bénin.
              Prévisions, optimisation et prévention des ruptures de stock.
            </p>
          </div>

          {/* Col 2 — Open sources */}
          <div>
            <h2 className="text-xs font-semibold uppercase tracking-wider text-white/40 mb-5">
              Sources ouvertes
            </h2>
            <ul className="space-y-3 text-sm">
              {OPEN_SOURCES.map((s) => (
                <li key={s} className="text-white/55">{s}</li>
              ))}
            </ul>
          </div>

          {/* Col 3 — Navigation */}
          <div>
            <h2 className="text-xs font-semibold uppercase tracking-wider text-white/40 mb-5">
              Navigation
            </h2>
            <ul className="space-y-3 text-sm">
              {NAV_LINKS.map((l) => (
                <li key={l.href}>
                  <Link
                    href={l.href}
                    className="text-white/55 hover:text-white transition-colors"
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

        </div>

        {/* Bottom line */}
        <div className="mt-14 pt-8 border-t border-white/10 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm text-white/35">
            © {new Date().getFullYear()} PharmaOptimus — Données simulées
          </p>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-palme animate-pulse" />
            <p className="text-sm text-white/40 font-medium">Non validé sur données réelles</p>
          </div>
        </div>

      </div>
    </footer>
  )
}
