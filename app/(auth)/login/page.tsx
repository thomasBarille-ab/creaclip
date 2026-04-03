'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { LogIn } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { createClient } from '@/lib/supabase/client'
import { AlertBanner, Button, Input, GoogleAuthButton, useToast } from '@/components/ui'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const toast = useToast()
  const { t } = useTranslation()

  function validate(): string | null {
    if (!email.trim()) return t('auth.login.enterEmail')
    if (!password) return t('auth.login.enterPassword')
    return null
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    const validationError = validate()
    if (validationError) {
      setError(validationError)
      return
    }

    setLoading(true)

    try {
      const supabase = createClient()
      const { error: authError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      })

      if (authError) {
        if (authError.message === 'Email not confirmed') {
          toast.error(t('auth.login.emailNotConfirmed', 'Please confirm your email first'))
          setError(t('auth.login.emailNotConfirmedDetail', 'Check your inbox and click the confirmation link before logging in.'))
        } else {
          toast.error(t('auth.login.invalidCredentials'))
          setError(t('auth.login.wrongEmailPassword'))
        }
        return
      }

      router.push('/dashboard')
    } catch {
      setError(t('common.genericError'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold text-white">{t('auth.login.title')}</h1>
        <p className="mt-2 text-white/60">
          {t('auth.login.subtitle')}
        </p>
      </div>

      <div className="space-y-5 rounded-2xl border border-white/20 bg-white/10 p-8 backdrop-blur-xl">
        <GoogleAuthButton />

        <div className="flex items-center gap-4">
          <div className="h-px flex-1 bg-white/20" />
          <span className="text-sm text-white/40">{t('common.or')}</span>
          <div className="h-px flex-1 bg-white/20" />
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <Input
            id="email"
            type="email"
            label={t('auth.login.email')}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
            placeholder={t('auth.login.emailPlaceholder')}
          />

          <div>
            <div className="mb-2 flex items-center justify-between">
              <label htmlFor="password" className="text-sm font-medium text-white/70">
                {t('auth.login.password')}
              </label>
              <Link
                href="/reset-password"
                className="text-xs text-orange-400 hover:text-orange-300 transition-colors"
              >
                {t('auth.login.forgotPassword')}
              </Link>
            </div>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              placeholder="••••••••"
            />
          </div>

          {error && <AlertBanner message={error} />}

          <Button
            type="submit"
            loading={loading}
            icon={LogIn}
            size="lg"
            className="w-full"
          >
            {t('auth.login.submit')}
          </Button>

          <p className="text-center text-sm text-white/50">
            {t('auth.login.noAccount')}{' '}
            <Link href="/signup" className="text-orange-400 hover:text-orange-300 transition-colors">
              {t('auth.login.createAccount')}
            </Link>
          </p>
        </form>
      </div>
    </>
  )
}
