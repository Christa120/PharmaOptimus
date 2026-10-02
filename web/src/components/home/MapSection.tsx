import Link from "next/link"
import { motion } from "framer-motion"
import { MapPin, ArrowRight } from "lucide-react"

const DEPTS = [
  { id: "alibori",    score: 0.62, path: "M110 10L170 10L175 60L115 65Z" },
  { id: "atacora",   score: 0.48, path: "M40 15L110 10L115 65L50 70Z" },
  { id: "atlantique",score: 0.81, path: "M55 230L85 230L90 265L50 265Z" },
  { id: "borgou",    score: 0.55, path: "M115 65L175 60L180 130L120 135Z" },
  { id: "collines",  score: 0.71, path: "M80 145L140 140L145 185L85 190Z" },
  { id: "couffo",    score: 0.44, path: "M45 215L80 215L82 240L48 242Z" },
  { id: "donga",     score: 0.59, path: "M50 70L115 65L120 135L55 140Z" },
  { id: "littoral",  score: 0.88, path: "M85 265L105 265L108 280L83 280Z" },
  { id: "mono",      score: 0.42, path: "M48 242L80 240L82 260L50 262Z" },
  { id: "oueme",     score: 0.76, path: "M120 230L150 228L155 265L122 268Z" },
  { id: "plateau",   score: 0.66, path: "M145 185L185 182L188 225L148 228Z" },
  { id: "zou",       score: 0.69, path: "M80 190L145 185L148 228L82 232Z" },
]
function c(s: number) { return s >= 0.75 ? "#1F7A4D" : s >= 0.55 ? "#E3A92B" : "#C8372D" }

const LEGEND = [
  { color: "bg-signal", label: "Risque élevé — rupture imminente" },
  { color: "bg-soleil", label: "À surveiller — moins de 30 jours" },
  { color: "bg-palme",  label: "Couverture correcte" },
]

export function MapSection() {
  return (
    <section id="carte" className="py-20 sm:py-32 bg-white relative overflow-hidden">
      <div className="absolute top-1/2 left-0 w-[600px] h-[600px] bg-palme/5 rounded-full blur-3xl -translate-y-1/2 -translate-x-1/2" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-20 items-center">

          {/* Text */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.7 }}
            className="space-y-8"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-palme/10 text-palme text-sm font-semibold">
              <MapPin className="w-4 h-4" />
              Carte nationale
            </div>

            <h2 className="font-display text-4xl sm:text-5xl font-black text-lagune leading-[1.1] tracking-tight">
              Vue nationale<br className="hidden sm:block" /> en temps réel
            </h2>

            <p className="text-lagune/65 leading-relaxed text-lg">
              12 départements, 54 établissements, visibles d'un coup d'œil.
              Chaque couleur indique l'état du stock et déclenche une alerte si nécessaire.
            </p>

            <ul className="space-y-4" role="list">
              {LEGEND.map((item, i) => (
                <motion.li
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.2 + i * 0.1, duration: 0.5 }}
                  key={item.label}
                  className="flex items-center gap-4 text-lagune/80"
                >
                  <div className={`w-4 h-4 rounded ${item.color} shrink-0 shadow-sm`} />
                  <span className="font-medium">{item.label}</span>
                </motion.li>
              ))}
            </ul>

            <Link
              href="/app/carte"
              className="group inline-flex items-center gap-3 bg-lagune text-white px-7 py-4 rounded-2xl font-bold hover:bg-lagune/90 transition-all hover:-translate-y-1 shadow-lg shadow-lagune/20"
            >
              Explorer la carte
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
          </motion.div>

          {/* Map preview */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="relative"
          >
            <div className="absolute -inset-4 bg-gradient-to-tr from-lagune/20 to-palme/10 rounded-[3rem] blur-2xl opacity-60" />

            <div className="relative bg-lagune rounded-[2rem] p-8 sm:p-10 overflow-hidden shadow-2xl">
              <div
                className="absolute inset-0 opacity-[0.04]"
                style={{ backgroundImage: "radial-gradient(circle,white 1px,transparent 1px)", backgroundSize: "24px 24px" }}
              />

              <div className="relative z-10 flex flex-wrap gap-2 mb-8 justify-center">
                {["12 départements", "54 établissements", "Alertes actives"].map((b) => (
                  <span key={b} className="bg-white/10 border border-white/10 text-white/80 text-xs font-semibold px-4 py-1.5 rounded-full">
                    {b}
                  </span>
                ))}
              </div>

              <div className="relative z-10 w-full max-w-[200px] sm:max-w-[240px] mx-auto">
                <svg viewBox="0 0 230 300" className="w-full drop-shadow-2xl" role="img" aria-label="Carte schématique des 12 départements du Bénin">
                  <title>Carte schématique du Bénin — scores simulés</title>
                  {DEPTS.map((d, i) => (
                    <motion.path
                      key={d.id}
                      initial={{ opacity: 0 }}
                      whileInView={{ opacity: 0.9 }}
                      viewport={{ once: true }}
                      transition={{ delay: 0.5 + i * 0.05, duration: 0.6 }}
                      d={d.path}
                      fill={c(d.score)}
                      stroke="rgba(11,46,51,0.5)"
                      strokeWidth="2"
                    />
                  ))}
                  {[{ cx: 88, cy: 272 }, { cx: 143, cy: 108 }, { cx: 77, cy: 32 }].map((p, i) => (
                    <g key={i}>
                      <circle cx={p.cx} cy={p.cy} r="4" fill="white" />
                      <circle cx={p.cx} cy={p.cy} r="10" fill="none" stroke="white" strokeWidth="1.5" opacity="0.3" className="animate-ping" />
                    </g>
                  ))}
                </svg>
              </div>

              <p className="relative z-10 text-white/25 text-xs text-center mt-6 font-mono">
                Données simulées · seed=42
              </p>
            </div>
          </motion.div>

        </div>
      </div>
    </section>
  )
}
