import { createFileRoute } from "@tanstack/react-router";
import DestinationNorway from "@/pages/DestinationNorway";

export const Route = createFileRoute("/{-$locale}/destinations/norway")({
  component: DestinationNorway,
});
