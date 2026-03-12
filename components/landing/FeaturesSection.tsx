'use client'

import { motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'

function MockupGuidedSelection({ t }: { t: (key: string) => string }) {
  return (
    <div className="flex aspect-video items-center justify-center bg-gradient-to-br from-orange-900/20 to-amber-900/20 p-6">
      <div className="flex w-full max-w-md gap-4">
        {/* Without CreaClip */}
        <div className="flex-1 space-y-2">
          <p className="mb-3 text-center text-[10px] font-semibold uppercase tracking-wider text-red-400/80">
            {t('landing.features.feature1Without')}
          </p>
          <div className="grid grid-cols-4 gap-1.5">
            {[false, false, true, false, false, false, true, false].map((good, i) => (
              <div
                key={i}
                className={`flex h-10 items-center justify-center rounded border ${
                  good
                    ? 'border-emerald-500/30 bg-emerald-500/10'
                    : 'border-red-500/20 bg-red-500/5'
                }`}
              >
                <span className="text-xs">{good ? '\u2713' : '\u2717'}</span>
              </div>
            ))}
          </div>
          <p className="text-center text-[9px] text-red-400/60">2/8 {t('landing.features.feature1Usable')}</p>
        </div>

        {/* Divider */}
        <div className="flex items-center">
          <div className="h-16 w-px bg-white/10" />
        </div>

        {/* With CreaClip */}
        <div className="flex-1 space-y-2">
          <p className="mb-3 text-center text-[10px] font-semibold uppercase tracking-wider text-emerald-400/80">
            {t('landing.features.feature1With')}
          </p>
          <div className="grid grid-cols-2 gap-1.5">
            {[9.5, 9.2, 8.8, 8.5].map((score, i) => (
              <div
                key={i}
                className="flex h-10 items-center justify-center gap-1 rounded border border-emerald-500/30 bg-emerald-500/10"
              >
                <span className="text-[10px] text-emerald-400">\u2713</span>
                <span className="text-[10px] font-bold text-emerald-300">{score}</span>
              </div>
            ))}
          </div>
          <p className="text-center text-[9px] text-emerald-400/60">4/4 {t('landing.features.feature1Usable')}</p>
        </div>
      </div>
    </div>
  )
}

function MockupLivePreview({ t }: { t: (key: string) => string }) {
  return (
    <div className="flex aspect-video items-center justify-center bg-gradient-to-br from-orange-900/20 to-amber-900/20 p-6">
      <div className="flex w-full max-w-md gap-4">
        {/* Mini phone */}
        <div className="w-20 shrink-0">
          <div className="overflow-hidden rounded-lg border-2 border-slate-600 bg-slate-900" style={{ aspectRatio: '9/16' }}>
            <div className="relative h-full bg-gradient-to-b from-orange-900/50 to-orange-900/50">
              <div className="absolute bottom-2 left-1 right-1">
                <div className="rounded bg-black/50 px-1 py-0.5 text-center">
                  <span className="text-[6px] font-bold text-orange-400">{t('landing.features.feature2SubPreview')}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Editor panel */}
        <div className="flex-1 space-y-2">
          <div className="rounded-lg border border-white/10 bg-white/5 p-2">
            <div className="mb-1 text-[8px] uppercase tracking-wider text-slate-500">{t('landing.features.feature2StyleLabel')}</div>
            <div className="flex gap-1">
              {['Impact', 'Neon', 'Clean'].map((s, i) => (
                <div key={s} className={`rounded px-2 py-0.5 text-[8px] ${i === 0 ? 'bg-orange-500 text-white' : 'bg-white/5 text-white/30'}`}>
                  {s}
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-lg border border-white/10 bg-white/5 p-2">
            <div className="mb-1 text-[8px] uppercase tracking-wider text-slate-500">{t('landing.features.feature2SizeLabel')}</div>
            <div className="h-1.5 rounded-full bg-white/10">
              <div className="h-full w-3/5 rounded-full bg-orange-500" />
            </div>
          </div>
          <div className="rounded-lg border border-white/10 bg-white/5 p-2">
            <div className="mb-1 text-[8px] uppercase tracking-wider text-slate-500">{t('landing.features.feature2ColorLabel')}</div>
            <div className="flex gap-1">
              {['bg-white', 'bg-orange-400', 'bg-yellow-400', 'bg-amber-400'].map((c, i) => (
                <div key={i} className={`h-4 w-4 rounded-full ${c} ${i === 0 ? 'ring-1 ring-orange-500 ring-offset-1 ring-offset-slate-900' : ''}`} />
              ))}
            </div>
          </div>
          {/* Blinking cursor effect */}
          <div className="flex items-center gap-1 pt-1">
            <div className="h-2 w-px animate-pulse bg-orange-400" />
            <span className="text-[8px] text-slate-500">{t('landing.features.feature2Editing')}</span>
          </div>
        </div>
      </div>
    </div>
  )
}

function MockupMultiFormat({ t }: { t: (key: string) => string }) {
  return (
    <div className="flex aspect-video flex-col items-center justify-center bg-gradient-to-br from-orange-900/20 to-amber-900/20 p-6">
      {/* 3 phones */}
      <div className="mb-4 flex gap-3">
        {[
          { label: 'TikTok', gradient: 'from-amber-500/20 to-red-500/20' },
          { label: 'Reels', gradient: 'from-orange-500/20 to-amber-500/20' },
          { label: 'Shorts', gradient: 'from-red-500/20 to-orange-500/20' },
        ].map((platform) => (
          <div key={platform.label} className="text-center">
            <div className="h-20 w-12 overflow-hidden rounded-lg border border-white/10 bg-gradient-to-b from-slate-800 to-slate-900">
              <div className={`h-full bg-gradient-to-b ${platform.gradient}`}>
                <div className="flex h-full items-end justify-center pb-1.5">
                  <div className="rounded bg-black/50 px-1 py-0.5">
                    <span className="text-[5px] font-bold text-white/60">Aa</span>
                  </div>
                </div>
              </div>
            </div>
            <span className="mt-1 block text-[8px] text-slate-400">{platform.label}</span>
          </div>
        ))}
      </div>

      {/* Toggle + Button */}
      <div className="flex flex-col items-center gap-2">
        <div className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5">
          <div className="h-3 w-6 rounded-full bg-orange-500 relative">
            <div className="absolute right-0.5 top-0.5 h-2 w-2 rounded-full bg-white" />
          </div>
          <span className="text-[9px] text-white/60">{t('landing.features.feature3SelectAll')}</span>
        </div>
        <div className="rounded-lg bg-gradient-to-r from-orange-600 to-amber-600 px-4 py-1.5">
          <span className="text-[10px] font-semibold text-white">{t('landing.features.feature3Export')}</span>
        </div>
      </div>
    </div>
  )
}

export function FeaturesSection() {
  const { t } = useTranslation()

  const FEATURES = [
    {
      badge: t('landing.features.feature1Badge'),
      title: t('landing.features.feature1Title'),
      description: t('landing.features.feature1Desc'),
      mockup: <MockupGuidedSelection t={t} />,
    },
    {
      badge: t('landing.features.feature2Badge'),
      title: t('landing.features.feature2Title'),
      description: t('landing.features.feature2Desc'),
      mockup: <MockupLivePreview t={t} />,
    },
    {
      badge: t('landing.features.feature3Badge'),
      title: t('landing.features.feature3Title'),
      description: t('landing.features.feature3Desc'),
      mockup: <MockupMultiFormat t={t} />,
    },
  ]

  return (
    <section id="features" className="bg-slate-900 py-20">
      <div className="mx-auto max-w-6xl px-6">
        <div className="space-y-24">
          {FEATURES.map((feature, i) => {
            const isReversed = i % 2 === 1
            return (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                viewport={{ once: true }}
                className="grid items-center gap-12 lg:grid-cols-2"
              >
                <div className={`relative overflow-hidden rounded-2xl border border-white/10 ${isReversed ? 'order-1 lg:order-2' : ''}`}>
                  {feature.mockup}
                </div>

                <div className={isReversed ? 'order-2 lg:order-1' : ''}>
                  <span className="mb-4 inline-block rounded-full bg-orange-500/20 px-4 py-2 text-sm font-semibold text-orange-300">
                    {feature.badge}
                  </span>
                  <h3 className="mb-4 text-3xl font-bold text-white">
                    {feature.title}
                  </h3>
                  <p className="text-lg text-slate-300">
                    {feature.description}
                  </p>
                </div>
              </motion.div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
