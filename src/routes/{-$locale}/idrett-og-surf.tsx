import { createFileRoute } from "@tanstack/react-router";
import TravelPlaceholderPage from "@/components/voyage/TravelPlaceholderPage";
import { travelPageHead } from "@/lib/travelPageHead";
import { guardGroupPage, withGroupNoindex } from "@/lib/groupPageGuard";

export const Route = createFileRoute("/{-$locale}/idrett-og-surf")({
  beforeLoad: ({ params }) => guardGroupPage("sportsAndSurf", params.locale),
  head: ({ params }) => withGroupNoindex("sportsAndSurf", travelPageHead(params.locale, "sportsAndSurf", "/sports-and-surf")),
  component: Page,
});

function Page() {
  return <TravelPlaceholderPage page="sportsAndSurf" />;
}
