'use client'

import { useState } from 'react'
import { useTranslation } from 'react-i18next'

type Status = 'idle' | 'loading' | 'success' | 'error'

export function WaitlistForm() {
  const { t } = useTranslation()
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
        setErrorMessage(data.error || t('landing.waitlist.errorDefault'))
        return
      }

      setStatus('success')
    } catch {
      setStatus('error')
      setErrorMessage(t('landing.waitlist.errorRetry'))
    }
  }

  if (status === 'success') {
    return (
      <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-6 py-4 backdrop-blur-xl">
        <p className="text-center font-semibold text-emerald-400">
          {t('landing.waitlist.successTitle')}
        </p>
        <p className="mt-1 text-center text-sm text-slate-300">
          {t('landing.waitlist.successDesc')}
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
        placeholder={t('landing.waitlist.placeholder')}
        required
        className="flex-1 rounded-xl border border-white/20 bg-white/5 px-4 py-3 text-white placeholder-slate-400 focus:border-orange-500 focus:outline-none transition-colors"
      />
      <button
        type="submit"
        disabled={status === 'loading'}
        className="rounded-xl bg-gradient-to-r from-orange-600 to-amber-600 px-6 py-3 font-semibold text-white shadow-lg transition-transform hover:scale-105 hover:shadow-orange-500/50 disabled:opacity-50 disabled:hover:scale-100"
      >
        {status === 'loading' ? t('landing.waitlist.sending') : t('landing.waitlist.cta')}
      </button>
      {status === 'error' && (
        <p className="text-sm text-red-400 sm:col-span-2">{errorMessage}</p>
      )}
    </form>
  )
}
