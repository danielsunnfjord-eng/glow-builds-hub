import { z } from "zod";

export const THEME_WISH_OWNER_EMAIL = "daniel.lirafigueiredo@fora.travel";
export const themeWishSchema = z.object({
  name: z.string().trim().min(1).max(120),
  email: z.string().trim().email().max(200),
  wish: z.string().trim().min(1).max(2000),
  locale: z.enum(["en", "no", "pt"]),
  consent: z.literal(true),
});

export const THEME_WISH_COPY = {
  en: { title: "Your theme travel wish", name: "Name", email: "Email", wish: "What theme would you like us to run?", consent: "I agree that Fjord & Waves Travel stores my details to contact me about my travel wish.", privacy: "Privacy", send: "Send wish", sending: "Sending…", done: "Thank you! Your theme travel wish has been received.", error: "Your wish could not be sent. Please try again.", invalid: "Please complete all fields and agree to the privacy consent.", close: "Close" },
  no: { title: "Ditt ønske for en temareise", name: "Navn", email: "E-post", wish: "Hvilket tema ønsker du at vi setter opp?", consent: "Jeg samtykker til at Fjord & Waves Travel lagrer opplysningene mine for å kontakte meg om reiseønsket mitt.", privacy: "Personvern", send: "Send ønske", sending: "Sender…", done: "Takk! Vi har mottatt ønsket ditt for en temareise.", error: "Ønsket kunne ikke sendes. Prøv igjen.", invalid: "Fyll ut alle feltene og gi samtykke til personvern.", close: "Lukk" },
  pt: { title: "Seu desejo de viagem temática", name: "Nome", email: "E-mail", wish: "Qual tema você gostaria que organizássemos?", consent: "Concordo que a Fjord & Waves Travel armazene meus dados para entrar em contato sobre meu desejo de viagem.", privacy: "Privacidade", send: "Enviar desejo", sending: "Enviando…", done: "Obrigado! Recebemos seu desejo de viagem temática.", error: "Não foi possível enviar seu desejo. Tente novamente.", invalid: "Preencha todos os campos e aceite o consentimento de privacidade.", close: "Fechar" },
};