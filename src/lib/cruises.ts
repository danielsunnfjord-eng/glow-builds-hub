import type { Locale } from "./locale";
import { buildHead, localeFromParam } from "./seoHead";
import { SITE_URL } from "./locale";
import shareImage from "@/assets/cruises/cruise-fjord-share.jpg.asset.json";

export const CRUISE_COPY = {
  en: {
    title: "Planning a cruise?", subtitle: "I can book it, and help free of charge.",
    alt: "A cruise ship sailing through a narrow fjord between mountains",
    credit: "Image courtesy of Princess Cruise Line.",
    intro: "When I book your cruise, I can often add perks that aren't available when you book on your own. Depending on the cruise line and sailing, these may include:",
    perks: ["Onboard credit", "A complimentary specialty dining experience", "A complimentary spa experience", "Complimentary excursions"],
    body: "Fill out a short intake form and tell me about your dream trip. I'll send back personalized offers and recommendations that fit your travel style and budget.",
    request: "Start your cruise request", learn: "Learn more", how: "How it works",
    steps: ["Tell me about your dream trip in a short form.", "I send personalized offers and recommendations.", "You choose, and I book it for you."],
    fine: "Perks and offers vary by cruise line and sailing and are subject to availability and the cruise line's terms and conditions.",
    seoTitle: "Cruise Booking with Perks | Fjord & Waves Travel",
    description: "Planning a cruise? Get personalized offers and, when available, perks such as onboard credit. I book it and help free of charge.",
  },
  no: {
    title: "Skal du på cruise?", subtitle: "Jeg kan booke det, og hjelpe deg uten kostnad.",
    alt: "Et cruiseskip seiler gjennom en smal fjord mellom fjell",
    credit: "Bilde: Princess Cruise Line (gjengitt med tillatelse).",
    intro: "Når jeg booker cruiset ditt, kan jeg ofte legge til fordeler som ikke er tilgjengelige når du booker selv. Avhengig av rederi og avgang kan dette være:",
    perks: ["Bordkreditt (onboard credit)", "En gratis opplevelse på spesialrestaurant", "En gratis spaopplevelse", "Gratis utflukter"],
    body: "Fyll ut et kort skjema og fortell om drømmereisen din. Jeg sender deg personlige tilbud og anbefalinger som passer reisestilen og budsjettet ditt.",
    request: "Start cruiseforespørsel", learn: "Les mer", how: "Slik fungerer det",
    steps: ["Fortell meg om drømmereisen din i et kort skjema.", "Jeg sender deg personlige tilbud og anbefalinger.", "Du velger, og jeg booker for deg."],
    fine: "Fordeler og tilbud varierer mellom rederier og avganger og gis med forbehold om tilgjengelighet og rederiets vilkår.",
    seoTitle: "Cruise-booking med fordeler | Fjord & Waves Travel",
    description: "Skal du på cruise? Få personlige tilbud og, når det er mulig, fordeler som bordkreditt. Jeg booker og hjelper deg uten kostnad.",
  },
  // DRAFT Portuguese translation from supplied English, pending owner review.
  pt: {
    title: "Planejando um cruzeiro?", subtitle: "Posso reservar e ajudar você sem custo.",
    alt: "Um navio de cruzeiro navegando por um fiorde estreito entre montanhas",
    credit: "Imagem cedida pela Princess Cruise Line.",
    intro: "Quando reservo seu cruzeiro, muitas vezes posso incluir benefícios que não estão disponíveis quando você reserva por conta própria. Dependendo da companhia e da saída, eles podem incluir:",
    perks: ["Crédito a bordo", "Uma experiência gastronômica de cortesia em restaurante de especialidades", "Uma experiência de spa de cortesia", "Excursões de cortesia"],
    body: "Preencha um breve formulário e conte sobre a viagem dos seus sonhos. Enviarei ofertas e recomendações personalizadas que combinam com seu estilo de viagem e orçamento.",
    request: "Solicite seu cruzeiro", learn: "Saiba mais", how: "Como funciona",
    steps: ["Conte sobre a viagem dos seus sonhos em um breve formulário.", "Envio ofertas e recomendações personalizadas.", "Você escolhe, e eu faço a reserva para você."],
    fine: "Os benefícios e as ofertas variam conforme a companhia e a saída e estão sujeitos à disponibilidade e aos termos e condições da companhia de cruzeiros.",
    seoTitle: "Reserva de cruzeiros com benefícios | Fjord & Waves Travel",
    description: "Planejando um cruzeiro? Receba ofertas personalizadas e, quando disponíveis, benefícios como crédito a bordo. Reservo e ajudo você sem custo.",
  },
} satisfies Record<Locale, { title: string; subtitle: string; alt: string; credit: string; intro: string; perks: string[]; body: string; request: string; learn: string; how: string; steps: string[]; fine: string; seoTitle: string; description: string }>;

export function cruiseHead(param?: string) {
  const locale = localeFromParam(param);
  const c = CRUISE_COPY[locale];
  return buildHead({ path: "/cruises", locale, title: c.seoTitle, description: c.description, image: `${SITE_URL}${shareImage.url}` });
}