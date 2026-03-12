'use client'

import { useTranslation } from 'react-i18next'
import { WaitlistForm } from './WaitlistForm'
import { PhoneMockup } from './PhoneMockup'

export function HeroSection() {
  const { t } = useTranslation()

  return (
    <section id="hero" className="relative flex min-h-screen items-center justify-center overflow-hidden bg-slate-950">
      {/* Animated gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-orange-900/20 via-slate-950 to-amber-900/20" />
      <div className="absolute inset-0">
        <div className="absolute left-1/4 top-1/4 h-96 w-96 rounded-full bg-orange-600/30 blur-3xl animate-[float_20s_ease-in-out_infinite]" />
        <div className="absolute bottom-1/4 right-1/4 h-96 w-96 rounded-full bg-amber-600/30 blur-3xl animate-[float_20s_ease-in-out_infinite_reverse]" />
      </div>

      <div className="relative z-10 mx-auto max-w-6xl px-6 py-20 pt-28 md:pt-32">
        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
          {/* Left column — Copy + Waitlist */}
          <div className="space-y-8">
            <h1 className="text-4xl font-black leading-tight text-white sm:text-5xl md:text-6xl">
              {t('landing.hero.headline1')}
              <span className="block bg-gradient-to-r from-orange-500 to-amber-500 bg-clip-text text-transparent">
                {t('landing.hero.headline2')}
              </span>
              {t('landing.hero.headline3')}
            </h1>

            <p className="max-w-lg text-lg leading-relaxed text-slate-300 sm:text-xl">
              {t('landing.hero.description')}
            </p>

            {/* Waitlist */}
            <WaitlistForm />

          </div>

          {/* Right column — Phone Mockup */}
          <div className="flex justify-center" style={{ perspective: '1000px' }}>
            <div
              className="transition-transform duration-500"
              style={{ transform: 'rotateY(-5deg) rotateX(2deg)' }}
            >
              <PhoneMockup />
            </div>
          </div>
        </div>
      </div>

      {/* Custom animation keyframes */}
      <style jsx>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px) translateX(0px); }
          25% { transform: translateY(-20px) translateX(10px); }
          50% { transform: translateY(10px) translateX(-15px); }
          75% { transform: translateY(-15px) translateX(5px); }
        }
      `}</style>
    </section>
  )
}
