import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { stripe, getPlanFromPriceId } from '@/lib/stripe'
import {
  sendSubscriptionStartedEmail,
  sendSubscriptionChangedEmail,
  sendSubscriptionCanceledEmail,
  sendInvoicePaidEmail,
} from '@/lib/email/send'
import type Stripe from 'stripe'

export const runtime = 'nodejs'

// Supabase admin client (service role, no cookies needed for webhooks)
function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

const HANDLED_EVENTS = new Set([
  'checkout.session.completed',
  'customer.subscription.updated',
  'customer.subscription.deleted',
  'invoice.payment_succeeded',
  'invoice.payment_failed',
])

export async function POST(request: Request) {
  const body = await request.text()
  const signature = request.headers.get('stripe-signature')

  if (!signature) {
    return NextResponse.json({ error: 'Signature manquante' }, { status: 400 })
  }

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    )
  } catch (err) {
    console.error('Webhook signature verification failed:', err)
    return NextResponse.json({ error: 'Signature invalide' }, { status: 400 })
  }

  // Ignore events we don't handle
  if (!HANDLED_EVENTS.has(event.type)) {
    return NextResponse.json({ received: true })
  }

  const supabase = getAdminClient()

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        const userId = session.metadata?.userId
        const plan = session.metadata?.plan

        if (!userId || !plan) {
          console.error('Webhook: missing metadata on checkout session', session.id)
          break
        }

        const subscriptionId = typeof session.subscription === 'string'
          ? session.subscription
          : session.subscription?.id ?? null

        const { error: updateErr } = await supabase
          .from('profiles')
          .update({
            plan,
            stripe_subscription_id: subscriptionId,
            credits_remaining: null,
          })
          .eq('id', userId)

        if (updateErr) {
          console.error('Webhook: failed to update profile for checkout', updateErr)
          break
        }

        // Email de confirmation d'abonnement
        const { data: profile } = await supabase
          .from('profiles')
          .select('email')
          .eq('id', userId)
          .single()

        if (profile?.email) {
          await sendSubscriptionStartedEmail(profile.email, plan)
        }

        break
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription
        const customerId = subscription.customer as string

        const { data: profile } = await supabase
          .from('profiles')
          .select('id, plan, email')
          .eq('stripe_customer_id', customerId)
          .single()

        if (!profile) {
          console.error('Webhook: no profile for customer', customerId)
          break
        }

        // Detect plan change from price
        const priceId = subscription.items.data[0]?.price?.id
        if (priceId) {
          const newPlan = getPlanFromPriceId(priceId)
          if (newPlan && newPlan !== profile.plan) {
            await supabase
              .from('profiles')
              .update({
                plan: newPlan,
                credits_remaining: null,
              })
              .eq('id', profile.id)

            // Email de changement de plan
            if (profile.email) {
              await sendSubscriptionChangedEmail(profile.email, profile.plan, newPlan)
            }
          }
        }

        break
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription
        const customerId = subscription.customer as string

        const { data: profile } = await supabase
          .from('profiles')
          .select('id, email')
          .eq('stripe_customer_id', customerId)
          .single()

        if (!profile) {
          console.error('Webhook: no profile for customer', customerId)
          break
        }

        await supabase
          .from('profiles')
          .update({
            plan: 'free',
            stripe_subscription_id: null,
            credits_remaining: 3,
          })
          .eq('id', profile.id)

        // Email d'annulation
        if (profile.email) {
          await sendSubscriptionCanceledEmail(profile.email)
        }

        break
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice
        const customerId = invoice.customer as string

        const { data: profile } = await supabase
          .from('profiles')
          .select('id, email, plan')
          .eq('stripe_customer_id', customerId)
          .single()

        if (!profile?.email) break

        const amount = invoice.amount_paid
          ? `${(invoice.amount_paid / 100).toFixed(2)}€`
          : '0€'
        const invoiceUrl = invoice.hosted_invoice_url || ''

        await sendInvoicePaidEmail(profile.email, amount, invoiceUrl, profile.plan)

        break
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice
        console.error('Payment failed for invoice:', invoice.id, 'customer:', invoice.customer)
        break
      }
    }
  } catch (err) {
    console.error('Webhook handler error for event', event.type, ':', err instanceof Error ? err.message : err)
    return NextResponse.json({ error: 'Erreur de traitement du webhook' }, { status: 500 })
  }

  return NextResponse.json({ received: true })
}
