import { fr } from '@/lib/fr'
import { motion } from 'framer-motion'
import { AlertCircle, PackageX, TrendingDown, RouteOff } from 'lucide-react'

const CONSEQUENCES = [
  { icon: AlertCircle, text: 'Des médicaments essentiels absents au moment critique', color: 'text-signal', bg: 'bg-signal/10' },
  { icon: PackageX, text: 'Des stocks qui périment faute de redistribution', color: 'text-alerte', bg: 'bg-alerte/10' },
  { icon: RouteOff, text: 'Des livraisons sans optimisation de route', color: 'text-soleil', bg: 'bg-soleil/10' },
  { icon: TrendingDown, text: 'Des décisions sans données fiables en temps réel', color: 'text-palme', bg: 'bg-palme/10' },
]

export function ProblemSection() {
  const { problem } = fr

  return (
    <section id="probleme" className="py-20 sm:py-32 bg-white relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-gradient-to-br from-kaolin via-white to-white rounded-full blur-3xl opacity-60 -translate-y-1/2 translate-x-1/3" />
      <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-brume/10 rounded-full blur-3xl opacity-50 translate-y-1/3 -translate-x-1/4" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-24 items-center">
          
          {/* Left — numbered problems */}
          <motion.div 
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.7 }}
          >
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-signal/10 text-signal text-sm font-semibold mb-6">
              <AlertCircle className="w-4 h-4" />
              Le Problème
            </div>
            
            <h2 className="font-display text-4xl sm:text-5xl font-black text-lagune mb-10 leading-[1.1] tracking-tight">
              Pourquoi la gestion<br className="hidden sm:block" /> actuelle <span className="text-transparent bg-clip-text bg-gradient-to-r from-signal to-alerte">ne suffit pas</span>
            </h2>
            
            <div className="space-y-8">
              {problem.items.map((item, i) => (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-50px" }}
                  transition={{ delay: i * 0.1, duration: 0.5 }}
                  key={item.title}
                  className="flex gap-6 items-start group"
                >
                  <div className="relative shrink-0 flex items-center justify-center">
                    <div className="absolute inset-0 bg-brume/30 rounded-xl rotate-3 group-hover:rotate-6 transition-transform" />
                    <div className="relative bg-white border border-brume/60 w-12 h-12 rounded-xl flex items-center justify-center font-display font-bold text-lg text-lagune shadow-sm group-hover:-translate-y-1 transition-all">
                      {String(i + 1).padStart(2, '0')}
                    </div>
                  </div>
                  <div>
                    <h3 className="font-display text-xl font-bold text-lagune mb-2 group-hover:text-palme transition-colors">
                      {item.title}
                    </h3>
                    <p className="text-lagune/60 leading-relaxed">
                      {item.description}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Right — impact block */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="relative"
          >
            {/* Glossy card effect */}
            <div className="absolute -inset-4 bg-gradient-to-b from-lagune/10 to-lagune/5 rounded-[2.5rem] blur-2xl opacity-50" />
            
            <div className="relative bg-lagune rounded-[2rem] p-8 sm:p-10 shadow-2xl border border-lagune-light/10 overflow-hidden">
              {/* Internal glow */}
              <div className="absolute top-0 right-0 w-64 h-64 bg-signal/10 rounded-full blur-[80px]" />
              
              <h3 className="relative z-10 font-display text-2xl font-bold text-white mb-8">
                Les conséquences sur le terrain
              </h3>
              
              <ul className="relative z-10 space-y-5">
                {CONSEQUENCES.map((item, i) => {
                  const Icon = item.icon
                  return (
                    <motion.li 
                      initial={{ opacity: 0, x: 20 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: 0.3 + (i * 0.1), duration: 0.5 }}
                      key={item.text} 
                      className="flex gap-4 items-center bg-white/5 border border-white/5 rounded-xl p-4 backdrop-blur-sm hover:bg-white/10 transition-colors"
                    >
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${item.bg}`}>
                        <Icon className={`w-5 h-5 ${item.color}`} />
                      </div>
                      <span className="text-white/90 text-sm font-medium leading-snug">{item.text}</span>
                    </motion.li>
                  )
                })}
              </ul>
              
              <div className="relative z-10 mt-8 pt-6 border-t border-white/10 flex justify-between items-center">
                <p className="text-white/40 text-xs font-medium uppercase tracking-wider">
                  Données qualitatives
                </p>
                <div className="flex gap-1">
                  {[1,2,3].map(n => <div key={n} className="w-1.5 h-1.5 rounded-full bg-white/20" />)}
                </div>
              </div>
            </div>
          </motion.div>

        </div>
      </div>
    </section>
  )
}
