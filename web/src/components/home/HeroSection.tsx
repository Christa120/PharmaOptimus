import Link from 'next/link'
import { fr } from '@/lib/fr'
import { motion } from 'framer-motion'
import { ArrowRight, Activity, Map, Truck } from 'lucide-react'

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

function deptColor(score: number): string {
  if (score >= 0.75) return '#1F7A4D'
  if (score >= 0.5)  return '#E3A92B'
  return '#C8372D'
}

export function HeroSection() {
  const { hero, disclaimers } = fr

  return (
    <section className="relative min-h-[95vh] flex items-center justify-center bg-lagune overflow-hidden pt-20">
      {/* Dynamic Background */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-palme/20 rounded-full blur-[120px] mix-blend-screen animate-pulse-dot" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-soleil/10 rounded-full blur-[120px] mix-blend-screen animate-pulse-dot" style={{ animationDelay: '1s' }} />
        <div className="absolute top-[40%] right-[20%] w-[30%] h-[30%] bg-signal/10 rounded-full blur-[100px] mix-blend-screen animate-pulse-dot" style={{ animationDelay: '2s' }} />
        
        {/* Subtle Grid */}
        <div 
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `linear-gradient(rgba(255, 255, 255, 0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 255, 255, 0.5) 1px, transparent 1px)`,
            backgroundSize: '40px 40px'
          }}
        />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-20 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          
          {/* LEFT CONTENT */}
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="lg:col-span-7 flex flex-col items-start gap-8"
          >
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="inline-flex items-center gap-3 bg-white/5 border border-white/10 backdrop-blur-md px-4 py-2 rounded-full text-sm text-white/90 shadow-xl"
            >
              <span className="flex h-2.5 w-2.5 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-palme opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-palme"></span>
              </span>
              <span className="font-medium tracking-wide">Bénin · 54 établissements connectés</span>
            </motion.div>

            <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-black text-white leading-[1.05] tracking-tight">
              Chaque médicament<br />
              au bon endroit,<br />
              avant la <span className="text-transparent bg-clip-text bg-gradient-to-r from-signal to-[#ff6b6b]">rupture.</span>
            </h1>

            <p className="text-white/70 text-lg sm:text-xl leading-relaxed max-w-2xl font-body">
              {hero.subheadline}
            </p>

            <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto mt-4">
              <Link 
                href="/app" 
                className="group flex items-center justify-center gap-2 bg-palme text-white px-8 py-4 rounded-2xl font-bold text-lg hover:bg-palme/90 transition-all shadow-[0_0_40px_-10px_rgba(31,122,77,0.5)] hover:shadow-[0_0_60px_-10px_rgba(31,122,77,0.7)] hover:-translate-y-1"
              >
                {hero.ctaDemo}
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link 
                href="/methode" 
                className="flex items-center justify-center bg-white/5 hover:bg-white/10 border border-white/10 text-white px-8 py-4 rounded-2xl font-bold text-lg transition-all hover:-translate-y-1 backdrop-blur-sm"
              >
                {hero.ctaMethod}
              </Link>
            </div>

            <p className="text-white/40 text-sm mt-2 flex items-center gap-2">
              <span className="w-4 h-px bg-white/20" />
              {disclaimers.simulatedData}
            </p>
          </motion.div>

          {/* RIGHT CONTENT - GLASSMORPHISM DASHBOARD PREVIEW */}
          <motion.div 
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4, duration: 0.8, ease: "easeOut" }}
            className="lg:col-span-5 hidden lg:block"
          >
            <div className="relative group">
              {/* Decorative behind card */}
              <div className="absolute -inset-1 bg-gradient-to-tr from-palme to-soleil rounded-[2rem] blur-2xl opacity-20 group-hover:opacity-30 transition-opacity duration-700" />
              
              <div className="relative bg-white/5 border border-white/10 backdrop-blur-2xl rounded-[2rem] p-8 shadow-2xl overflow-hidden">
                <div className="absolute top-0 right-0 p-8 opacity-10">
                  <Activity className="w-32 h-32 text-white" />
                </div>
                
                <div className="relative z-10 space-y-8">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-white/50 text-sm font-semibold tracking-wider uppercase mb-1">Aperçu Réseau</h3>
                      <p className="text-white font-display text-2xl font-bold">État des stocks</p>
                    </div>
                    <span className="bg-soleil/20 border border-soleil/30 text-soleil text-xs font-bold px-3 py-1 rounded-full shadow-[0_0_15px_-3px_rgba(227,169,43,0.4)]">
                      DÉMO EN DIRECT
                    </span>
                  </div>

                  {/* Grid Stats */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-black/20 border border-white/5 rounded-2xl p-4 backdrop-blur-md">
                      <div className="flex items-center gap-2 mb-2">
                        <Map className="w-4 h-4 text-palme" />
                        <span className="text-white/60 text-sm">Couverture</span>
                      </div>
                      <p className="text-white font-display text-3xl font-black">84<span className="text-lg text-white/40">%</span></p>
                    </div>
                    <div className="bg-black/20 border border-white/5 rounded-2xl p-4 backdrop-blur-md">
                      <div className="flex items-center gap-2 mb-2">
                        <Truck className="w-4 h-4 text-signal" />
                        <span className="text-white/60 text-sm">Urgences</span>
                      </div>
                      <p className="text-white font-display text-3xl font-black">12<span className="text-lg text-white/40"> sites</span></p>
                    </div>
                  </div>

                  {/* SVG Map Graphic */}
                  <div className="bg-black/20 border border-white/5 rounded-2xl p-6 backdrop-blur-md flex items-center justify-center relative">
                    <svg
                      viewBox="0 0 370 310"
                      className="w-full h-auto max-h-[220px]"
                      role="img"
                    >
                      {DEPARTMENTS.map((d, i) => (
                        <motion.path
                          initial={{ pathLength: 0, opacity: 0 }}
                          animate={{ pathLength: 1, opacity: 0.85 }}
                          transition={{ delay: 0.8 + (i * 0.1), duration: 1 }}
                          key={d.id}
                          d={d.path}
                          fill={deptColor(d.score)}
                          stroke="rgba(255,255,255,0.2)"
                          strokeWidth="2"
                          className="hover:opacity-100 transition-opacity"
                        />
                      ))}
                      {/* Critical Hub Pulse */}
                      <circle cx="143" cy="293" r="4" fill="#C8372D" />
                      <circle
                        cx="143"
                        cy="293"
                        r="12"
                        fill="none"
                        stroke="#C8372D"
                        strokeWidth="2"
                        className="animate-pulse-dot"
                      />
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
