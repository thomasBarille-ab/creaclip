import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Section,
  Text,
} from '@react-email/components'

const PLAN_LABELS: Record<string, string> = {
  pro: 'Pro',
  business: 'Business',
  free: 'Gratuit',
}

const PLAN_PRICES: Record<string, string> = {
  pro: '24€/mois',
  business: '49€/mois',
  free: '0€',
}

// Email de bienvenue sur un plan payant
interface SubscriptionStartedProps {
  plan: string
}

export function SubscriptionStartedEmail({ plan }: SubscriptionStartedProps) {
  const label = PLAN_LABELS[plan] || plan
  const price = PLAN_PRICES[plan] || ''

  return (
    <Html>
      <Head />
      <Preview>Votre abonnement {label} est activé !</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={box}>
            <Heading style={heading}>Abonnement {label} activé ! 🚀</Heading>
            <Text style={paragraph}>
              Merci pour votre confiance ! Votre abonnement <strong>{label}</strong> ({price}) est maintenant actif.
            </Text>
            <Text style={paragraph}>
              Vous avez désormais accès à toutes les fonctionnalités de votre plan :
            </Text>
            <Text style={list}>
              • Clips illimités{'\n'}
              • Sans filigrane{'\n'}
              • Recherche par prompt IA
              {plan === 'business' ? '\n• Persona créateur personnalisée' : ''}
            </Text>
            <Text style={footer}>L'équipe CreaClip</Text>
          </Section>
        </Container>
      </Body>
    </Html>
  )
}

// Email de changement de plan
interface SubscriptionChangedProps {
  oldPlan: string
  newPlan: string
}

export function SubscriptionChangedEmail({ oldPlan, newPlan }: SubscriptionChangedProps) {
  const oldLabel = PLAN_LABELS[oldPlan] || oldPlan
  const newLabel = PLAN_LABELS[newPlan] || newPlan
  const newPrice = PLAN_PRICES[newPlan] || ''

  return (
    <Html>
      <Head />
      <Preview>Votre plan a été modifié : {newLabel}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={box}>
            <Heading style={heading}>Plan modifié ✅</Heading>
            <Text style={paragraph}>
              Votre abonnement est passé de <strong>{oldLabel}</strong> à <strong>{newLabel}</strong> ({newPrice}).
            </Text>
            <Text style={paragraph}>
              Les changements sont effectifs immédiatement.
            </Text>
            <Text style={footer}>L'équipe CreaClip</Text>
          </Section>
        </Container>
      </Body>
    </Html>
  )
}

// Email d'annulation
export function SubscriptionCanceledEmail() {
  return (
    <Html>
      <Head />
      <Preview>Votre abonnement a été annulé</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={box}>
            <Heading style={heading}>Abonnement annulé</Heading>
            <Text style={paragraph}>
              Votre abonnement CreaClip a été annulé. Vous êtes repassé sur le plan <strong>Gratuit</strong>.
            </Text>
            <Text style={paragraph}>
              Vous conservez l'accès à 3 clips par mois. Vos clips existants restent disponibles.
            </Text>
            <Text style={paragraph}>
              Vous pouvez vous réabonner à tout moment depuis les paramètres de votre compte.
            </Text>
            <Text style={footer}>L'équipe CreaClip</Text>
          </Section>
        </Container>
      </Body>
    </Html>
  )
}

// Email de facture
interface InvoicePaidProps {
  amount: string
  invoiceUrl: string
  plan: string
}

export function InvoicePaidEmail({ amount, invoiceUrl, plan }: InvoicePaidProps) {
  const label = PLAN_LABELS[plan] || plan

  return (
    <Html>
      <Head />
      <Preview>Facture CreaClip - {amount}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={box}>
            <Heading style={heading}>Paiement reçu 💳</Heading>
            <Text style={paragraph}>
              Nous avons bien reçu votre paiement de <strong>{amount}</strong> pour le plan <strong>{label}</strong>.
            </Text>
            <Text style={paragraph}>
              <a href={invoiceUrl} style={link}>Voir la facture</a>
            </Text>
            <Text style={footer}>L'équipe CreaClip</Text>
          </Section>
        </Container>
      </Body>
    </Html>
  )
}

const main = {
  backgroundColor: '#0f172a',
  fontFamily:
    '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
}

const container = {
  backgroundColor: '#1e293b',
  margin: '0 auto',
  padding: '20px 0 48px',
  marginBottom: '64px',
  borderRadius: '8px',
}

const box = {
  padding: '0 48px',
}

const heading = {
  fontSize: '32px',
  fontWeight: 'bold',
  marginBottom: '48px',
  color: '#a78bfa',
  textAlign: 'center' as const,
}

const paragraph = {
  fontSize: '16px',
  lineHeight: '26px',
  color: '#cbd5e1',
  marginBottom: '16px',
}

const list = {
  fontSize: '16px',
  lineHeight: '32px',
  color: '#cbd5e1',
  marginBottom: '16px',
  whiteSpace: 'pre-line' as const,
}

const link = {
  color: '#a78bfa',
  textDecoration: 'underline',
}

const footer = {
  color: '#64748b',
  fontSize: '14px',
  marginTop: '32px',
  textAlign: 'center' as const,
}
