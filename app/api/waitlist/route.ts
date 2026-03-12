import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { resend, FROM_EMAIL } from '@/lib/email/client'
import { WaitlistConfirmEmail } from '@/lib/email/templates/waitlist-confirm'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { email } = body

    if (!email || typeof email !== 'string') {
      return NextResponse.json(
        { error: 'Veuillez fournir une adresse email valide.' },
        { status: 400 }
      )
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Adresse email invalide.' },
        { status: 400 }
      )
    }

    // Insert into waitlist (idempotent — ON CONFLICT DO NOTHING)
    const { error: dbError } = await supabaseAdmin
      .from('waitlist')
      .upsert({ email: email.toLowerCase().trim() }, { onConflict: 'email', ignoreDuplicates: true })

    if (dbError) {
      console.error('Waitlist DB error:', dbError)
      return NextResponse.json(
        { error: 'Une erreur est survenue. Veuillez réessayer.' },
        { status: 500 }
      )
    }

    // Send confirmation email
    const normalizedEmail = email.toLowerCase().trim()
    const { error: emailError } = await resend.emails.send({
      from: FROM_EMAIL,
      to: normalizedEmail,
      subject: 'Bienvenue sur la waitlist CreaClip !',
      react: WaitlistConfirmEmail({ email: normalizedEmail }),
    })

    if (emailError) {
      console.error('Resend error:', emailError)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Waitlist API error:', error)
    return NextResponse.json(
      { error: 'Une erreur est survenue. Veuillez réessayer.' },
      { status: 500 }
    )
  }
}
