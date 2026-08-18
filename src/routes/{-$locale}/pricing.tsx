import { createFileRoute } from "@tanstack/react-router";
import PricingPage from "@/pages/PricingPage";
import { headFor, localeFromParam } from "@/lib/seoHead";
import { copyFor } from "@/lib/seoCopy";

export const Route = createFileRoute("/{-$locale}/pricing")({
  head: ({ params }) => {
    const copy = copyFor("pricing", localeFromParam(params.locale));
    return headFor(params.locale, {
      path: "/pricing",
      title: copy.title,
      description: copy.description,
    });
  },
  component: PricingPage,
});
