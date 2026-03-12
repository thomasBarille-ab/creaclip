'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Upload, Sparkles, SlidersHorizontal } from 'lucide-react'
import { useTranslation } from 'react-i18next'

function TabImport() {
  const { t } = useTranslation()
  return (
    <div className="flex flex-col items-center gap-6 p-6 sm:flex-row sm:p-8">
      {/* Video thumbnail */}
      <div className="relative h-36 w-full shrink-0 overflow-hidden rounded-lg bg-gradient-to-br from-orange-900/50 to-orange-900/50 sm:h-44 sm:w-64">
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="h-12 w-12 rounded-full border-2 border-white/30 bg-white/10 backdrop-blur-sm flex items-center justify-center">
            <div className="ml-1 h-0 w-0 border-y-[8px] border-l-[14px] border-y-transparent border-l-white/80" />
          </div>
        </div>
        <div className="absolute bottom-2 right-2 rounded bg-black/60 px-2 py-0.5 text-[10px] text-white">
          45:23
        </div>
      </div>

      {/* Progress */}
      <div className="flex-1 space-y-4 w-full">
        <div>
          <div className="mb-1 flex items-center justify-between text-sm">
            <span className="text-white">{t('landing.productDemo.tab1Progress')}</span>
            <span className="text-orange-400">67%</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-white/10">
            <motion.div
              className="h-full rounded-full bg-gradient-to-r from-orange-500 to-amber-500"
              initial={{ width: '0%' }}
              animate={{ width: '67%' }}
              transition={{ duration: 2, ease: 'easeOut' }}
            />
          </div>
        </div>
        <div className="flex gap-2">
          {['00:00 - 15:00', '15:00 - 30:00', '30:00 - 45:23'].map((chunk, i) => (
            <div
              key={i}
              className={`rounded-md px-2 py-1 text-[10px] ${
                i < 2
                  ? 'bg-emerald-500/20 text-emerald-400'
                  : 'bg-white/5 text-white/30'
              }`}
            >
              {i < 2 ? '\u2713' : '\u2022'} {chunk}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function TabSuggestions() {
  const { t } = useTranslation()
  const suggestions = [
    { score: 9.5, title: t('landing.productDemo.tab2Sug1'), time: '12:34 - 13:21' },
    { score: 8.7, title: t('landing.productDemo.tab2Sug2'), time: '24:05 - 25:18' },
    { score: 8.2, title: t('landing.productDemo.tab2Sug3'), time: '38:42 - 39:55' },
  ]

  return (
    <div className="p-6 sm:p-8">
      {/* Waveform */}
      <div className="mb-6 flex items-end gap-[2px]">
        {Array.from({ length: 60 }).map((_, i) => {
          const h = Math.sin(i * 0.3) * 15 + Math.random() * 10 + 8
          const isHighlighted = (i >= 15 && i <= 20) || (i >= 35 && i <= 42) || (i >= 50 && i <= 56)
          return (
            <div
              key={i}
              className={`w-1 rounded-full ${isHighlighted ? 'bg-orange-500' : 'bg-white/15'}`}
              style={{ height: `${h}px` }}
            />
          )
        })}
      </div>

      {/* Suggestion cards */}
      <div className="space-y-3">
        {suggestions.map((sug, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.2 }}
            className="flex items-center gap-4 rounded-xl border border-white/10 bg-white/5 p-3"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-orange-500/30 to-amber-500/30">
              <span className="text-sm font-bold text-orange-300">{sug.score}</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">{sug.title}</p>
              <p className="text-xs text-slate-400">{sug.time}</p>
            </div>
            <Sparkles className="h-4 w-4 shrink-0 text-orange-400" />
          </motion.div>
        ))}
      </div>
    </div>
  )
}

function TabEditor() {
  const { t } = useTranslation()
  return (
    <div className="flex flex-col gap-4 p-6 sm:flex-row sm:p-8">
      {/* Mini phone preview */}
      <div className="mx-auto w-28 shrink-0 sm:mx-0">
        <div className="overflow-hidden rounded-xl border-2 border-slate-600 bg-slate-900" style={{ aspectRatio: '9/16' }}>
          <div className="h-full bg-gradient-to-b from-orange-900/50 to-orange-900/50 relative">
            <div className="absolute bottom-3 left-1 right-1">
              <div className="rounded bg-black/50 px-1.5 py-1 text-center">
                <span className="text-[8px] font-bold text-orange-400">{t('landing.productDemo.tab3Sub')}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Editor options */}
      <div className="flex-1 space-y-3">
        {/* Timeline mini */}
        <div className="rounded-lg border border-white/10 bg-white/5 p-3">
          <p className="mb-2 text-[10px] font-medium uppercase tracking-wider text-slate-400">{t('landing.productDemo.tab3Timeline')}</p>
          <div className="flex gap-1">
            {[40, 25, 35].map((w, i) => (
              <div
                key={i}
                className="h-6 rounded bg-gradient-to-r from-orange-500/30 to-amber-500/30 border border-orange-500/20"
                style={{ width: `${w}%` }}
              />
            ))}
          </div>
        </div>

        {/* Style options */}
        <div className="rounded-lg border border-white/10 bg-white/5 p-3">
          <p className="mb-2 text-[10px] font-medium uppercase tracking-wider text-slate-400">{t('landing.productDemo.tab3Style')}</p>
          <div className="flex gap-2">
            {[
              { label: 'Impact', active: true },
              { label: 'Minimal', active: false },
              { label: 'Neon', active: false },
            ].map((style) => (
              <div
                key={style.label}
                className={`rounded-md px-2.5 py-1 text-[10px] font-medium ${
                  style.active
                    ? 'bg-orange-500 text-white'
                    : 'bg-white/5 text-white/40'
                }`}
              >
                {style.label}
              </div>
            ))}
          </div>
        </div>

        {/* Format */}
        <div className="rounded-lg border border-white/10 bg-white/5 p-3">
          <p className="mb-2 text-[10px] font-medium uppercase tracking-wider text-slate-400">{t('landing.productDemo.tab3Format')}</p>
          <div className="flex gap-2">
            {['9:16', '1:1', '16:9'].map((f, i) => (
              <div
                key={f}
                className={`rounded-md px-2.5 py-1 text-[10px] font-medium ${
                  i === 0 ? 'bg-orange-500 text-white' : 'bg-white/5 text-white/40'
                }`}
              >
                {f}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export function ProductDemo() {
  const { t } = useTranslation()
  const [activeTab, setActiveTab] = useState(0)
  const [isPaused, setIsPaused] = useState(false)

  const TABS = [
    { icon: Upload, label: t('landing.productDemo.tab1') },
    { icon: Sparkles, label: t('landing.productDemo.tab2') },
    { icon: SlidersHorizontal, label: t('landing.productDemo.tab3') },
  ]

  const advanceTab = useCallback(() => {
    setActiveTab((prev) => (prev + 1) % 3)
  }, [])

  useEffect(() => {
    if (isPaused) return
    const timer = setInterval(advanceTab, 4000)
    return () => clearInterval(timer)
  }, [isPaused, advanceTab])

  return (
    <section className="bg-slate-900 py-20">
      <div className="mx-auto max-w-4xl px-6">
        {/* Header */}
        <div className="mb-12 text-center">
          <h2 className="mb-4 text-4xl font-bold text-white sm:text-5xl">
            {t('landing.productDemo.title')}
          </h2>
          <p className="text-lg text-slate-400">
            {t('landing.productDemo.subtitle')}
          </p>
        </div>

        {/* Browser frame */}
        <div
          className="overflow-hidden rounded-2xl border border-white/10 shadow-2xl shadow-orange-500/10"
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
        >
          {/* Browser chrome */}
          <div className="flex items-center gap-3 border-b border-white/10 bg-slate-800/80 px-4 py-3">
            <div className="flex gap-1.5">
              <div className="h-3 w-3 rounded-full bg-red-500/80" />
              <div className="h-3 w-3 rounded-full bg-yellow-500/80" />
              <div className="h-3 w-3 rounded-full bg-green-500/80" />
            </div>
            <div className="flex-1 rounded-md bg-white/5 px-3 py-1 text-xs text-slate-500">
              creaclip.io
            </div>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-white/10 bg-slate-800/40">
            {TABS.map((tab, i) => (
              <button
                key={i}
                onClick={() => { setActiveTab(i); setIsPaused(true) }}
                className={`flex flex-1 items-center justify-center gap-2 px-4 py-3 text-sm font-medium transition-colors ${
                  activeTab === i
                    ? 'border-b-2 border-orange-500 text-white'
                    : 'text-slate-400 hover:text-slate-300'
                }`}
              >
                <tab.icon className="h-4 w-4" />
                <span className="hidden sm:inline">{tab.label}</span>
              </button>
            ))}
          </div>

          {/* Tab content */}
          <div className="min-h-[280px] bg-slate-900/80">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.25 }}
              >
                {activeTab === 0 && <TabImport />}
                {activeTab === 1 && <TabSuggestions />}
                {activeTab === 2 && <TabEditor />}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Progress indicator */}
          <div className="flex gap-1 bg-slate-800/40 p-2">
            {TABS.map((_, i) => (
              <div key={i} className="h-1 flex-1 overflow-hidden rounded-full bg-white/10">
                {activeTab === i && (
                  <motion.div
                    className="h-full rounded-full bg-orange-500"
                    initial={{ width: '0%' }}
                    animate={{ width: '100%' }}
                    transition={{ duration: isPaused ? 999 : 4, ease: 'linear' }}
                    key={`progress-${activeTab}-${isPaused}`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
