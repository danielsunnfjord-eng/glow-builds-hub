import { Body, Container, Head, Heading, Html, Preview, Text } from "@react-email/components";
import type { TemplateEntry } from "./registry";
import { THEME_WISH_OWNER_EMAIL } from "@/lib/themeWish";

interface Props { name?: string; email?: string; wish?: string; locale?: string }
const Email = ({ name, email, wish, locale }: Props) => (
  <Html lang="en"><Head /><Preview>New theme travel wish</Preview>
    <Body style={{ backgroundColor: "#ffffff", fontFamily: "Montserrat, Arial, sans-serif", color: "#1e2634" }}>
      <Container style={{ maxWidth: 560, padding: "28px 24px" }}>
        <Text>Fjord &amp; Waves Travel</Text>
        <Heading>New theme travel wish</Heading>
        <Text><strong>Name:</strong> {name}</Text>
        <Text><strong>Email:</strong> {email}</Text>
        <Text><strong>Language:</strong> {locale}</Text>
        <Text><strong>Travel wish</strong></Text>
        <Text style={{ whiteSpace: "pre-wrap", lineHeight: 1.6 }}>{wish}</Text>
        <Text>Privacy consent: agreed</Text>
      </Container>
    </Body>
  </Html>
);
export const template = {
  component: Email,
  subject: "New theme travel wish — Fjord & Waves Travel",
  displayName: "Theme travel wish notification",
  to: THEME_WISH_OWNER_EMAIL,
} satisfies TemplateEntry;