import type { Locale } from "./locale";

// Portuguese is a draft translated from the supplied English, for owner review.
export const CONCIERGE_COPY = {
  en: {
    groups: "Schools, sports teams & clubs", intro: "Study trips, camps and training trips to Rio de Janeiro and Sogn og Fjordane, planned by a former folk high school teacher. One personal contact and local hosts in both places.",
    schoolText: "Study trips for sport, surf and outdoor, solidarity and culture, and creative lines.", sportsText: "Training camps and friendlies against local clubs, for youth and amateur teams.",
    school: "Folk high schools", sports: "Sports teams & clubs", start: "How can we help?",
    privateChoice: "Plan a private trip", groupChoice: "Request a proposal for a group, school, club or company", themeChoice: "Join a themed departure",
    trips: "Theme Travels", themeIntro: "Surf, beach sports and outdoor departures for small groups. Register your interest.",
  },
  no: {
    groups: "Skoler, idrettslag og klubber", intro: "Studieturer, camper og treningsreiser til Rio de Janeiro og Sogn og Fjordane, planlagt av en tidligere folkehøgskolelærer. Én personlig kontakt og lokale verter begge steder.",
    schoolText: "Studieturer for idrett, surf og friluftsliv, solidaritet og kultur, og kreative linjer.", sportsText: "Treningscamper og kamper mot lokale klubber, for ungdoms- og breddelag.",
    school: "Folkehøgskoler", sports: "Idrettslag og klubber", start: "Hvordan kan vi hjelpe?",
    privateChoice: "Planlegg en privatreise", groupChoice: "Be om forslag for en gruppe, skole, klubb eller bedrift", themeChoice: "Bli med på en temareise",
    trips: "Temareiser", themeIntro: "Surf, beach sports og friluftsliv for små grupper. Meld din interesse.",
  },
  pt: {
    groups: "Escolas, equipes e clubes", intro: "Viagens de estudo, camps e viagens de treinamento para o Rio de Janeiro e Sogn og Fjordane, planejadas por um ex-professor de folkehøgskole. Um contato pessoal e anfitriões locais nos dois lugares.",
    schoolText: "Viagens de estudo para linhas de esporte, surf e atividades ao ar livre, solidariedade e cultura, e cursos criativos.", sportsText: "Camps de treinamento e amistosos contra clubes locais, para times de base e amadores.",
    school: "Folkehøgskoler", sports: "Equipes e clubes esportivos", start: "Como podemos ajudar?",
    privateChoice: "Planeje uma viagem privada", groupChoice: "Solicite uma proposta para um grupo, escola, clube ou empresa", themeChoice: "Participe de uma viagem temática",
    trips: "Viagens temáticas", themeIntro: "Surf, esportes de praia e viagens ao ar livre para pequenos grupos. Registre seu interesse.",
  },
} satisfies Record<Locale, Record<string, string>>;

export const START_CHOICES = [
  { key: "privateChoice", href: "https://secure.foratravel.com/intake/uRYFCpSsUZ", external: true },
  { key: "groupChoice", href: "https://secure.foratravel.com/intake/98VwtEFIcy", external: true },
  { key: "themeChoice", href: "/trips", external: false },
] as const;

export const GROUP_ENTRIES = [
  { key: "school", href: "/folkehogskole" },
  { key: "sports", href: "/sports-and-surf" },
] as const;