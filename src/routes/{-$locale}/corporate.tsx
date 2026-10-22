import { createFileRoute } from "@tanstack/react-router";
import TravelPlaceholderPage from "@/components/voyage/TravelPlaceholderPage";
import { travelPageHead } from "@/lib/travelPageHead";

export const Route = createFileRoute("/{-$locale}/corporate")({
  head: ({ params }) => travelPageHead(params.locale, "corporate", "/corporate"),
  component: Page,
});

function Page() {
  return <TravelPlaceholderPage page="corporate" />;
}
