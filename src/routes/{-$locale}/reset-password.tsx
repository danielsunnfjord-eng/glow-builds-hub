import { createFileRoute } from "@tanstack/react-router";
import ResetPassword from "@/pages/ResetPassword";

export const Route = createFileRoute("/{-$locale}/reset-password")({
  component: ResetPassword,
});
