import * as React from 'npm:react@18.3.1'
import {
  Body, Container, Head, Heading, Html, Preview, Section, Text, Hr,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

interface CatalogSaleNotificationProps {
  customerName?: string
  customerEmail?: string
  itineraryTitle?: string
  itinerarySlug?: string
  amount?: string
  currency?: string
  purchasedAt?: string
}

const Row = ({ label, value }: { label: string; value?: string }) => (
  <Text style={rowStyle}>
    <span style={labelStyle}>{label}: </span>
    <span style={valueStyle}>{value && value.length ? value : '—'}</span>
  </Text>
)

const CatalogSaleNotificationEmail = (props: CatalogSaleNotificationProps) => {
  const { customerName, customerEmail, itineraryTitle, itinerarySlug, amount, currency, purchasedAt } = props
  const amountLabel = amount ? `${amount}${currency ? ` ${currency.toUpperCase()}` : ''}` : undefined

  return (
    <Html lang="en" dir="ltr">
      <Head />
      <Preview>New Catalogue sale: {itineraryTitle || 'an itinerary'}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>New Catalogue Sale</Heading>
          <Text style={lead}>
            <strong>{customerName || customerEmail || 'A customer'}</strong> just purchased{' '}
            <strong>{itineraryTitle || 'an itinerary'}</strong>.
          </Text>

          <Section style={section}>
            <Heading as="h2" style={h2}>Customer</Heading>
            <Row label="Name" value={customerName} />
            <Row label="Email" value={customerEmail} />
          </Section>

          <Hr style={hr} />

          <Section style={section}>
            <Heading as="h2" style={h2}>Order</Heading>
            <Row label="Itinerary" value={itineraryTitle} />
            <Row label="Slug" value={itinerarySlug} />
            <Row label="Amount" value={amountLabel} />
            <Row label="Purchased at" value={purchasedAt} />
          </Section>

          <Hr style={hr} />
          <Text style={footer}>Fjord &amp; Waves Travel — sale notification</Text>
        </Container>
      </Body>
    </Html>
  )
}

export const template = {
  component: CatalogSaleNotificationEmail,
  subject: (data: Record<string, any>) =>
    `New Catalogue sale: ${data.itineraryTitle || 'itinerary'} — ${data.customerName || data.customerEmail || 'customer'}`,
  to: 'daniel.lirafigueiredo@fora.travel',
  displayName: 'Catalogue sale notification',
  previewData: {
    customerName: 'Jane Doe',
    customerEmail: 'jane@example.com',
    itineraryTitle: '7 Days in the Norwegian Fjords',
    itinerarySlug: '7-days-norwegian-fjords',
    amount: '149.00',
    currency: 'EUR',
    purchasedAt: new Date().toISOString(),
  },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: 'Georgia, "Libre Baskerville", serif' }
const container = { padding: '32px 28px', maxWidth: '600px', margin: '0 auto' }
const h1 = { fontSize: '24px', fontWeight: 'normal', color: '#1a1a1a', margin: '0 0 16px', letterSpacing: '0.02em' }
const h2 = { fontSize: '13px', fontWeight: 'bold', color: '#8a7a4f', margin: '0 0 10px', textTransform: 'uppercase' as const, letterSpacing: '0.12em' }
const lead = { fontSize: '15px', color: '#333', lineHeight: '1.5', margin: '0 0 20px' }
const section = { margin: '12px 0' }
const rowStyle = { fontSize: '14px', color: '#333', lineHeight: '1.6', margin: '4px 0' }
const labelStyle = { color: '#666', fontWeight: 'normal' as const }
const valueStyle = { color: '#1a1a1a' }
const hr = { borderColor: '#e5e0d4', margin: '20px 0' }
const footer = { fontSize: '11px', color: '#999', margin: '20px 0 0', textAlign: 'center' as const, letterSpacing: '0.08em' }
