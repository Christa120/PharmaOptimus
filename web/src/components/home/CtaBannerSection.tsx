import Link from 'next/link'
import { fr } from '@/lib/fr'
import { motion } from 'framer-motion'
import { ArrowRight, Sparkles } from 'lucide-react'

export function CtaBannerSection() {
  return (
    <section className="relative py-24 sm:py-32 overflow-hidden bg-lagune">
      {/* Animated background */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-br from-lagune via-lagune to-palme/40" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-palme/20 rounded-full blur-[100px] animate-pulse-dot" />
      </div>

      <div className="relative z-10 max-w-4xl mx-auto px-4 text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-palme/20 border border-palme/30 text-palme text-sm font-semibold mb-8"
        >
          <Sparkles className="w-4 h-4" />
          Démo disponible maintenant
        </motion.div>

        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="font-display text-4xl sm:text-5xl lg:text-6xl font-black text-white leading-[1.05] mb-6 tracking-tight"
        >
          Prêt à explorer le réseau ?
        </motion.h2>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="text-white/70 text-lg sm:text-xl leading-relaxed mb-10 max-w-2xl mx-auto"
        >
          Tableau de bord, carte nationale, recommandations de transfert —
          toute la plateforme en mode démo.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          <Link
            href="/app"
            className="group inline-flex items-center gap-3 bg-white text-lagune font-black px-10 py-4 rounded-2xl text-lg hover:bg-white/90 transition-all shadow-[0_0_60px_-10px_rgba(255,255,255,0.4)] hover:shadow-[0_0_80px_-10px_rgba(255,255,255,0.6)] hover:-translate-y-1"
          >
            {fr.nav.openDemo}
            <ArrowRight className="w-5 h-5 group-hover:translate-x-2 transition-transform" />
          </Link>
        </motion.div>
      </div>
    </section>
  )
}
