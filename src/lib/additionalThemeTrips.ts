import type { Locale } from "./locale";
import type { ThemeTripCopy, ThemeTrip } from "./themeTrips";

const CARNAVAL_EN: ThemeTripCopy = {
  title: "Rio Carnaval Experience",
  seoTitle: "Rio Carnaval Experience 2027 and 2028 | Fjord & Waves Travel",
  subtitle: "Ten days in Rio during the world's biggest street party: blocos, samba and the Sambadrome, with the real Rio around them.",
  overview: "Rio transforms during Carnaval. The city becomes an immersive spectacle where strangers dance together at dawn, and the line between visitors and locals disappears in the blocos, the open-air street parties with live music, drums and dancing. Carnaval in Rio is not just observed: it invites you to take part. We recommend at least ten days, so you can experience the blocos, the Sambadrome and the street parties, and still find time for the city at a calmer pace. This is an example journey and is adapted to your group.",
  metaDescription: "Ten days in Rio for Carnaval: blocos, samba, the Sambadrome and quieter city moments. Register interest for February 2027 or 2028 before the deadline.",
  duration: "10 days", destination: "Rio de Janeiro, Brazil",
  periods: ["February 2027", "February 2028"],
  cardPeriods: ["February 2027 (register by 5 December 2026)", "February 2028 (register by 1 November 2027)"],
  periodDeadlines: ["register by 5 December 2026", "register by 1 November 2027"],
  deadlineTitle: "Registration deadlines",
  deadlineText: "Register your interest by 5 December 2026 for February 2027, or by 1 November 2027 for February 2028. Carnaval hotels and Sambadrome tickets are secured months ahead, and prices rise sharply during Carnaval week, so we need your interest early. Right after the deadline we check availability with our partners in Rio and tell you whether the trip goes ahead.",
  programHead: ["Day", "Program"],
  program: [
    ["1", "Arrival in Rio and private transfer. Easy first evening"],
    ["2", "Iconic Rio: Christ the Redeemer early in the morning, then Sugarloaf at sunset"],
    ["3", "Beach morning at Ipanema and Arpoador. Afternoon in Lapa, the Selarón steps and Santa Teresa. Evening samba in Lapa"],
    ["4", "Samba school culture (a rehearsal, if available for your dates) and a nature walk in Tijuca Forest or Pedra Bonita"],
    ["5", "Carnaval Friday: relaxed beach morning, an afternoon neighborhood bloco in Santa Teresa or Jardim Botânico, early night"],
    ["6", "Carnaval Saturday: a major bloco with huge crowds, with preparation and a plan for the day"],
    ["7", "Carnaval Sunday: the Sambadrome parade night (tickets subject to availability), or Lapa and smaller blocos"],
    ["8", "Carnaval Monday: beach, an afternoon bloco in Leblon or Ipanema, evening roda de samba at Pedra do Sal"],
    ["9", "Carnaval Tuesday: the biggest blocos, or a calmer day with a boat trip or beach town escape"],
    ["10", "Ash Wednesday: quiet beach time, then departure"],
  ],
  stayTitle: "Where you stay",
  stay: "We choose the neighborhood to fit your group. Ipanema and Leblon (beach, restaurants, calmer base), Copacabana (lively, wide choice of hotels), Santa Teresa (charm and atmosphere, less central), Botafogo and Flamengo (local feel, good metro access). The final choice is confirmed per departure.",
  activitiesTitle: "Experiences we can add",
  activities: "A private guide for landmarks, sunrise hikes with a local guide, boat trips to Ilha Grande or Angra dos Reis, VIP boxes at the Sambadrome (subject to availability).",
  leadersTitle: "Your leaders",
  leaders: [{ name: "Daniel Lira Figueiredo", role: "" }, { name: "Pablo Cabral Salles", role: "Rio Sports & Tour" }],
  leadersNote: "When a theme needs special expertise, we bring in specialists from our network.",
  beforeTitle: "Before you book",
  before: "Carnaval is hot (28 to 35 °C), humid and crowded, with short afternoon storms. We schedule quiet time in between. Street crime such as phone theft can happen in crowded blocos. We brief you, keep valuables to a minimum and plan transport with registered taxis or ride apps. Check recommended vaccinations, including yellow fever, with your health provider. Travel insurance is required. Entry requirements depend on your passport.",
  faqTitle: "Common questions",
  faq: [
    { q: "Do I need to speak Portuguese?", a: "No. English is spoken in hotels and tourist businesses, and Daniel speaks Portuguese, Norwegian and English." },
    { q: "Why is there a registration deadline?", a: "Hotels and Sambadrome tickets for Carnaval are secured months ahead, and prices are much higher than usual during Carnaval week." },
    // HIDDEN: Can I come alone? Awaiting the owner's answer.
    { q: "How many people do you need?", a: "Group size depends on the activities. We start with a short talk about your goals and needs." },
    { q: "What about flights?", a: "For groups of at least 10 travelers we can help with flight reservations." },
  ],
};

// DRAFT – Norwegian translation of the owner's English, awaiting review.
const CARNAVAL_NO: ThemeTripCopy = {
  ...CARNAVAL_EN,
  title: "Rio Karneval Experience",
  seoTitle: "Rio Karneval Experience 2027 og 2028 | Fjord & Waves Travel",
  subtitle: "Ti dager i Rio under verdens største gatefest: blocos, samba og Sambadromen, med det ekte Rio rundt deg.",
  overview: "Rio forvandles under karnevalet. Byen blir en opplevelse som omslutter deg, der fremmede danser sammen ved daggry, og skillet mellom besøkende og lokale forsvinner i blocos – gatefestene med livemusikk, trommer og dans. Karnevalet i Rio er ikke bare noe du ser på: du inviteres til å delta. Vi anbefaler minst ti dager, slik at du kan oppleve blocos, Sambadromen og gatefestene, og likevel ha tid til å utforske byen i roligere tempo. Dette er en eksempelreise og tilpasses gruppen din.",
  metaDescription: "Ti dager i Rio under karnevalet med blocos, samba, Sambadromen og roligere byopplevelser. Meld interesse for februar 2027 eller 2028 innen fristen.",
  duration: "10 dager", destination: "Rio de Janeiro, Brasil",
  periods: ["februar 2027", "februar 2028"],
  cardPeriods: ["februar 2027 (meld interesse innen 5. desember 2026)", "februar 2028 (meld interesse innen 1. november 2027)"],
  periodDeadlines: ["meld interesse innen 5. desember 2026", "meld interesse innen 1. november 2027"],
  deadlineTitle: "Frister for å melde interesse",
  deadlineText: "Meld interesse innen 5. desember 2026 for februar 2027, eller innen 1. november 2027 for februar 2028. Hoteller og billetter til Sambadromen sikres flere måneder i forkant, og prisene stiger kraftig under karnevalsuken. Derfor trenger vi interessen din tidlig. Rett etter fristen sjekker vi tilgjengeligheten med partnerne våre i Rio og gir beskjed om reisen blir gjennomført.",
  programHead: ["Dag", "Program"],
  program: [
    ["1", "Ankomst i Rio og privat transfer. En rolig første kveld"],
    ["2", "Rios ikoner: Kristusstatuen tidlig om morgenen, deretter Sukkertoppen ved solnedgang"],
    ["3", "Strandmorgen i Ipanema og Arpoador. Ettermiddag i Lapa, Selarón-trappen og Santa Teresa. Samba i Lapa om kvelden"],
    ["4", "Sambaskolekultur (en øvelse, hvis det passer med datoene) og naturvandring i Tijuca-skogen eller Pedra Bonita"],
    ["5", "Karnevalsfredag: rolig strandmorgen, en lokal bloco i Santa Teresa eller Jardim Botânico om ettermiddagen, tidlig kveld"],
    ["6", "Karnevalslørdag: en stor bloco med mye folk, med forberedelser og en plan for dagen"],
    ["7", "Karnevalssøndag: paraden på Sambadromen om natten (billetter med forbehold om tilgjengelighet), eller Lapa og mindre blocos"],
    ["8", "Karnevalsmandag: strand, en bloco i Leblon eller Ipanema om ettermiddagen, roda de samba på Pedra do Sal om kvelden"],
    ["9", "Karnevalstirsdag: de største blocos, eller en roligere dag med båttur eller en utflukt til en strandby"],
    ["10", "Askeonsdag: rolig tid på stranden, deretter avreise"],
  ],
  stayTitle: "Der dere bor",
  stay: "Vi velger bydel etter gruppens behov. Ipanema og Leblon (strand, restauranter, roligere base), Copacabana (livlig, stort hotellutvalg), Santa Teresa (sjarm og atmosfære, mindre sentralt), Botafogo og Flamengo (lokalt preg, god tilgang til metroen). Endelig valg bekreftes per avreise.",
  activitiesTitle: "Opplevelser vi kan legge til",
  activities: "Privat guide til severdighetene, soloppgangsturer med lokal guide, båtturer til Ilha Grande eller Angra dos Reis, VIP-losjer på Sambadromen (med forbehold om tilgjengelighet).",
  leadersTitle: "Reiseledere",
  leadersNote: "Når et tema krever spesiell kompetanse, henter vi inn eksperter fra nettverket vårt.",
  beforeTitle: "Før du bestiller",
  before: "Karnevalet er varmt (28 til 35 °C), fuktig og folksomt, med korte regnbyger om ettermiddagen. Vi legger inn rolige pauser. Gatelovbrudd som mobiltyveri kan forekomme i tettpakkede blocos. Vi gir en gjennomgang, begrenser verdisaker og planlegger transport med registrerte drosjer eller transportapper. Sjekk anbefalte vaksiner, inkludert gulfeber, med helsepersonell. Reiseforsikring er påkrevd. Innreisekrav avhenger av passet ditt.",
  faqTitle: "Vanlige spørsmål",
  faq: [
    { q: "Må jeg snakke portugisisk?", a: "Nei. Engelsk brukes på hoteller og i turistbedrifter, og Daniel snakker portugisisk, norsk og engelsk." },
    { q: "Hvorfor er det en frist for å melde interesse?", a: "Hoteller og billetter til Sambadromen sikres flere måneder før karnevalet, og prisene er mye høyere enn vanlig under karnevalsuken." },
    // HIDDEN: Kan jeg reise alene? Awaiting the owner's answer.
    { q: "Hvor mange trenger dere?", a: "Gruppestørrelsen avhenger av aktivitetene. Vi starter med en kort samtale om mål og behov." },
    { q: "Hva med fly?", a: "For grupper på minst 10 personer hjelper vi også med flyreservasjon." },
  ],
};

// DRAFT – pending owner review: Portuguese translated from the English.
const CARNAVAL_PT: ThemeTripCopy = {
  ...CARNAVAL_EN,
  seoTitle: "Rio Carnaval Experience 2027 e 2028 | Fjord & Waves Travel",
  subtitle: "Dez dias no Rio durante a maior festa de rua do mundo: blocos, samba e o Sambódromo, com o Rio de verdade ao redor.",
  overview: "O Rio se transforma durante o Carnaval. A cidade se torna um espetáculo imersivo em que desconhecidos dançam juntos ao amanhecer, e a linha entre visitantes e locais desaparece nos blocos, as festas de rua com música ao vivo, tambores e dança. O Carnaval no Rio não é apenas assistido: ele convida você a participar. Recomendamos pelo menos dez dias, para viver os blocos, o Sambódromo e as festas de rua e ainda ter tempo para a cidade em um ritmo mais calmo. Esta é uma viagem exemplo e é adaptada ao seu grupo.",
  metaDescription: "Dez dias no Rio no Carnaval: blocos, samba, o Sambódromo e momentos mais tranquilos na cidade. Registre seu interesse para fevereiro de 2027 ou 2028 antes do prazo.",
  duration: "10 dias", destination: "Rio de Janeiro, Brasil",
  periods: ["fevereiro de 2027", "fevereiro de 2028"],
  cardPeriods: ["fevereiro de 2027 (registre-se até 5 de dezembro de 2026)", "fevereiro de 2028 (registre-se até 1º de novembro de 2027)"],
  periodDeadlines: ["registre-se até 5 de dezembro de 2026", "registre-se até 1º de novembro de 2027"],
  deadlineTitle: "Prazos de inscrição",
  deadlineText: "Registre seu interesse até 5 de dezembro de 2026 para fevereiro de 2027, ou até 1º de novembro de 2027 para fevereiro de 2028. Hotéis de Carnaval e ingressos do Sambódromo são garantidos meses antes, e os preços sobem muito durante a semana do Carnaval, por isso precisamos do seu interesse com antecedência. Logo após o prazo, verificamos a disponibilidade com nossos parceiros no Rio e informamos se a viagem acontecerá.",
  programHead: ["Dia", "Programa"],
  program: [
    ["1", "Chegada ao Rio e traslado privativo. Primeira noite tranquila"],
    ["2", "Rio icônico: Cristo Redentor logo cedo, depois o Pão de Açúcar ao pôr do sol"],
    ["3", "Manhã de praia em Ipanema e Arpoador. Tarde na Lapa, Escadaria Selarón e Santa Teresa. Samba na Lapa à noite"],
    ["4", "Cultura das escolas de samba (um ensaio, se disponível nas suas datas) e caminhada na natureza na Floresta da Tijuca ou na Pedra Bonita"],
    ["5", "Sexta de Carnaval: manhã tranquila na praia, um bloco de bairro à tarde em Santa Teresa ou Jardim Botânico, noite cedo"],
    ["6", "Sábado de Carnaval: um bloco grande com muita gente, com preparação e um plano para o dia"],
    ["7", "Domingo de Carnaval: noite de desfile no Sambódromo (ingressos sujeitos a disponibilidade), ou Lapa e blocos menores"],
    ["8", "Segunda de Carnaval: praia, um bloco à tarde no Leblon ou Ipanema, roda de samba à noite no Pedra do Sal"],
    ["9", "Terça de Carnaval: os maiores blocos, ou um dia mais calmo com passeio de barco ou fuga para uma cidade litorânea"],
    ["10", "Quarta-feira de Cinzas: tempo tranquilo na praia, depois partida"],
  ],
  stayTitle: "Onde você fica",
  stay: "Escolhemos o bairro conforme o seu grupo. Ipanema e Leblon (praia, restaurantes, base mais calma), Copacabana (animada, muita opção de hotéis), Santa Teresa (charme e atmosfera, menos central), Botafogo e Flamengo (clima local, bom acesso ao metrô). A escolha final é confirmada por partida.",
  activitiesTitle: "Experiências que podemos incluir",
  activities: "Um guia privativo para os pontos turísticos, trilhas ao nascer do sol com guia local, passeios de barco para Ilha Grande ou Angra dos Reis, camarotes no Sambódromo (sujeitos a disponibilidade).",
  leadersTitle: "Líderes da viagem",
  leadersNote: "Quando um tema exige conhecimento especial, trazemos especialistas da nossa rede.",
  beforeTitle: "Antes de reservar",
  before: "O Carnaval é quente (28 a 35 °C), úmido e cheio de gente, com tempestades curtas à tarde. Programamos momentos de descanso. Crimes de rua, como roubo de celular, podem acontecer em blocos lotados. Fazemos uma orientação, mantemos objetos de valor no mínimo e planejamos o transporte com táxis registrados ou aplicativos. Verifique as vacinas recomendadas, incluindo febre amarela, com seu médico. Seguro-viagem é obrigatório. Os requisitos de entrada dependem do seu passaporte.",
  faqTitle: "Perguntas frequentes",
  faq: [
    { q: "Preciso falar português?", a: "Não. Inglês é falado em hotéis e negócios turísticos, e Daniel fala português, norueguês e inglês." },
    { q: "Por que existe um prazo de inscrição?", a: "Hotéis e ingressos do Sambódromo para o Carnaval são garantidos meses antes, e os preços são muito mais altos que o normal durante a semana do Carnaval." },
    // HIDDEN: Posso vir sozinho? Awaiting the owner's answer.
    { q: "Quantas pessoas são necessárias?", a: "O tamanho do grupo depende das atividades. Começamos com uma breve conversa sobre objetivos e necessidades." },
    { q: "E os voos?", a: "Para grupos de pelo menos 10 viajantes, também ajudamos com reservas de voos." },
  ],
};

const FJORDS_EN: ThemeTripCopy = {
  title: "Sogn og Fjordane: The Soul of Norwegian Fjords",
  subtitle: "A seven-day journey through the Sognefjord region: Flåm, the Nærøyfjord, a glacier walk and Balestrand.",
  overview: "Deep blue water, high mountains, old glaciers and lovely villages. This trip takes you through the Sognefjord region, visiting Flåm, the Nærøyfjord, Balestrand and the glaciers of Jostedalen, and balances cultural experiences with calm, unhurried travel. It is for people who value nature, authenticity and real depth, including first-time visitors to Norway. You ride one of the world's steepest railway lines, cross the famous Nærøyfjord by boat and walk onto an active glacier with a certified guide. Between the highlights there are quiet stops, good local food and scenic roads to quiet viewpoints. This is an example journey and is adapted to your group.",
  metaDescription: "Seven days through the Sognefjord region: Flåm Railway, Nærøyfjord cruise, a guided glacier walk and Balestrand, with unhurried cultural and nature experiences.",
  duration: "7 days", destination: "Sognefjord region, Norway", periods: ["June to August 2027"],
  programHead: ["Day", "Program"],
  program: [
    ["1", "Bergen, Voss and Flåm. Optional stops in Voss (gondola, Bordalsgjelet gorge, Tvindefossen waterfall). The Flåm Railway to Myrdal in the afternoon, evening walk by Flåm harbour"],
    ["2", "Early drive over Aurlandsfjellet to the Stegastein viewpoint before the tour buses arrive. Then Lærdalsøyri with its old wooden houses, and the Borgund stave church"],
    ["3", "Fjord cruise from Flåm to Gudvangen and Viking Valley with archery, axe throwing and Viking games. Then on to Gaupne in Luster (timing confirmed per departure)"],
    ["4", "Guided blue-ice glacier walk with a certified guide. Alternatives if weather cancels: Urnes stave church, Feigefossen waterfall, a drive along Lustrafjorden"],
    ["5", "Drive to Balestrand. A farm visit at Ciderhuset Balholm with tasting and the cider makers' dinner. Afternoon on foot, or by kayak in summer"],
    ["6", "A day in Vik: local ferry from Balestrand and the Hopperstad stave church. Slow evening in Balestrand"],
    ["7", "Scenic drive back to Bergen. Time at Bryggen, then departure"],
  ],
  stayTitle: "Where you stay (examples)",
  stay: "Flåm (Fretheim Hotel, Flåmsbrygga Hotell or Hotel Aurlandsfjord), Gaupne or Luster (Gaupnetunet Hotell and Cabins or Tørvis Hotell), Balestrand (Kviknes Hotel or Balestrand Hotel), Bergen (Opus XVI or Comfort Hotel Bergen Airport). The final choice is confirmed per departure.",
  extraSections: [{ title: "Good to know", text: "Flåm Railway tickets, fjord cruises and glacier walks must be booked early in summer, and we take care of the bookings. Glacier walks run from late May to September and depend on the weather, so we plan alternatives. The Aurlandsfjellet road is typically open from early June, depending on snow. Ferries and some roads run on limited timetables, and we plan the days around them." }],
  leadersTitle: "Your leaders",
  leaders: [{ name: "Daniel Lira Figueiredo", role: "Local guides from our network join Daniel" }],
  leadersNote: "When a theme needs special expertise, we bring in specialists from our network.",
  beforeTitle: "Before you book",
  before: "The weather in the fjords changes quickly. Bring layers, a windproof jacket, gloves for the glacier and good walking shoes, even in summer. Travel insurance is required. Entry requirements depend on your passport.",
  faqTitle: "Common questions", faq: [],
};

// DRAFT – Norwegian translation of the owner's English, awaiting review.
const FJORDS_NO: ThemeTripCopy = {
  ...FJORDS_EN,
  title: "Sogn og Fjordane: Sjelen i de norske fjordene",
  subtitle: "En sjudagers reise gjennom Sognefjord-regionen: Flåm, Nærøyfjorden, brevandring og Balestrand.",
  overview: "Dypblått vann, høye fjell, gamle breer og vakre bygder. Reisen tar deg gjennom Sognefjord-regionen, med besøk i Flåm, Nærøyfjorden, Balestrand og breene i Jostedalen, og kombinerer kulturopplevelser med rolig reising uten hastverk. Den passer for dem som setter pris på natur, autentisitet og opplevelser med dybde, også førstegangsbesøkende i Norge. Du reiser med en av verdens bratteste jernbaner, krysser den kjente Nærøyfjorden med båt og går på en aktiv bre med sertifisert guide. Mellom høydepunktene er det rolige stopp, god lokal mat og naturskjønne veier til stille utsiktspunkter. Dette er en eksempelreise og tilpasses gruppen din.",
  metaDescription: "Sju dager gjennom Sognefjord-regionen med Flåmsbana, fjordcruise på Nærøyfjorden, guidet brevandring og Balestrand i rolig tempo.",
  duration: "7 dager", destination: "Sognefjord-regionen, Norge", periods: ["juni til august 2027"],
  programHead: ["Dag", "Program"],
  program: [
    ["1", "Bergen, Voss og Flåm. Valgfrie stopp på Voss (gondol, Bordalsgjelet, Tvindefossen). Flåmsbana til Myrdal om ettermiddagen, kveldstur ved Flåm havn"],
    ["2", "Tidlig kjøretur over Aurlandsfjellet til Stegastein før turistbussene kommer. Deretter Lærdalsøyri med de gamle trehusene og Borgund stavkirke"],
    ["3", "Fjordcruise fra Flåm til Gudvangen og Viking Valley med bueskyting, øksekasting og vikingleker. Videre til Gaupne i Luster (tidspunkter bekreftes per avreise)"],
    ["4", "Guidet blåisvandring med sertifisert guide. Alternativer ved væravlysning: Urnes stavkirke, Feigefossen, kjøretur langs Lustrafjorden"],
    ["5", "Kjøretur til Balestrand. Gårdsbesøk på Ciderhuset Balholm med smaking og sidermakernes middag. Ettermiddag til fots, eller med kajakk om sommeren"],
    ["6", "En dag i Vik: lokal ferge fra Balestrand og Hopperstad stavkirke. Rolig kveld i Balestrand"],
    ["7", "Naturskjønn kjøretur tilbake til Bergen. Tid på Bryggen, deretter avreise"],
  ],
  stayTitle: "Der dere bor (eksempler)",
  stay: "Flåm (Fretheim Hotel, Flåmsbrygga Hotell eller Hotel Aurlandsfjord), Gaupne eller Luster (Gaupnetunet Hotell og Hytter eller Tørvis Hotell), Balestrand (Kviknes Hotel eller Balestrand Hotel), Bergen (Opus XVI eller Comfort Hotel Bergen Airport). Endelig valg bekreftes per avreise.",
  extraSections: [{ title: "Greit å vite", text: "Billetter til Flåmsbana, fjordcruise og brevandringer må bestilles tidlig om sommeren, og vi tar oss av bestillingene. Brevandringer gjennomføres fra slutten av mai til september og avhenger av været, så vi planlegger alternativer. Veien over Aurlandsfjellet åpner vanligvis tidlig i juni, avhengig av snøforholdene. Ferger og enkelte veier har begrensede rutetider, og vi planlegger dagene etter dem." }],
  leadersTitle: "Reiseledere",
  leaders: [{ name: "Daniel Lira Figueiredo", role: "Lokale guider fra nettverket vårt blir med Daniel" }],
  leadersNote: "Når et tema krever spesiell kompetanse, henter vi inn eksperter fra nettverket vårt.",
  beforeTitle: "Før du bestiller",
  before: "Været i fjordene skifter raskt. Ta med klær i flere lag, vindtett jakke, hansker til brevandringen og gode tursko, også om sommeren. Reiseforsikring er påkrevd. Innreisekrav avhenger av passet ditt.",
  faqTitle: "Vanlige spørsmål", faq: [],
};

// DRAFT – pending owner review: Portuguese translated from the English.
const FJORDS_PT: ThemeTripCopy = {
  ...FJORDS_EN,
  title: "Sogn og Fjordane: A alma dos fiordes noruegueses",
  seoTitle: "Sogn og Fjordane: a alma dos fiordes noruegueses | Fjord & Waves Travel",
  subtitle: "Uma viagem de sete dias pela região do Sognefjord: Flåm, Nærøyfjord, caminhada em geleira e Balestrand.",
  overview: "Água azul profunda, montanhas altas, geleiras antigas e vilarejos encantadores. Esta viagem percorre a região do Sognefjord, com visitas a Flåm, Nærøyfjord, Balestrand e às geleiras de Jostedalen, e equilibra experiências culturais com uma viagem calma e sem pressa. É para quem valoriza natureza, autenticidade e experiências com profundidade, incluindo quem visita a Noruega pela primeira vez. Você viaja em uma das ferrovias mais íngremes do mundo, cruza o famoso Nærøyfjord de barco e caminha sobre uma geleira ativa com um guia certificado. Entre os destaques há paradas tranquilas, boa comida local e estradas cênicas até mirantes silenciosos. Esta é uma viagem exemplo e é adaptada ao seu grupo.",
  metaDescription: "Sete dias pela região do Sognefjord: Ferrovia de Flåm, cruzeiro no Nærøyfjord, caminhada guiada em geleira e Balestrand, em ritmo tranquilo.",
  duration: "7 dias", destination: "Região do Sognefjord, Noruega", periods: ["junho a agosto de 2027"],
  programHead: ["Dia", "Programa"],
  program: [
    ["1", "Bergen, Voss e Flåm. Paradas opcionais em Voss (bondinho, desfiladeiro Bordalsgjelet, cachoeira Tvindefossen). Ferrovia de Flåm até Myrdal à tarde, caminhada noturna no porto de Flåm"],
    ["2", "Saída cedo por Aurlandsfjellet até o mirante Stegastein antes dos ônibus de turismo. Depois Lærdalsøyri com suas casas de madeira antigas e a igreja de madeira de Borgund"],
    ["3", "Cruzeiro de Flåm a Gudvangen e Viking Valley com arco e flecha, arremesso de machado e jogos vikings. Depois para Gaupne, em Luster (horários confirmados por partida)"],
    ["4", "Caminhada guiada em geleira azul com guia certificado. Alternativas se o tempo impedir: igreja de madeira de Urnes, cachoeira Feigefossen, passeio ao longo do Lustrafjorden"],
    ["5", "Viagem até Balestrand. Visita à fazenda Ciderhuset Balholm com degustação e o jantar dos produtores de sidra. Tarde a pé, ou de caiaque no verão"],
    ["6", "Um dia em Vik: balsa local de Balestrand e a igreja de madeira de Hopperstad. Noite tranquila em Balestrand"],
    ["7", "Estrada cênica de volta a Bergen. Tempo na Bryggen, depois partida"],
  ],
  stayTitle: "Onde você fica (exemplos)",
  stay: "Flåm (Fretheim Hotel, Flåmsbrygga Hotell ou Hotel Aurlandsfjord), Gaupne ou Luster (Gaupnetunet Hotell and Cabins ou Tørvis Hotell), Balestrand (Kviknes Hotel ou Balestrand Hotel), Bergen (Opus XVI ou Comfort Hotel Bergen Airport). A escolha final é confirmada por partida.",
  extraSections: [{ title: "Bom saber", text: "Ingressos da Ferrovia de Flåm, cruzeiros pelos fiordes e caminhadas em geleira devem ser reservados cedo no verão, e cuidamos das reservas. As caminhadas em geleira acontecem do final de maio a setembro e dependem do clima, então planejamos alternativas. A estrada de Aurlandsfjellet normalmente abre no início de junho, dependendo da neve. Ferries e algumas estradas têm horários limitados, e planejamos os dias de acordo." }],
  leadersTitle: "Líderes da viagem",
  leaders: [{ name: "Daniel Lira Figueiredo", role: "Guias locais da nossa rede acompanham Daniel" }],
  leadersNote: "Quando um tema exige conhecimento especial, trazemos especialistas da nossa rede.",
  beforeTitle: "Antes de reservar",
  before: "O clima nos fiordes muda rápido. Leve roupas em camadas, jaqueta corta-vento, luvas para a geleira e bons calçados para caminhada, mesmo no verão. Seguro-viagem é obrigatório. Os requisitos de entrada dependem do seu passaporte.",
  faqTitle: "Perguntas frequentes", faq: [],
};

// Portuguese is a draft translated from the English, for owner review.
export const CARNAVAL_TRIP: ThemeTrip = {
  slug: "rio-carnaval-experience", norwegianSlug: "rio-karneval",
  // End of 5 December 2026 / 1 November 2027 in Europe/Oslo (UTC+1).
  registrationClosesAt: ["2026-12-05T23:00:00.000Z", "2027-11-01T23:00:00.000Z"],
  copy: { en: CARNAVAL_EN, no: CARNAVAL_NO, pt: CARNAVAL_PT },
};

export function fjordsTrip(faq: Record<Locale, ThemeTripCopy["faq"]>): ThemeTrip {
  const en = { ...FJORDS_EN, faq: [...faq.en, { q: "Is a car needed?", a: "We arrange transport to fit your group size and the activities, so you do not need to rent a car yourself." }] };
  const no = { ...FJORDS_NO, faq: [...faq.no, { q: "Trenger jeg bil?", a: "Vi ordner transport som passer gruppestørrelsen og aktivitetene, så du trenger ikke å leie bil selv." }] };
  const pt = { ...FJORDS_PT, faq: [...faq.pt, { q: "Preciso de um carro?", a: "Organizamos o transporte conforme o tamanho do grupo e as atividades, então você não precisa alugar um carro." }] };
  return { slug: "sogn-og-fjordane-fjords", norwegianSlug: "sogn-og-fjordane-fjordene", copy: { en, no, pt } };
}