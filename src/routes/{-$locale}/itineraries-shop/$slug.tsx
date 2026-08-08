import { createFileRoute } from "@tanstack/react-router";
import { Navigate, useParams } from "@/lib/router-compat";

// Legacy redirect from the previous /itineraries-shop/:slug URLs.
const LegacyShopRedirect = () => {
  const { slug } = useParams();
  return <Navigate to={`/catalogue/${slug ?? ""}`} replace />;
};

export const Route = createFileRoute("/{-$locale}/itineraries-shop/$slug")({
  component: LegacyShopRedirect,
});
