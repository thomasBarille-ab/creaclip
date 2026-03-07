'use client'

import { Play, Sparkles, Captions } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { WaitlistForm } from './WaitlistForm'

export function HeroSection() {
  const { t } = useTranslation()

  return (
    <section id="hero" className="relative flex min-h-screen items-center justify-center overflow-hidden bg-slate-950">
      {/* Animated gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 via-slate-950 to-pink-900/20" />
      <div className="absolute inset-0">
        <div className="absolute left-1/4 top-1/4 h-96 w-96 animate-pulse rounded-full bg-purple-600/30 blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 h-96 w-96 animate-pulse rounded-full bg-pink-600/30 blur-3xl [animation-delay:1s]" />
      </div>

      <div className="relative z-10 mx-auto max-w-6xl px-6 pt-20">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          {/* Content */}
          <div className="space-y-8">
            <h1 className="text-5xl font-black leading-tight text-white md:text-6xl">
              {t('landing.hero.headline1')}
              <span className="block bg-gradient-to-r from-purple-500 to-pink-500 bg-clip-text text-transparent">
                {t('landing.hero.headline2')}
              </span>
            </h1>

            <p className="text-xl leading-relaxed text-slate-300">
              {t('landing.hero.description')}
            </p>

            {/* Waitlist */}
            <WaitlistForm />

            {/* Social proof */}
            <div className="flex items-center gap-4 pt-4">
              <div className="flex -space-x-2">
                {[
                  'bg-purple-500',
                  'bg-pink-500',
                  'bg-indigo-500',
                  'bg-fuchsia-500',
                ].map((bg, i) => (
                  <div
                    key={i}
                    className={`h-10 w-10 rounded-full border-2 border-slate-950 ${bg}`}
                  />
                ))}
                <div className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-slate-950 bg-slate-800 text-xs font-semibold text-white">
                  {t('landing.hero.socialProofCount')}
                </div>
              </div>
              <div className="text-sm text-slate-400">
                {t('landing.hero.socialProofText')}
                <span className="block text-yellow-400">&#9733;&#9733;&#9733;&#9733;&#9733; {t('landing.hero.socialProofRating')}</span>
              </div>
            </div>
          </div>

          {/* Visual - Dashboard mockup */}
          <div className="relative hidden lg:block">
            <div className="relative overflow-hidden rounded-2xl border border-white/10 shadow-2xl">
              <div className="flex aspect-video items-center justify-center bg-gradient-to-br from-slate-800 to-slate-900">
                <div className="flex items-center gap-8">
                  {/* Video source */}
                  <div className="flex h-44 w-60 flex-col items-center justify-center rounded-lg border border-white/10 bg-white/5">
                    <Play className="mb-2 h-8 w-8 text-white/20" />
                    <p className="text-xs text-white/30">{t('landing.hero.videoSource')}</p>
                    <p className="text-[10px] text-white/15">45:00 min</p>
                  </div>
                  {/* Arrow */}
                  <div className="flex flex-col items-center gap-1">
                    <Sparkles className="h-5 w-5 text-purple-400" />
                    <div className="h-px w-8 bg-gradient-to-r from-purple-500 to-pink-500" />
                    <p className="text-[10px] text-purple-300">IA</p>
                  </div>
                  {/* Generated clips */}
                  <div className="flex gap-3">
                    {[
                      { score: '9.2', color: 'from-purple-500/30 to-pink-500/30' },
                      { score: '8.7', color: 'from-pink-500/30 to-orange-500/30' },
                      { score: '8.1', color: 'from-indigo-500/30 to-purple-500/30' },
                    ].map((clip, i) => (
                      <div key={i} className={`flex h-36 w-20 flex-col items-center justify-center gap-1 rounded-lg border border-white/10 bg-gradient-to-b ${clip.color}`}>
                        <Captions className="h-4 w-4 text-white/40" />
                        <p className="text-[10px] font-bold text-white/60">{t('landing.hero.clip', { num: i + 1 })}</p>
                        <span className="rounded-full bg-purple-500/40 px-1.5 py-0.5 text-[9px] font-bold text-white">
                          {clip.score}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <div className="absolute inset-0 bg-gradient-to-t from-purple-600/20 to-transparent" />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
