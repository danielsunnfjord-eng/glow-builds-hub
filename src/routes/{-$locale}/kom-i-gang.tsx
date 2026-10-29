import { createFileRoute } from "@tanstack/react-router";
import ConciergeHubPage from "@/components/voyage/ConciergeHubPage";
import { conciergeHead } from "@/lib/conciergeHead";

export const Route = createFileRoute("/{-$locale}/kom-i-gang")({
  head: ({ params }) => conciergeHead(params.locale, "start"),
  component: () => <ConciergeHubPage page="start" />,
});
