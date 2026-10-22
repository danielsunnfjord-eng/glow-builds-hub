import { createFileRoute } from "@tanstack/react-router";
import TravelPlaceholderPage from "@/components/voyage/TravelPlaceholderPage";
import { travelPageHead } from "@/lib/travelPageHead";
import { guardGroupPage, withGroupNoindex } from "@/lib/groupPageGuard";

export const Route = createFileRoute("/{-$locale}/folkehogskole")({
  beforeLoad: ({ params }) => guardGroupPage("folkHighSchools", params.locale),
  head: ({ params }) => withGroupNoindex("folkHighSchools", travelPageHead(params.locale, "folkHighSchools", "/folkehogskole")),
  component: Page,
});

function Page() {
  return <TravelPlaceholderPage page="folkHighSchools" />;
}
