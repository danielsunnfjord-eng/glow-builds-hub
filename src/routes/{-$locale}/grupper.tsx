import { createFileRoute } from "@tanstack/react-router";
import ConciergeHubPage from "@/components/voyage/ConciergeHubPage";
import { conciergeHead } from "@/lib/conciergeHead";

export const Route = createFileRoute("/{-$locale}/grupper")({
  head: ({ params }) => conciergeHead(params.locale, "groups"),
  component: () => <ConciergeHubPage page="groups" />,
});
