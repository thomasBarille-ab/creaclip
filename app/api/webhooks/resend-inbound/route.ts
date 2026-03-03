import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

/**
 * Webhook Resend Inbound
 * Reçoit les emails envoyés à contact@send.creaclip.io
 */
export async function POST(request: Request) {
  try {
    const payload = await request.json()

    console.log('Resend Inbound webhook received:', payload)

    // Payload Resend Inbound :
    // {
    //   from: "user@example.com",
    //   to: "contact@send.creaclip.io",
    //   subject: "Question sur CreaClip",
    //   text: "Contenu du message",
    //   html: "<p>Contenu du message</p>"
    // }

    const { from, to, subject, text, html } = payload

    if (!from || !subject || !text) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Extraire le nom de l'email si format "Name <email@example.com>"
    let fromEmail = from
    let fromName = null

    const emailMatch = from.match(/^(.+?)\s*<(.+)>$/)
    if (emailMatch) {
      fromName = emailMatch[1].trim()
      fromEmail = emailMatch[2].trim()
    }

    // Stocker dans Supabase
    const supabase = await createClient()
    const { error } = await supabase.from('contact_messages').insert({
      from_email: fromEmail,
      from_name: fromName,
      subject,
      message_text: text,
      message_html: html,
      received_at: new Date().toISOString(),
    })

    if (error) {
      console.error('Error saving contact message:', error)
      return NextResponse.json(
        { error: 'Failed to save message' },
        { status: 500 }
      )
    }

    console.log('Contact message saved successfully')

    // TODO (optionnel) : Envoyer une notification email à l'équipe
    // import { resend } from '@/lib/email/client'
    // await resend.emails.send({
    //   from: 'CreaClip Notifications <noreply@send.creaclip.io>',
    //   to: 'votre-email@example.com',
    //   subject: `Nouveau message de contact : ${subject}`,
    //   text: `De : ${from}\n\n${text}`
    // })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Webhook error:', error)
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    )
  }
}
