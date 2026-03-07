import { Resend } from 'resend'

export const resend = new Resend(process.env.RESEND_API_KEY)

export const FROM_EMAIL = 'CreaClip <noreply@creaclip.com>'
export const CONTACT_EMAIL = 'contact@creaclip.com'
