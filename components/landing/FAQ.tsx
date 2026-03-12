'use client'

import { ChevronDown } from 'lucide-react'
import { useTranslation } from 'react-i18next'

export function FAQ() {
  const { t } = useTranslation()

  const QUESTIONS = [
    { q: t('landing.faq.q1'), a: t('landing.faq.a1') },
    { q: t('landing.faq.q2'), a: t('landing.faq.a2') },
    { q: t('landing.faq.q3'), a: t('landing.faq.a3') },
    { q: t('landing.faq.q4'), a: t('landing.faq.a4') },
    { q: t('landing.faq.q5'), a: t('landing.faq.a5') },
    { q: t('landing.faq.q6'), a: t('landing.faq.a6') },
  ]

  return (
    <section id="faq" className="bg-slate-950 py-20">
      <div className="mx-auto max-w-3xl px-6">
        <div className="mb-14 text-center">
          <p className="mb-3 text-sm font-semibold uppercase tracking-wider text-orange-400">{t('landing.faq.label')}</p>
          <h2 className="text-3xl font-bold text-white md:text-4xl">
            {t('landing.faq.title')}
          </h2>
        </div>

        <div className="space-y-3">
          {QUESTIONS.map(({ q, a }) => (
            <details
              key={q}
              className="group rounded-xl border border-white/10 bg-white/[0.03] transition-colors hover:border-white/15 [&[open]]:border-orange-500/20 [&[open]]:bg-orange-500/[0.03]"
            >
              <summary className="flex cursor-pointer items-center justify-between gap-4 px-6 py-4 text-left font-medium text-white marker:content-none [&::-webkit-details-marker]:hidden">
                {q}
                <ChevronDown className="h-4 w-4 shrink-0 text-white/30 transition-transform group-open:rotate-180" />
              </summary>
              <div className="px-6 pb-4">
                <p className="text-sm leading-relaxed text-white/50">{a}</p>
              </div>
            </details>
          ))}
        </div>
      </div>
    </section>
  )
}
