import { headFor } from "./seoHead";
import { withGroupNoindex } from "./groupPageGuard";

const META = {
  no: { title: "Trygghet og hvordan vi jobber | Fjord & Waves Travel", description: "Hvordan Fjord & Waves Travel organiserer ansvar, tilsyn, overnatting, regler, vannsikkerhet, forsikring, beredskap og kommunikasjon på gruppeturer." },
  en: { title: "Safety and how we work | Fjord & Waves Travel", description: "How Fjord & Waves Travel organises responsibility, supervision, accommodation, rules, water safety, insurance, emergency response and communication on group trips." },
  // DRAFT – pending owner review (translated from English)
  pt: { title: "Segurança e como trabalhamos | Fjord & Waves Travel", description: "Como a Fjord & Waves Travel organiza responsabilidade, supervisão, hospedagem, regras, segurança na água, seguro, emergências e comunicação em viagens de grupo." },
};

export function safetyHead(locale: string | undefined) {
  return withGroupNoindex("safety", headFor(locale, { path: "/safety", ...(locale === "no" ? META.no : locale === "pt-br" ? META.pt : META.en) }));
}
