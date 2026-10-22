import { createFileRoute } from "@tanstack/react-router";
import FolkHighSchoolPage from "@/components/voyage/FolkHighSchoolPage";
import { headFor } from "@/lib/seoHead";
import { guardGroupPage, withGroupNoindex } from "@/lib/groupPageGuard";

const META = {
  no: { title: "Studietur til Brasil for folkehøgskoler | Fjord & Waves Travel", description: "Trygge og faglig sterke studieturer til Rio for folkehøgskoler, planlagt av en tidligere folkehøgskolelærer sammen med Rio Sport & Tour." },
  en: { title: "Study Trips to Rio for Folk High Schools | Fjord & Waves Travel", description: "Safe, academically strong study trips to Rio for folk high schools, planned by a former folk high school teacher with Rio Sport & Tour." },
};

export const Route = createFileRoute("/{-$locale}/folkehogskole")({
  beforeLoad: ({ params }) => guardGroupPage("folkHighSchools", params.locale),
  head: ({ params }) =>
    withGroupNoindex("folkHighSchools", headFor(params.locale, { path: "/folkehogskole", ...(params.locale === "no" ? META.no : META.en) })),
  component: FolkHighSchoolPage,
});
