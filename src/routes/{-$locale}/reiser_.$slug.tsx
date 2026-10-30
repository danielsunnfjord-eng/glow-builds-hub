import { createFileRoute, notFound } from "@tanstack/react-router";
import ThemeTripPage from "@/components/voyage/ThemeTripPage";
import { themeTripBySlug } from "@/lib/themeTrips";
import { themeTripHead } from "@/lib/themeTripsHead";

export const Route = createFileRoute("/{-$locale}/reiser_/$slug")({
  beforeLoad: ({ params }) => {
    if (!themeTripBySlug(params.slug)) throw notFound();
  },
  head: ({ params }) => themeTripHead(params.locale, params.slug),
  component: function TripRoute() {
    const { slug } = Route.useParams();
    const trip = themeTripBySlug(slug);
    if (!trip) return null;
    return <ThemeTripPage trip={trip} />;
  },
});
