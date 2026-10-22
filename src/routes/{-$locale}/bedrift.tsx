import { createFileRoute } from "@tanstack/react-router";
import CorporatePage from "@/components/voyage/CorporatePage";
import { headFor } from "@/lib/seoHead";
import { guardGroupPage, withGroupNoindex } from "@/lib/groupPageGuard";

const META = {
  no: { title: "Bedriftsreiser og teamopplevelser i Rio og fjordene | Fjord & Waves", description: "Teambuilding, incentivturer, samlinger og delegasjoner i Rio og fjordene. Én partner, to reisemål, tre språk." },
  en: { title: "Corporate Trips & Team Experiences in Rio and Norway | Fjord & Waves", description: "Team building, incentive trips, retreats and delegations in Rio and Norway's fjords. One partner, two destinations, three languages." },
};

export const Route = createFileRoute("/{-$locale}/bedrift")({
  beforeLoad: ({ params }) => guardGroupPage("corporate", params.locale),
  head: ({ params }) => withGroupNoindex("corporate", headFor(params.locale, { path: "/corporate", ...(params.locale === "no" ? META.no : META.en) })),
  component: CorporatePage,
});
