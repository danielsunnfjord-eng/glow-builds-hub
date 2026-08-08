import { createFileRoute } from "@tanstack/react-router";
import { Navigate } from "@/lib/router-compat";

// Legacy redirect from the previous /itineraries-shop URL.
export const Route = createFileRoute("/{-$locale}/itineraries-shop/")({
  component: () => <Navigate to="/catalogue" replace />,
});
