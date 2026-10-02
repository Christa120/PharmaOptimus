import { fr } from '@/lib/fr'
import { motion } from 'framer-motion'

export function HowItWorksSection() {
  const { howItWorks } = fr
  return (
    <section id="fonctionnement" className="py-20 sm:py-32 bg-lagune text-white relative overflow-hidden">
      {/* Decorative blurred blobs */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-palme/10 rounded-full blur-[100px] opacity-60" />
      <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-signal/10 rounded-full blur-[100px] opacity-40" />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-20 max-w-2xl mx-auto"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-palme/20 text-palme text-sm font-semibold mb-6">
            Fonctionnement
          </div>
          <h2 className="font-display text-4xl sm:text-5xl font-black leading-tight">
            {howItWorks.title}
          </h2>
        </motion.div>

        {/* Desktop — horizontal timeline */}
        <div className="hidden md:grid grid-cols-4 gap-6 relative">
          {/* Connecting line background */}
          <div className="absolute top-8 left-[12.5%] right-[12.5%] h-1 bg-white/5 rounded-full" />
          {/* Animated Connecting line */}
          <motion.div 
            initial={{ scaleX: 0 }}
            whileInView={{ scaleX: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 1.5, ease: "easeInOut" }}
            className="absolute top-8 left-[12.5%] right-[12.5%] h-1 bg-gradient-to-r from-palme/50 via-palme to-palme/50 rounded-full origin-left" 
          />

          {howItWorks.steps.map((step, i) => {
            const isLast = i === howItWorks.steps.length - 1
            return (
              <motion.div 
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ delay: i * 0.2, duration: 0.6 }}
                key={step.number} 
                className="flex flex-col items-center text-center relative z-10"
              >
                {/* Circle */}
                <div className={`w-16 h-16 rounded-2xl flex items-center justify-center font-display font-black text-2xl mb-8 relative shadow-lg ${
                    isLast
                      ? 'bg-palme text-white shadow-palme/40'
                      : 'bg-white/10 backdrop-blur-md text-white border border-white/20'
                  }`}
                >
                  {isLast && <div className="absolute inset-0 bg-palme rounded-2xl animate-ping opacity-30" />}
                  {step.number}
                </div>
                
                {/* Content Card */}
                <div className={`rounded-3xl p-6 sm:p-8 w-full h-full flex flex-col border ${
                    isLast 
                      ? 'bg-palme/10 border-palme/30 shadow-[0_0_30px_-5px_rgba(31,122,77,0.3)]' 
                      : 'bg-white/5 border-white/10 backdrop-blur-sm'
                  }`}
                >
                  <h3 className="font-display font-bold text-xl mb-4 text-white">
                    {step.title}
                  </h3>
                  <p className="text-white/60 text-sm leading-relaxed flex-grow">
                    {step.description}
                  </p>
                  
                  {isLast && (
                    <div className="mt-6 pt-4 border-t border-palme/30">
                      <span className="inline-block text-xs font-bold uppercase tracking-wider bg-palme/20 text-palme px-3 py-1.5 rounded-full">
                        Toujours votre décision
                      </span>
                    </div>
                  )}
                </div>
              </motion.div>
            )
          })}
        </div>

        {/* Mobile — vertical stack */}
        <div className="md:hidden space-y-6 relative before:absolute before:inset-0 before:ml-8 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-palme/0 before:via-palme/50 before:to-palme/0">
          {howItWorks.steps.map((step, i) => {
            const isLast = i === howItWorks.steps.length - 1
            return (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, duration: 0.5 }}
                key={step.number}
                className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active"
              >
                <div className={`flex items-center justify-center w-16 h-16 rounded-2xl border-4 border-lagune shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 shadow-sm ${
                    isLast
                      ? 'bg-palme text-white'
                      : 'bg-white/10 text-white'
                  }`}
                >
                  <span className="font-display font-black text-xl">{step.number}</span>
                </div>
                
                <div className={`w-[calc(100%-5rem)] md:w-[calc(50%-2.5rem)] p-6 rounded-3xl border ${
                    isLast 
                      ? 'bg-palme/10 border-palme/30' 
                      : 'bg-white/5 border-white/10'
                  }`}
                >
                  <h3 className="font-display font-bold text-lg text-white mb-2">
                    {step.title}
                  </h3>
                  <p className="text-white/60 text-sm leading-relaxed">{step.description}</p>
                  {isLast && (
                    <span className="mt-4 inline-block text-[10px] font-bold uppercase tracking-wider bg-palme/20 text-palme px-3 py-1 rounded-full">
                      Toujours votre décision
                    </span>
                  )}
                </div>
              </motion.div>
            )
          })}
        </div>

        <motion.p 
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.8 }}
          className="text-center text-white/40 text-sm mt-16 max-w-lg mx-auto"
        >
          Aucune action automatique sur le terrain. Chaque recommandation attend votre validation.
        </motion.p>

      </div>
    </section>
  )
}
