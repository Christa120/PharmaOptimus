"use client"
import { useState } from "react"
import { Plus, Minus } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"

const FAQ_ITEMS = [
  {
    question: "D'où viennent les données ?",
    answer: "Les données géographiques proviennent de geoBoundaries et OpenStreetMap (licences ouvertes). Les données climatiques viennent d'Open-Meteo. Les consommations et stocks sont entièrement simulés — aucune donnée hospitalière réelle n'est utilisée dans cette démo.",
  },
  {
    question: "La plateforme remplace-t-elle le pharmacien ?",
    answer: "Non. PharmaOptimus est un outil d'aide à la décision. Aucune recommandation ne s'exécute automatiquement. Le pharmacien valide, ajuste ou refuse chaque suggestion. L'humain décide toujours.",
  },
  {
    question: "Que se passe-t-il quand je refuse une recommandation ?",
    answer: "Le refus est enregistré avec le motif que vous saisissez. La recommandation passe au statut 'refusée' et disparaît de la liste active. Ces données permettront d'améliorer le modèle.",
  },
  {
    question: "Peut-on l'utiliser dans un autre pays ?",
    answer: "L'architecture est générique. Un déploiement dans un autre pays nécessite de nouvelles données géographiques, une recalibration du simulateur et un réentraînement du modèle sur données locales.",
  },
  {
    question: "Comment fonctionnent les prévisions ?",
    answer: "Un modèle LightGBM global entraîné sur 140 semaines produit des prévisions à horizon 4–8 semaines avec intervalles de confiance [Q10/Q50/Q90]. Les métriques réelles sont disponibles dans Données et méthode.",
  },
  {
    question: "Les données patients sont-elles utilisées ?",
    answer: "Non. Aucune donnée individuelle de patient n'est collectée, stockée ou traitée. Seules les données agrégées de stock et consommation au niveau de l'établissement sont utilisées.",
  },
]

export function FaqSection() {
  const [open, setOpen] = useState<number | null>(null)
  return (
    <section id="faq" className="py-20 sm:py-32 bg-lagune relative overflow-hidden">
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-palme/10 rounded-full blur-[100px] opacity-60" />
      <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-signal/5 rounded-full blur-[100px] opacity-40" />

      <div className="relative z-10 max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-14"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-palme/20 text-palme text-sm font-semibold mb-6">
            FAQ
          </div>
          <h2 className="font-display text-4xl sm:text-5xl font-black text-white leading-tight">Questions fréquentes</h2>
        </motion.div>

        <div className="space-y-3">
          {FAQ_ITEMS.map((item, i) => {
            const isOpen = open === i
            return (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.07, duration: 0.5 }}
                key={i}
                className={`rounded-2xl border transition-all duration-300 overflow-hidden ${
                  isOpen
                    ? "bg-white/10 border-palme/40 shadow-[0_0_30px_-10px_rgba(31,122,77,0.4)] backdrop-blur-md"
                    : "bg-white/5 border-white/10 hover:bg-white/8 backdrop-blur-sm"
                }`}
              >
                <button
                  onClick={() => setOpen(isOpen ? null : i)}
                  aria-expanded={isOpen}
                  aria-controls={`faq-a-${i}`}
                  id={`faq-q-${i}`}
                  className="w-full flex items-center justify-between px-6 py-5 text-left gap-4"
                >
                  <span className={`font-bold text-base transition-colors ${
                    isOpen ? "text-white" : "text-white/80"
                  }`}>
                    {item.question}
                  </span>
                  <div className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                    isOpen ? "bg-palme text-white rotate-180" : "bg-white/10 text-white/60"
                  }`}>
                    {isOpen ? <Minus className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                  </div>
                </button>
                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25, ease: "easeInOut" }}
                      id={`faq-a-${i}`}
                      role="region"
                      aria-labelledby={`faq-q-${i}`}
                    >
                      <div className="px-6 pb-6 text-white/70 leading-relaxed border-t border-white/10 pt-4">
                        {item.answer}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
