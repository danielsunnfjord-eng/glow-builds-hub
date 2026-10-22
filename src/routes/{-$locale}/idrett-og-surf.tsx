import { createFileRoute } from "@tanstack/react-router";
import TravelPlaceholderPage from "@/components/voyage/TravelPlaceholderPage";
import { travelPageHead } from "@/lib/travelPageHead";

export const Route = createFileRoute("/{-$locale}/idrett-og-surf")({
  head: ({ params }) => travelPageHead(params.locale, "sportsAndSurf", "/sports-and-surf"),
  component: Page,
});

function Page() {
  return <TravelPlaceholderPage page="sportsAndSurf" />;
}
