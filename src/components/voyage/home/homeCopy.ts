import type { Locale } from "@/lib/locale";

type Card = { title: string; text: string; path: string };

export type HomeCopy = {
  headline: string;
  subheadline: string;
  proposal: string;
  start: string;
  explore: string;
  conciergeTitle: string;
  conciergePoints: string[];
  founder: string;
  call: string;
  whatsapp: string;
  cardsEyebrow: string;
  cards: Card[];
  proof: string[];
  howTitle: string;
  steps: string[];
  safety: string;
  safetyLink: string;
  finalTitle: string;
  finalCall: string;
  privateLink: string;
};

export const HOME_COPY: Record<Locale, HomeCopy> = {
  en: {
    headline: "Your Concierge Travel Agents. From Tropical shores to Nordic Fjords",
    subheadline: "Private journeys, group trips and themed departures. Planned and hosted by local experts.",
    proposal: "Request a proposal",
    start: "Start planning",
    explore: "Explore",
    conciergeTitle: "What a concierge travel agent does",
    conciergePoints: ["One personal contact from the first idea to the day you are home.", "Planning built around you or your group.", "Local hosts in Rio and in Sogn og Fjordane.", "Support during the trip, with a 24/7 contact line.", "A follow-up after you return."],
    founder: "Brazilian-born, Norway-based since 2010. Trilingual, IATA accredited, and a former folk high school teacher. I am your concierge travel agent: one personal contact from the first idea to the day you are home. I plan private journeys, school and club trips, corporate programs and themed departures, with trusted local partners in Rio and Sogn og Fjordane.",
    call: "Book a 20-minute call",
    whatsapp: "Or message on WhatsApp",
    cardsEyebrow: "Who we plan for",
    cards: [{"title": "Private Trips", "text": "Tailor-made journeys for individuals, couples and families in Rio and Norway.", "path": "/private-travel"}, {"title": "Schools, Sports Teams & Clubs", "text": "Study trips, camps and training trips.", "path": "/groups"}, {"title": "Corporate & Delegations", "text": "We manage every detail behind the scenes so your people can focus on the main goal of your trip.", "path": "/corporate"}, {"title": "Theme Travels", "text": "From a vibrant Rio Carnaval experience to witnessing the magical Northern Lights in Tromsø, we curate unforgettable custom journeys.", "path": "/trips"}],
    proof: ["6 years as a folk high school teacher", "20+ years of local partner experience in Rio", "Brazilian-born, Norway-based since 2010", "IATA accredited"],
    howTitle: "How it works",
    steps: ["Talk", "Proposal", "Agreement", "Preparation", "Trip", "Evaluation"],
    safety: "Safety comes first. Read how we prepare, supervise and respond.",
    safetyLink: "Read about safety",
    finalTitle: "Tell us about your group. I reply within one business day.",
    finalCall: "Book a video call",
    privateLink: "Planning a trip for yourself? See private travel.",
  },
  no: {
    // DRAFT translation from the English hero text; reviewed before publishing.
    headline: "Dine concierge-reiserådgivere. Fra tropiske strender til nordiske fjorder",
    subheadline: "Privatreiser, gruppereiser og temareiser. Planlagt og gjennomført av lokale eksperter.",
    proposal: "Be om forslag",
    start: "Kom i gang",
    explore: "Utforsk",
    conciergeTitle: "Hva en concierge-reiserådgiver gjør",
    conciergePoints: ["Én personlig kontakt fra første idé til du er hjemme igjen.", "Planlegging bygget rundt deg eller gruppen din.", "Lokale verter i Rio og Sogn og Fjordane.", "Støtte under reisen, med døgnåpen kontaktlinje.", "Oppfølging etter at du er kommet hjem."],
    founder: "Brasiliansk-født og bosatt i Norge siden 2010. Trespråklig, IATA-akkreditert og tidligere folkehøgskolelærer. Jeg er din concierge-reiserådgiver: én personlig kontakt fra første idé til du er hjemme igjen. Jeg planlegger privatreiser, skole- og klubbturer, bedriftsprogram og temareiser, sammen med lokale partnere i Rio og Sogn og Fjordane.",
    call: "Book en 20 minutters samtale",
    whatsapp: "Eller send en melding på WhatsApp",
    cardsEyebrow: "Hvem vi planlegger for",
    cards: [{"title": "Privatreiser", "text": "Skreddersydde reiser for enkeltpersoner, par og familier i Rio og Norge.", "path": "/private-travel"}, {"title": "Skoler, idrettslag og klubber", "text": "Studieturer, camper og treningsreiser.", "path": "/groups"}, {"title": "Bedrift og delegasjoner", "text": "Vi håndterer alle detaljer bak kulissene, slik at deltakerne kan fokusere på hovedmålet med reisen.", "path": "/corporate"}, {"title": "Temareiser", "text": "Fra en stemningsfull Carnaval-opplevelse i Rio til det magiske nordlyset i Tromsø – vi kuraterer uforglemmelige, skreddersydde reiser.", "path": "/trips"}],
    proof: ["6 år som folkehøgskolelærer", "Over 20 års lokal partnererfaring i Rio", "Brasiliansk-født, bosatt i Norge siden 2010", "IATA-akkreditert"],
    howTitle: "Slik fungerer det",
    steps: ["Samtale", "Forslag", "Avtale", "Forberedelser", "Reise", "Evaluering"],
    safety: "Trygghet kommer først. Les hvordan vi forbereder, følger opp og håndterer uforutsette hendelser.",
    safetyLink: "Les om trygghet",
    finalTitle: "Fortell om gruppen deres. Jeg svarer innen én arbeidsdag.",
    finalCall: "Book en samtale",
    privateLink: "Planlegger du en reise for deg selv? Se privatreiser.",
  },
  // DRAFT – pending review: Portuguese translated from the English text; the owner reviews before publishing.
  pt: {
    headline: "Seus concierges de viagens. Das praias tropicais aos fiordes nórdicos",
    subheadline: "Viagens privadas, viagens em grupo e viagens temáticas. Planejadas e realizadas por especialistas locais.",
    proposal: "Solicite uma proposta",
    start: "Comece a planejar",
    explore: "Explore",
    conciergeTitle: "O que faz um concierge de viagens",
    conciergePoints: ["Um contato pessoal desde a primeira ideia até o dia em que você volta para casa.", "Planejamento feito para você ou seu grupo.", "Anfitriões locais no Rio e em Sogn og Fjordane.", "Apoio durante a viagem, com uma linha de contato 24 horas por dia.", "Acompanhamento após o seu retorno."],
    founder: "Brasileiro, morando na Noruega desde 2010. Trilíngue, credenciado pela IATA e ex-professor de folkehøgskole. Sou seu concierge de viagens: um contato pessoal desde a primeira ideia até o dia em que você volta para casa. Planejo viagens privadas, viagens para escolas e clubes, programas corporativos e viagens temáticas, com parceiros locais de confiança no Rio e em Sogn og Fjordane.",
    call: "Agende uma conversa de 20 minutos",
    whatsapp: "Ou envie uma mensagem pelo WhatsApp",
    cardsEyebrow: "Para quem planejamos",
    cards: [{"title": "Viagens privadas", "text": "Viagens sob medida para pessoas, casais e famílias no Rio e na Noruega.", "path": "/private-travel"}, {"title": "Escolas, equipes e clubes", "text": "Viagens de estudo, camps e viagens de treinamento.", "path": "/groups"}, {"title": "Empresas e delegações", "text": "Gerenciamos cada detalhe nos bastidores para que as pessoas se concentrem no objetivo principal da viagem.", "path": "/corporate"}, {"title": "Viagens temáticas", "text": "De uma vibrante experiência de Carnaval no Rio à mágica aurora boreal em Tromsø, criamos jornadas inesquecíveis sob medida.", "path": "/trips"}],
    proof: ["6 anos como professor de folk high school", "Mais de 20 anos de experiência com parceiros locais no Rio", "Brasileiro, morando na Noruega desde 2010", "Credenciado pela IATA"],
    howTitle: "Como funciona",
    steps: ["Conversa", "Proposta", "Acordo", "Preparação", "Viagem", "Avaliação"],
    safety: "A segurança vem em primeiro lugar. Veja como preparamos, acompanhamos e agimos.",
    safetyLink: "Leia sobre segurança",
    finalTitle: "Conte sobre o seu grupo. Respondo em até um dia útil.",
    finalCall: "Agende uma videochamada",
    privateLink: "Planejando uma viagem só para você? Veja as viagens privadas.",
  },
};

/** Testimonials shown on the homepage; all others appear on /private-travel. */
export const HOME_TESTIMONIAL_AUTHORS = ["Ingeborg Sol Fure", "Åge Avedal"];
/** Rio reviews shown on folk high school and sports pages (never framed as group clients). */
export const RIO_TESTIMONIAL_AUTHORS = ["Ingeborg Sol Fure", "Åge Avedal"];
/** Rome review: only /private-travel and /catalogue. */
export const ROME_TESTIMONIAL_AUTHORS = ["Therese Lothe"];
export const RIO_REVIEWS_LABEL = { en: "From travelers we hosted in Rio", no: "Fra reisende vi har tatt imot i Rio", pt: "De viajantes que recebemos no Rio" } as const;
