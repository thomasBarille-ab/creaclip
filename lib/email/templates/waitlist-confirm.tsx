import * as React from 'react'

interface WaitlistConfirmEmailProps {
  email: string
}

export function WaitlistConfirmEmail({ email }: WaitlistConfirmEmailProps) {
  return (
    <div style={{
      fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      backgroundColor: '#0f172a',
      padding: '40px 20px',
    }}>
      <div style={{
        maxWidth: '480px',
        margin: '0 auto',
        backgroundColor: '#1e293b',
        borderRadius: '16px',
        border: '1px solid rgba(255,255,255,0.1)',
        padding: '40px',
      }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <span style={{ fontSize: '24px', fontWeight: 'bold' }}>
            <span style={{ color: '#c084fc' }}>Crea</span>
            <span style={{ color: '#ffffff' }}>Clip</span>
          </span>
        </div>

        {/* Content */}
        <h1 style={{
          color: '#ffffff',
          fontSize: '24px',
          fontWeight: 'bold',
          textAlign: 'center',
          marginBottom: '16px',
        }}>
          Vous êtes sur la liste !
        </h1>

        <p style={{
          color: '#94a3b8',
          fontSize: '16px',
          lineHeight: '1.6',
          textAlign: 'center',
          marginBottom: '24px',
        }}>
          Merci de votre intérêt pour CreaClip ! Nous vous préviendrons dès que
          la plateforme sera disponible.
        </p>

        <div style={{
          backgroundColor: 'rgba(139, 92, 246, 0.1)',
          border: '1px solid rgba(139, 92, 246, 0.3)',
          borderRadius: '12px',
          padding: '20px',
          textAlign: 'center',
          marginBottom: '24px',
        }}>
          <p style={{ color: '#c084fc', fontSize: '14px', margin: '0 0 4px 0' }}>
            Email inscrit
          </p>
          <p style={{ color: '#ffffff', fontSize: '16px', fontWeight: 'bold', margin: 0 }}>
            {email}
          </p>
        </div>

        <p style={{
          color: '#64748b',
          fontSize: '14px',
          lineHeight: '1.6',
          textAlign: 'center',
        }}>
          Transformez vos vidéos longues en clips viraux grâce à l'IA.
          Transcription automatique, suggestions intelligentes, export en un clic.
        </p>

        {/* Footer */}
        <div style={{
          borderTop: '1px solid rgba(255,255,255,0.1)',
          marginTop: '32px',
          paddingTop: '20px',
          textAlign: 'center',
        }}>
          <p style={{ color: '#475569', fontSize: '12px', margin: 0 }}>
            CreaClip &mdash; Créez des clips viraux en quelques clics
          </p>
        </div>
      </div>
    </div>
  )
}
