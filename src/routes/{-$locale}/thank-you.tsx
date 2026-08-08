import { createFileRoute } from "@tanstack/react-router";
import ThankYou from "@/pages/ThankYou";

export const Route = createFileRoute("/{-$locale}/thank-you")({
  component: ThankYou,
});
