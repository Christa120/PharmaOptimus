import { BarChart2, ShieldAlert, ArrowLeftRight, Route } from 'lucide-react'
import { fr } from '@/lib/fr'
import { motion } from 'framer-motion'

const ICONS = [BarChart2, ShieldAlert, ArrowLeftRight, Route]

export function SolutionSection() {
  const { solution } = fr

  return (
    <section id="solution" className="py-20 sm:py-32 bg-kaolin relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mb-16 max-w-2xl text-center mx-auto"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-palme/10 text-palme text-sm font-semibold mb-6">
            La Solution
          </div>
          <h2 className="font-display text-4xl sm:text-5xl font-black text-lagune leading-tight">
            Quatre modules, une réponse complète.
          </h2>
        </motion.div>

        {/* 4 cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
          {solution.capabilities.map((cap, i) => {
            const Icon = ICONS[i]
            return (
              <motion.article
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ delay: i * 0.1, duration: 0.5 }}
                key={cap.title}
                className="relative bg-white rounded-3xl p-8 border border-white shadow-sm hover:shadow-xl hover:-translate-y-2 transition-all duration-300 group overflow-hidden flex flex-col"
              >
                {/* Decorative Number */}
                <span className="absolute -top-4 -right-2 font-display text-[8rem] font-black text-kaolin/50 leading-none select-none pointer-events-none group-hover:text-palme/5 group-hover:scale-110 transition-all duration-500">
                  {String(i + 1).padStart(2, '0')}
                </span>
                
                <div className="w-14 h-14 rounded-2xl bg-palme/5 flex items-center justify-center mb-8 group-hover:bg-palme group-hover:shadow-[0_0_20px_-5px_rgba(31,122,77,0.5)] transition-all duration-300">
                  <Icon className="w-6 h-6 text-palme group-hover:text-white transition-colors" strokeWidth={2.5} />
                </div>
                
                <h3 className="font-display text-xl font-bold text-lagune mb-4 relative z-10">
                  {cap.title}
                </h3>
                <p className="text-lagune/60 leading-relaxed text-sm relative z-10">
                  {cap.description}
                </p>
                
                {/* Bottom decorative bar */}
                <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-palme/0 via-palme/50 to-palme/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </motion.article>
            )
          })}
        </div>

      </div>
    </section>
  )
}
