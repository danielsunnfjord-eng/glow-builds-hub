import { createFileRoute } from "@tanstack/react-router";
import Admin from "@/pages/Admin";
import ProtectedRoute from "@/components/ProtectedRoute";

export const Route = createFileRoute("/{-$locale}/admin")({
  component: () => (
    <ProtectedRoute>
      <Admin />
    </ProtectedRoute>
  ),
});
