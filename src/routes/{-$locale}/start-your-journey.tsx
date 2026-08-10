import { createFileRoute } from "@tanstack/react-router";
import StartYourJourney from "@/pages/StartYourJourney";
import { headFor, localeFromParam } from "@/lib/seoHead";
import { copyFor } from "@/lib/seoCopy";

export const Route = createFileRoute("/{-$locale}/start-your-journey")({
  head: ({ params }) => {
    const copy = copyFor("startYourJourney", localeFromParam(params.locale));
    return headFor(params.locale, {
      path: "/start-your-journey",
      title: copy.title,
      description: copy.description,
    });
  },
  component: StartYourJourney,
});
