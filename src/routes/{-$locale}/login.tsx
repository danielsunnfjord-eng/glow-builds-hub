import { createFileRoute } from "@tanstack/react-router";
import Login from "@/pages/Login";
import { headFor } from "@/lib/seoHead";

export const Route = createFileRoute("/{-$locale}/login")({
  head: ({ params }) =>
    headFor(params.locale, {
      path: "/login",
      title: "Advisor login — Fjord & Waves Travel",
      description: "Sign in to the Fjord & Waves Travel advisor workspace.",
      noindex: true,
    }),
  component: Login,
});
