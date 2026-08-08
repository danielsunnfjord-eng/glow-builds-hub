import { createFileRoute } from "@tanstack/react-router";
import RouteDetail from "@/pages/RouteDetail";

export const Route = createFileRoute("/{-$locale}/routes/$slug")({
  component: RouteDetail,
});
