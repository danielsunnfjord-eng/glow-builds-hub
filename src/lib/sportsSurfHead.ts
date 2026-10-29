import { headFor } from "./seoHead";
import { withGroupNoindex } from "./groupPageGuard";

const META = {
  no: { title: "Idrettscamper og surfreiser i Rio og fjordene | Fjord & Waves", description: "Idrettscamper og surfreiser for ungdoms- og breddelag, surfegrupper og friluftsklubber i Rio og fjordene, med lokale eksperter i begge land." },
  en: { title: "Sports Camps & Surf Journeys in Rio and Norway | Fjord & Waves", description: "Sports camps and surf journeys for youth and amateur teams, surf groups and outdoor clubs in Rio and Norway's fjords, hosted by local experts." },
  // DRAFT – pending owner review (translated from English)
  pt: { title: "Camps esportivos e viagens de surf no Rio e na Noruega | Fjord & Waves", description: "Camps esportivos e viagens de surf para times de base e amadores, grupos de surf e clubes outdoor no Rio e nos fiordes da Noruega, com especialistas locais." },
};

export function sportsSurfHead(locale: string | undefined) {
  return withGroupNoindex("sportsAndSurf", headFor(locale, { path: "/sports-and-surf", ...(locale === "no" ? META.no : locale === "pt-br" ? META.pt : META.en) }));
}
