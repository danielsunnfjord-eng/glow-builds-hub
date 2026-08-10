import { createFileRoute } from "@tanstack/react-router";
import ThankYou from "@/pages/ThankYou";
import { headFor } from "@/lib/seoHead";

export const Route = createFileRoute("/{-$locale}/thank-you")({
  head: ({ params }) =>
    headFor(params.locale, {
      path: "/thank-you",
      title: "Thank you — Fjord & Waves Travel",
      description: "We have received your travel request and will be in touch shortly.",
      noindex: true,
    }),
  component: ThankYou,
});
