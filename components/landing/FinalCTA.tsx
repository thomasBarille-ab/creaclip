'use client'

import { useTranslation } from 'react-i18next'
import { WaitlistForm } from './WaitlistForm'

export function FinalCTA() {
  const { t } = useTranslation()

  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-purple-900/50 via-slate-950 to-pink-900/50 py-32">
      <div className="relative z-10 mx-auto max-w-6xl px-6 text-center">
        <h2 className="mb-6 text-5xl font-bold text-white md:text-6xl">
          {t('landing.finalCta.title')}
        </h2>
        <p className="mb-12 text-2xl text-slate-300">
          {t('landing.finalCta.subtitle')}
        </p>

        <div className="flex justify-center">
          <WaitlistForm />
        </div>

        <div className="mt-12 flex flex-wrap justify-center gap-8 text-slate-400">
          <span>&#10003; {t('landing.finalCta.benefit1')}</span>
          <span>&#10003; {t('landing.finalCta.benefit2')}</span>
          <span>&#10003; {t('landing.finalCta.benefit3')}</span>
        </div>
      </div>
    </section>
  )
}
