import { createFileRoute } from "@tanstack/react-router";
import ThemeTripsHub from "@/components/voyage/ThemeTripsHub";
import { themeTripsHubHead } from "@/lib/themeTripsHead";

export const Route = createFileRoute("/{-$locale}/reiser")({
  head: ({ params }) => themeTripsHubHead(params.locale),
  component: ThemeTripsHub,
});
