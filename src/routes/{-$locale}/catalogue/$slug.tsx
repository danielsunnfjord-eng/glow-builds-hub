import { createFileRoute } from "@tanstack/react-router";
import ItineraryShopDetail from "@/pages/ItineraryShopDetail";
import { supabase } from "@/integrations/supabase/client";
import { SITE_URL, localePath } from "@/lib/locale";
import { headFor, localeFromParam } from "@/lib/seoHead";

type ItineraryMeta = {
  slug: string;
  title_en: string | null;
  title_pt: string | null;
  title_no: string | null;
  summary_en: string | null;
  summary_pt: string | null;
  summary_no: string | null;
  hero_image_url: string | null;
  destination: string | null;
  duration: string | null;
  price_nok: number | null;
} | null;

const BRAND: Record<string, string> = {
  en: "Fjord & Waves Travel",
  no: "Fjord & Waves Travel",
  pt: "Fjord & Waves Travel",
};

// Suffix written for how each market searches, appended to the itinerary title.
const TITLE_SUFFIX: Record<string, string> = {
  en: "Itinerary",
  no: "reiserute",
  pt: "Roteiro",
};

const FALLBACK_DESC: Record<string, (t: string) => string> = {
  en: (t) => `A day-by-day ${t} itinerary with hotels, timings and route notes, written by an IATA-accredited travel advisor. Instant PDF download.`,
  no: (t) => `Ferdig reiserute for ${t} dag for dag – hoteller, tidsbruk og lokale tips fra en erfaren reiserådgiver. Last ned som PDF med en gang.`,
  pt: (t) => `Roteiro dia a dia de ${t} com hospedagem, tempos de deslocamento e dicas locais de um consultor de viagem. Download imediato em PDF.`,
};

// Server-rendered per-itinerary metadata — crawlers (WhatsApp, Facebook,
// LinkedIn, Google) read these from the HTML the server returns.
export const Route = createFileRoute("/{-$locale}/catalogue/$slug")({
  loader: async ({ params }): Promise<{ meta: ItineraryMeta }> => {
    try {
      const { data } = await supabase
        .from("catalog_itineraries")
        .select(
          "slug, title_en, title_pt, title_no, summary_en, summary_pt, summary_no, hero_image_url, destination, duration, price_nok",
        )
        .eq("slug", params.slug)
        .eq("is_published", true)
        .maybeSingle();
      return { meta: (data as ItineraryMeta) ?? null };
    } catch {
      // Metadata is best-effort; the page itself fetches its own data.
      return { meta: null };
    }
  },
  head: ({ loaderData, params }) => {
    const meta = loaderData?.meta ?? null;
    const locale = localeFromParam(params.locale);
    const path = `/catalogue/${params.slug}`;
    const url = `${SITE_URL}${localePath(path, locale)}`;

    const pick = (en: string | null, pt: string | null, no: string | null) =>
      (locale === "pt" ? pt : locale === "no" ? no : en) || en || "";

    if (!meta) {
      return { links: [{ rel: "canonical", href: url }] };
    }

    const name = pick(meta.title_en, meta.title_pt, meta.title_no);
    const title = `${name} — ${TITLE_SUFFIX[locale]} | ${BRAND[locale]}`;
    const summary = pick(meta.summary_en, meta.summary_pt, meta.summary_no);
    const description = summary || FALLBACK_DESC[locale](meta.destination || name);
    const image = meta.hero_image_url || `${SITE_URL}/og-image.png`;
    const price = meta.price_nok ? Number(meta.price_nok).toFixed(2) : undefined;

    const offers = price
      ? {
          "@type": "Offer",
          price,
          priceCurrency: "NOK",
          availability: "https://schema.org/InStock",
          url,
        }
      : undefined;

    const product: Record<string, unknown> = {
      "@context": "https://schema.org",
      "@type": "Product",
      name,
      description,
      image,
      brand: { "@type": "Brand", name: "Fjord & Waves Travel" },
      category: "Travel itinerary",
      ...(offers ? { offers } : {}),
    };

    const trip: Record<string, unknown> = {
      "@context": "https://schema.org",
      "@type": "TouristTrip",
      name,
      description,
      image,
      url,
      ...(meta.destination
        ? { itinerary: { "@type": "Place", name: meta.destination } }
        : {}),
      ...(meta.duration ? { touristType: undefined, subjectOf: undefined } : {}),
      provider: {
        "@type": "TravelAgency",
        name: "Fjord & Waves Travel",
        url: SITE_URL,
      },
      ...(offers ? { offers } : {}),
    };

    const breadcrumbs = {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        {
          "@type": "ListItem",
          position: 1,
          name: locale === "pt" ? "Início" : locale === "no" ? "Hjem" : "Home",
          item: `${SITE_URL}${localePath("/", locale)}`,
        },
        {
          "@type": "ListItem",
          position: 2,
          name: locale === "pt" ? "Roteiros" : locale === "no" ? "Reiseruter" : "Itinerary Shop",
          item: `${SITE_URL}${localePath("/catalogue", locale)}`,
        },
        { "@type": "ListItem", position: 3, name, item: url },
      ],
    };

    return headFor(params.locale, {
      path,
      title,
      description,
      image,
      type: "product",
      jsonLd: [product, trip, breadcrumbs],
    });
  },
  component: ItineraryShopDetail,
});
