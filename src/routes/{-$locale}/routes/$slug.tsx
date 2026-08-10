import { createFileRoute } from "@tanstack/react-router";
import RouteDetail from "@/pages/RouteDetail";
import { supabase } from "@/integrations/supabase/client";
import { SITE_URL, localePath } from "@/lib/locale";
import { headFor, localeFromParam } from "@/lib/seoHead";

type RouteMeta = {
  slug: string;
  title: string | null;
  summary: string | null;
  destination: string | null;
  hero_image_url: string | null;
} | null;

export const Route = createFileRoute("/{-$locale}/routes/$slug")({
  loader: async ({ params }): Promise<{ meta: RouteMeta }> => {
    try {
      const { data } = await supabase
        .from("route_maker_itineraries")
        .select("slug, title, summary, destination, hero_image_url")
        .eq("slug", params.slug)
        .maybeSingle();
      return { meta: (data as RouteMeta) ?? null };
    } catch {
      return { meta: null };
    }
  },
  head: ({ loaderData, params }) => {
    const meta = loaderData?.meta ?? null;
    const locale = localeFromParam(params.locale);
    const path = `/routes/${params.slug}`;
    const url = `${SITE_URL}${localePath(path, locale)}`;
    if (!meta?.title) return { links: [{ rel: "canonical", href: url }] };

    const fallback: Record<string, string> = {
      en: `A day-by-day route through ${meta.destination || "the Nordics"}, planned by an IATA-accredited travel advisor.`,
      no: `Reiserute dag for dag gjennom ${meta.destination || "reisemålet"}, satt sammen av en erfaren reiserådgiver.`,
      pt: `Roteiro dia a dia por ${meta.destination || "a região"}, montado por um consultor de viagem credenciado.`,
    };

    return headFor(params.locale, {
      path,
      title: `${meta.title} — Fjord & Waves Travel`,
      description: meta.summary || fallback[locale],
      image: meta.hero_image_url || undefined,
      type: "article",
      jsonLd: {
        "@context": "https://schema.org",
        "@type": "TouristTrip",
        name: meta.title,
        description: meta.summary || fallback[locale],
        url,
        ...(meta.hero_image_url ? { image: meta.hero_image_url } : {}),
        ...(meta.destination
          ? { itinerary: { "@type": "Place", name: meta.destination } }
          : {}),
        provider: { "@type": "TravelAgency", name: "Fjord & Waves Travel", url: SITE_URL },
      },
    });
  },
  component: RouteDetail,
});
