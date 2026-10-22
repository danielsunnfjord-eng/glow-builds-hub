import { createFileRoute } from "@tanstack/react-router";
import TravelPlaceholderPage from "@/components/voyage/TravelPlaceholderPage";
import { travelPageHead } from "@/lib/travelPageHead";
import { guardGroupPage, withGroupNoindex } from "@/lib/groupPageGuard";

export const Route = createFileRoute("/{-$locale}/safety")({
  beforeLoad: ({ params }) => guardGroupPage("safety", params.locale),
  head: ({ params }) => withGroupNoindex("safety", travelPageHead(params.locale, "safety", "/safety")),
  component: Page,
});

function Page() {
  return <TravelPlaceholderPage page="safety" />;
}
