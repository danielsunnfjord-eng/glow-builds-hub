import type { Locale } from "@/lib/locale";
import type { GroupPageKey } from "@/lib/travelNavigation";

type Card = { title: string; text: string; page: GroupPageKey; path: string; hash?: string };

export type HomeCopy = {
  headline: string;
  subheadline: string;
  proposal: string;
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
    headline: "Group journeys between Rio's waves and Norway's fjords",
    subheadline: "Planned by a former folk high school teacher. Hosted by local experts.",
    proposal: "Request a proposal",
    call: "Book a 20-minute call",
    whatsapp: "Or message on WhatsApp",
    cardsEyebrow: "Who we plan for",
    cards: [
      { title: "Folk High Schools", text: "Study trips for sport, surf and outdoor, solidarity and culture, and creative lines.", page: "folkHighSchools", path: "/folkehogskole" },
      { title: "Sports Teams & Clubs", text: "Camps, friendlies and training with local clubs in Rio and the fjords.", page: "sportsAndSurf", path: "/sports-and-surf" },
      { title: "Surf & Outdoor", text: "Rio's waves, Stad's surf, fjord kayaking and mountain hikes.", page: "sportsAndSurf", path: "/sports-and-surf", hash: "surf" },
      { title: "Corporate & Teams", text: "Team experiences, incentives and meetings in Rio and Norway's fjords.", page: "corporate", path: "/corporate" },
    ],
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
    headline: "Studieturer til Rio og fjordene",
    subheadline: "Planlagt av en tidligere folkehøgskolelærer, gjennomført sammen med lokale eksperter.",
    proposal: "Be om forslag",
    call: "Book en 20 minutters samtale",
    whatsapp: "Eller send en melding på WhatsApp",
    cardsEyebrow: "Hvem vi planlegger for",
    cards: [
      { title: "For folkehøgskoler", text: "Studieturer for idrett, surf og friluftsliv, solidaritet og kultur, og kreative fag.", page: "folkHighSchools", path: "/folkehogskole" },
      { title: "Idrettslag og klubber", text: "Camper, kamper og trening med lokale klubber i Rio og fjordene.", page: "sportsAndSurf", path: "/sports-and-surf" },
      { title: "Surf og friluftsliv", text: "Rios bølger, surf på Stad, fjordkajakk og fjellturer.", page: "sportsAndSurf", path: "/sports-and-surf", hash: "surf" },
      { title: "Bedrift og team", text: "Teamopplevelser, incentivreiser og møter i Rio og fjordene.", page: "corporate", path: "/corporate" },
    ],
    proof: ["6 år som folkehøgskolelærer", "Over 20 års lokal partnererfaring i Rio", "Brasiliansk-født, bosatt i Norge siden 2010", "IATA-akkreditert"],
    howTitle: "Slik fungerer det",
    steps: ["Samtale", "Forslag", "Avtale", "Forberedelser", "Reise", "Evaluering"],
    safety: "Trygghet kommer først. Les hvordan vi forbereder, følger opp og håndterer uforutsette hendelser.",
    safetyLink: "Les om trygghet",
    finalTitle: "Fortell om gruppen deres. Jeg svarer innen én virkedag.",
    finalCall: "Book en samtale",
    privateLink: "Planlegger du en reise for deg selv? Se privatreiser.",
  },
  // DRAFT – pending review: Portuguese translated from the English text; the owner reviews before publishing.
  pt: {
    headline: "Viagens em grupo entre as ondas do Rio e os fiordes da Noruega",
    subheadline: "Planejadas por um ex-professor de folk high school. Conduzidas por especialistas locais.",
    proposal: "Solicite uma proposta",
    call: "Agende uma conversa de 20 minutos",
    whatsapp: "Ou envie uma mensagem pelo WhatsApp",
    cardsEyebrow: "Para quem planejamos",
    cards: [
      { title: "Escolas e folk high schools", text: "Viagens de estudo para esporte, surf e atividades ao ar livre, solidariedade e cultura, e cursos criativos.", page: "folkHighSchools", path: "/folkehogskole" },
      { title: "Times e clubes esportivos", text: "Camps, amistosos e treinos com clubes locais no Rio e nos fiordes.", page: "sportsAndSurf", path: "/sports-and-surf" },
      { title: "Surf e aventura", text: "As ondas do Rio, o surf de Stad, caiaque nos fiordes e trilhas nas montanhas.", page: "sportsAndSurf", path: "/sports-and-surf", hash: "surf" },
      { title: "Empresas e equipes", text: "Experiências de equipe, viagens de incentivo e reuniões no Rio e nos fiordes da Noruega.", page: "corporate", path: "/corporate" },
    ],
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
