import { createFileRoute } from "@tanstack/react-router";
import TravelPlaceholderPage from "@/components/voyage/TravelPlaceholderPage";
import { travelPageHead } from "@/lib/travelPageHead";

export const Route = createFileRoute("/{-$locale}/private-travel")({
  head: ({ params }) => travelPageHead(params.locale, "privateTravel", "/private-travel"),
  component: Page,
});

function Page() {
  return <TravelPlaceholderPage page="privateTravel" />;
}
