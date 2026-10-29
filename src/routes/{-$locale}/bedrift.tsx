import { createFileRoute } from "@tanstack/react-router";
import CorporatePage from "@/components/voyage/CorporatePage";
import { headFor } from "@/lib/seoHead";
import { guardGroupPage, withGroupNoindex } from "@/lib/groupPageGuard";

const META = {
  no: { title: "Bedriftsreiser til Rio og Norge | Fjord & Waves Travel", description: "Teambuilding, incentivturer, samlinger og delegasjoner i Rio og fjordene. Én partner, to reisemål, tre språk." },
  en: { title: "Corporate Trips in Rio and Norway | Fjord & Waves Travel", description: "Team building, incentive trips, retreats and delegations in Rio and Norway's fjords. One partner, two destinations, three languages." },
  // DRAFT – pending owner review (translated from English)
  pt: { title: "Viagens corporativas ao Rio e à Noruega | Fjord & Waves Travel", description: "Experiências de equipe, viagens de incentivo, encontros e delegações no Rio e nos fiordes da Noruega. Um parceiro, dois destinos, três idiomas." },
};

export const Route = createFileRoute("/{-$locale}/bedrift")({
  beforeLoad: ({ params }) => guardGroupPage("corporate", params.locale),
  head: ({ params }) => withGroupNoindex("corporate", headFor(params.locale, { path: "/corporate", ...(params.locale === "no" ? META.no : params.locale === "pt-br" ? META.pt : META.en) })),
  component: CorporatePage,
});
