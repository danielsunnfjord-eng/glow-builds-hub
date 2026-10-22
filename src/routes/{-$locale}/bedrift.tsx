import { createFileRoute } from "@tanstack/react-router";
import TravelPlaceholderPage from "@/components/voyage/TravelPlaceholderPage";
import { travelPageHead } from "@/lib/travelPageHead";
import { guardGroupPage, withGroupNoindex } from "@/lib/groupPageGuard";

export const Route = createFileRoute("/{-$locale}/bedrift")({
  beforeLoad: ({ params }) => guardGroupPage("corporate", params.locale),
  head: ({ params }) => withGroupNoindex("corporate", travelPageHead(params.locale, "corporate", "/corporate")),
  component: Page,
});

function Page() {
  return <TravelPlaceholderPage page="corporate" />;
}
