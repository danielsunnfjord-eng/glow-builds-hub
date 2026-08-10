import { createFileRoute } from "@tanstack/react-router";
import Unsubscribe from "@/pages/Unsubscribe";
import { headFor } from "@/lib/seoHead";

export const Route = createFileRoute("/{-$locale}/unsubscribe")({
  head: ({ params }) =>
    headFor(params.locale, {
      path: "/unsubscribe",
      title: "Unsubscribe — Fjord & Waves Travel",
      description: "Manage your Fjord & Waves Travel email preferences.",
      noindex: true,
    }),
  component: Unsubscribe,
});
