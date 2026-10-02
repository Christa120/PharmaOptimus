import { Package, Building2, BarChart2 } from "lucide-react"
import { fr } from "@/lib/fr"
import { motion } from "framer-motion"

const ICONS = [Package, Building2, BarChart2]
const ROLES = ["Dépôt central", "District de santé", "Décideur national"]
const COLORS = [
  { icon: "bg-palme/10 text-palme", border: "border-palme/20", accent: "bg-palme" },
  { icon: "bg-soleil/10 text-soleil", border: "border-soleil/20", accent: "bg-soleil" },
  { icon: "bg-signal/10 text-signal", border: "border-signal/20", accent: "bg-signal" },
]

export function ForWhoSection() {
  const { forWho } = fr
  return (
    <section id="pour-qui" className="py-20 sm:py-32 bg-kaolin relative overflow-hidden">
      <div className="absolute top-0 left-1/2 w-[800px] h-[800px] bg-white/50 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
      
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-palme/10 text-palme text-sm font-semibold mb-6">
            {forWho.title}
          </div>
          <h2 className="font-display text-4xl sm:text-5xl font-black text-lagune">Qui utilise la plateforme ?</h2>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {forWho.profiles.map((profile, i) => {
            const Icon = ICONS[i]
            const col = COLORS[i]
            return (
              <motion.article
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ delay: i * 0.15, duration: 0.6 }}
                key={profile.title}
                className={`relative bg-white rounded-3xl p-8 border ${col.border} shadow-sm hover:shadow-xl hover:-translate-y-2 transition-all duration-300 group overflow-hidden flex flex-col gap-6`}
              >
                <div className="flex items-start justify-between">
                  <div className={`w-14 h-14 rounded-2xl ${col.icon} flex items-center justify-center group-hover:scale-110 transition-transform`}>
                    <Icon className="w-7 h-7" strokeWidth={2} />
                  </div>
                  <span className={`text-xs font-bold uppercase tracking-wider px-3 py-1.5 rounded-full bg-lagune/5 text-lagune/50`}>
                    {ROLES[i]}
                  </span>
                </div>
                <div>
                  <h3 className="font-display text-2xl font-bold text-lagune mb-3">{profile.title}</h3>
                  <p className="text-lagune/60 leading-relaxed">{profile.description}</p>
                </div>
                <div className={`absolute bottom-0 left-0 w-full h-1 ${col.accent} opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />
              </motion.article>
            )
          })}
        </div>
      </div>
    </section>
  )
}
