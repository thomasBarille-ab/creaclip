'use client'

import Link from 'next/link'
import { useTranslation } from 'react-i18next'
import { LanguageSwitcher } from '@/components/LanguageSwitcher'

export function Navbar() {
  const { t } = useTranslation()

  return (
    <nav className="fixed top-0 z-50 w-full border-b border-white/5 bg-slate-950/80 backdrop-blur-xl">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 md:px-8">
        <Link href="/" className="text-xl font-bold tracking-tight">
          <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
            Crea
          </span>
          <span className="text-white">Clip</span>
        </Link>

        <div className="hidden items-center gap-8 text-sm text-white/60 md:flex">
          <a href="#features" className="transition-colors hover:text-white">{t('nav.features')}</a>
          <a href="#how-it-works" className="transition-colors hover:text-white">{t('nav.howItWorks')}</a>
          <a href="#pricing" className="transition-colors hover:text-white">{t('nav.pricing')}</a>
          <a href="#faq" className="transition-colors hover:text-white">{t('nav.faq')}</a>
        </div>

        <div className="flex items-center gap-3">
          <LanguageSwitcher className="hidden sm:block" dropUp={false} />
          <a
            href="#hero"
            className="rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 px-5 py-2.5 text-sm font-semibold text-white transition-transform hover:scale-105"
          >
            Rejoindre la waitlist
          </a>
        </div>
      </div>
    </nav>
  )
}
