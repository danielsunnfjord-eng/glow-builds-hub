import { createFileRoute } from "@tanstack/react-router";
import DestinationNorway from "@/pages/DestinationNorway";
import { headFor, localeFromParam } from "@/lib/seoHead";
import { copyFor } from "@/lib/seoCopy";

export const Route = createFileRoute("/{-$locale}/destinations/norway")({
  head: ({ params }) => {
    const copy = copyFor("norway", localeFromParam(params.locale));
    return headFor(params.locale, {
      path: "/destinations/norway",
      title: copy.title,
      description: copy.description,
    });
  },
  component: DestinationNorway,
});
