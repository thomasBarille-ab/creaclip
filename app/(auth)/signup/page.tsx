'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { UserPlus, CircleCheck } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { createClient } from '@/lib/supabase/client'
import { AlertBanner, Button, Input, GoogleAuthButton, useToast } from '@/components/ui'

export default function SignupPage() {
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const toast = useToast()
  const { t } = useTranslation()

  function validate(): string | null {
    if (!fullName.trim()) return t('auth.signup.enterName', 'Please enter your name')
    if (!email.trim()) return t('auth.signup.enterEmail')
    if (password.length < 8) return t('auth.signup.passwordMinLength')
    if (password !== confirmPassword) return t('auth.signup.passwordMismatch')
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
      const { error: authError } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
          data: {
            full_name: fullName.trim(),
          },
        },
      })

      if (authError) {
        toast.error(t('auth.signup.cannotCreateAccount'))
        setError(t('auth.signup.cannotCreateAccount'))
        return
      }

      toast.success(t('auth.signup.toastSuccess'))
      router.push('/dashboard')
    } catch {
      setError(t('common.genericError'))
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-8 text-center backdrop-blur-xl">
        <CircleCheck className="mx-auto mb-4 h-12 w-12 text-emerald-400" />
        <h2 className="mb-2 text-xl font-bold text-white">{t('auth.signup.successTitle')}</h2>
        <p className="text-white/60">
          {t('auth.signup.successMessage')}
          <br />
          {t('auth.signup.successRedirect')}
        </p>
      </div>
    )
  }

  return (
    <>
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold text-white">{t('auth.signup.title')}</h1>
        <p className="mt-2 text-white/60">
          {t('auth.signup.subtitle')}
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
            id="fullName"
            type="text"
            label={t('auth.signup.name', 'Name')}
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            required
            autoComplete="name"
            placeholder={t('auth.signup.namePlaceholder', 'John Doe')}
          />

          <Input
            id="email"
            type="email"
            label={t('auth.signup.email')}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
            placeholder={t('auth.signup.emailPlaceholder')}
          />

          <Input
            id="password"
            type="password"
            label={t('auth.signup.password')}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="new-password"
            placeholder={t('auth.signup.passwordPlaceholder')}
          />

          <Input
            id="confirmPassword"
            type="password"
            label={t('auth.signup.confirmPassword')}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            autoComplete="new-password"
            placeholder={t('auth.signup.confirmPasswordPlaceholder')}
          />

          {error && <AlertBanner message={error} />}

          <Button
            type="submit"
            loading={loading}
            icon={UserPlus}
            size="lg"
            className="w-full"
          >
            {t('auth.signup.submit')}
          </Button>

          <p className="text-center text-sm text-white/50">
            {t('auth.signup.hasAccount')}{' '}
            <Link href="/login" className="text-orange-400 hover:text-orange-300 transition-colors">
              {t('auth.signup.signIn')}
            </Link>
          </p>
        </form>
      </div>
    </>
  )
}
