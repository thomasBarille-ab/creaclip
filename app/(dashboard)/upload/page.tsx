'use client'

import { useTranslation } from 'react-i18next'
import { VideoUploader } from '@/components/VideoUploader'

export default function UploadPage() {
  const { t } = useTranslation()

  return (
    <>
      <style jsx>{`
        @keyframes fade-in-up {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in-up-1 { animation: fade-in-up 0.5s ease-out 0.1s both; }
        .animate-fade-in-up-2 { animation: fade-in-up 0.5s ease-out 0.2s both; }
      `}</style>

      <div className="mx-auto max-w-5xl space-y-8">
        <div className="animate-fade-in-up-1">
          <h1 className="text-2xl font-bold text-white md:text-3xl">
            {t('upload.title')}
          </h1>
          <p className="mt-1 text-sm text-white/40">
            {t('upload.subtitle')}
          </p>
        </div>
        <div className="animate-fade-in-up-2">
          <VideoUploader />
        </div>
      </div>
    </>
  )
}
