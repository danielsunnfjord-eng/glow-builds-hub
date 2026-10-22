import { createFileRoute } from "@tanstack/react-router";
import TravelPlaceholderPage from "@/components/voyage/TravelPlaceholderPage";
import { travelPageHead } from "@/lib/travelPageHead";

export const Route = createFileRoute("/{-$locale}/safety")({
  head: ({ params }) => travelPageHead(params.locale, "safety", "/safety"),
  component: Page,
});

function Page() {
  return <TravelPlaceholderPage page="safety" />;
}
