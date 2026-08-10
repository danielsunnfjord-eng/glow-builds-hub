import { createFileRoute } from "@tanstack/react-router";
import About from "@/pages/About";
import { headFor, localeFromParam } from "@/lib/seoHead";
import { copyFor } from "@/lib/seoCopy";

export const Route = createFileRoute("/{-$locale}/about")({
  head: ({ params }) => {
    const copy = copyFor("about", localeFromParam(params.locale));
    return headFor(params.locale, {
      path: "/about",
      title: copy.title,
      description: copy.description,
    });
  },
  component: About,
});
