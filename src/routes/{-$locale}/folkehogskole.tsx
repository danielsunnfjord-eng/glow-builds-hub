import { createFileRoute } from "@tanstack/react-router";
import TravelPlaceholderPage from "@/components/voyage/TravelPlaceholderPage";
import { travelPageHead } from "@/lib/travelPageHead";

export const Route = createFileRoute("/{-$locale}/folkehogskole")({
  head: ({ params }) => travelPageHead(params.locale, "folkHighSchools", "/folkehogskole"),
  component: Page,
});

function Page() {
  return <TravelPlaceholderPage page="folkHighSchools" />;
}
