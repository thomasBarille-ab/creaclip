'use client'

import { Check } from 'lucide-react'
import { useTranslation } from 'react-i18next'

export function PricingSection() {
  const { t } = useTranslation()

  const PLANS = [
    {
      name: t('landing.pricing.free.name'),
      price: t('landing.pricing.free.price'),
      description: t('landing.pricing.free.description'),
      features: [
        t('landing.pricing.free.features.0'),
        t('landing.pricing.free.features.1'),
        t('landing.pricing.free.features.2'),
      ],
      caveats: [t('landing.pricing.free.caveats.0')],
      cta: t('landing.pricing.free.cta'),
      href: '#hero',
      highlighted: false,
    },
    {
      name: t('landing.pricing.pro.name'),
      price: t('landing.pricing.pro.price'),
      description: t('landing.pricing.pro.description'),
      badge: t('landing.pricing.popular'),
      features: [
        t('landing.pricing.pro.features.0'),
        t('landing.pricing.pro.features.1'),
        t('landing.pricing.pro.features.2'),
        t('landing.pricing.pro.features.3'),
      ],
      caveats: [],
      cta: t('landing.pricing.pro.cta'),
      href: '#hero',
      highlighted: true,
    },
    {
      name: t('landing.pricing.business.name'),
      price: t('landing.pricing.business.price'),
      description: t('landing.pricing.business.description'),
      features: [
        t('landing.pricing.business.features.0'),
        t('landing.pricing.business.features.1'),
        t('landing.pricing.business.features.2'),
        t('landing.pricing.business.features.3'),
      ],
      caveats: [],
      cta: t('landing.pricing.business.cta'),
      href: '#hero',
      highlighted: false,
    },
  ]

  return (
    <section id="pricing" className="bg-slate-900 py-20">
      <div className="mx-auto max-w-6xl px-6">
        <h2 className="mb-4 text-center text-5xl font-bold text-white">
          {t('landing.pricing.title')}
        </h2>
        <p className="mb-16 text-center text-xl text-slate-400">
          {t('landing.pricing.subtitle')}
        </p>

        <div className="mx-auto grid max-w-5xl gap-8 md:grid-cols-3">
          {PLANS.map((plan) => (
            <div
              key={plan.name}
              className={`relative rounded-2xl p-8 backdrop-blur-xl ${
                plan.highlighted
                  ? 'border-2 border-orange-500 bg-white/5'
                  : 'border border-white/10 bg-white/5'
              }`}
            >
              {plan.badge && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 rounded-full bg-gradient-to-r from-orange-600 to-amber-600 px-4 py-1 text-sm font-semibold">
                  &#11088; {plan.badge}
                </div>
              )}

              <h3 className="mb-4 text-2xl font-bold text-white">{plan.name}</h3>
              <div className="mb-2">
                <span className="text-5xl font-bold text-white">{plan.price}&euro;</span>
                <span className="text-slate-400">{t('common.month')}</span>
              </div>
              <p className="mb-6 text-sm text-slate-400">{plan.description}</p>

              <ul className="mb-8 space-y-3">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2 text-sm text-white">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
                    {feature}
                  </li>
                ))}
                {plan.caveats.map((caveat) => (
                  <li key={caveat} className="flex items-start gap-2 text-sm text-slate-400">
                    <span className="mt-0.5 shrink-0 text-xs">&#9888;&#65039;</span>
                    {caveat}
                  </li>
                ))}
              </ul>

              <a
                href={plan.href}
                className={`flex w-full items-center justify-center rounded-xl px-6 py-3 font-semibold transition-all ${
                  plan.highlighted
                    ? 'bg-gradient-to-r from-orange-600 to-amber-600 text-white shadow-lg hover:scale-105'
                    : 'border border-white/20 bg-white/10 text-white hover:bg-white/20'
                }`}
              >
                {plan.cta}
              </a>

            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
