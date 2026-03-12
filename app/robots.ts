import type { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://creaclip.com'

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/api/', '/dashboard/', '/upload/', '/videos/', '/clips/', '/login/', '/signup/'],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  }
}
