import { createFileRoute } from "@tanstack/react-router";
import SportsSurfPage from "@/components/voyage/SportsSurfPage";
import { sportsSurfHead } from "@/lib/sportsSurfHead";
import { guardGroupPage } from "@/lib/groupPageGuard";

export const Route = createFileRoute("/{-$locale}/sports-and-surf")({
  beforeLoad: ({ params }) => guardGroupPage("sportsAndSurf", params.locale),
  head: ({ params }) => sportsSurfHead(params.locale),
  component: SportsSurfPage,
});
