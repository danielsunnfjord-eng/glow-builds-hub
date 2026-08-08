import { createFileRoute } from "@tanstack/react-router";
import ItinerariesShop from "@/pages/ItinerariesShop";

export const Route = createFileRoute("/{-$locale}/catalogue/")({
  component: ItinerariesShop,
});
