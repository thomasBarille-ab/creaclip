import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { Providers } from '@/components/Providers'
import './globals.css'

const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  title: {
    default: 'CreaClip — Créez des clips viraux en quelques clics',
    template: '%s | CreaClip',
  },
  description:
    'CreaClip transforme vos vidéos longues en clips courts et percutants grâce à l\'IA. Transcription automatique, suggestions intelligentes, export en un clic.',
  keywords: ['clips vidéo', 'IA', 'montage automatique', 'transcription', 'SaaS', 'créateur contenu'],
  openGraph: {
    title: 'CreaClip — Créez des clips viraux en quelques clics',
    description:
      'Transformez vos vidéos longues en clips courts et percutants grâce à l\'IA.',
    type: 'website',
    locale: 'fr_FR',
  },
  robots: {
    index: true,
    follow: true,
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="fr" className="dark">
      <head>
        <script
          type="importmap"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              imports: {
                '@ffmpeg/ffmpeg': 'https://unpkg.com/@ffmpeg/ffmpeg@0.12.10/dist/esm/index.js',
                '@ffmpeg/util': 'https://unpkg.com/@ffmpeg/util@0.12.1/dist/esm/index.js',
              },
            }),
          }}
        />
      </head>
      <body
        className={`${inter.variable} font-sans antialiased bg-slate-950 text-white`}
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
