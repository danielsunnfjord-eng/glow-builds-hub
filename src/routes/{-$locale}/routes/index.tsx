import { createFileRoute } from "@tanstack/react-router";
import RoutesPage from "@/pages/Routes";
import { headFor, localeFromParam } from "@/lib/seoHead";
import { copyFor } from "@/lib/seoCopy";

export const Route = createFileRoute("/{-$locale}/routes/")({
  head: ({ params }) => {
    const copy = copyFor("routes", localeFromParam(params.locale));
    return headFor(params.locale, {
      path: "/routes",
      title: copy.title,
      description: copy.description,
    });
  },
  component: RoutesPage,
});
