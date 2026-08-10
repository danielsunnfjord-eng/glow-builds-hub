import type { Locale } from "./locale";

/**
 * Market-specific page metadata. Written for how each audience actually
 * searches — not literal translations of the English copy.
 *
 * en  → Americans planning trips to Norway / Europe
 * no  → Norwegians planning trips to Brazil
 * pt  → Brazilians planning trips to Norway / Europe
 */
export interface PageCopy {
  title: string;
  description: string;
}

type Copy = Record<Locale, PageCopy>;

export const SEO_COPY = {
  home: {
    en: {
      title: "Norway Itinerary Planning & Custom Trips | Fjord & Waves Travel",
      description:
        "Plan a Norway itinerary without the tourist traps — custom fjord and Northern Lights trips designed with an IATA-accredited travel advisor.",
    },
    no: {
      title: "Reise til Brasil – skreddersydd reiseplanlegging | Fjord & Waves",
      description:
        "Planlegg reisen til Brasil med en norsktalende reiserådgiver: trygge ruter, lokalkunnskap og en skreddersydd reiseplan fra dag én.",
    },
    pt: {
      title: "Roteiro Noruega e viagem sob medida | Fjord & Waves Travel",
      description:
        "Roteiros prontos e consultoria de viagem para a Noruega e Europa, em português, com preços transparentes e planejamento feito por especialista.",
    },
  } satisfies Copy,

  pricing: {
    en: {
      title: "Trip Planning Prices — Norway Travel Advisor | Fjord & Waves",
      description:
        "Flat, upfront fees for Norway trip planning: ready-made itineraries, consultation calls and fully custom travel design. No hidden commissions.",
    },
    no: {
      title: "Priser på reiseplanlegging til Brasil | Fjord & Waves Travel",
      description:
        "Faste priser på skreddersydd reise til Brasil: ferdige reiseruter, rådgivningssamtale og full reiseplanlegging. Ingen skjulte gebyrer.",
    },
    pt: {
      title: "Preços de consultoria de viagem e roteiros | Fjord & Waves",
      description:
        "Preços claros e fixos para roteiros prontos, consultoria de viagem e planejamento personalizado para a Noruega e Europa. Sem taxas escondidas.",
    },
  } satisfies Copy,

  catalogue: {
    en: {
      title: "Ready-Made Norway & Fjord Itineraries to Download | Fjord & Waves",
      description:
        "Download day-by-day Norway itineraries — fjords, Northern Lights and road trips — written by a travel advisor who plans these routes for a living.",
    },
    no: {
      title: "Ferdige reiseruter til Brasil og Norden | Fjord & Waves Travel",
      description:
        "Last ned ferdige reiseruter dag for dag — Brasil, Norden og mer — skrevet av en reiserådgiver med lokalkunnskap i begge land.",
    },
    pt: {
      title: "Roteiros prontos para Noruega e Europa | Fjord & Waves Travel",
      description:
        "Baixe roteiros dia a dia para a Noruega e Europa, escritos por um consultor de viagem brasileiro que mora na Escandinávia. Preço transparente.",
    },
  } satisfies Copy,

  about: {
    en: {
      title: "Your Norway Travel Advisor — Daniel Lira | Fjord & Waves Travel",
      description:
        "Meet Daniel Lira Figueiredo, an IATA-accredited Fora Travel advisor living in Norway who plans fjord, Arctic and Nordic trips for US travellers.",
    },
    no: {
      title: "Om reiserådgiveren – Brasil og Norden | Fjord & Waves Travel",
      description:
        "Daniel Lira Figueiredo er brasiliansk reiserådgiver bosatt i Norge, og planlegger trygge, skreddersydde reiser til Brasil for norske reisende.",
    },
    pt: {
      title: "Sobre o consultor de viagem | Fjord & Waves Travel",
      description:
        "Daniel Lira Figueiredo é consultor de viagem brasileiro na Noruega, credenciado IATA, e planeja roteiros personalizados pela Escandinávia e Europa.",
    },
  } satisfies Copy,

  planMyTrip: {
    en: {
      title: "Plan My Norway Trip — Custom Itinerary Request | Fjord & Waves",
      description:
        "Tell us your dates and travel style and get a custom Norway itinerary built around you — hotels, fjords and Northern Lights, no tourist traps.",
    },
    no: {
      title: "Planlegg reisen til Brasil – send forespørsel | Fjord & Waves",
      description:
        "Fortell oss når og hvordan du vil reise, så lager vi en skreddersydd Brasil-reise med trygge ruter, gode hoteller og lokale opplevelser.",
    },
    pt: {
      title: "Planejar minha viagem — roteiro personalizado | Fjord & Waves",
      description:
        "Conte suas datas e seu estilo de viagem e receba um roteiro personalizado para a Noruega ou Europa, com hospedagem e experiências selecionadas.",
    },
  } satisfies Copy,

  norway: {
    en: {
      title: "Norway Travel Guide & Fjord Trip Planning | Fjord & Waves Travel",
      description:
        "How to plan a Norway trip: when to see the Northern Lights, which fjords are worth the detour, and how long you really need in each region.",
    },
    no: {
      title: "Norge som reisemål – planlegg turen | Fjord & Waves Travel",
      description:
        "Praktisk guide til reiser i Norge: nordlys, fjorder, årstider og hvor lang tid du faktisk trenger i hver region.",
    },
    pt: {
      title: "Viagem para Noruega: guia e planejamento | Fjord & Waves",
      description:
        "Guia prático para planejar sua viagem para a Noruega: melhor época para auroras boreais, quais fiordes valem a viagem e quantos dias reservar.",
    },
  } satisfies Copy,

  routes: {
    en: {
      title: "Sample Norway Routes & Fjord Road Trips | Fjord & Waves Travel",
      description:
        "Route ideas for Norway and the Nordics — fjord road trips, Arctic winter weeks and city-plus-nature combinations, with realistic day counts.",
    },
    no: {
      title: "Reiseruter og forslag til rundreiser | Fjord & Waves Travel",
      description:
        "Forslag til rundreiser i Brasil og Norden: hvor lenge du bør bli hvert sted, hvordan du reiser mellom dem og hva som er verdt omveien.",
    },
    pt: {
      title: "Sugestões de roteiros e rotas de viagem | Fjord & Waves",
      description:
        "Ideias de rotas pela Noruega e Escandinávia: quantos dias em cada lugar, como se locomover e quais desvios realmente valem a pena.",
    },
  } satisfies Copy,

  startYourJourney: {
    en: {
      title: "Start Your Norway Journey — Talk to an Advisor | Fjord & Waves",
      description:
        "Book a consultation with a Norway travel advisor and turn a rough idea into a day-by-day itinerary with hotels, transport and timing sorted.",
    },
    no: {
      title: "Start reiseplanleggingen – snakk med rådgiver | Fjord & Waves",
      description:
        "Book en samtale med reiserådgiveren og gjør en løs idé om til en ferdig reiseplan med hoteller, transport og tidsplan på plass.",
    },
    pt: {
      title: "Comece sua viagem — fale com o consultor | Fjord & Waves",
      description:
        "Agende uma conversa com o consultor de viagem e transforme uma ideia solta em um roteiro dia a dia, com hospedagem e transporte definidos.",
    },
  } satisfies Copy,
} as const;

export function copyFor(page: keyof typeof SEO_COPY, locale: Locale): PageCopy {
  return SEO_COPY[page][locale];
}
