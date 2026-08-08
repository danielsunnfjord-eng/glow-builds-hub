import { createFileRoute } from "@tanstack/react-router";
import Legal from "@/pages/Legal";

export const Route = createFileRoute("/{-$locale}/privacy")({
  component: Legal,
});
