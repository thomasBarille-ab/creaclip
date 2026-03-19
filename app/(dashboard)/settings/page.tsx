'use client'

import { useState, useEffect, useCallback, useRef, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import {
  User,
  Mail,
  Pencil,
  Save,
  Loader2,
  LogOut,
  Trash2,
  Crown,
  Zap,
  Shield,
  Check,
  ArrowUp,
  ArrowDown,
  Sparkles,
  RefreshCw,
  CreditCard,
} from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'
import { AlertBanner, Button, Input, GoogleAuthButton, useToast } from '@/components/ui'
import type { Profile, PlanType, CreatorPersona } from '@/types/database'

const PLAN_CONFIG: Record<PlanType, { labelKey: string; color: string; icon: React.ElementType }> = {
  free: { labelKey: 'settings.subscription.planFree', color: 'bg-white/10 text-white/70', icon: Zap },
  pro: { labelKey: 'settings.subscription.planPro', color: 'bg-orange-500/20 text-orange-300', icon: Crown },
  business: { labelKey: 'settings.subscription.planBusiness', color: 'bg-amber-500/20 text-amber-300', icon: Shield },
}

const PLANS_DETAILS: {
  key: PlanType
  name: string
  price: string
  descriptionKey: string
  featuresKey: string
  badge?: string
}[] = [
  {
    key: 'free',
    name: 'Free',
    price: '0',
    descriptionKey: 'settings.subscription.freeDesc',
    featuresKey: 'settings.subscription.freeFeatures',
  },
  {
    key: 'pro',
    name: 'Pro',
    price: '24',
    descriptionKey: 'settings.subscription.proDesc',
    badge: 'settings.subscription.popular',
    featuresKey: 'settings.subscription.proFeatures',
  },
  {
    key: 'business',
    name: 'Business',
    price: '49',
    descriptionKey: 'settings.subscription.businessDesc',
    featuresKey: 'settings.subscription.businessFeatures',
  },
]

// Composant séparé pour gérer les search params (nécessite Suspense)
function StripeRedirectHandler({ onSuccess, onCanceled }: { onSuccess: () => void; onCanceled: () => void }) {
  const searchParams = useSearchParams()
  const stripeHandled = useRef(false)

  useEffect(() => {
    if (stripeHandled.current) return
    const success = searchParams.get('success')
    const canceled = searchParams.get('canceled')

    if (success === 'true') {
      stripeHandled.current = true
      onSuccess()
    } else if (canceled === 'true') {
      stripeHandled.current = true
      onCanceled()
    }
  }, [searchParams, onSuccess, onCanceled])

  return null
}

function SettingsPageContent() {
  const { t } = useTranslation()
  const router = useRouter()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [authProvider, setAuthProvider] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  const [editing, setEditing] = useState(false)
  const [fullName, setFullName] = useState('')
  const [saving, setSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)

  const [signingOut, setSigningOut] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [switchingPlan, setSwitchingPlan] = useState<PlanType | null>(null)
  const [persona, setPersona] = useState<CreatorPersona | null>(null)
  const [refreshingPersona, setRefreshingPersona] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const toast = useToast()

  const loadProfile = useCallback(async () => {
    setLoading(true)
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const provider = user.app_metadata?.provider ?? 'email'
      setAuthProvider(provider)

      const { data, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (profileError || !data) {
        setError(t('settings.profile.loadError'))
        return
      }

      const p = data as Profile
      setProfile(p)
      setFullName(p.full_name ?? '')

      // Fetch persona si plan business
      if (p.plan === 'business') {
        const { data: personaData } = await supabase
          .from('creator_personas')
          .select('*')
          .eq('user_id', user.id)
          .single()

        setPersona(personaData as CreatorPersona | null)
      } else {
        setPersona(null)
      }
    } catch {
      setError(t('common.genericError'))
    } finally {
      setLoading(false)
    }
  }, [t])

  useEffect(() => {
    loadProfile()
  }, [loadProfile])

  // Callbacks pour le handler Stripe
  const handleStripeSuccess = useCallback(() => {
    toast.success(t('settings.subscription.paymentSuccess'))
    router.replace('/settings')
    loadProfile()
  }, [t, router, loadProfile, toast])

  const handleStripeCanceled = useCallback(() => {
    toast.error(t('settings.subscription.paymentCanceled'))
    router.replace('/settings')
  }, [t, router, toast])

  async function handleSaveName() {
    if (!profile || saving) return
    setSaving(true)
    setSaveSuccess(false)
    setError(null)

    try {
      const supabase = createClient()
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ full_name: fullName.trim() || null })
        .eq('id', profile.id)

      if (updateError) {
        toast.error(t('settings.profile.updateError'))
        setError(t('settings.profile.updateNameError'))
        return
      }

      setProfile({ ...profile, full_name: fullName.trim() || null })
      setEditing(false)
      setSaveSuccess(true)
      toast.success(t('settings.profile.profileUpdated'))
      setTimeout(() => setSaveSuccess(false), 3000)
    } catch {
      setError(t('common.genericError'))
    } finally {
      setSaving(false)
    }
  }

  async function handleSignOut() {
    setSigningOut(true)
    try {
      const supabase = createClient()
      await supabase.auth.signOut()
      toast.success(t('settings.account.signOutSuccess'))
      router.push('/login')
    } catch {
      toast.error(t('settings.account.signOutError'))
      setError(t('settings.account.signOutError'))
      setSigningOut(false)
    }
  }

  async function handleDeleteAccount() {
    if (!profile || deleting) return
    setDeleting(true)
    setError(null)

    try {
      const response = await fetch('/api/account/delete', { method: 'DELETE' })
      if (!response.ok) {
        const data = await response.json()
        toast.error(data.error ?? t('settings.account.deleteError'))
        setError(data.error ?? t('settings.account.deleteError'))
        setDeleting(false)
        return
      }

      toast.success(t('settings.account.deleteSuccess'))
      const supabase = createClient()
      await supabase.auth.signOut()
      router.push('/login')
    } catch {
      toast.error(t('common.genericError'))
      setError(t('common.genericError'))
      setDeleting(false)
    }
  }

  async function handleSwitchPlan(newPlan: PlanType) {
    if (!profile || switchingPlan || newPlan === profile.plan) return
    setSwitchingPlan(newPlan)
    setError(null)

    try {
      const response = await fetch('/api/account/update-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan: newPlan }),
      })

      const data = await response.json()

      if (!response.ok) {
        toast.error(data.error ?? t('settings.subscription.switchError'))
        setError(data.error ?? t('settings.subscription.switchError'))
        return
      }

      // Redirect to Stripe Checkout or Portal
      if (data.url) {
        window.location.href = data.url
        return
      }

      toast.success(t('settings.subscription.planChanged', { plan: t(PLAN_CONFIG[newPlan].labelKey) }))
      await loadProfile()
    } catch {
      toast.error(t('common.genericError'))
      setError(t('common.genericError'))
    } finally {
      setSwitchingPlan(null)
    }
  }

  async function handleManageSubscription() {
    try {
      const response = await fetch('/api/stripe/portal', { method: 'POST' })
      const data = await response.json()

      if (!response.ok) {
        toast.error(data.error ?? t('common.genericError'))
        return
      }

      window.location.href = data.url
    } catch {
      toast.error(t('common.genericError'))
    }
  }

  async function handleRefreshPersona() {
    if (refreshingPersona) return
    setRefreshingPersona(true)

    try {
      const response = await fetch('/api/persona/update', { method: 'POST' })
      const data = await response.json()

      if (!response.ok) {
        toast.error(data.error ?? t('settings.persona.refreshError'))
        return
      }

      if (data.skipped) {
        toast.error(data.reason)
        return
      }

      toast.success(t('settings.persona.refreshed'))
      await loadProfile()
    } catch {
      toast.error(t('common.genericError'))
    } finally {
      setRefreshingPersona(false)
    }
  }

  const displayName = profile?.full_name || profile?.email?.split('@')[0] || ''
  const initials = displayName.slice(0, 2).toUpperCase()
  const plan = profile?.plan ?? 'free'
  const PlanIcon = PLAN_CONFIG[plan].icon

  if (loading) {
    return (
      <>
        <style jsx>{`
          @keyframes fade-in-up {
            from { opacity: 0; transform: translateY(12px); }
            to { opacity: 1; transform: translateY(0); }
          }
          @keyframes shimmer {
            0% { background-position: -200% 0; }
            100% { background-position: 200% 0; }
          }
          .animate-fade-in-up-1 { animation: fade-in-up 0.5s ease-out 0.1s both; }
          .animate-fade-in-up-2 { animation: fade-in-up 0.5s ease-out 0.2s both; }
          .animate-fade-in-up-3 { animation: fade-in-up 0.5s ease-out 0.3s both; }
          .animate-fade-in-up-4 { animation: fade-in-up 0.5s ease-out 0.4s both; }
          .skeleton-shimmer {
            background: linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.08) 50%, transparent 100%);
            background-size: 200% 100%;
            animation: shimmer 1.5s ease-in-out infinite;
          }
        `}</style>

        <div className="mx-auto max-w-5xl space-y-8">
          {/* Hero header */}
          <div className="animate-fade-in-up-1">
            <h1 className="text-2xl font-bold text-white md:text-3xl">{t('settings.title')}</h1>
            <p className="mt-1 text-sm text-white/40">{t('settings.subtitle')}</p>
          </div>

          {/* Skeleton profil */}
          <div className="animate-fade-in-up-2 rounded-2xl border border-white/10 bg-white/5 p-6">
            <div className="mb-5 flex items-center gap-2">
              <div className="h-6 w-1 rounded-full bg-gradient-to-b from-orange-500 to-amber-500" />
              <div className="h-5 w-24 rounded bg-white/10" />
            </div>
            <div className="flex items-start gap-5">
              <div className="relative h-16 w-16 overflow-hidden rounded-full bg-white/10">
                <div className="skeleton-shimmer absolute inset-0" />
              </div>
              <div className="flex-1 space-y-3">
                <div className="h-5 w-40 rounded bg-white/10" />
                <div className="h-4 w-56 rounded bg-white/5" />
              </div>
            </div>
          </div>

          {/* Skeleton abonnement */}
          <div className="animate-fade-in-up-3 rounded-2xl border border-white/10 bg-white/5 p-6">
            <div className="mb-5 flex items-center gap-2">
              <div className="h-6 w-1 rounded-full bg-gradient-to-b from-orange-500 to-amber-500" />
              <div className="h-5 w-32 rounded bg-white/10" />
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="overflow-hidden rounded-xl border border-white/10 p-5">
                  <div className="relative mb-3 h-8 w-8 overflow-hidden rounded-lg bg-white/10">
                    <div className="skeleton-shimmer absolute inset-0" />
                  </div>
                  <div className="mb-2 h-6 w-16 rounded bg-white/10" />
                  <div className="mb-4 h-3 w-full rounded bg-white/5" />
                  <div className="space-y-2">
                    <div className="h-3 w-4/5 rounded bg-white/5" />
                    <div className="h-3 w-3/5 rounded bg-white/5" />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Skeleton compte */}
          <div className="animate-fade-in-up-4 rounded-2xl border border-white/10 bg-white/5 p-6">
            <div className="mb-5 flex items-center gap-2">
              <div className="h-6 w-1 rounded-full bg-gradient-to-b from-orange-500 to-amber-500" />
              <div className="h-5 w-20 rounded bg-white/10" />
            </div>
            <div className="space-y-3">
              <div className="h-12 rounded-xl bg-white/5" />
              <div className="h-12 rounded-xl bg-white/5" />
            </div>
          </div>
        </div>
      </>
    )
  }

  return (
    <>
      <style jsx>{`
        @keyframes fade-in-up {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in-up-1 { animation: fade-in-up 0.5s ease-out 0.1s both; }
        .animate-fade-in-up-2 { animation: fade-in-up 0.5s ease-out 0.2s both; }
        .animate-fade-in-up-3 { animation: fade-in-up 0.5s ease-out 0.3s both; }
        .animate-fade-in-up-4 { animation: fade-in-up 0.5s ease-out 0.4s both; }
        .animate-fade-in-up-5 { animation: fade-in-up 0.5s ease-out 0.5s both; }
      `}</style>

      <div className="mx-auto max-w-5xl space-y-8">
        {/* Handler pour les redirections Stripe (avec Suspense car utilise useSearchParams) */}
        <Suspense fallback={null}>
          <StripeRedirectHandler onSuccess={handleStripeSuccess} onCanceled={handleStripeCanceled} />
        </Suspense>

        {/* ═══ Hero Header ═══ */}
        <div className="animate-fade-in-up-1">
          <h1 className="text-2xl font-bold text-white md:text-3xl">{t('settings.title')}</h1>
          <p className="mt-1 text-sm text-white/40">{t('settings.subtitle')}</p>
        </div>

        {error && <AlertBanner message={error} />}
        {saveSuccess && <AlertBanner variant="success" message={t('settings.profile.profileUpdated')} />}

        {/* Profil */}
        <section className="animate-fade-in-up-2 rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm transition-all duration-300 hover:border-white/15">
          <div className="mb-5 flex items-center gap-2">
            <div className="h-6 w-1 rounded-full bg-gradient-to-b from-orange-500 to-amber-500" />
            <h2 className="text-lg font-semibold text-white">{t('settings.profile.title')}</h2>
          </div>

          <div className="flex items-start gap-5">
            {profile?.avatar_url ? (
              <img src={profile.avatar_url} alt="" className="h-16 w-16 rounded-full object-cover" />
            ) : (
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-orange-500 to-amber-500 text-lg font-bold text-white">
                {initials}
              </div>
            )}

            <div className="flex-1 space-y-3">
              {editing ? (
                <div className="flex items-center gap-2">
                  <Input
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSaveName()}
                    placeholder={t('settings.profile.namePlaceholder')}
                    autoFocus
                    className="max-w-xs px-3 py-2 text-sm"
                  />
                  <Button
                    onClick={handleSaveName}
                    loading={saving}
                    icon={Save}
                    variant="secondary"
                    size="sm"
                  >
                    {t('common.save')}
                  </Button>
                  <button
                    onClick={() => {
                      setEditing(false)
                      setFullName(profile?.full_name ?? '')
                    }}
                    className="rounded-lg px-2 py-2 text-sm text-white/40 transition-colors hover:text-white/60"
                  >
                    {t('common.cancel')}
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-white/40" />
                  <span className="font-medium text-white">
                    {profile?.full_name || <span className="italic text-white/30">{t('settings.profile.noName')}</span>}
                  </span>
                  <button
                    onClick={() => setEditing(true)}
                    className="rounded-md p-1 text-white/30 transition-colors hover:text-orange-400"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                </div>
              )}

              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-white/40" />
                <span className="text-sm text-white/60">{profile?.email}</span>
              </div>

              {authProvider && (
                <div className="flex items-center gap-2">
                  {authProvider === 'google' ? (
                    <>
                      <svg className="h-4 w-4" viewBox="0 0 24 24">
                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18A11.96 11.96 0 0 0 0 12c0 1.94.46 3.77 1.28 5.4l3.56-2.77.01-.54z" />
                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                      </svg>
                      <span className="text-sm text-white/40">{t('settings.profile.connectedViaGoogle')}</span>
                    </>
                  ) : (
                    <>
                      <Shield className="h-4 w-4 text-white/40" />
                      <span className="text-sm text-white/40">{t('settings.profile.connectedViaEmail')}</span>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Abonnement */}
        <section className="animate-fade-in-up-3 rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm transition-all duration-300 hover:border-white/15">
          <div className="mb-5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-6 w-1 rounded-full bg-gradient-to-b from-orange-500 to-amber-500" />
              <h2 className="text-lg font-semibold text-white">{t('settings.subscription.title')}</h2>
            </div>
            <div className="flex items-center gap-2">
              <div className={cn('flex h-8 w-8 items-center justify-center rounded-lg', PLAN_CONFIG[plan].color)}>
                <PlanIcon className="h-4 w-4" />
              </div>
              <span className="text-sm font-medium text-white/60">
                {t('settings.subscription.currentPlan')} {t(PLAN_CONFIG[plan].labelKey)}
              </span>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            {PLANS_DETAILS.map((p) => {
              const isCurrent = p.key === plan
              const PIcon = PLAN_CONFIG[p.key].icon
              const planOrder: PlanType[] = ['free', 'pro', 'business']
              const isUpgrade = planOrder.indexOf(p.key) > planOrder.indexOf(plan)
              const isDowngrade = planOrder.indexOf(p.key) < planOrder.indexOf(plan)
              const isSwitching = switchingPlan === p.key

              return (
                <div
                  key={p.key}
                  className={cn(
                    'relative flex flex-col rounded-xl border p-5 transition-all duration-300',
                    isCurrent
                      ? 'border-orange-500/50 bg-orange-500/10'
                      : 'border-white/10 bg-white/[0.03] hover:-translate-y-0.5 hover:border-white/20 hover:bg-white/5 hover:shadow-lg hover:shadow-orange-600/5'
                  )}
                >
                  {p.badge && !isCurrent && (
                    <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 rounded-full bg-gradient-to-r from-orange-600 to-amber-600 px-3 py-0.5 text-xs font-semibold text-white">
                      {t(p.badge)}
                    </div>
                  )}

                  {isCurrent && (
                    <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 rounded-full bg-orange-500 px-3 py-0.5 text-xs font-semibold text-white">
                      {t('settings.subscription.currentPlan')}
                    </div>
                  )}

                  <div className="mb-3 flex items-center gap-2">
                    <div className={cn('flex h-8 w-8 items-center justify-center rounded-lg', PLAN_CONFIG[p.key].color)}>
                      <PIcon className="h-4 w-4" />
                    </div>
                    <h3 className="font-semibold text-white">{p.name}</h3>
                  </div>

                  <div className="mb-1">
                    <span className="text-2xl font-bold text-white">{p.price}&euro;</span>
                    <span className="text-sm text-white/40">/mois</span>
                  </div>
                  <p className="mb-4 text-xs text-white/40">{t(p.descriptionKey)}</p>

                  <ul className="mb-5 flex-1 space-y-2">
                    {(t(p.featuresKey, { returnObjects: true }) as string[]).map((f) => (
                      <li key={f} className="flex items-start gap-2 text-sm text-white/70">
                        <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-400" />
                        {f}
                      </li>
                    ))}
                  </ul>

                  {isCurrent ? (
                    <div className="rounded-lg border border-orange-500/20 bg-orange-500/10 px-4 py-2 text-center text-sm font-medium text-orange-300">
                      {t('settings.subscription.active')}
                    </div>
                  ) : (
                    <button
                      onClick={() => handleSwitchPlan(p.key)}
                      disabled={switchingPlan !== null}
                      className={cn(
                        'flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all disabled:opacity-50',
                        isUpgrade
                          ? 'bg-gradient-to-r from-orange-600 to-amber-600 text-white hover:scale-[1.02] hover:shadow-lg'
                          : 'border border-white/20 bg-white/5 text-white/70 hover:bg-white/10 hover:text-white'
                      )}
                    >
                      {isSwitching ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : isUpgrade ? (
                        <ArrowUp className="h-4 w-4" />
                      ) : isDowngrade ? (
                        <ArrowDown className="h-4 w-4" />
                      ) : null}
                      {isSwitching
                        ? t('settings.subscription.switching')
                        : isUpgrade
                          ? t('settings.subscription.upgrade', { name: p.name })
                          : t('settings.subscription.downgrade', { name: p.name })}
                    </button>
                  )}
                </div>
              )
            })}
          </div>

          <div className="mt-4 flex items-center justify-between rounded-lg border border-white/5 bg-white/[0.03] p-4">
            <p className="text-sm text-white/40">
              {t('settings.subscription.memberSince')}{' '}
              <span className="text-white/60">
                {profile?.created_at
                  ? new Date(profile.created_at).toLocaleDateString('fr-FR', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })
                  : '—'}
              </span>
              {' '}&middot;{' '}
              {plan === 'free' ? (
                <span className="text-white/60">
                  {t('settings.subscription.creditsRemaining', { count: profile?.credits_remaining ?? 0 })}
                </span>
              ) : (
                <span className="text-orange-300">{t('settings.subscription.unlimitedClips')}</span>
              )}
            </p>
            {profile?.stripe_subscription_id && (
              <button
                onClick={handleManageSubscription}
                className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-white/60 transition-colors hover:bg-white/10 hover:text-white"
              >
                <CreditCard className="h-3.5 w-3.5" />
                {t('settings.subscription.manageSubscription')}
              </button>
            )}
          </div>
        </section>

        {/* Persona IA — Business only */}
        {plan === 'business' && (
          <section className="animate-fade-in-up-4 rounded-2xl border border-amber-500/20 bg-gradient-to-br from-amber-500/5 to-orange-500/5 p-6 backdrop-blur-sm transition-all duration-300 hover:border-amber-500/30">
            <div className="mb-5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/20">
                  <Sparkles className="h-5 w-5 text-amber-300" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-white">{t('settings.persona.title')}</h2>
                  <p className="text-xs text-white/40">{t('settings.persona.subtitle')}</p>
                </div>
              </div>
              <button
                onClick={handleRefreshPersona}
                disabled={refreshingPersona}
                className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-white/60 transition-colors hover:bg-white/10 hover:text-white disabled:opacity-50"
              >
                <RefreshCw className={cn('h-3.5 w-3.5', refreshingPersona && 'animate-spin')} />
                {refreshingPersona ? t('settings.persona.refreshing') : t('settings.persona.refresh')}
              </button>
            </div>

            {persona ? (
              <div className="space-y-4">
                <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                  <p className="text-sm leading-relaxed text-white/70">
                    {persona.persona_summary}
                  </p>
                </div>
                <div className="flex items-center gap-4 text-xs text-white/30">
                  <span>
                    {t('settings.persona.basedOn', { count: persona.clip_count })}
                  </span>
                  <span>
                    {t('settings.persona.updatedAt')}{' '}
                    {new Date(persona.updated_at).toLocaleDateString('fr-FR', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
              </div>
            ) : (
              <div className="rounded-xl border border-white/5 bg-white/[0.03] p-6 text-center">
                <Sparkles className="mx-auto mb-3 h-8 w-8 text-white/20" />
                <p className="mb-1 text-sm text-white/50">{t('settings.persona.noPersona')}</p>
                <p className="text-xs text-white/30">
                  {t('settings.persona.noPersonaDesc')}
                </p>
              </div>
            )}
          </section>
        )}

        {/* Compte */}
        <section className={cn(
          'rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm transition-all duration-300 hover:border-white/15',
          plan === 'business' ? 'animate-fade-in-up-5' : 'animate-fade-in-up-4'
        )}>
          <div className="mb-5 flex items-center gap-2">
            <div className="h-6 w-1 rounded-full bg-gradient-to-b from-orange-500 to-amber-500" />
            <h2 className="text-lg font-semibold text-white">{t('settings.account.title')}</h2>
          </div>

          <div className="space-y-3">
            <button
              onClick={handleSignOut}
              disabled={signingOut}
              className="flex w-full items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-left text-sm text-white/70 transition-all duration-300 hover:bg-white/10 hover:text-white disabled:opacity-50"
            >
              {signingOut ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <LogOut className="h-4 w-4" />
              )}
              {t('settings.account.signOut')}
            </button>

            {!confirmDelete ? (
              <button
                onClick={() => setConfirmDelete(true)}
                className="flex w-full items-center gap-3 rounded-xl border border-red-500/10 bg-red-500/5 px-4 py-3 text-left text-sm text-red-400/70 transition-all duration-300 hover:border-red-500/20 hover:bg-red-500/10 hover:text-red-400"
              >
                <Trash2 className="h-4 w-4" />
                {t('settings.account.deleteAccount')}
              </button>
            ) : (
              <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-4">
                <p className="mb-3 text-sm text-red-300">
                  {t('settings.account.deleteWarning')}
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="danger"
                    onClick={handleDeleteAccount}
                    loading={deleting}
                    icon={Trash2}
                    size="sm"
                  >
                    {t('settings.account.deleteConfirm')}
                  </Button>
                  <button
                    onClick={() => setConfirmDelete(false)}
                    className="rounded-lg px-4 py-2 text-sm text-white/40 transition-colors hover:text-white/60"
                  >
                    {t('common.cancel')}
                  </button>
                </div>
              </div>
            )}
          </div>
        </section>
      </div>
    </>
  )
}

// Export avec Suspense boundary
export default function SettingsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[400px] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-white/30" />
        </div>
      }
    >
      <SettingsPageContent />
    </Suspense>
  )
}
