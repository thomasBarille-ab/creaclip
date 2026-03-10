'use client'

import Link from 'next/link'
import { useTranslation } from 'react-i18next'

export function Footer() {
  const { t } = useTranslation()

  return (
    <footer className="border-t border-white/5 bg-slate-950 py-10">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-6 sm:flex-row">
        <Link href="/" className="text-sm font-bold tracking-tight">
          <span className="bg-gradient-to-r from-orange-400 to-amber-400 bg-clip-text text-transparent">
            Crea
          </span>
          <span className="text-white">Clip</span>
        </Link>

        <div className="flex items-center gap-6 text-sm text-white/30">
          <a href="#features" className="transition-colors hover:text-white/60">{t('nav.features')}</a>
          <a href="#how-it-works" className="transition-colors hover:text-white/60">{t('nav.howItWorks')}</a>
          <a href="#pricing" className="transition-colors hover:text-white/60">{t('nav.pricing')}</a>
          <a href="#faq" className="transition-colors hover:text-white/60">{t('nav.faq')}</a>
        </div>

        <p className="text-xs text-white/20">
          {t('landing.footer.copyright', { year: new Date().getFullYear() })}
        </p>
      </div>
    </footer>
  )
}
