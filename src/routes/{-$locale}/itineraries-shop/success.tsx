import { createFileRoute } from "@tanstack/react-router";
import { Navigate } from "@/lib/router-compat";

// Legacy redirect from the previous /itineraries-shop/success URL.
export const Route = createFileRoute("/{-$locale}/itineraries-shop/success")({
  component: () => <Navigate to="/catalogue/success" replace />,
});
