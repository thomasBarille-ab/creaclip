import { sendWelcomeEmail } from '@/lib/email/send'
import { NextResponse } from 'next/server'

/**
 * Endpoint de test pour envoyer un email
 * À supprimer en production !
 */
export async function POST(request: Request) {
  try {
    const { email, name } = await request.json()

    if (!email) {
      return NextResponse.json(
        { error: 'Email requis' },
        { status: 400 }
      )
    }

    const result = await sendWelcomeEmail(email, name || 'Utilisateur')

    if (!result.success) {
      return NextResponse.json(
        { error: 'Erreur envoi email', details: result.error },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: `Email envoyé à ${email}`,
      data: result.data,
    })
  } catch (error) {
    console.error('Test email error:', error)
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}
