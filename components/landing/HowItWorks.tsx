'use client'

import { motion } from 'framer-motion'
import { Upload, Sparkles, Download } from 'lucide-react'
import { useTranslation } from 'react-i18next'

export function HowItWorks() {
  const { t } = useTranslation()

  const STEPS = [
    {
      icon: Upload,
      title: t('landing.howItWorks.step1Title'),
      description: t('landing.howItWorks.step1Desc'),
      badge: t('landing.howItWorks.step1Badge'),
      color: 'from-orange-500 to-amber-500',
      iconBg: 'bg-orange-500/20 text-orange-400',
      illustration: (
        <div className="mb-4 flex items-center justify-center">
          <div className="relative h-20 w-32 rounded-lg border border-dashed border-white/20 bg-white/5">
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-1">
              <Upload className="h-5 w-5 text-orange-400" />
              <div className="h-1 w-16 rounded-full bg-white/10">
                <div className="h-full w-3/4 rounded-full bg-orange-500" />
              </div>
              <span className="text-[9px] text-white/40">video.mp4</span>
            </div>
          </div>
        </div>
      ),
    },
    {
      icon: Sparkles,
      title: t('landing.howItWorks.step2Title'),
      description: t('landing.howItWorks.step2Desc'),
      badge: t('landing.howItWorks.step2Badge'),
      color: 'from-amber-500 to-orange-500',
      iconBg: 'bg-amber-500/20 text-amber-400',
      illustration: (
        <div className="mb-4 flex items-center justify-center">
          <div className="flex gap-1.5">
            {[85, 92, 78, 95, 70].map((h, i) => (
              <div key={i} className="flex flex-col items-center gap-1">
                <div
                  className={`w-4 rounded-sm ${i === 1 || i === 3 ? 'bg-amber-500/60' : 'bg-white/10'}`}
                  style={{ height: `${h * 0.6}px` }}
                />
              </div>
            ))}
            <div className="ml-2 flex flex-col gap-1">
              <div className="flex items-center gap-1 rounded bg-amber-500/20 px-1.5 py-0.5">
                <span className="text-[8px] font-bold text-amber-400">9.5</span>
              </div>
              <div className="flex items-center gap-1 rounded bg-orange-500/20 px-1.5 py-0.5">
                <span className="text-[8px] font-bold text-orange-400">8.7</span>
              </div>
            </div>
          </div>
        </div>
      ),
    },
    {
      icon: Download,
      title: t('landing.howItWorks.step3Title'),
      description: t('landing.howItWorks.step3Desc'),
      badge: t('landing.howItWorks.step3Badge'),
      color: 'from-orange-500 to-amber-500',
      iconBg: 'bg-orange-500/20 text-orange-400',
      illustration: (
        <div className="mb-4 flex items-center justify-center">
          <div className="flex gap-2">
            {['TK', 'IG', 'YT'].map((label, i) => (
              <div key={i} className="flex h-14 w-10 flex-col items-center justify-center rounded-lg border border-white/10 bg-white/5">
                <div className="mb-1 h-6 w-6 rounded bg-gradient-to-br from-orange-500/30 to-amber-500/30" />
                <span className="text-[7px] font-bold text-white/40">{label}</span>
              </div>
            ))}
          </div>
        </div>
      ),
    },
  ]

  return (
    <section id="how-it-works" className="bg-slate-950 py-20">
      <div className="mx-auto max-w-6xl px-6">
        {/* Header */}
        <div className="mb-16 text-center">
          <h2 className="mb-4 text-4xl font-bold text-white sm:text-5xl">
            {t('landing.howItWorks.title')}
          </h2>
          <p className="text-lg text-slate-400">
            {t('landing.howItWorks.subtitle')}
          </p>
        </div>

        {/* Steps */}
        <div className="relative grid gap-8 md:grid-cols-3">
          {/* Connection arrows (desktop) */}
          <div className="pointer-events-none absolute left-0 right-0 top-1/2 hidden -translate-y-1/2 md:block">
            <div className="mx-auto flex max-w-4xl justify-between px-16">
              <div className="h-px flex-1 bg-gradient-to-r from-orange-500/50 to-amber-500/50" />
              <div className="mx-8" />
              <div className="h-px flex-1 bg-gradient-to-r from-amber-500/50 to-orange-500/50" />
            </div>
          </div>

          {STEPS.map((step, i) => (
            <motion.div
              key={step.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: i * 0.15 }}
              viewport={{ once: true }}
              className="relative rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl"
            >
              {/* Step number */}
              <div className={`mb-4 inline-flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-r ${step.color} text-sm font-bold text-white`}>
                {i + 1}
              </div>

              {/* Illustration */}
              {step.illustration}

              {/* Icon + Title */}
              <div className="mb-3 flex items-center gap-3">
                <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${step.iconBg}`}>
                  <step.icon className="h-5 w-5" />
                </div>
                <h3 className="text-xl font-bold text-white">{step.title}</h3>
              </div>

              <p className="mb-4 text-sm text-slate-300">{step.description}</p>

              {/* Badge */}
              <span className={`inline-block rounded-full bg-gradient-to-r ${step.color} px-3 py-1 text-xs font-semibold text-white`}>
                {step.badge}
              </span>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
