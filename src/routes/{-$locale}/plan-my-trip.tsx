import { createFileRoute } from "@tanstack/react-router";
import PlanMyTripPage from "@/pages/PlanMyTrip";

export const Route = createFileRoute("/{-$locale}/plan-my-trip")({
  component: PlanMyTripPage,
});
