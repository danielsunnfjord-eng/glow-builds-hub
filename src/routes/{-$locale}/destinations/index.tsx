import { createFileRoute } from "@tanstack/react-router";
import TravelPlaceholderPage from "@/components/voyage/TravelPlaceholderPage";
import { travelPageHead } from "@/lib/travelPageHead";

export const Route = createFileRoute("/{-$locale}/destinations/")({
  head: ({ params }) => travelPageHead(params.locale, "destinations", "/destinations"),
  component: Page,
});

function Page() {
  return <TravelPlaceholderPage page="destinations" />;
}
