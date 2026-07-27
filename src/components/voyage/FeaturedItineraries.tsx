import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { formatPrice, usePreferredCurrency } from "@/lib/pricing";
import ScrollReveal from "./ScrollReveal";

interface FeaturedItem {
  id: string;
  slug: string;
  title_en: string;
  title_pt: string | null;
  title_no: string | null;
  destination: string | null;
  duration: string | null;
  hero_image_url: string | null;
  price_eur: number;
  price_usd: number | null;
  price_brl: number | null;
  price_nok: number | null;
  created_at: string;
}

const pickLang = (lang: string, en: string, pt: string | null, no: string | null) =>
  (lang === "pt" && pt) || (lang === "no" && no) || en;

const parseDays = (s: string | null): number | null => {
  if (!s) return null;
  const m = s.match(/(\d+)/);
  return m ? parseInt(m[1], 10) : null;
};

const FeaturedItineraries = () => {
  const { t, i18n } = useTranslation();
  const lang = (i18n.language?.substring(0, 2) || "en") as "en" | "pt" | "no";
  const { enPref } = usePreferredCurrency();

  const { data, isLoading } = useQuery({
    queryKey: ["featured-itineraries", lang],
    queryFn: async () => {
      let query = supabase
        .from("catalog_itineraries")
        .select(
          "id, slug, title_en, title_pt, title_no, destination, duration, hero_image_url, price_eur, price_usd, price_brl, price_nok, created_at, primary_language",
        )
        .eq("is_published", true);
      if (lang === "pt") query = query.eq("primary_language", "pt");
      else if (lang === "en") query = query.eq("primary_language", "en");
      else if (lang === "no") query = query.in("primary_language", ["en", "no"]);
      const { data, error } = await query
        .order("sort_order", { ascending: true })
        .order("created_at", { ascending: false })
        .limit(3);
      if (error) throw error;
      return data as FeaturedItem[];
    },
  });


  if (!isLoading && (!data || data.length === 0)) return null;

  return (
    <section className="bg-parchment px-6 md:px-16 pb-24">
      <div className="max-w-[1200px] mx-auto">
        <ScrollReveal>
          <div className="flex items-end justify-between flex-wrap gap-4 mb-8">
            <div>
              <div className="text-[0.65rem] font-semibold tracking-[0.22em] uppercase text-gold mb-3">
                {t("home.featured.eyebrow")}
              </div>
              <h2 className="font-serif text-[clamp(1.6rem,3vw,2.4rem)] font-bold leading-[1.1] tracking-tight text-ink">
                {t("home.featured.title")}
              </h2>
            </div>
            <Link
              to="/catalogue"
              className="inline-flex items-center gap-2 px-5 py-3 border border-ink/20 rounded-sm text-[0.72rem] font-semibold tracking-[0.14em] uppercase text-ink hover:bg-ink hover:text-voyage-white transition-colors"
            >
              {t("home.featured.seeAll")} →
            </Link>
          </div>
        </ScrollReveal>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
          {(data ?? []).map((trip) => {
            const title = pickLang(lang, trip.title_en, trip.title_pt, trip.title_no);
            const days = parseDays(trip.duration);
            const durLabel = days
              ? `${days} ${t("catalogue.daysWord", "days")}`
              : trip.duration;
            return (
              <ScrollReveal key={trip.id} className="h-full">
                <Link
                  to={`/catalogue/${trip.slug}`}
                  className="group flex flex-col h-full rounded-lg overflow-hidden border border-ink/[0.08] bg-voyage-white shadow-sm hover:shadow-xl transition-all duration-300"
                >
                  <div className="relative aspect-[4/3] bg-parchment-2 overflow-hidden">
                    {trip.hero_image_url && (
                      <img
                        src={trip.hero_image_url}
                        alt={title}
                        loading="lazy"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                      />
                    )}
                  </div>
                  <div className="p-5 flex-1 flex flex-col">
                    <div className="flex items-center gap-2 mb-2 text-[0.62rem] font-semibold tracking-[0.18em] uppercase text-voyage-muted">
                      {trip.destination && <span className="text-gold">{trip.destination}</span>}
                      {trip.destination && durLabel && <span className="text-voyage-muted/40">·</span>}
                      {durLabel && <span>{durLabel}</span>}
                    </div>
                    <h3 className="font-serif text-[1.05rem] font-bold text-ink leading-tight line-clamp-2 mb-4 flex-1">
                      {title}
                    </h3>
                    <div className="flex items-center justify-between border-t border-parchment-3 pt-3 mt-auto">
                      <span className="font-serif text-[1.05rem] text-gold font-semibold">
                        {formatPrice(trip, lang, enPref)}
                      </span>
                      <span className="text-[0.7rem] tracking-[0.1em] uppercase text-voyage-muted">
                        {t("home.featured.instantPdf")}
                      </span>
                    </div>
                  </div>
                </Link>
              </ScrollReveal>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default FeaturedItineraries;
