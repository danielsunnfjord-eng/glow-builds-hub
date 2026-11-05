import type { Locale } from "./locale";
import { CARNAVAL_TRIP, fjordsTrip } from "./additionalThemeTrips";

/**
 * Theme Travels (/trips, /no/reiser) data module.
 * Owner rules that must always hold here:
 * - No price anywhere, not even "from".
 * - Every trip carries the status tag "Interest list" / "Interesseliste".
 * - Period dropdowns list ONLY the periods below; each option ends in the status tag.
 * - Portuguese is a draft translated from the English, for owner review.
 * - The Norwegian Rio Flow and Norway Surf texts are drafts translated from the
 *   supplied English; the English Beach Sports Camp text is a draft translated
 *   from the supplied Norwegian.
 */

export interface ThemeTripCopy {
  seoTitle?: string;
  cardPeriods?: string[];
  periodDeadlines?: string[];
  deadlineTitle?: string;
  deadlineText?: string;
  title: string;
  subtitle: string;
  overview: string;
  /** Short unique meta description derived from the overview. */
  metaDescription: string;
  duration: string;
  destination: string;
  periods: string[];
  programHead: [string, string];
  program: [string, string][];
  stayTitle: string;
  stay: string;
  /** Optional extra sections (getting there, surf note, activities, steps). */
  extraSections?: { title: string; text: string }[];
  activitiesTitle?: string;
  activities?: string;
  leadersTitle: string;
  leaders: { name: string; role: string }[];
  leadersNote?: string;
  beforeTitle: string;
  before: string;
  faqTitle: string;
  faq: { q: string; a: string }[];
  /** Show the Rio Sport & Tour partner block (Beach Sports Camp). */
  showRioPartner?: boolean;
}

export interface ThemeTrip {
  slug: string;
  norwegianSlug?: string;
  registrationClosesAt?: string[];
  copy: Record<Locale, ThemeTripCopy>;
}

const FAQ_EN = [
  { q: "How many people do you need?", a: "Group size depends on the theme and the activities. We start with a short talk about your goals and needs." },
  { q: "Can the program be changed?", a: "Yes. The program is an example and is adapted to your group." },
  { q: "When do I know if the trip goes ahead?", a: "We tell you three months before departure." },
  { q: "What about flights?", a: "For groups of at least 10 travelers we can help with flight reservations." },
];

const FAQ_NO = [
  { q: "Hvor mange trenger dere?", a: "Gruppestørrelsen avhenger av tema og aktiviteter. Vi starter med en kort samtale om mål og behov." },
  { q: "Kan opplegget endres?", a: "Ja, programmet er et eksempel og tilpasses gruppen." },
  { q: "Når får jeg vite om reisen blir gjennomført?", a: "Tre måneder før avreise." },
  { q: "Hva med fly?", a: "For grupper på minst 10 personer hjelper vi også med flyreservasjon." },
];

// DRAFT – pending owner review: Portuguese translated from the English.
const FAQ_PT = [
  { q: "Quantas pessoas são necessárias?", a: "O tamanho do grupo depende do tema e das atividades. Começamos com uma breve conversa sobre seus objetivos e necessidades." },
  { q: "O programa pode ser alterado?", a: "Sim. O programa é um exemplo e é adaptado ao seu grupo." },
  { q: "Quando sei se a viagem acontece?", a: "Avisamos três meses antes da partida." },
  { q: "E os voos?", a: "Para grupos de pelo menos 10 viajantes, também ajudamos com reservas de voos." },
];

const RIO_FLOW_EN: ThemeTripCopy = {
  title: "Rio Flow Experience: Surf. Move. Live.",
  subtitle: "A small-group journey through Copacabana, Ilha Grande and Recreio.",
  overview:
    "This is not a typical trip to Rio. You wake up close to the ocean, surf, move through the city with ease and settle into Rio's natural rhythm. No rush and no overplanning, just flow. With local guidance you experience the city beyond the surface: the right places at the right time. Small groups, carefully curated. This is an example journey and is adapted to your group.",
  metaDescription:
    "A small-group surf and city journey through Copacabana, Ilha Grande and Recreio, hosted by local experts. Register your interest – no payment, no commitment.",
  duration: "10 days",
  destination: "Rio de Janeiro, Brazil",
  periods: ["June to August 2027", "September to October 2027", "December 2027 to January 2028"],
  programHead: ["Day", "Program"],
  program: [
    ["1", "Morning surf session at Arpoador. Hike to Morro da Urca and cable car to Sugarloaf for sunset"],
    ["2", "Sunrise stand-up paddle at Copacabana (early start). Christ the Redeemer, then Lapa with the Selarón steps and Arcos da Lapa. Lunch near the Museum of Tomorrow. Free afternoon"],
    ["3", "Free morning with optional surf or hike. Evening out together: petiscos, drinks and music"],
    ["4", "Free day with suggestions: Forte do Leme, a hike up Dois Irmãos, a traditional churrasco"],
    ["5", "Final surf at Arpoador, check-out and travel to Ilha Grande. Short walk on the Abraão circuit and dinner by the beach"],
    ["6", "Ilha Grande, your choice: a full-day boat tour to the lagoons for snorkeling, or Lopes Mendes beach"],
    ["7", "Morning boat back to the mainland and transfer to Recreio. Afternoon at Macumba beach"],
    ["8", "Praia do Secreto at low tide and Mirante do Roncador. Sunset surf"],
    ["9", "Surf or an activity of your choice. Afternoon hike to Pedra do Telégrafo (moderate, about 3.5 km round trip, 40 to 60 minutes up)"],
    ["10", "Your day to design, then departure"],
  ],
  stayTitle: "Where you stay",
  stay: "Copacabana (for example Ritz Copacabana, Pestana Rio Atlântica or Grand Mercure Copacabana), Ilha Grande (O Sítio) and Recreio (KS Beach Hotel). These are examples. The final choice is confirmed per departure.",
  leadersTitle: "Your leaders",
  leaders: [
    { name: "Daniel Lira Figueiredo", role: "Born in Rio and based in Norway since 2010" },
    { name: "Pablo Cabral Salles", role: "Rio Sport & Tour" },
  ],
  leadersNote: "When a theme needs special expertise, we bring in specialists from our network.",
  beforeTitle: "Before you book",
  before:
    "Early starts (sunrise SUP). Moderate hikes. Sea temperature is around 18 to 22 °C in the Brazilian winter (June to August) and warmer the rest of the year. Travel insurance is required. Entry requirements depend on your passport.",
  faqTitle: "Common questions",
  faq: FAQ_EN,
  // HIDDEN FAQ (awaiting owner's answers): "Do I need surf experience?" and "Can I come alone?"
};

// DRAFT – pending owner review: Norwegian translated from the supplied English.
const RIO_FLOW_NO: ThemeTripCopy = {
  title: "Rio Flow Experience: Surf. Move. Live.",
  subtitle: "En reise i liten gruppe gjennom Copacabana, Ilha Grande og Recreio.",
  overview:
    "Dette er ikke en vanlig tur til Rio. Du våkner nær havet, surfer, beveger deg gjennom byen med letthet og finner Rios naturlige rytme. Ingen stress og ingen overplanlegging, bare flyt. Med lokal guiding opplever du byen under overflaten: de riktige stedene til riktig tid. Små grupper, nøye satt sammen. Dette er en eksempelreise og tilpasses gruppen din.",
  metaDescription:
    "En reise i liten gruppe med surf og byliv gjennom Copacabana, Ilha Grande og Recreio, med lokale verter. Meld din interesse – ingen betaling, ingen forpliktelse.",
  duration: "10 dager",
  destination: "Rio de Janeiro, Brasil",
  periods: ["juni til august 2027", "september til oktober 2027", "desember 2027 til januar 2028"],
  programHead: ["Dag", "Program"],
  program: [
    ["1", "Morgensurf ved Arpoador. Tur til Morro da Urca og taubane til Sukkertoppen i solnedgang"],
    ["2", "SUP i soloppgang ved Copacabana (tidlig start). Kristusstatuen, deretter Lapa med Selarón-trappen og Arcos da Lapa. Lunsj nær Museu do Amanhã. Fri ettermiddag"],
    ["3", "Fri formiddag med valgfri surf eller fjelltur. Kveld sammen: petiscos, drikke og musikk"],
    ["4", "Fri dag med forslag: Forte do Leme, tur opp Dois Irmãos, tradisjonell churrasco"],
    ["5", "Siste surf ved Arpoador, utsjekk og reise til Ilha Grande. Kort tur på Abraão-løypa og middag ved stranden"],
    ["6", "Ilha Grande, ditt valg: heldags båttur til lagunene for snorkling, eller Lopes Mendes-stranden"],
    ["7", "Morgenbåt tilbake til fastlandet og transfer til Recreio. Ettermiddag på Macumba-stranden"],
    ["8", "Praia do Secreto ved lavvann og Mirante do Roncador. Surf i solnedgang"],
    ["9", "Surf eller en aktivitet etter eget valg. Ettermiddagstur til Pedra do Telégrafo (moderat, cirka 3,5 km tur/retur, 40 til 60 minutter opp)"],
    ["10", "Dagen designer du selv, deretter hjemreise"],
  ],
  stayTitle: "Der dere bor",
  stay: "Copacabana (for eksempel Ritz Copacabana, Pestana Rio Atlântica eller Grand Mercure Copacabana), Ilha Grande (O Sítio) og Recreio (KS Beach Hotel). Dette er eksempler. Endelig valg bekreftes per avreise.",
  leadersTitle: "Reiseledere",
  leaders: [
    { name: "Daniel Lira Figueiredo", role: "Født i Rio og bosatt i Norge siden 2010" },
    { name: "Pablo Cabral Salles", role: "Rio Sport & Tour" },
  ],
  leadersNote: "Når et tema krever spesiell kompetanse, henter vi inn eksperter fra nettverket vårt.",
  beforeTitle: "Før du bestiller",
  before:
    "Tidlige starter (SUP i soloppgang). Moderate fjellturer. Vanntemperaturen er rundt 18 til 22 °C i den brasilianske vinteren (juni til august) og varmere resten av året. Reiseforsikring er påkrevd. Innreisekrav avhenger av passet ditt.",
  faqTitle: "Vanlige spørsmål",
  faq: FAQ_NO,
  // HIDDEN FAQ (awaiting owner's answers): "Trenger jeg surfeerfaring?" and "Kan jeg reise alene?"
};

// DRAFT – pending owner review: Portuguese translated from the English.
const RIO_FLOW_PT: ThemeTripCopy = {
  title: "Rio Flow Experience: Surf. Move. Live.",
  subtitle: "Uma viagem em pequeno grupo por Copacabana, Ilha Grande e Recreio.",
  overview:
    "Esta não é uma viagem típica ao Rio. Você acorda perto do oceano, surfa, se move pela cidade com leveza e entra no ritmo natural do Rio. Sem pressa e sem excesso de planejamento, apenas flow. Com orientação local, você vive a cidade além da superfície: os lugares certos na hora certa. Grupos pequenos, cuidadosamente selecionados. Esta é uma viagem exemplo e é adaptada ao seu grupo.",
  metaDescription:
    "Uma viagem em pequeno grupo de surf e cidade por Copacabana, Ilha Grande e Recreio, com anfitriões locais. Registre seu interesse – sem pagamento, sem compromisso.",
  duration: "10 dias",
  destination: "Rio de Janeiro, Brasil",
  periods: ["junho a agosto de 2027", "setembro a outubro de 2027", "dezembro de 2027 a janeiro de 2028"],
  programHead: ["Dia", "Programa"],
  program: [
    ["1", "Sessão de surf matinal no Arpoador. Trilha até o Morro da Urca e bondinho até o Pão de Açúcar no pôr do sol"],
    ["2", "SUP ao nascer do sol em Copacabana (saída cedo). Cristo Redentor, depois Lapa com a Escadaria Selarón e os Arcos da Lapa. Almoço perto do Museu do Amanhã. Tarde livre"],
    ["3", "Manhã livre com surf ou trilha opcionais. Saída noturna em grupo: petiscos, drinks e música"],
    ["4", "Dia livre com sugestões: Forte do Leme, trilha do Dois Irmãos, um churrasco tradicional"],
    ["5", "Último surf no Arpoador, check-out e viagem para Ilha Grande. Caminhada curta no circuito de Abraão e jantar na praia"],
    ["6", "Ilha Grande, você escolhe: passeio de barco de dia inteiro às lagoas para snorkel, ou a praia de Lopes Mendes"],
    ["7", "Barco de manhã de volta ao continente e traslado para Recreio. Tarde na praia da Macumba"],
    ["8", "Praia do Secreto na maré baixa e Mirante do Roncador. Surf no pôr do sol"],
    ["9", "Surf ou uma atividade de sua escolha. Trilha à tarde até a Pedra do Telégrafo (moderada, cerca de 3,5 km ida e volta, 40 a 60 minutos de subida)"],
    ["10", "Um dia para você planejar, depois partida"],
  ],
  stayTitle: "Onde você fica",
  stay: "Copacabana (por exemplo Ritz Copacabana, Pestana Rio Atlântica ou Grand Mercure Copacabana), Ilha Grande (O Sítio) e Recreio (KS Beach Hotel). Estes são exemplos. A escolha final é confirmada por partida.",
  leadersTitle: "Líderes da viagem",
  leaders: [
    { name: "Daniel Lira Figueiredo", role: "Nascido no Rio e morando na Noruega desde 2010" },
    { name: "Pablo Cabral Salles", role: "Rio Sport & Tour" },
  ],
  leadersNote: "Quando um tema exige conhecimento especial, trazemos especialistas da nossa rede.",
  beforeTitle: "Antes de reservar",
  before:
    "Inícios cedo (SUP ao nascer do sol). Trilhas moderadas. A temperatura do mar fica em torno de 18 a 22 °C no inverno brasileiro (junho a agosto) e mais quente no restante do ano. Seguro-viagem é obrigatório. Os requisitos de entrada dependem do seu passaporte.",
  faqTitle: "Perguntas frequentes",
  faq: FAQ_PT,
  // HIDDEN FAQ (awaiting owner's answers): "Preciso ter experiência com surf?" and "Posso vir sozinho?"
};

const NORWAY_EN: ThemeTripCopy = {
  title: "Norway Surf & Fjord Week",
  subtitle: "Surf at Stad and travel through Nordfjord: sea cliffs, Viking history, glacier valleys and quiet fjords. The surf and fjord season runs April to September.",
  overview:
    "Start with surf at Hoddevik and Ervik on the Stadlandet peninsula, then follow a route through Selje, Måløy, Loen, Kalvåg and Gloppen. Small group, local host, a new landscape each day. We adapt the transport to the size of the group and the activities you choose.",
  metaDescription:
    "Surf at Stad and travel through Nordfjord – sea cliffs, Viking history, glacier valleys and quiet fjords in a small group with a local host. Register your interest.",
  duration: "8 days",
  destination: "Stad and Nordfjord, Norway",
  periods: ["June to August 2027"],
  programHead: ["Day", "Program"],
  program: [
    ["Arrival", "Check-in at Stad Hotell and free time"],
    ["1", "One or two surf sessions at Hoddevik or Ervik. Vestkapp viewpoint and Dragseidet. Sunset on the beach"],
    ["2", "Surf. Boat trip to Selje Kloster and Sunniva cave. Beach evening or light sunset surf"],
    ["3", "Early surf, check-out. Måløy: Kannesteinen, Refviksanden beach and Kråkenes lighthouse. Optional: the Måløy raid center"],
    ["4", "Loen: Skylift to Hoven, Briksdalsbreen glacier, Oldevatnet and Lovatnet. Optional: guided Via Ferrata"],
    ["5", "Bremanger: Grotlesanden, Vingen rock carvings and Kalvåg. Lunch at Knutholmen. Sauna, kayaking, fishing or a swim"],
    ["6", "Nordfjordeid: Sagastad and Eidsgata. Gloppen: e-foil, SUP or kayak on the Gloppefjord. Dinner at Gloppen Hotell"],
    ["Departure", "Breakfast and check-out. Transfer to the airport"],
  ],
  stayTitle: "Where you stay",
  stay: "Stad Hotell, Thon Partner Hotel Måløy, Hotel Loenfjord, Knutholmen in Kalvåg and Gloppen Hotell. These are examples. The final choice is confirmed per departure.",
  extraSections: [
    {
      title: "Getting there",
      text: "Start at Stadlandet and end in Sandane. Nearby airports: Sandane, Førde, Sogndal and Florø. We can arrange pickup.",
    },
    {
      title: "Surf",
      text: "Surf sessions are led by local instructors from our network. The sea is cold. We provide a briefing and advise on wetsuits.",
      // HIDDEN (awaiting owner): surf school name and wetsuit rental details.
    },
  ],
  leadersTitle: "Your leaders",
  leaders: [{ name: "Daniel Lira Figueiredo", role: "Born in Rio and based in Norway since 2010" }],
  leadersNote: "Daniel is joined by local experts from our network.",
  beforeTitle: "Before you book",
  before:
    "Cold-water surfing needs a wetsuit and a briefing. Some places and activities operate seasonally, such as the Vestkapp café, the Loen Skylift, the Via Ferrata and the boat to Selje. We confirm opening times for your dates.",
  faqTitle: "Common questions",
  faq: FAQ_EN,
};

// DRAFT – pending owner review: Norwegian translated from the supplied English.
const NORWAY_NO: ThemeTripCopy = {
  title: "Norway Surf & Fjord Week",
  subtitle: "Surf på Stad og reise gjennom Nordfjord: havklipper, vikinghistorie, bredaler og stille fjorder. Surf- og fjordsesongen varer fra april til september.",
  overview:
    "Start med surf i Hoddevik og Ervik på Stadlandet, og følg deretter en rute gjennom Selje, Måløy, Loen, Kalvåg og Gloppen. Liten gruppe, lokal vert og et nytt landskap hver dag. Vi tilpasser transporten til gruppens størrelse og aktivitetene dere velger.",
  metaDescription:
    "Surf på Stad og reise gjennom Nordfjord – havklipper, vikinghistorie, bredaler og stille fjorder i liten gruppe med lokal vert. Meld din interesse.",
  duration: "8 dager",
  destination: "Stad og Nordfjord, Norge",
  periods: ["juni til august 2027"],
  programHead: ["Dag", "Program"],
  program: [
    ["Ankomst", "Innsjekk på Stad Hotell og fri tid"],
    ["1", "Én eller to surføkter i Hoddevik eller Ervik. Vestkapp og Dragseidet. Solnedgang på stranden"],
    ["2", "Surf. Båttur til Selje kloster og Sunniva-hulen. Strandkveld eller rolig surf i solnedgang"],
    ["3", "Tidlig surf, utsjekk. Måløy: Kannesteinen, Refviksanden og Kråkenes fyr. Valgfritt: Måløyraid-senteret"],
    ["4", "Loen: Skylift til Hoven, Briksdalsbreen, Oldevatnet og Lovatnet. Valgfritt: guidet Via Ferrata"],
    ["5", "Bremanger: Grotlesanden, helleristningene i Vingen og Kalvåg. Lunsj på Knutholmen. Badstue, kajakk, fiske eller en svømmetur"],
    ["6", "Nordfjordeid: Sagastad og Eidsgata. Gloppen: e-foil, SUP eller kajakk på Gloppefjorden. Middag på Gloppen Hotell"],
    ["Avreise", "Frokost og utsjekk. Transfer til flyplassen"],
  ],
  stayTitle: "Der dere bor",
  stay: "Stad Hotell, Thon Partner Hotel Måløy, Hotel Loenfjord, Knutholmen i Kalvåg og Gloppen Hotell. Dette er eksempler. Endelig valg bekreftes per avreise.",
  extraSections: [
    {
      title: "Slik kommer du deg dit",
      text: "Start på Stadlandet og slutt i Sandane. Nærmeste flyplasser: Sandane, Førde, Sogndal og Florø. Vi kan ordne henting.",
    },
    {
      title: "Surf",
      text: "Surføktene ledes av lokale instruktører fra nettverket vårt. Havet er kaldt. Vi gir en gjennomgang og råd om våtdrakt.",
      // HIDDEN (awaiting owner): surfeskolens navn og detaljer om våtdraktutleie.
    },
  ],
  leadersTitle: "Reiseledere",
  leaders: [{ name: "Daniel Lira Figueiredo", role: "Født i Rio og bosatt i Norge siden 2010" }],
  leadersNote: "Daniel får med seg lokale eksperter fra nettverket vårt.",
  beforeTitle: "Før du bestiller",
  before:
    "Kaldtvannssurfing krever våtdrakt og en gjennomgang. Enkelte steder og aktiviteter er sesongåpne, som Vestkapp-kaféen, Loen Skylift, Via Ferrata og båten til Selje. Vi bekrefter åpningstider for datoene dine.",
  faqTitle: "Vanlige spørsmål",
  faq: FAQ_NO,
};

// DRAFT – pending owner review: Portuguese translated from the English.
const NORWAY_PT: ThemeTripCopy = {
  title: "Norway Surf & Fjord Week",
  subtitle: "Surf em Stad e viagem pelo Nordfjord: falésias marítimas, história viking, vales de geleiras e fiordes tranquilos. A temporada de surf e fiordes vai de abril a setembro.",
  overview:
    "Comece com surf em Hoddevik e Ervik na península de Stadlandet, depois siga uma rota por Selje, Måløy, Loen, Kalvåg e Gloppen. Grupo pequeno, anfitrião local, uma nova paisagem a cada dia. Adaptamos o transporte ao tamanho do grupo e às atividades que você escolher.",
  metaDescription:
    "Surf em Stad e viagem pelo Nordfjord – falésias marítimas, história viking, vales de geleiras e fiordes tranquilos em grupo pequeno com anfitrião local. Registre seu interesse.",
  duration: "8 dias",
  destination: "Stad e Nordfjord, Noruega",
  periods: ["junho a agosto de 2027"],
  programHead: ["Dia", "Programa"],
  program: [
    ["Chegada", "Check-in no Stad Hotell e tempo livre"],
    ["1", "Uma ou duas sessões de surf em Hoddevik ou Ervik. Mirante Vestkapp e Dragseidet. Pôr do sol na praia"],
    ["2", "Surf. Passeio de barco ao mosteiro de Selje e à caverna de Sunniva. Noite na praia ou surf leve ao pôr do sol"],
    ["3", "Surf cedo, check-out. Måløy: Kannesteinen, praia de Refviksanden e farol de Kråkenes. Opcional: o centro Måløy Raid"],
    ["4", "Loen: Skylift até Hoven, geleira Briksdalsbreen, Oldevatnet e Lovatnet. Opcional: Via Ferrata guiada"],
    ["5", "Bremanger: Grotlesanden, gravuras rupestres de Vingen e Kalvåg. Almoço no Knutholmen. Sauna, caiaque, pesca ou um banho de mar"],
    ["6", "Nordfjordeid: Sagastad e Eidsgata. Gloppen: e-foil, SUP ou caiaque no Gloppefjord. Jantar no Gloppen Hotell"],
    ["Partida", "Café da manhã e check-out. Traslado ao aeroporto"],
  ],
  stayTitle: "Onde você fica",
  stay: "Stad Hotell, Thon Partner Hotel Måløy, Hotel Loenfjord, Knutholmen em Kalvåg e Gloppen Hotell. Estes são exemplos. A escolha final é confirmada por partida.",
  extraSections: [
    {
      title: "Como chegar",
      text: "Começa em Stadlandet e termina em Sandane. Aeroportos próximos: Sandane, Førde, Sogndal e Florø. Podemos organizar o traslado.",
    },
    {
      title: "Surf",
      text: "As sessões de surf são lideradas por instrutores locais da nossa rede. O mar é frio. Fazemos uma orientação e damos recomendações sobre wetsuit.",
      // HIDDEN (awaiting owner): surf school name and wetsuit rental details.
    },
  ],
  leadersTitle: "Líderes da viagem",
  leaders: [{ name: "Daniel Lira Figueiredo", role: "Nascido no Rio e morando na Noruega desde 2010" }],
  leadersNote: "Daniel é acompanhado por especialistas locais da nossa rede.",
  beforeTitle: "Antes de reservar",
  before:
    "Surfar em água fria exige wetsuit e uma orientação. Alguns lugares e atividades funcionam apenas na temporada, como o café Vestkapp, o Loen Skylift, a Via Ferrata e o barco para Selje. Confirmamos os horários para as suas datas.",
  faqTitle: "Perguntas frequentes",
  faq: FAQ_PT,
};

// Owner-supplied Norwegian text (primary version).
const BEACH_NO: ThemeTripCopy = {
  title: "Beach Sports Camp i Rio de Janeiro",
  subtitle: "To uker med sand, sol og sport i Zona Sul, pluss Arraial do Cabo eller Ilha Grande.",
  overview:
    "Start dagen med soloppgang over Copacabana, føttene i sanden og bølgene som vugger deg. Velg mellom beachvolley, footvolley, beach tennis, sandfotball, surf, SUP og yoga. Kvelden avsluttes med gode venner og en kald drink. Du bor nær Copacabana og Ipanema, og trener på sandvolleyballbanene i Leme. Mellom øktene opplever du Kristusstatuen, Sukkertoppen, Tijuca nasjonalpark, Lapa og en fotballkamp på Maracanã. De siste dagene tilbringer du på Arraial do Cabo eller Ilha Grande. Dette er et eksempel, og tilpasses gruppen.",
  metaDescription:
    "To uker med beachvolley, footvolley, beach tennis, surf og SUP i Rio de Janeiro, med lokale trenere og dager på Arraial do Cabo eller Ilha Grande. Meld din interesse.",
  duration: "15 dager",
  destination: "Rio de Janeiro, Brasil",
  periods: ["juni til august 2027", "september til oktober 2027"],
  programHead: ["Dag", "Program"],
  program: [
    ["Dag 1", "Ankomst og velkomstmøte på hotellet"],
    ["Dag 2 til 9", "Trening morgen og ettermiddag (beachvolleyball, beach tennis, footvolley, sandfotball, løping, styrke), surf eller SUP, tur til Kristusstatuen og Lapa, turnering 2x2 og 4x4, fotballkamp på Maracanã, hike i Tijuca"],
    ["Dag 10 til 14", "Ilha Grande eller Arraial do Cabo: dykking, snorkling, hikes og båttur"],
    ["Dag 15", "Hjemreise"],
  ],
  stayTitle: "Der dere bor",
  stay: "Du bor nær Copacabana og Ipanema, og trener på sandvolleyballbanene i Leme.",
  activitiesTitle: "Aktiviteter",
  activities:
    "Beachvolley, footvolley, beach tennis, sandfotball, styrke- og sirkeltrening, yoga, utesvømming, løping, fjellturer, SUP, surf, dykking og snorkling. Du velger aktiviteter når du melder deg på.",
  extraSections: [
    {
      title: "Slik går det til",
      text: "1 Meld interesse (ingen betaling). 2 Vi åpner registrering minst seks måneder før avreise. 3 Vi gir beskjed tre måneder før avreise om reisen blir gjennomført. 4 Betalingsplan og vilkår sendes ved bekreftelse.",
    },
  ],
  leadersTitle: "Reiseledere",
  leaders: [
    { name: "Daniel Lira Figueiredo", role: "Født i Rio og bosatt i Norge siden 2010" },
    { name: "Pablo Cabral Salles", role: "Volleyballtrener og grunnlegger av Rio Sport & Tour" },
  ],
  leadersNote: "Når et tema krever spesiell kompetanse, henter vi inn eksperter fra nettverket vårt.",
  beforeTitle: "Før du bestiller",
  before: "Dette er et eksempel, og tilpasses gruppen. Reiseforsikring er påkrevd. Innreisekrav avhenger av passet ditt.",
  faqTitle: "Vanlige spørsmål",
  faq: FAQ_NO,
  showRioPartner: true,
};

// DRAFT – pending owner review: English translated from the supplied Norwegian.
const BEACH_EN: ThemeTripCopy = {
  title: "Beach Sports Camp in Rio de Janeiro",
  subtitle: "Two weeks of sand, sun and sport in Zona Sul, plus Arraial do Cabo or Ilha Grande.",
  overview:
    "Start the day with sunrise over Copacabana, your feet in the sand and the waves rocking you. Choose between beach volleyball, footvolley, beach tennis, beach soccer, surf, SUP and yoga. The evening ends with good friends and a cold drink. You stay near Copacabana and Ipanema and train on the beach volleyball courts in Leme. Between sessions you experience Christ the Redeemer, Sugarloaf, Tijuca National Park, Lapa and a football match at Maracanã. You spend the last days on Arraial do Cabo or Ilha Grande. This is an example and is adapted to your group.",
  metaDescription:
    "Two weeks of beach volleyball, footvolley, beach tennis, surf and SUP in Rio de Janeiro, with local coaches and days on Arraial do Cabo or Ilha Grande. Register your interest.",
  duration: "15 days",
  destination: "Rio de Janeiro, Brazil",
  periods: ["June to August 2027", "September to October 2027"],
  programHead: ["Day", "Program"],
  program: [
    ["Day 1", "Arrival and welcome meeting at the hotel"],
    ["Days 2 to 9", "Training morning and afternoon (beach volleyball, beach tennis, footvolley, beach soccer, running, strength), surf or SUP, trip to Christ the Redeemer and Lapa, 2x2 and 4x4 tournament, football match at Maracanã, hike in Tijuca"],
    ["Days 10 to 14", "Ilha Grande or Arraial do Cabo: diving, snorkeling, hikes and boat tour"],
    ["Day 15", "Departure"],
  ],
  stayTitle: "Where you stay",
  stay: "You stay near Copacabana and Ipanema and train on the beach volleyball courts in Leme.",
  activitiesTitle: "Activities",
  activities:
    "Beach volleyball, footvolley, beach tennis, beach soccer, strength and circuit training, yoga, open-water swimming, running, mountain hikes, SUP, surf, diving and snorkeling. You choose your activities when you sign up.",
  extraSections: [
    {
      title: "How it works",
      text: "1 Register your interest (no payment). 2 We open registration at least six months before departure. 3 We tell you three months before departure whether the trip goes ahead. 4 A payment plan and terms are sent upon confirmation.",
    },
  ],
  leadersTitle: "Your leaders",
  leaders: [
    { name: "Daniel Lira Figueiredo", role: "Born in Rio and based in Norway since 2010" },
    { name: "Pablo Cabral Salles", role: "Volleyball coach and founder of Rio Sport & Tour" },
  ],
  leadersNote: "When a theme needs special expertise, we bring in specialists from our network.",
  beforeTitle: "Before you book",
  before: "This is an example and is adapted to your group. Travel insurance is required. Entry requirements depend on your passport.",
  faqTitle: "Common questions",
  faq: FAQ_EN,
  showRioPartner: true,
};

export const THEME_TRIPS: ThemeTrip[] = [
  CARNAVAL_TRIP,
  { slug: "rio-flow-experience", copy: { en: RIO_FLOW_EN, no: RIO_FLOW_NO, pt: RIO_FLOW_EN } },
  { slug: "norway-surf-fjord-week", copy: { en: NORWAY_EN, no: NORWAY_NO, pt: NORWAY_EN } },
  fjordsTrip({ en: FAQ_EN, no: FAQ_NO }),
  { slug: "beach-sports-camp-rio", copy: { en: BEACH_EN, no: BEACH_NO, pt: BEACH_NO } },
];

export function themeTripBySlug(slug: string): ThemeTrip | undefined {
  return THEME_TRIPS.find((trip) => trip.slug === slug || trip.norwegianSlug === slug);
}

/** The cutoff is exclusive: registration stays open through the Oslo deadline day. */
export function availableTripPeriods(trip: ThemeTrip, locale: Locale, now: Date): string[] {
  return trip.copy[locale].periods.filter((_, index) => {
    const closesAt = trip.registrationClosesAt?.[index];
    return !closesAt || now.getTime() < Date.parse(closesAt);
  });
}

export function tripPeriodLabel(trip: ThemeTrip, locale: Locale, period: string): string {
  const c = trip.copy[locale];
  const deadline = c.periodDeadlines?.[c.periods.indexOf(period)];
  return `${period} – ${THEME_COPY[locale].statusTag}${deadline ? ` (${deadline})` : ""}`;
}

/** Shared blocks and labels used on the hub and every trip page. */
export const THEME_COPY = {
  en: {
    hubTitle: "Theme Travels",
    hubIntro:
      "Small-group departures built around a theme: surf, beach sports and outdoor life. Choose a trip, pick a period and register your interest. No payment, no commitment.",
    howTitle: "How it works",
    deadlineNote: "Some trips have a registration deadline. It is shown on the trip page.",
    periodClosed: "Registration is closed for this period.",
    registrationClosed: "Interest registration is closed. Contact us about future departures.",
    consultation: "Book a conversation",
    howSteps: [
      "Register your interest for the trip and the period you prefer.",
      "We open registration at least six months before departure.",
      "We tell you three months before departure whether the trip goes ahead, and you receive the full program and the price.",
      "You decide. Nothing is booked until you say yes.",
    ],
    ownGroup: "Your own group? Travelling with a school, club or company? Request a proposal.",
    ownTheme: "A theme you would like us to run? Tell us.",
    statusTag: "Interest list",
    periodsLabel: "Tentative periods",
    registerTitle: "Register your interest",
    registerName: "Name",
    registerEmail: "Email",
    registerPeriod: "Preferred period",
    registerMessage: "Message (optional)",
    registerSubmit: "Register your interest",
    registerDone: "Thank you! Your interest is registered. We will be in touch when registration opens.",
    registerError: "Something went wrong. Please try again, or reach out on WhatsApp.",
    tentativeNote: "Dates are tentative. No payment. No commitment.",
    groupLink: "Travelling as a group? Request a proposal",
    adaptedTitle: "Adapted to you",
    adapted: "These trips are examples. After a short talk about your goals and needs, we adapt the program, group size, transport and what is included to your group.",
    minimumTitle: "If we do not reach the minimum",
    minimum: "We only confirm a departure when enough people have signed up. We tell you three months before departure whether the trip goes ahead.",
    languagesTitle: "Languages",
    languages: "Daniel speaks Portuguese, Norwegian and English. Some activities are led in English.",
    arrangeTitle: "What we arrange",
    arrange:
      "We take care of all the logistics: hotels, transport, airport transfers, activities, local guides and a 24/7 contact line. What is included is tailored to your wishes and set out in your proposal. For groups of at least 10 travelers we can also help with flight reservations.",
    programTitle: "Program",
    backToTrips: "All theme travels",
  },
  no: {
    hubTitle: "Temareiser",
    hubIntro:
      "Små grupper på reiser bygget rundt et tema: surf, beach sports og friluftsliv. Velg en reise, velg en periode og meld din interesse. Ingen betaling, ingen forpliktelse.",
    howTitle: "Slik fungerer det",
    deadlineNote: "Noen reiser har en påmeldingsfrist. Den vises på reisesiden.",
    periodClosed: "Interesseregistreringen er stengt for denne perioden.",
    registrationClosed: "Interesseregistreringen er stengt. Kontakt oss om fremtidige avganger.",
    consultation: "Bestill en samtale",
    howSteps: [
      "Meld interesse for reisen og perioden du ønsker.",
      "Vi åpner registrering minst seks måneder før avreise.",
      "Vi gir beskjed tre måneder før avreise om reisen blir gjennomført, og du får fullt program og pris.",
      "Du bestemmer. Ingenting er booket før du sier ja.",
    ],
    ownGroup: "Egen gruppe? Reiser dere som skole, klubb eller bedrift? Be om forslag.",
    ownTheme: "Et tema du ønsker at vi setter opp? Fortell oss.",
    statusTag: "Interesseliste",
    periodsLabel: "Foreløpige perioder",
    registerTitle: "Meld din interesse",
    registerName: "Navn",
    registerEmail: "E-post",
    registerPeriod: "Ønsket periode",
    registerMessage: "Melding (valgfritt)",
    registerSubmit: "Meld din interesse",
    registerDone: "Takk! Interessen din er registrert. Vi tar kontakt når registreringen åpner.",
    registerError: "Noe gikk galt. Prøv igjen, eller ta kontakt på WhatsApp.",
    tentativeNote: "Datoene er foreløpige. Ingen betaling. Ingen forpliktelse.",
    groupLink: "Reiser dere som gruppe? Be om forslag",
    adaptedTitle: "Tilpasset deg",
    adapted: "Disse reisene er eksempler. Etter en kort samtale om mål og behov tilpasser vi program, gruppestørrelse, transport og hva som er inkludert til gruppen din.",
    minimumTitle: "Hvis vi ikke når minimumsantallet",
    minimum: "Vi bekrefter en avreise når nok har meldt seg. Vi gir beskjed tre måneder før avreise om reisen blir gjennomført.",
    languagesTitle: "Språk",
    languages: "Daniel snakker portugisisk, norsk og engelsk. Enkelte aktiviteter foregår på engelsk.",
    arrangeTitle: "Dette ordner vi",
    arrange:
      "Vi tar oss av all logistikk: hotell, transport, flyplasstransfer, aktiviteter, lokale guider og en døgnåpen kontaktlinje. Hva som er inkludert tilpasses dine ønsker og settes opp i tilbudet. For grupper på minst 10 personer hjelper vi også med flyreservasjon.",
    programTitle: "Program",
    backToTrips: "Alle temareiser",
  },
  // DRAFT – pending review: Portuguese translated from the English text.
  pt: {
    hubTitle: "Viagens temáticas",
    hubIntro:
      "Pequenos grupos em viagens construídas em torno de um tema: surf, esportes de praia e vida ao ar livre. Escolha uma viagem, escolha um período e registre seu interesse. Sem pagamento, sem compromisso.",
    howTitle: "Como funciona",
    deadlineNote: "Algumas viagens têm um prazo de inscrição. Ele aparece na página da viagem.",
    periodClosed: "As inscrições estão encerradas para este período.",
    registrationClosed: "O registro de interesse está encerrado. Fale conosco sobre futuras partidas.",
    consultation: "Agende uma conversa",
    howSteps: [
      "Registre seu interesse na viagem e no período que preferir.",
      "Abrimos as inscrições pelo menos seis meses antes da partida.",
      "Avisamos três meses antes da partida se a viagem será realizada, e você recebe o programa completo e o preço.",
      "Você decide. Nada é reservado até você dizer sim.",
    ],
    ownGroup: "Grupo próprio? Viajando com uma escola, clube ou empresa? Solicite uma proposta.",
    ownTheme: "Um tema que você gostaria que organizássemos? Conte para nós.",
    statusTag: "Lista de interesse",
    periodsLabel: "Períodos provisórios",
    registerTitle: "Registre seu interesse",
    registerName: "Nome",
    registerEmail: "E-mail",
    registerPeriod: "Período preferido",
    registerMessage: "Mensagem (opcional)",
    registerSubmit: "Registrar interesse",
    registerDone: "Obrigado! Seu interesse foi registrado. Entraremos em contato quando as inscrições abrirem.",
    registerError: "Algo deu errado. Tente novamente ou fale conosco pelo WhatsApp.",
    tentativeNote: "As datas são provisórias. Sem pagamento. Sem compromisso.",
    groupLink: "Viajando em grupo? Solicite uma proposta",
    adaptedTitle: "Adaptado a você",
    adapted: "Estas viagens são exemplos. Após uma breve conversa sobre seus objetivos e necessidades, adaptamos o programa, o tamanho do grupo, o transporte e o que está incluído ao seu grupo.",
    minimumTitle: "Se não atingirmos o mínimo",
    minimum: "Só confirmamos uma partida quando pessoas suficientes se inscrevem. Avisamos três meses antes da partida se a viagem será realizada.",
    languagesTitle: "Idiomas",
    languages: "Daniel fala português, norueguês e inglês. Algumas atividades são conduzidas em inglês.",
    arrangeTitle: "O que organizamos",
    arrange:
      "Cuidamos de toda a logística: hotéis, transporte, traslados ao aeroporto, atividades, guias locais e uma linha de contato 24 horas. O que está incluído é adaptado aos seus desejos e definido na proposta. Para grupos de pelo menos 10 viajantes, também ajudamos com reservas de voos.",
    programTitle: "Programa",
    backToTrips: "Todas as viagens temáticas",
  },
} satisfies Record<Locale, Record<string, unknown>>;

export type ThemeCopy = (typeof THEME_COPY)["en"];
