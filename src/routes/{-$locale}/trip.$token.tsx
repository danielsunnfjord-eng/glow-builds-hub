import { createFileRoute } from "@tanstack/react-router";
import SharedItinerary from "@/pages/SharedItinerary";

export const Route = createFileRoute("/{-$locale}/trip/$token")({
  component: SharedItinerary,
});
