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
    conciergePoints: ["One personal contact from the first idea to the day you are home.", "Planning built around you or your group.", "Our network with locals guarantee the quality and precision of our services.", "Support during the trip, with a 24/7 contact line.", "A follow-up after you return."],
    founder: "Born in Brazil and based in Norway since 2010, I combine deep local knowledge of both countries with extensive international travel experience. As an IATA-accredited travel advisor, I serve as your personal concierge from the first idea to the moment you return home. From bespoke leisure travel and premium FIT itineraries to educational, corporate, and special-interest group travel, every journey is carefully designed around your interests, goals, and expectations. My in-depth understanding of Brazilian and Norwegian culture, logistics, and destinations allows me to create authentic experiences with confidence and attention to detail.",
    call: "Book a 20-minute call",
    whatsapp: "Or message on WhatsApp",
    cardsEyebrow: "Who we plan for",
    cards: [{"title": "Private Trips", "text": "Tailor-made journeys for individuals, couples and families in Rio and Norway.", "path": "/private-travel"}, {"title": "Schools, Sports Teams & Clubs", "text": "Study trips, camps and training trips.", "path": "/groups"}, {"title": "Corporate & Delegations", "text": "We manage every detail behind the scenes so your people can focus on the main goal of your trip.", "path": "/corporate"}, {"title": "Theme Travels", "text": "From a vibrant Rio Carnaval experience to witnessing the magical Northern Lights in Tromsø, we curate unforgettable custom journeys.", "path": "/trips"}],
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
    conciergePoints: ["Én personlig kontakt fra første idé til du er hjemme igjen.", "Planlegging bygget rundt deg eller gruppen din.", "Vårt nettverk med lokale garanterer kvaliteten og presisjonen i tjenestene våre.", "Støtte under reisen, med døgnåpen kontaktlinje.", "Oppfølging etter at du er kommet hjem."],
    // DRAFT translation from the English founder text; reviewed before publishing.
    founder: "Født i Brasil og bosatt i Norge siden 2010. Jeg kombinerer dyp lokal kunnskap om begge land med omfattende internasjonal reiseerfaring. Som IATA-akkreditert reiserådgiver er jeg din personlige concierge fra første idé til du er hjemme igjen. Fra skreddersydde fritidsreiser og premium FIT-reiser til undervisnings-, bedrifts- og interessegruppereiser – hver reise planlegges nøye rundt dine interesser, mål og forventninger. Min grundige forståelse av brasiliansk og norsk kultur, logistikk og destinasjoner lar meg skape autentiske opplevelser med trygghet og omsorg for detaljene.",
    call: "Book en 20 minutters samtale",
    whatsapp: "Eller send en melding på WhatsApp",
    cardsEyebrow: "Hvem vi planlegger for",
    cards: [{"title": "Privatreiser", "text": "Skreddersydde reiser for enkeltpersoner, par og familier i Rio og Norge.", "path": "/private-travel"}, {"title": "Skoler, idrettslag og klubber", "text": "Studieturer, camper og treningsreiser.", "path": "/groups"}, {"title": "Bedrift og delegasjoner", "text": "Vi håndterer alle detaljer bak kulissene, slik at deltakerne kan fokusere på hovedmålet med reisen.", "path": "/corporate"}, {"title": "Temareiser", "text": "Fra en stemningsfull Carnaval-opplevelse i Rio til det magiske nordlyset i Tromsø – vi kuraterer uforglemmelige, skreddersydde reiser.", "path": "/trips"}],
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
    conciergePoints: ["Um contato pessoal desde a primeira ideia até o dia em que você volta para casa.", "Planejamento feito para você ou seu grupo.", "Nossa rede com locais garante a qualidade e a precisão dos nossos serviços.", "Apoio durante a viagem, com uma linha de contato 24 horas por dia.", "Acompanhamento após o seu retorno."],
    // DRAFT – pending review: Portuguese translated from the English founder text; the owner reviews before publishing.
    founder: "Nascido no Brasil e morando na Noruega desde 2010, combino um profundo conhecimento local dos dois países com vasta experiência internacional de viagens. Como consultor de viagens credenciado pela IATA, atuo como seu concierge pessoal desde a primeira ideia até o momento em que você volta para casa. De viagens de lazer sob medida e itinerários FIT premium a viagens em grupo educacionais, corporativas e de interesses especiais, cada jornada é cuidadosamente planejada de acordo com seus interesses, objetivos e expectativas. Minha compreensão aprofundada da cultura, da logística e dos destinos brasileiros e noruegueses me permite criar experiências autênticas com segurança e atenção aos detalhes.",
    call: "Agende uma conversa de 20 minutos",
    whatsapp: "Ou envie uma mensagem pelo WhatsApp",
    cardsEyebrow: "Para quem planejamos",
    cards: [{"title": "Viagens privadas", "text": "Viagens sob medida para pessoas, casais e famílias no Rio e na Noruega.", "path": "/private-travel"}, {"title": "Escolas, equipes e clubes", "text": "Viagens de estudo, camps e viagens de treinamento.", "path": "/groups"}, {"title": "Empresas e delegações", "text": "Gerenciamos cada detalhe nos bastidores para que as pessoas se concentrem no objetivo principal da viagem.", "path": "/corporate"}, {"title": "Viagens temáticas", "text": "De uma vibrante experiência de Carnaval no Rio à mágica aurora boreal em Tromsø, criamos jornadas inesquecíveis sob medida.", "path": "/trips"}],
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
