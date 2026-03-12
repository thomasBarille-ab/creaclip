import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { Providers } from '@/components/Providers'
import { GoogleAnalytics } from '@/components/GoogleAnalytics'
import './globals.css'

const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin'],
})

const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://creaclip.com'

export const metadata: Metadata = {
  metadataBase: new URL(baseUrl),
  title: {
    default: 'CreaClip — Créez des clips viraux en quelques clics',
    template: '%s | CreaClip',
  },
  description:
    'CreaClip transforme vos vidéos longues en clips courts et percutants pour TikTok, Reels et Shorts grâce à l\'IA. Transcription automatique, sous-titres animés, export multi-format.',
  keywords: [
    'CreaClip',
    'clips vidéo IA',
    'créer clips TikTok',
    'vidéo vers shorts',
    'montage automatique',
    'sous-titres automatiques',
    'transcription vidéo',
    'clip TikTok',
    'clip Instagram Reels',
    'clip YouTube Shorts',
    'outil créateur contenu',
    'repurpose video',
    'AI video clipping',
    'short form video generator',
    'OpusClip alternative',
  ],
  authors: [{ name: 'CreaClip' }],
  creator: 'CreaClip',
  publisher: 'CreaClip',
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: 'CreaClip — Créez des clips viraux en quelques clics',
    description:
      'Transformez vos vidéos longues en clips TikTok, Reels & Shorts avec sous-titres animés grâce à l\'IA.',
    type: 'website',
    locale: 'fr_FR',
    alternateLocale: ['en_US', 'es_ES'],
    siteName: 'CreaClip',
    url: baseUrl,
  },
  twitter: {
    card: 'summary_large_image',
    title: 'CreaClip — Créez des clips viraux en quelques clics',
    description:
      'Transformez vos vidéos longues en clips TikTok, Reels & Shorts avec sous-titres animés grâce à l\'IA.',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  icons: {
    icon: '/icon.svg',
  },
  manifest: '/manifest.json',
  category: 'technology',
}

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'CreaClip',
  description:
    'CreaClip transforme vos vidéos longues en clips courts et percutants pour TikTok, Instagram Reels et YouTube Shorts grâce à l\'IA.',
  url: baseUrl,
  applicationCategory: 'MultimediaApplication',
  operatingSystem: 'Web',
  offers: [
    {
      '@type': 'Offer',
      name: 'Free',
      price: '0',
      priceCurrency: 'EUR',
      description: '3 clips par mois, preview live, export multi-format',
    },
    {
      '@type': 'Offer',
      name: 'Pro',
      price: '29',
      priceCurrency: 'EUR',
      priceSpecification: {
        '@type': 'UnitPriceSpecification',
        price: '29',
        priceCurrency: 'EUR',
        billingDuration: 'P1M',
      },
      description: '50 clips par mois, sans watermark, toutes les features',
    },
    {
      '@type': 'Offer',
      name: 'Business',
      price: '49',
      priceCurrency: 'EUR',
      priceSpecification: {
        '@type': 'UnitPriceSpecification',
        price: '49',
        priceCurrency: 'EUR',
        billingDuration: 'P1M',
      },
      description: '200 clips par mois, persona individuel, tout Pro inclus',
    },
  ],
  featureList: [
    'Transcription automatique par IA',
    'Suggestions de clips intelligentes',
    'Sous-titres animés style karaoké',
    'Export multi-format (TikTok, Reels, Shorts)',
    'Éditeur avec timeline style Premiere Pro',
    'Traitement vidéo côté client (confidentialité)',
  ],
  screenshot: `${baseUrl}/og-image.png`,
}

const faqJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    {
      '@type': 'Question',
      name: 'Quels formats de vidéo sont supportés par CreaClip ?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'CreaClip accepte les fichiers MP4, MOV et AVI jusqu\'à 500 Mo.',
      },
    },
    {
      '@type': 'Question',
      name: 'Combien de temps prend la génération d\'un clip ?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'La transcription prend généralement 1 à 3 minutes. La génération du clip se fait en quelques secondes directement dans votre navigateur.',
      },
    },
    {
      '@type': 'Question',
      name: 'Est-ce que mes vidéos sont stockées de façon sécurisée ?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Oui. Vos vidéos sont stockées dans un espace privé accessible uniquement par votre compte avec des politiques de sécurité strictes.',
      },
    },
    {
      '@type': 'Question',
      name: 'Le traitement vidéo se fait sur vos serveurs ?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Le montage vidéo (découpe, sous-titres, recadrage) se fait entièrement dans votre navigateur grâce à FFmpeg WASM. Vos vidéos ne sont pas envoyées à un serveur tiers.',
      },
    },
  ],
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
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
        />
      </head>
      <body
        className={`${inter.variable} font-sans antialiased bg-slate-950 text-white`}
      >
        <GoogleAnalytics />
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
