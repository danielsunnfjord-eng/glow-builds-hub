import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/voyage/Navbar";
import Footer from "@/components/voyage/Footer";
import ScrollReveal from "@/components/voyage/ScrollReveal";

interface CatalogItem {
  id: string;
  slug: string;
  title_en: string;
  title_pt: string | null;
  title_no: string | null;
  summary_en: string;
  summary_pt: string | null;
  summary_no: string | null;
  destination: string | null;
  duration: string | null;
  hero_image_url: string | null;
  price_eur: number;
  sort_order: number;
}

const pickLang = <T extends string | null>(
  lang: string,
  en: T,
  pt: T,
  no: T,
): T =>
  ((lang === "pt" && pt) || (lang === "no" && no) || en) as T;

const ItinerariesShop = () => {
  const { t, i18n } = useTranslation();
  const lang = i18n.language?.substring(0, 2) || "en";

  useEffect(() => {
    document.title = `${t("shop.title")} · Fjord & Waves Travel`;
  }, [t]);

  const { data, isLoading } = useQuery({
    queryKey: ["catalog-itineraries"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("catalog_itineraries")
        .select(
          "id, slug, title_en, title_pt, title_no, summary_en, summary_pt, summary_no, destination, duration, hero_image_url, price_eur, sort_order",
        )
        .eq("is_published", true)
        .order("sort_order", { ascending: true })
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as CatalogItem[];
    },
  });

  return (
    <div className="min-h-screen bg-parchment">
      <Navbar />
      <main className="pt-32 pb-20 px-16 max-md:px-6 max-md:pt-24">
        <ScrollReveal>
          <div className="text-[0.65rem] font-semibold tracking-[0.22em] uppercase text-gold mb-3">
            {t("shop.badge")}
          </div>
        </ScrollReveal>
        <ScrollReveal>
          <h1 className="font-serif text-[clamp(2rem,4vw,3.5rem)] font-bold leading-[1.05] tracking-tight mb-4 text-ink max-w-3xl">
            {t("shop.title")}
          </h1>
        </ScrollReveal>
        <ScrollReveal>
          <p className="text-[0.95rem] text-voyage-muted max-w-[560px] leading-relaxed mb-12">
            {t("shop.subtitle")}
          </p>
        </ScrollReveal>

        {isLoading && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="aspect-[4/5] bg-parchment-2 animate-pulse rounded-lg"
              />
            ))}
          </div>
        )}

        {!isLoading && (data?.length ?? 0) === 0 && (
          <div className="border border-ink/10 bg-voyage-white rounded-lg p-12 text-center">
            <p className="text-[0.9rem] text-voyage-muted mb-4">
              {t("shop.empty")}
            </p>
            <Link
              to="/plan-my-trip"
              className="inline-block px-6 py-3 rounded-sm bg-ink text-voyage-white text-[0.72rem] font-medium tracking-[0.12em] uppercase hover:bg-gold hover:text-ink transition-colors"
            >
              {t("nav.planMyTrip")}
            </Link>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {data?.map((trip) => {
            const title = pickLang(lang, trip.title_en, trip.title_pt, trip.title_no) || trip.title_en;
            const summary = pickLang(lang, trip.summary_en, trip.summary_pt, trip.summary_no) || trip.summary_en;
            return (
              <ScrollReveal key={trip.id}>
                <Link
                  to={`/itineraries-shop/${trip.slug}`}
                  className="group block w-full rounded-lg overflow-hidden border border-ink/[0.06] bg-voyage-white shadow-sm hover:shadow-lg transition-shadow text-left"
                >
                  <div className="aspect-[4/5] overflow-hidden bg-parchment-2">
                    {trip.hero_image_url && (
                      <img
                        src={trip.hero_image_url}
                        alt={title}
                        loading="lazy"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    )}
                  </div>
                  <div className="p-6">
                    <div className="text-[0.65rem] tracking-[0.18em] uppercase text-gold mb-2">
                      {[trip.destination, trip.duration].filter(Boolean).join(" · ")}
                    </div>
                    <h3 className="font-serif text-[1.15rem] font-bold text-ink mb-2 group-hover:text-gold transition-colors leading-snug">
                      {title}
                    </h3>
                    {summary && (
                      <p className="text-[0.82rem] text-voyage-muted line-clamp-3 mb-4">
                        {summary}
                      </p>
                    )}
                    <div className="flex items-baseline justify-between border-t border-parchment-3 pt-4">
                      <span className="text-[0.72rem] uppercase tracking-[0.1em] text-voyage-muted">
                        {t("shop.from")}
                      </span>
                      <span className="font-serif text-[1.4rem] font-bold text-ink">
                        €{Number(trip.price_eur).toFixed(0)}
                      </span>
                    </div>
                  </div>
                </Link>
              </ScrollReveal>
            );
          })}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default ItinerariesShop;
