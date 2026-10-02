import Link from "next/link"
import { fr } from "@/lib/fr"

interface Props { modelVersion?: string; lastRunDate?: string }

export function Footer({ modelVersion, lastRunDate }: Props) {
  const { footer, nav } = fr
  return (
    <footer className="bg-lagune text-white border-t border-brume/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 lg:gap-8">
          
          <div className="md:col-span-2 space-y-6">
            <Link href="/" className="font-display font-black text-2xl tracking-tight text-white">
              {nav.appName}<span className="text-palme">.</span>
            </Link>
            <p className="text-white/60 text-sm leading-relaxed max-w-sm">
              Plateforme nationale d'aide à la décision pour la logistique pharmaceutique au Bénin.
              Prévisions, optimisation et prévention des ruptures de stock.
            </p>
          </div>

          <div className="space-y-6">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-white/40">À propos</h3>
            <ul className="space-y-4">
              <li>
                <Link href="/methode" className="text-sm text-white/70 hover:text-white transition-colors">
                  Données et méthode
                </Link>
              </li>
              <li>
                <Link href="#fonctionnement" className="text-sm text-white/70 hover:text-white transition-colors">
                  Comment ça marche
                </Link>
              </li>
              <li>
                <Link href="/app" className="text-sm text-palme font-medium hover:text-palme/80 transition-colors">
                  Accéder à l'application
                </Link>
              </li>
            </ul>
          </div>

          <div className="space-y-6">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-white/40">Technique</h3>
            <ul className="space-y-4 text-sm text-white/70">
              <li className="flex items-center justify-between">
                <span>Modèle</span>
                <span className="font-mono bg-white/10 px-2 py-0.5 rounded text-xs">{modelVersion ?? "—"}</span>
              </li>
              <li className="flex items-center justify-between">
                <span>Dernier calcul</span>
                <span>{lastRunDate ?? "—"}</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-16 pt-8 border-t border-white/10 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm text-white/40">
            © {new Date().getFullYear()} PharmaOptimus. {footer.openSource}
          </p>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-palme animate-pulse"></span>
            <p className="text-sm font-medium text-white/50">Démonstration sur données simulées</p>
          </div>
        </div>
      </div>
    </footer>
  )
}

