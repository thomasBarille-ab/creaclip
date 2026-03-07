import { createClient } from '@/lib/supabase/server'
import { resend, FROM_EMAIL } from '@/lib/email/client'
import { NextResponse } from 'next/server'

/**
 * API pour le formulaire de contact
 * Stocke le message dans Supabase + envoie une notification email
 */
export async function POST(request: Request) {
  try {
    const { name, email, subject, message } = await request.json()

    if (!email || !subject || !message) {
      return NextResponse.json(
        { error: 'Tous les champs sont requis' },
        { status: 400 }
      )
    }

    // Stocker dans Supabase
    const supabase = await createClient()
    const { error: dbError } = await supabase.from('contact_messages').insert({
      from_email: email,
      from_name: name || null,
      subject,
      message_text: message,
      received_at: new Date().toISOString(),
    })

    if (dbError) {
      console.error('Error saving contact message:', dbError)
      return NextResponse.json(
        { error: 'Impossible de sauvegarder le message' },
        { status: 500 }
      )
    }

    // Envoyer une notification à l'équipe
    await resend.emails.send({
      from: FROM_EMAIL,
      to: 'contact@creaclip.io',
      subject: `[Contact] ${subject}`,
      html: `
        <h2>Nouveau message de contact</h2>
        <p><strong>De :</strong> ${name || 'Non renseigné'} (${email})</p>
        <p><strong>Sujet :</strong> ${subject}</p>
        <hr />
        <p>${message.replace(/\n/g, '<br />')}</p>
      `,
    })

    // Envoyer une confirmation à l'utilisateur
    await resend.emails.send({
      from: FROM_EMAIL,
      to: email,
      subject: 'Nous avons bien reçu votre message - CreaClip',
      html: `
        <h2>Merci pour votre message !</h2>
        <p>Bonjour ${name || ''},</p>
        <p>Nous avons bien reçu votre message et nous vous répondrons dans les plus brefs délais.</p>
        <br />
        <p><strong>Votre message :</strong></p>
        <p><em>${subject}</em></p>
        <p>${message.replace(/\n/g, '<br />')}</p>
        <br />
        <p>L'équipe CreaClip</p>
      `,
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Contact API error:', error)
    return NextResponse.json(
      { error: 'Une erreur est survenue' },
      { status: 500 }
    )
  }
}
