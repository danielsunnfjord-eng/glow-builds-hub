import { z } from "zod";
import { THEME_TRIPS } from "./themeTrips";

export const INTEREST_AUDIENCES = ["individual", "school", "club", "company"] as const;

export const interestSignupSchema = z.object({
  trip: z.string().trim().min(1).max(120),
  locale: z.enum(["en", "no", "pt"]),
  name: z.string().trim().min(1).max(120),
  email: z.string().trim().email().max(200),
  phone: z.string().trim().max(40).regex(/^[+\d\s().-]*$/).nullable().optional(),
  period: z.string().trim().min(1).max(120),
  number_of_people: z.number().int().positive().max(2147483647),
  audience: z.enum(INTEREST_AUDIENCES),
  message: z.string().trim().max(2000).nullable().optional(),
  consent: z.literal(true),
}).superRefine((data, ctx) => {
  const trip = THEME_TRIPS.find((item) => item.slug === data.trip);
  if (!trip) ctx.addIssue({ code: "custom", path: ["trip"], message: "Unknown trip" });
  else if (!trip.copy[data.locale].periods.includes(data.period)) {
    ctx.addIssue({ code: "custom", path: ["period"], message: "Choose a listed period" });
  }
});

export const INTEREST_FORM_COPY = {
  en: {
    phone: "Phone (optional)", people: "Number of people", audience: "I am",
    audiences: { individual: "Individual", school: "School or line", club: "Club or team", company: "Company" },
    consent: "I agree that Fjord & Waves Travel stores my details to contact me about this trip. No payment, no commitment.",
    privacy: "Privacy", invalid: "Please check your details and agree to the privacy consent.",
  },
  no: {
    phone: "Telefon (valgfritt)", people: "Antall personer", audience: "Jeg er",
    audiences: { individual: "Privatperson", school: "Skole eller linje", club: "Klubb eller lag", company: "Bedrift" },
    consent: "Jeg samtykker til at Fjord & Waves Travel lagrer opplysningene mine for å kontakte meg om denne reisen. Ingen betaling, ingen forpliktelse.",
    privacy: "Personvern", invalid: "Kontroller opplysningene og godta personvernsamtykket.",
  },
  // DRAFT — Portuguese translation for owner review.
  pt: {
    phone: "Telefone (opcional)", people: "Número de pessoas", audience: "Sou",
    audiences: { individual: "Pessoa física", school: "Escola ou curso", club: "Clube ou equipe", company: "Empresa" },
    consent: "Concordo que a Fjord & Waves Travel armazene meus dados para entrar em contato comigo sobre esta viagem. Sem pagamento, sem compromisso.",
    privacy: "Privacidade", invalid: "Confira seus dados e aceite o consentimento de privacidade.",
  },
};