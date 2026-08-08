import { createFileRoute } from "@tanstack/react-router";
import StartYourJourney from "@/pages/StartYourJourney";

export const Route = createFileRoute("/{-$locale}/start-your-journey")({
  component: StartYourJourney,
});
