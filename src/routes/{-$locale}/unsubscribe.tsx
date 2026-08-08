import { createFileRoute } from "@tanstack/react-router";
import Unsubscribe from "@/pages/Unsubscribe";

export const Route = createFileRoute("/{-$locale}/unsubscribe")({
  component: Unsubscribe,
});
