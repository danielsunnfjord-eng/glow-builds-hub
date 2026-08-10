import { createFileRoute } from "@tanstack/react-router";
import PlanMyTripPage from "@/pages/PlanMyTrip";
import { headFor, localeFromParam } from "@/lib/seoHead";
import { copyFor } from "@/lib/seoCopy";

export const Route = createFileRoute("/{-$locale}/plan-my-trip")({
  head: ({ params }) => {
    const copy = copyFor("planMyTrip", localeFromParam(params.locale));
    return headFor(params.locale, {
      path: "/plan-my-trip",
      title: copy.title,
      description: copy.description,
    });
  },
  component: PlanMyTripPage,
});
