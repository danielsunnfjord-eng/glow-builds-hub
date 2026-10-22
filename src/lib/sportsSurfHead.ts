import { headFor } from "./seoHead";
import { withGroupNoindex } from "./groupPageGuard";

const META = {
  no: { title: "Idrettscamper og surfreiser i Rio og fjordene | Fjord & Waves", description: "Idrettscamper og surfreiser for ungdoms- og breddelag, surfegrupper og friluftsklubber i Rio og fjordene, med lokale eksperter i begge land." },
  en: { title: "Sports Camps & Surf Journeys in Rio and Norway | Fjord & Waves", description: "Sports camps and surf journeys for youth and amateur teams, surf groups and outdoor clubs in Rio and Norway's fjords, hosted by local experts." },
};

export function sportsSurfHead(locale: string | undefined) {
  return withGroupNoindex("sportsAndSurf", headFor(locale, { path: "/sports-and-surf", ...(locale === "no" ? META.no : META.en) }));
}
