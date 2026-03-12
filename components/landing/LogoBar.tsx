'use client'

import { useTranslation } from 'react-i18next'

const PLATFORMS = [
  {
    name: 'TikTok',
    path: 'M12.5 2.5c0 2.8 1.8 5.1 4.3 5.9v3.1c-1.5-.2-2.9-.8-4.1-1.7v7.3c0 3.6-2.9 6.4-6.4 6.4S0 20.7 0 17.1c0-3.5 2.8-6.3 6.3-6.4v3.1c-1.8.1-3.2 1.5-3.2 3.3 0 1.8 1.5 3.3 3.3 3.3s3.3-1.5 3.3-3.3V2.5h2.8z',
    viewBox: '0 0 17 28',
  },
  {
    name: 'Instagram',
    path: 'M12 2.2c2.7 0 3 0 4.1.1 1 0 1.5.2 1.9.4.5.2.8.4 1.1.7.3.3.5.7.7 1.1.2.4.3.9.4 1.9 0 1.1.1 1.4.1 4.1s0 3-.1 4.1c0 1-.2 1.5-.4 1.9-.2.5-.4.8-.7 1.1-.3.3-.7.5-1.1.7-.4.2-.9.3-1.9.4-1.1 0-1.4.1-4.1.1s-3 0-4.1-.1c-1 0-1.5-.2-1.9-.4-.5-.2-.8-.4-1.1-.7-.3-.3-.5-.7-.7-1.1-.2-.4-.3-.9-.4-1.9 0-1.1-.1-1.4-.1-4.1s0-3 .1-4.1c0-1 .2-1.5.4-1.9.2-.5.4-.8.7-1.1.3-.3.7-.5 1.1-.7.4-.2.9-.3 1.9-.4 1.1 0 1.4-.1 4.1-.1zM12 0C9.3 0 8.9 0 7.8.1 6.7.1 5.9.3 5.2.6c-.7.3-1.3.6-1.9 1.2C2.7 2.4 2.4 3 2.1 3.7c-.3.7-.5 1.5-.5 2.6C1.5 7.4 1.5 7.7 1.5 10.5s0 3.1.1 4.2c0 1.1.2 1.9.5 2.6.3.7.6 1.3 1.2 1.9.6.6 1.2.9 1.9 1.2.7.3 1.5.5 2.6.5 1.1 0 1.4.1 4.2.1s3.1 0 4.2-.1c1.1 0 1.9-.2 2.6-.5.7-.3 1.3-.6 1.9-1.2.6-.6.9-1.2 1.2-1.9.3-.7.5-1.5.5-2.6 0-1.1.1-1.4.1-4.2s0-3.1-.1-4.2c0-1.1-.2-1.9-.5-2.6-.3-.7-.6-1.3-1.2-1.9-.6-.6-1.2-.9-1.9-1.2C17.1.3 16.3.1 15.2.1 14.1 0 13.8 0 12 0zm0 5.1a5.4 5.4 0 100 10.8 5.4 5.4 0 000-10.8zm0 8.9a3.5 3.5 0 110-7 3.5 3.5 0 010 7zm5.6-9.1a1.3 1.3 0 100-2.6 1.3 1.3 0 000 2.6z',
    viewBox: '0 0 24 21',
  },
  {
    name: 'YouTube',
    path: 'M23.5 6.2s-.2-1.7-.9-2.4c-.9-.9-1.8-.9-2.3-1C17 2.5 12 2.5 12 2.5s-5 0-8.3.3c-.5.1-1.4.1-2.3 1-.7.7-.9 2.4-.9 2.4S0 8.2 0 10.1v1.8c0 2 .5 3.9.5 3.9s.2 1.7.9 2.4c.9.9 2 .9 2.5 1 1.8.2 7.1.2 7.1.2s5 0 8.3-.3c.5-.1 1.4-.1 2.3-1 .7-.7.9-2.4.9-2.4s.5-2 .5-3.9v-1.8c0-2-.5-3.9-.5-3.9zM9.5 14.6V7.4l6.3 3.6-6.3 3.6z',
    viewBox: '0 0 24 22',
  },
]

export function LogoBar() {
  const { t } = useTranslation()

  return (
    <section className="border-y border-white/5 bg-slate-950/80 py-8">
      <div className="mx-auto max-w-6xl px-6">
        <p className="mb-6 text-center text-sm font-medium uppercase tracking-widest text-slate-500">
          {t('landing.logoBar.label')}
        </p>
        <div className="flex items-center justify-center gap-8 overflow-x-auto sm:gap-12 md:gap-16">
          {PLATFORMS.map((platform) => (
            <div
              key={platform.name}
              className="flex shrink-0 flex-col items-center gap-2 opacity-40 transition-opacity hover:opacity-80"
            >
              <svg
                className="h-6 w-6 fill-current text-white"
                viewBox={platform.viewBox}
                xmlns="http://www.w3.org/2000/svg"
              >
                <path d={platform.path} />
              </svg>
              <span className="text-[10px] text-slate-500">{platform.name}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
