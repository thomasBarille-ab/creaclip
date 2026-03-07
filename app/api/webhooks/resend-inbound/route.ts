import { resend, FROM_EMAIL, CONTACT_EMAIL } from '@/lib/email/client'
import { NextResponse } from 'next/server'

/**
 * Webhook Resend Inbound
 * Reçoit les notifications quand un email arrive à *@creaclip.io
 * Envoie une notification à l'équipe
 */
export async function POST(request: Request) {
  try {
    const payload = await request.json()

    if (payload.type !== 'email.received') {
      return NextResponse.json({ success: true })
    }

    const { data } = payload

    if (!data?.email_id) {
      return NextResponse.json({ error: 'Missing email_id' }, { status: 400 })
    }

    // Récupérer le contenu complet via le SDK Resend
    let emailContent: { text?: string; html?: string } = {}
    try {
      const { data: fullEmail } = await resend.emails.get(data.email_id)
      if (fullEmail) {
        emailContent = { text: fullEmail.text || undefined, html: fullEmail.html || undefined }
      }
    } catch (fetchError) {
      console.error('Error fetching email content:', fetchError)
    }

    // Extraire nom et email depuis "Name <email@example.com>"
    const fromRaw = data.from || ''
    let fromEmail = fromRaw
    let fromName = ''

    const match = fromRaw.match(/^(.+?)\s*<(.+)>$/)
    if (match) {
      fromName = match[1].trim()
      fromEmail = match[2].trim()
    }

    // Notification à l'équipe
    await resend.emails.send({
      from: FROM_EMAIL,
      to: CONTACT_EMAIL,
      subject: `[Contact] ${data.subject || '(Sans sujet)'}`,
      html: `
        <h2>Nouveau message reçu</h2>
        <p><strong>De :</strong> ${fromName || fromEmail} &lt;${fromEmail}&gt;</p>
        <p><strong>Sujet :</strong> ${data.subject || '(Sans sujet)'}</p>
        <hr />
        <div>${emailContent.html || (emailContent.text ? emailContent.text.replace(/\n/g, '<br />') : '<em>Contenu non disponible</em>')}</div>
      `,
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Webhook error:', error)
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 })
  }
}
