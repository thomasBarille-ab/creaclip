import { ImageResponse } from 'next/og'

export const runtime = 'edge'

export const alt = 'CreaClip — Créez des clips viraux en quelques clics'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #0f172a 0%, #1c0f05 50%, #0f172a 100%)',
          position: 'relative',
        }}
      >
        {/* Gradient blobs */}
        <div
          style={{
            position: 'absolute',
            top: '-100px',
            left: '-100px',
            width: '500px',
            height: '500px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(234,88,12,0.3) 0%, transparent 70%)',
          }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: '-100px',
            right: '-100px',
            width: '500px',
            height: '500px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(245,158,11,0.3) 0%, transparent 70%)',
          }}
        />

        {/* Logo icon */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '80px',
            height: '80px',
            borderRadius: '20px',
            background: 'linear-gradient(135deg, #ea580c, #f59e0b)',
            marginBottom: '32px',
          }}
        >
          <svg width="44" height="44" viewBox="0 0 24 24" fill="none">
            <path d="M8 5v14l11-7z" fill="white" />
          </svg>
        </div>

        {/* Title */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <div
            style={{
              fontSize: '64px',
              fontWeight: 900,
              color: 'white',
              letterSpacing: '-2px',
              display: 'flex',
            }}
          >
            <span>Crea</span>
            <span
              style={{
                background: 'linear-gradient(90deg, #ea580c, #f59e0b)',
                backgroundClip: 'text',
                color: 'transparent',
              }}
            >
              Clip
            </span>
          </div>
        </div>

        {/* Tagline */}
        <div
          style={{
            fontSize: '28px',
            color: '#94a3b8',
            marginTop: '16px',
            textAlign: 'center',
            maxWidth: '700px',
            display: 'flex',
          }}
        >
          Transformez vos vidéos en clips viraux avec l'IA
        </div>

        {/* Feature pills */}
        <div
          style={{
            display: 'flex',
            gap: '16px',
            marginTop: '40px',
          }}
        >
          {['TikTok', 'Reels', 'Shorts'].map((platform) => (
            <div
              key={platform}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 24px',
                borderRadius: '999px',
                border: '1px solid rgba(255,255,255,0.15)',
                background: 'rgba(255,255,255,0.05)',
                fontSize: '18px',
                color: '#e2e8f0',
              }}
            >
              {platform}
            </div>
          ))}
        </div>

        {/* Bottom URL */}
        <div
          style={{
            position: 'absolute',
            bottom: '32px',
            fontSize: '18px',
            color: '#64748b',
            display: 'flex',
          }}
        >
          creaclip.io
        </div>
      </div>
    ),
    { ...size }
  )
}
