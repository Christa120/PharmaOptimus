import type { Metadata } from 'next'
import { Bricolage_Grotesque, Instrument_Sans } from 'next/font/google'
import './globals.css'

const display = Bricolage_Grotesque({ subsets: ['latin'], variable: '--font-display', display: 'swap' })
const body    = Instrument_Sans({ subsets: ['latin'], variable: '--font-body', display: 'swap' })

export const metadata: Metadata = {
  title: 'PharmaOptimus — Gestion pharmaceutique intelligente au Bénin',
  description:
    'Prévision IA, optimisation des transferts et tournées de livraison pour les 54 établissements du réseau pharmaceutique du Bénin.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const useMocks = process.env.NEXT_PUBLIC_USE_MOCKS === 'true'
  return (
    <html
      lang="fr"
      className={`${display.variable} ${body.variable}`}
      style={{ scrollPaddingTop: '64px' }}
    >
      <body className="bg-kaolin text-lagune font-body antialiased">
        {useMocks && (
          <div
            role="alert"
            className="w-full bg-signal text-white text-center text-sm font-semibold py-2 px-4"
          >
            DONNÉES DE MAQUETTE — NE PAS UTILISER EN PRODUCTION
          </div>
        )}
        <div id="main-content">{children}</div>
      </body>
    </html>
  )
}
