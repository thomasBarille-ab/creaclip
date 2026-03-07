import { Resend } from 'resend'

if (!process.env.RESEND_API_KEY) {
  throw new Error('RESEND_API_KEY is not set')
}

export const resend = new Resend(process.env.RESEND_API_KEY)

// Adresses email
export const FROM_EMAIL = 'CreaClip <noreply@creaclip.io>'
export const CONTACT_EMAIL = 'contact@creaclip.io'
export const SUPPORT_EMAIL = 'support@creaclip.io'
