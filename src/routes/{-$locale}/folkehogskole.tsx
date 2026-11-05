import { createFileRoute } from "@tanstack/react-router";
import FolkHighSchoolPage from "@/components/voyage/FolkHighSchoolPage";
import { headFor } from "@/lib/seoHead";
import { guardGroupPage, withGroupNoindex } from "@/lib/groupPageGuard";

const META = {
  no: { title: "Studietur til Brasil for folkehøgskoler | Fjord & Waves Travel", description: "Trygge og faglig sterke studieturer til Rio for folkehøgskoler, planlagt av en tidligere folkehøgskolelærer sammen med Rio Sport & Tour." },
  en: { title: "Study Trips to Rio for Folk High Schools | Fjord & Waves Travel", description: "Safe, academically strong study trips to Rio for folk high schools, planned by a former folk high school teacher with Rio Sport & Tour." },
  // DRAFT – pending owner review (translated from English)
  pt: { title: "Viagens de estudo ao Rio para folk high schools | Fjord & Waves", description: "Viagens de estudo seguras e com conteúdo ao Rio para folk high schools, planejadas por um ex-professor de folk high school com a Rio Sport & Tour." },
};

export const Route = createFileRoute("/{-$locale}/folkehogskole")({
  beforeLoad: ({ params }) => guardGroupPage("folkHighSchools", params.locale),
  head: ({ params }) =>
    withGroupNoindex("folkHighSchools", headFor(params.locale, { path: "/folkehogskole", ...(params.locale === "no" ? META.no : params.locale === "pt-br" ? META.pt : META.en) })),
  component: FolkHighSchoolPage,
});
