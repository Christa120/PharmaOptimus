'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createBrowserClient } from '@/lib/supabase'

export default function ConnexionPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleMagicLink(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const supabase = createBrowserClient()
    if (!supabase) {
      setError('Supabase non configuré. Utilisez le mode démonstration.')
      setLoading(false)
      return
    }

    const { error: otpError } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/app`,
      },
    })

    setLoading(false)

    if (otpError) {
      setError(otpError.message)
    } else {
      setSent(true)
    }
  }

  function handleDemoMode() {
    router.push('/app')
  }

  return (
    <main className="min-h-screen bg-kaolin flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-white rounded-2xl border border-brume shadow-sm p-8">
        <h1 className="font-display text-2xl font-bold text-lagune mb-2">Connexion</h1>
        <p className="text-sm text-lagune/60 mb-6">
          Entrez votre adresse email pour recevoir un lien de connexion.
        </p>

        {/* Disclaimer */}
        <div
          className="mb-6 text-xs text-lagune/50 bg-kaolin border border-brume rounded-lg px-3 py-2"
          role="note"
        >
          Cette plateforme fonctionne sur <strong>données simulées</strong>. Aucune donnée
          patient réelle n&apos;est utilisée.
        </div>

        {sent ? (
          <div
            className="text-center py-6"
            role="status"
            aria-live="polite"
          >
            <div className="text-palme text-4xl mb-3" aria-hidden="true">
              ✉️
            </div>
            <p className="font-semibold text-lagune mb-1">Lien envoyé !</p>
            <p className="text-sm text-lagune/60">
              Vérifiez votre boîte mail à <strong>{email}</strong>. Cliquez sur le lien pour
              vous connecter.
            </p>
          </div>
        ) : (
          <form onSubmit={handleMagicLink} noValidate>
            <div className="mb-4">
              <label
                htmlFor="email"
                className="block text-sm font-medium text-lagune mb-1"
              >
                Adresse email
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-lg border border-brume px-3 py-2 text-lagune text-sm focus:outline-none focus:ring-2 focus:ring-palme focus:border-transparent placeholder:text-lagune/30"
                placeholder="vous@exemple.bj"
              />
            </div>

            {error && (
              <p className="text-signal text-sm mb-4" role="alert">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading || !email}
              className="w-full bg-palme hover:bg-palme/90 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-2 px-4 rounded-lg transition-colors text-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-palme"
            >
              {loading ? 'Envoi en cours…' : 'Recevoir un lien de connexion'}
            </button>
          </form>
        )}

        {/* Demo mode separator */}
        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center" aria-hidden="true">
            <div className="w-full border-t border-brume" />
          </div>
          <div className="relative flex justify-center text-xs">
            <span className="bg-white px-2 text-lagune/40">ou</span>
          </div>
        </div>

        <button
          type="button"
          onClick={handleDemoMode}
          className="w-full border border-brume hover:border-lagune/40 text-lagune text-sm font-medium py-2 px-4 rounded-lg transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-palme"
        >
          Entrer en mode démonstration
        </button>
        <p className="text-xs text-lagune/40 text-center mt-2">
          Accès immédiat — données simulées uniquement
        </p>
      </div>
    </main>
  )
}
