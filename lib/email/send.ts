import { resend, FROM_EMAIL } from './client'
import { WelcomeEmail } from './templates/welcome'
import { ClipReadyEmail } from './templates/clip-ready'
import {
  SubscriptionStartedEmail,
  SubscriptionChangedEmail,
  SubscriptionCanceledEmail,
  InvoicePaidEmail,
} from './templates/subscription'

export async function sendWelcomeEmail(to: string, userName: string) {
  try {
    const { error } = await resend.emails.send({
      from: FROM_EMAIL,
      to,
      subject: 'Bienvenue sur CreaClip ! 🎬',
      react: WelcomeEmail({ userName }),
    })
    if (error) console.error('Email send error:', error)
  } catch (error) {
    console.error('Email send exception:', error)
  }
}

export async function sendClipReadyEmail(to: string, clipTitle: string, clipUrl: string) {
  try {
    const { error } = await resend.emails.send({
      from: FROM_EMAIL,
      to,
      subject: `Votre clip "${clipTitle}" est prêt ! 🎉`,
      react: ClipReadyEmail({ clipTitle, clipUrl }),
    })
    if (error) console.error('Email send error:', error)
  } catch (error) {
    console.error('Email send exception:', error)
  }
}

export async function sendSubscriptionStartedEmail(to: string, plan: string) {
  try {
    const { error } = await resend.emails.send({
      from: FROM_EMAIL,
      to,
      subject: `Abonnement ${plan === 'business' ? 'Business' : 'Pro'} activé ! 🚀`,
      react: SubscriptionStartedEmail({ plan }),
    })
    if (error) console.error('Email send error:', error)
  } catch (error) {
    console.error('Email send exception:', error)
  }
}

export async function sendSubscriptionChangedEmail(to: string, oldPlan: string, newPlan: string) {
  try {
    const { error } = await resend.emails.send({
      from: FROM_EMAIL,
      to,
      subject: `Plan modifié : ${newPlan === 'business' ? 'Business' : 'Pro'} ✅`,
      react: SubscriptionChangedEmail({ oldPlan, newPlan }),
    })
    if (error) console.error('Email send error:', error)
  } catch (error) {
    console.error('Email send exception:', error)
  }
}

export async function sendSubscriptionCanceledEmail(to: string) {
  try {
    const { error } = await resend.emails.send({
      from: FROM_EMAIL,
      to,
      subject: 'Votre abonnement a été annulé',
      react: SubscriptionCanceledEmail(),
    })
    if (error) console.error('Email send error:', error)
  } catch (error) {
    console.error('Email send exception:', error)
  }
}

export async function sendInvoicePaidEmail(to: string, amount: string, invoiceUrl: string, plan: string) {
  try {
    const { error } = await resend.emails.send({
      from: FROM_EMAIL,
      to,
      subject: `Facture CreaClip - ${amount} 💳`,
      react: InvoicePaidEmail({ amount, invoiceUrl, plan }),
    })
    if (error) console.error('Email send error:', error)
  } catch (error) {
    console.error('Email send exception:', error)
  }
}
