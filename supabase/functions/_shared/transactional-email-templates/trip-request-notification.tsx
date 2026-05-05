import * as React from 'npm:react@18.3.1'
import {
  Body, Container, Head, Heading, Html, Preview, Section, Text, Hr,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

interface TripRequestNotificationProps {
  clientName?: string
  clientEmail?: string
  destination?: string
  departure?: string
  groupSize?: number | string
  tripDuration?: string
  startDate?: string
  endDate?: string
  budget?: string
  interests?: string[]
  accommodationType?: string
  travelPace?: string
  mobilityNotes?: string
  dietaryRestrictions?: string
  mustHaveExperiences?: string
  visitedBefore?: boolean
  notes?: string
}

const Row = ({ label, value }: { label: string; value?: string }) => (
  <Text style={rowStyle}>
    <span style={labelStyle}>{label}: </span>
    <span style={valueStyle}>{value && value.length ? value : '—'}</span>
  </Text>
)

const TripRequestNotificationEmail = (props: TripRequestNotificationProps) => {
  const {
    clientName, clientEmail, destination, departure, groupSize, tripDuration,
    startDate, endDate, budget, interests, accommodationType, travelPace,
    mobilityNotes, dietaryRestrictions, mustHaveExperiences, visitedBefore, notes,
  } = props

  return (
    <Html lang="en" dir="ltr">
      <Head />
      <Preview>New trip request from {clientName || 'a new client'}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>New Trip Request</Heading>
          <Text style={lead}>
            <strong>{clientName || 'A new client'}</strong> has submitted a trip request.
          </Text>

          <Section style={section}>
            <Heading as="h2" style={h2}>Client</Heading>
            <Row label="Name" value={clientName} />
            <Row label="Email" value={clientEmail} />
          </Section>

          <Hr style={hr} />

          <Section style={section}>
            <Heading as="h2" style={h2}>Trip</Heading>
            <Row label="Destination" value={destination} />
            <Row label="Departure" value={departure} />
            <Row label="Group size" value={groupSize ? String(groupSize) : ''} />
            <Row label="Duration" value={tripDuration} />
            <Row label="Dates" value={startDate || endDate ? `${startDate || '?'} → ${endDate || '?'}` : ''} />
            <Row label="Budget" value={budget} />
          </Section>

          <Hr style={hr} />

          <Section style={section}>
            <Heading as="h2" style={h2}>Preferences</Heading>
            <Row label="Interests" value={interests?.length ? interests.join(', ') : ''} />
            <Row label="Accommodation" value={accommodationType} />
            <Row label="Travel pace" value={travelPace} />
            <Row label="Mobility / accessibility" value={mobilityNotes} />
            <Row label="Dietary restrictions" value={dietaryRestrictions} />
            <Row label="Must-have experiences" value={mustHaveExperiences} />
            <Row label="Visited before" value={visitedBefore ? 'Yes' : 'No'} />
          </Section>

          {notes && (
            <>
              <Hr style={hr} />
              <Section style={section}>
                <Heading as="h2" style={h2}>Notes</Heading>
                <Text style={notesStyle}>{notes}</Text>
              </Section>
            </>
          )}

          <Hr style={hr} />
          <Text style={footer}>Fjord &amp; Waves Travel — advisor notification</Text>
        </Container>
      </Body>
    </Html>
  )
}

export const template = {
  component: TripRequestNotificationEmail,
  subject: (data: Record<string, any>) =>
    `New trip request: ${data.clientName || 'New client'} → ${data.destination || 'TBD'}`,
  to: 'daniel.lirafigueiredo@fora.travel',
  displayName: 'Trip request notification',
  previewData: {
    clientName: 'Jane Doe',
    clientEmail: 'jane@example.com',
    destination: 'Norway',
    departure: 'Lisbon',
    groupSize: 2,
    tripDuration: '7 days',
    startDate: '2026-06-10',
    endDate: '2026-06-17',
    budget: '5000 EUR',
    interests: ['Fjords', 'Hiking', 'Food'],
    accommodationType: 'Boutique hotels',
    travelPace: 'Relaxed',
    notes: 'Honeymoon trip — would love something memorable.',
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
const notesStyle = { fontSize: '14px', color: '#333', lineHeight: '1.6', margin: '0', whiteSpace: 'pre-wrap' as const }
const hr = { borderColor: '#e5e0d4', margin: '20px 0' }
const footer = { fontSize: '11px', color: '#999', margin: '20px 0 0', textAlign: 'center' as const, letterSpacing: '0.08em' }
