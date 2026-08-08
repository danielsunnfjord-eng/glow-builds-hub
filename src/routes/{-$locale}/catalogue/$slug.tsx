import { createFileRoute } from "@tanstack/react-router";
import ItineraryShopDetail from "@/pages/ItineraryShopDetail";
import { supabase } from "@/integrations/supabase/client";
import { SITE_URL } from "@/lib/locale";

type ItineraryMeta = {
  slug: string;
  title_en: string | null;
  title_pt: string | null;
  title_no: string | null;
  summary_en: string | null;
  summary_pt: string | null;
  summary_no: string | null;
  hero_image_url: string | null;
} | null;

// Server-rendered per-itinerary social metadata — the reason for this
// migration: crawlers (WhatsApp, Facebook, LinkedIn) read these tags from
// the HTML the server returns, no JavaScript required.
export const Route = createFileRoute("/{-$locale}/catalogue/$slug")({
  loader: async ({ params }): Promise<{ meta: ItineraryMeta }> => {
    try {
      const { data } = await supabase
        .from("catalog_itineraries")
        .select(
          "slug, title_en, title_pt, title_no, summary_en, summary_pt, summary_no, hero_image_url",
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
    const locale = params.locale; // undefined | "no" | "pt-br"
    const pick = (en: string | null, pt: string | null, no: string | null) =>
      (locale === "pt-br" ? pt : locale === "no" ? no : en) || en || "";

    const prefix = locale ? `/${locale}` : "";
    const url = `${SITE_URL}${prefix}/catalogue/${params.slug}`;

    if (!meta) {
      return { links: [{ rel: "canonical", href: url }] };
    }

    const title = `${pick(meta.title_en, meta.title_pt, meta.title_no)} | Fjord & Waves Travel`;
    const description = pick(meta.summary_en, meta.summary_pt, meta.summary_no).slice(0, 160);
    const image = meta.hero_image_url || "https://fjordwavestravel.com/og-image.png";

    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:image", content: image },
        { property: "og:url", content: url },
        { property: "og:type", content: "article" },
        { name: "twitter:card", content: "summary_large_image" },
        { name: "twitter:title", content: title },
        { name: "twitter:description", content: description },
        { name: "twitter:image", content: image },
      ],
      links: [{ rel: "canonical", href: url }],
    };
  },
  component: ItineraryShopDetail,
});
