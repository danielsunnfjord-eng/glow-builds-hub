import { createFileRoute } from "@tanstack/react-router";
import RoutesPage from "@/pages/Routes";

export const Route = createFileRoute("/{-$locale}/routes/")({
  component: RoutesPage,
});
