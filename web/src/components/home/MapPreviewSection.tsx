import Link from 'next/link'
import { motion } from 'framer-motion'
import { MapPin, ArrowRight } from 'lucide-react'

const DEPARTMENTS = [
  { id: 'alibori',    score: 0.62, path: 'M220 20L290 22L285 80L218 78Z' },
  { id: 'atacora',   score: 0.48, path: 'M80 30L220 20L218 78L82 85Z' },
  { id: 'borgou',    score: 0.55, path: 'M218 78L285 80L280 165L216 162Z' },
  { id: 'donga',     score: 0.59, path: 'M82 85L218 78L216 162L84 158Z' },
  { id: 'collines',  score: 0.71, path: 'M84 158L216 162L212 220L86 218Z' },
  { id: 'zou',       score: 0.69, path: 'M86 218L165 215L162 268L88 265Z' },
  { id: 'atlantique',score: 0.81, path: 'M88 265L135 262L130 290L86 288Z' },
  { id: 'littoral',  score: 0.88, path: 'M130 290L160 288L158 300L128 300Z' },
  { id: 'oueme',     score: 0.76, path: 'M162 268L215 265L210 295L160 295Z' },
  { id: 'plateau',   score: 0.66, path: 'M165 215L212 220L215 265L162 268Z' },
  { id: 'mono',      score: 0.42, path: 'M40 260L88 265L86 288L38 285Z' },
  { id: 'couffo',    score: 0.44, path: 'M40 220L86 218L88 265L40 260Z' },
]

const LEGEND = [
  { color: 'bg-palme',  label: 'Couverture ≥ 75 %' },
  { color: 'bg-soleil', label: 'Couverture ≥ 50 %' },
  { color: 'bg-signal', label: 'Couverture < 50 %' },
]

const ALERT_POINTS = [
  { cx: 143, cy: 293, key: 'cotonou' },
  { cx: 99,  cy: 275, key: 'abomey-calavi' },
]

function deptColor(score: number): string {
  if (score >= 0.75) return '#1F7A4D'
  if (score >= 0.5)  return '#E3A92B'
  return '#C8372D'
}

export function MapPreviewSection() {
  return (
    <section id="carte" className="py-20 sm:py-32 bg-white relative overflow-hidden">
      <div className="absolute top-1/2 left-0 w-[600px] h-[600px] bg-palme/5 rounded-full blur-3xl -translate-y-1/2 -translate-x-1/2" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-20 items-center">

          {/* Left — description */}
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
              Vue nationale en temps réel
            </h2>

            <p className="text-lagune/65 leading-relaxed text-lg">
              Visualisez l'état du réseau : couverture par département,
              établissements à risque, flux de transfert et tournées planifiées.
              Toutes les données sont actualisées à chaque cycle de calcul.
            </p>

            <div className="space-y-4">
              {LEGEND.map((l, i) => (
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.2 + i * 0.1 }}
                  key={l.label}
                  className="flex items-center gap-4"
                >
                  <div className={`w-4 h-4 rounded ${l.color} shrink-0 shadow-sm`} />
                  <span className="font-medium text-lagune/80">{l.label}</span>
                </motion.div>
              ))}
            </div>

            <Link
              href="/app/carte"
              className="group inline-flex items-center gap-3 bg-lagune text-white px-7 py-4 rounded-2xl font-bold hover:bg-lagune/90 transition-all hover:-translate-y-1 shadow-lg shadow-lagune/20"
            >
              Explorer la carte
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
          </motion.div>

          {/* Right — SVG map preview */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="relative"
          >
            <div className="absolute -inset-4 bg-gradient-to-tr from-lagune/20 to-palme/10 rounded-[3rem] blur-2xl opacity-60" />

            <div className="relative bg-lagune rounded-[2rem] p-8 sm:p-10 overflow-hidden shadow-2xl">
              <div className="absolute inset-0 opacity-[0.04]"
                style={{ backgroundImage: "radial-gradient(circle,white 1px,transparent 1px)", backgroundSize: "24px 24px" }}
              />

              <div className="relative z-10 flex items-center justify-between mb-8">
                <span className="text-white/40 text-xs font-mono">Carte · Bénin · données simulées</span>
                <span className="bg-soleil/20 border border-soleil/30 text-soleil text-xs font-bold px-3 py-1 rounded-full">
                  DÉMO
                </span>
              </div>

              <div className="relative z-10">
                <svg
                  viewBox="0 0 370 310"
                  className="w-full max-w-[300px] mx-auto drop-shadow-2xl"
                  role="img"
                  aria-label="Carte interactive du Bénin avec couverture pharmaceutique par département"
                >
                  <title>Couverture pharmaceutique par département — données simulées</title>
                  {DEPARTMENTS.map((d, i) => (
                    <motion.path
                      key={d.id}
                      initial={{ opacity: 0 }}
                      whileInView={{ opacity: 0.9 }}
                      viewport={{ once: true }}
                      transition={{ delay: 0.4 + i * 0.05, duration: 0.6 }}
                      d={d.path}
                      fill={deptColor(d.score)}
                      stroke="rgba(255,255,255,0.15)"
                      strokeWidth="2"
                    />
                  ))}

                  {ALERT_POINTS.map((p) => (
                    <g key={p.key}>
                      <circle cx={p.cx} cy={p.cy} r="10" fill="none" stroke="#C8372D" strokeWidth="1.5" opacity="0.4" className="animate-ping" />
                      <circle cx={p.cx} cy={p.cy} r="4" fill="#C8372D" />
                    </g>
                  ))}
                </svg>
              </div>

              <div className="relative z-10 grid grid-cols-3 gap-4 mt-8 pt-6 border-t border-white/10">
                {[
                  { v: '54', label: 'Établissements' },
                  { v: '8',  label: 'Critiques'      },
                  { v: '12', label: 'Dép. cartés'   },
                ].map((s) => (
                  <div key={s.label} className="text-center">
                    <span className="block font-display text-3xl font-black text-white">{s.v}</span>
                    <span className="text-white/40 text-xs mt-1 block">{s.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>

        </div>
      </div>
    </section>
  )
}
