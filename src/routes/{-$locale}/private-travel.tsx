import { createFileRoute } from "@tanstack/react-router";
import PrivateTravel from "@/pages/PrivateTravel";
import { travelPageHead } from "@/lib/travelPageHead";

export const Route = createFileRoute("/{-$locale}/private-travel")({
  head: ({ params }) => travelPageHead(params.locale, "privateTravel", "/private-travel"),
  component: PrivateTravel,
});
