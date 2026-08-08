import { createFileRoute } from "@tanstack/react-router";
import ItineraryShopSuccess from "@/pages/ItineraryShopSuccess";

export const Route = createFileRoute("/{-$locale}/catalogue/success")({
  component: ItineraryShopSuccess,
});
