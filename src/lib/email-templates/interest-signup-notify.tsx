import * as React from "react";
import { Body, Container, Head, Heading, Hr, Html, Preview, Section, Text } from "@react-email/components";
import type { TemplateEntry } from "./registry";

interface Props {
  trip?: string;
  period?: string;
  name?: string;
  email?: string;
  phone?: string;
  number_of_people?: number;
  audience?: string;
  consent?: boolean;
  message?: string;
  locale?: string;
}

const ink = "#1e2634";
const muted = "#5a6470";
const gold = "#c29a63";
const parchment = "#f3f1ea";

const label: React.CSSProperties = {
  margin: "0 0 4px",
  fontSize: "11px",
  fontWeight: 700,
  letterSpacing: "0.16em",
  textTransform: "uppercase",
  color: muted,
};
const value: React.CSSProperties = {
  margin: "0 0 16px",
  fontSize: "15px",
  color: ink,
  lineHeight: 1.5,
};

const Email = ({ trip, period, name, email, phone, number_of_people, audience, consent, message, locale }: Props) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>New interest signup for a themed trip</Preview>
    <Body style={{ backgroundColor: "#ffffff", fontFamily: "Montserrat, Arial, sans-serif" }}>
      <Container style={{ padding: "28px 24px", maxWidth: 560 }}>
        <Section style={{ backgroundColor: parchment, borderRadius: 6, padding: "20px 24px" }}>
          <Text style={{ margin: 0, fontSize: "12px", fontWeight: 700, letterSpacing: "0.18em", textTransform: "uppercase", color: gold }}>
            Fjord &amp; Waves Travel
          </Text>
          <Heading style={{ margin: "8px 0 0", fontSize: 22, color: ink }}>
            New interest signup{trip ? `: ${trip}` : ""}
          </Heading>
        </Section>
        <Section style={{ marginTop: 20 }}>
          <Text style={label}>Trip</Text>
          <Text style={value}>{trip || "—"}</Text>
          <Text style={label}>Period</Text>
          <Text style={value}>{period || "—"}</Text>
          <Text style={label}>Name</Text>
          <Text style={value}>{name || "—"}</Text>
          <Text style={label}>Email</Text>
          <Text style={value}>{email || "—"}</Text>
          <Text style={label}>Phone</Text>
          <Text style={value}>{phone || "Not supplied"}</Text>
          <Text style={label}>Number of people</Text>
          <Text style={value}>{number_of_people ?? "—"}</Text>
          <Text style={label}>I am</Text>
          <Text style={value}>{audience ? ({ individual: "Individual", school: "School or line", club: "Club or team", company: "Company" }[audience] ?? audience) : "—"}</Text>
          <Text style={label}>Privacy consent</Text>
          <Text style={value}>{consent ? "Agreed" : "Not supplied"}</Text>
          <Text style={label}>Language</Text>
          <Text style={value}>{locale || "en"}</Text>
          {message ? (
            <>
              <Text style={label}>Message</Text>
              <Text style={{ ...value, whiteSpace: "pre-wrap" }}>{message}</Text>
            </>
          ) : null}
        </Section>
        <Hr style={{ borderColor: "#e3ddd0" }} />
        <Text style={{ fontSize: 12, color: muted }}>
          Sent automatically when a visitor registers interest on a Theme Travels page.
        </Text>
      </Container>
    </Body>
  </Html>
);

export const template = {
  component: Email,
  subject: (d: Props) => `New interest signup: ${d.trip ?? "Trip"} — ${d.name ?? ""}`,
  displayName: "Interest signup notification",
  previewData: {
    trip: "Norway Surf & Fjord Week",
    period: "June to August 2027",
    name: "Jane Doe",
    email: "jane@example.com",
    message: "We are a group of six friends.",
    locale: "en",
  },
  // Owner notification: always to the concierge advisor.
  to: "daniel.lirafigueiredo@fora.travel",
} satisfies TemplateEntry;
