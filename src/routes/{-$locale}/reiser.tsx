import { createFileRoute } from "@tanstack/react-router";
import ConciergeHubPage from "@/components/voyage/ConciergeHubPage";
import { conciergeHead } from "@/lib/conciergeHead";

export const Route = createFileRoute("/{-$locale}/reiser")({
  head: ({ params }) => conciergeHead(params.locale, "trips"),
  component: () => <ConciergeHubPage page="trips" />,
});
