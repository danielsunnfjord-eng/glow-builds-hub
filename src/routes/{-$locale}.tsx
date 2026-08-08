import { Outlet, createFileRoute, notFound } from "@tanstack/react-router";

// Optional locale prefix: "/" (EN), "/no/..." (Norwegian), "/pt-br/..." (pt-BR).
// Any other first segment that reaches this param is not a locale — 404 it so
// arbitrary prefixes don't render the English site at a duplicate URL.
const VALID_LOCALE_SEGMENTS = new Set(["no", "pt-br"]);

export const Route = createFileRoute("/{-$locale}")({
  beforeLoad: ({ params }) => {
    if (params.locale !== undefined && !VALID_LOCALE_SEGMENTS.has(params.locale)) {
      throw notFound();
    }
  },
  component: Outlet,
});
