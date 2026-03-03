import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Section,
  Text,
} from '@react-email/components'

interface ClipReadyEmailProps {
  clipTitle: string
  clipUrl: string
}

export function ClipReadyEmail({ clipTitle, clipUrl }: ClipReadyEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>Votre clip "{clipTitle}" est prêt à être téléchargé !</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={box}>
            <Heading style={heading}>Votre clip est prêt ! 🎉</Heading>

            <Text style={paragraph}>
              Bonne nouvelle ! Votre clip <strong>"{clipTitle}"</strong> a été généré
              avec succès et est maintenant disponible.
            </Text>

            <Text style={paragraph}>
              Vous pouvez le télécharger, le partager sur vos réseaux sociaux,
              ou continuer à l'éditer.
            </Text>

            <Button style={button} href={clipUrl}>
              Voir mon clip
            </Button>

            <Text style={footer}>
              L'équipe CreaClip
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  )
}

// Styles (réutilisation des mêmes styles)
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

const button = {
  backgroundColor: '#7c3aed',
  borderRadius: '8px',
  color: '#fff',
  fontSize: '16px',
  fontWeight: 'bold',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'block',
  width: '100%',
  padding: '16px',
  marginTop: '32px',
  marginBottom: '32px',
}

const footer = {
  color: '#64748b',
  fontSize: '14px',
  marginTop: '32px',
  textAlign: 'center' as const,
}
