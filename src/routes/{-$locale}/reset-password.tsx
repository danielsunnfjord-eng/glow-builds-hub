import { createFileRoute } from "@tanstack/react-router";
import ResetPassword from "@/pages/ResetPassword";
import { headFor } from "@/lib/seoHead";

export const Route = createFileRoute("/{-$locale}/reset-password")({
  head: ({ params }) =>
    headFor(params.locale, {
      path: "/reset-password",
      title: "Reset password — Fjord & Waves Travel",
      description: "Reset your Fjord & Waves Travel account password.",
      noindex: true,
    }),
  component: ResetPassword,
});
