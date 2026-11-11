import { createFileRoute } from "@tanstack/react-router";
import CruisesPage from "@/components/voyage/CruisesPage";
import { cruiseHead } from "@/lib/cruises";

export const Route = createFileRoute("/{-$locale}/cruzeiros")({
  head: ({ params }) => cruiseHead(params.locale),
  component: CruisesPage,
});