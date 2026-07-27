import * as React from 'npm:react@18.3.1'
import {
  Body, Button, Container, Head, Heading, Html, Preview, Section, Text, Hr,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

interface Props {
  customerName?: string
  itineraryTitle?: string
  downloadUrl?: string
  amount?: string
  currency?: string
}

const SYMBOLS: Record<string, string> = { EUR: '€', USD: '$', BRL: 'R$', NOK: 'kr ' }

const formatPrice = (amount?: string, currency?: string) => {
  if (!amount) return ''
  const code = (currency ?? 'EUR').toUpperCase()
  const sym = SYMBOLS[code]
  if (code === 'NOK') return `${amount} NOK`
  return sym ? `${sym}${amount}` : `${amount} ${code}`
}

const Email = ({ customerName, itineraryTitle, downloadUrl, amount, currency }: Props) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>Your itinerary is ready to download</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>Thank you for your purchase</Heading>
        <Text style={text}>
          {customerName ? `Dear ${customerName},` : 'Hello,'}
        </Text>
        <Text style={text}>
          Your purchase of <strong>{itineraryTitle ?? 'your itinerary'}</strong>
          {amount ? ` (${formatPrice(amount, currency)})` : ''} has been confirmed.
        </Text>
        <Text style={text}>
          Click the button below to download your PDF itinerary. The link is valid for 7 days.
        </Text>
        <Section style={{ textAlign: 'center', margin: '32px 0' }}>
          <Button href={downloadUrl} style={button}>
            Download your itinerary
          </Button>
        </Section>
        <Hr style={hr} />
        <Text style={footer}>
          Warm regards,<br />
          The Fjord &amp; Waves Travel team
        </Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: Email,
  subject: 'Your Fjord & Waves itinerary is ready',
  displayName: 'Catalog purchase confirmation',
  previewData: {
    customerName: 'Jane',
    itineraryTitle: '7 Days in Norway',
    downloadUrl: 'https://example.com/download',
    amount: '49',
  },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: 'Georgia, serif' }
const container = { padding: '32px 28px', maxWidth: '600px', margin: '0 auto', color: '#1a1a2e' }
const h1 = { fontSize: '24px', margin: '0 0 16px', color: '#1a1a2e' }
const text = { fontSize: '16px', lineHeight: '1.6', color: '#444', margin: '0 0 16px' }
const button = {
  backgroundColor: '#c9a96e',
  color: '#1a1a2e',
  padding: '14px 28px',
  borderRadius: '4px',
  fontSize: '15px',
  fontWeight: 'bold' as const,
  textDecoration: 'none',
  letterSpacing: '0.05em',
}
const hr = { borderColor: '#eee', margin: '32px 0' }
const footer = { fontSize: '14px', color: '#888' }
