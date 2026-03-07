'use client'

import { useState } from 'react'

type Status = 'idle' | 'loading' | 'success' | 'error'

export function WaitlistForm() {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<Status>('idle')
  const [errorMessage, setErrorMessage] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!email.trim()) return

    setStatus('loading')
    setErrorMessage('')

    try {
      const res = await fetch('/api/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      })

      const data = await res.json()

      if (!res.ok) {
        setStatus('error')
        setErrorMessage(data.error || 'Une erreur est survenue.')
        return
      }

      setStatus('success')
    } catch {
      setStatus('error')
      setErrorMessage('Une erreur est survenue. Veuillez réessayer.')
    }
  }

  if (status === 'success') {
    return (
      <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-6 py-4 backdrop-blur-xl">
        <p className="text-center font-semibold text-emerald-400">
          Vous êtes inscrit !
        </p>
        <p className="mt-1 text-center text-sm text-slate-300">
          Nous vous préviendrons dès que CreaClip sera disponible.
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="flex w-full max-w-md flex-col gap-3 sm:flex-row">
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="votre@email.com"
        required
        className="flex-1 rounded-xl border border-white/20 bg-white/5 px-4 py-3 text-white placeholder-slate-400 focus:border-purple-500 focus:outline-none transition-colors"
      />
      <button
        type="submit"
        disabled={status === 'loading'}
        className="rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 px-6 py-3 font-semibold text-white shadow-lg transition-transform hover:scale-105 hover:shadow-purple-500/50 disabled:opacity-50 disabled:hover:scale-100"
      >
        {status === 'loading' ? 'Envoi...' : 'Rejoindre la waitlist'}
      </button>
      {status === 'error' && (
        <p className="text-sm text-red-400 sm:col-span-2">{errorMessage}</p>
      )}
    </form>
  )
}
