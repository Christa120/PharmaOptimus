'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Menu, X, ChevronRight } from 'lucide-react'
import { fr } from '@/lib/fr'
import { motion, AnimatePresence } from 'framer-motion'

const NAV_LINKS = [
  { label: fr.nav.problem,    href: '#probleme' },
  { label: fr.nav.solution,   href: '#solution' },
  { label: fr.nav.howItWorks, href: '#fonctionnement' },
  { label: fr.nav.dataMethod, href: '#donnees-methode' },
]

export function Navbar() {
  const [open, setOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <>
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[100]
                   focus:bg-palme focus:text-white focus:px-6 focus:py-3 focus:rounded-xl
                   focus:shadow-2xl text-sm font-semibold transition-all"
      >
        Aller au contenu principal
      </a>

      <header
        className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${
          scrolled
            ? 'bg-white/80 backdrop-blur-xl border-b border-brume/30 shadow-sm py-2'
            : 'bg-transparent py-4'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <Link
              href="/"
              className={`font-display font-black text-xl tracking-tight transition-colors ${
                scrolled ? 'text-lagune' : 'text-lagune md:text-white'
              }`}
            >
              {fr.nav.appName}<span className="text-palme">.</span>
            </Link>

            {/* Desktop nav */}
            <nav className="hidden md:flex items-center bg-white/10 backdrop-blur-md border border-white/20 rounded-full px-6 py-2 shadow-sm">
              <ul className="flex items-center gap-8 text-sm font-medium">
                {NAV_LINKS.map((l) => (
                  <li key={l.href}>
                    <a
                      href={l.href}
                      className={`transition-colors hover:text-palme ${
                        scrolled ? 'text-lagune/80' : 'text-lagune/80 md:text-white/90'
                      }`}
                    >
                      {l.label}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>

            {/* Desktop CTA */}
            <div className="hidden md:flex items-center">
              <Link
                href="/app"
                className={`group inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold transition-all ${
                  scrolled 
                    ? 'bg-palme text-white hover:bg-palme/90 shadow-md hover:shadow-lg' 
                    : 'bg-white text-lagune hover:bg-white/90 shadow-lg'
                }`}
              >
                {fr.nav.openDemo}
                <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>

            {/* Mobile hamburger */}
            <button
              className={`md:hidden p-2.5 rounded-full transition-colors ${
                scrolled ? 'text-lagune hover:bg-brume/20' : 'text-lagune hover:bg-white/20'
              }`}
              aria-label={open ? 'Fermer le menu' : 'Ouvrir le menu'}
              aria-expanded={open}
              onClick={() => setOpen((v) => !v)}
            >
              {open ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile menu dropdown */}
        <AnimatePresence>
          {open && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.2 }}
              className="md:hidden absolute top-full left-0 right-0 bg-white border-b border-brume/30 shadow-xl"
            >
              <nav aria-label="Menu mobile" className="flex flex-col px-6 py-8 gap-6">
                {NAV_LINKS.map((l) => (
                  <a
                    key={l.href}
                    href={l.href}
                    className="text-lg font-medium text-lagune hover:text-palme transition-colors"
                    onClick={() => setOpen(false)}
                  >
                    {l.label}
                  </a>
                ))}
                <div className="pt-4 border-t border-brume/30">
                  <Link
                    href="/app"
                    className="flex items-center justify-center gap-2 w-full bg-palme text-white px-6 py-3.5 rounded-xl font-semibold shadow-md hover:shadow-lg active:scale-95 transition-all"
                    onClick={() => setOpen(false)}
                  >
                    {fr.nav.openDemo}
                    <ChevronRight className="w-5 h-5" />
                  </Link>
                </div>
              </nav>
            </motion.div>
          )}
        </AnimatePresence>
      </header>
    </>
  )
}
