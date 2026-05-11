import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { Search, X, Eye, Download } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/voyage/Navbar";
import Footer from "@/components/voyage/Footer";
import ScrollReveal from "@/components/voyage/ScrollReveal";
import { Slider } from "@/components/ui/slider";

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
  view_count: number;
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
          "id, slug, title_en, title_pt, title_no, summary_en, summary_pt, summary_no, destination, duration, hero_image_url, price_eur, sort_order, view_count",
        )
        .eq("is_published", true)
        .order("sort_order", { ascending: true })
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as CatalogItem[];
    },
  });

  const { data: salesMap = {} } = useQuery({
    queryKey: ["catalog-sales-counts"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_catalog_sales_counts");
      if (error) throw error;
      const map: Record<string, number> = {};
      (data ?? []).forEach((r: any) => {
        map[r.itinerary_id] = Number(r.sales_count) || 0;
      });
      return map;
    },
  });

  // Filter state
  const [search, setSearch] = useState("");
  const [destination, setDestination] = useState("");
  const [filterLang, setFilterLang] = useState("");
  const [priceRange, setPriceRange] = useState<[number, number] | null>(null);

  const { destinations, priceBounds } = useMemo(() => {
    const dests = new Set<string>();
    let min = Infinity;
    let max = 0;
    (data ?? []).forEach((d) => {
      if (d.destination) dests.add(d.destination);
      const p = Number(d.price_eur) || 0;
      if (p < min) min = p;
      if (p > max) max = p;
    });
    if (!isFinite(min)) min = 0;
    if (max < min) max = min;
    return {
      destinations: Array.from(dests).sort((a, b) => a.localeCompare(b)),
      priceBounds: [Math.floor(min), Math.ceil(max)] as [number, number],
    };
  }, [data]);

  // Initialize price range when bounds change
  useEffect(() => {
    if (data && priceRange === null) {
      setPriceRange(priceBounds);
    }
  }, [data, priceBounds, priceRange]);

  const effectiveRange = priceRange ?? priceBounds;

  const filtered = useMemo(() => {
    if (!data) return [];
    const q = search.trim().toLowerCase();
    return data.filter((d) => {
      if (destination && d.destination !== destination) return false;
      if (filterLang === "pt" && !d.title_pt) return false;
      if (filterLang === "no" && !d.title_no) return false;
      if (filterLang === "en" && !d.title_en) return false;
      const price = Number(d.price_eur) || 0;
      if (price < effectiveRange[0] || price > effectiveRange[1]) return false;
      if (q) {
        const hay = [
          d.title_en, d.title_pt, d.title_no,
          d.summary_en, d.summary_pt, d.summary_no,
          d.destination, d.duration,
        ].filter(Boolean).join(" ").toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [data, search, destination, filterLang, effectiveRange]);

  const hasActiveFilters =
    search !== "" ||
    destination !== "" ||
    filterLang !== "" ||
    (priceRange !== null &&
      (priceRange[0] !== priceBounds[0] || priceRange[1] !== priceBounds[1]));

  const resetFilters = () => {
    setSearch("");
    setDestination("");
    setFilterLang("");
    setPriceRange(priceBounds);
  };

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
          <p className="text-[0.95rem] text-voyage-muted max-w-[560px] leading-relaxed mb-10">
            {t("shop.subtitle")}
          </p>
        </ScrollReveal>

        {!isLoading && (data?.length ?? 0) > 0 && (
          <div className="mb-10 border border-ink/10 bg-voyage-white rounded-lg p-5 md:p-6">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
              {/* Search */}
              <div className="md:col-span-4">
                <label className="block text-[0.65rem] font-semibold tracking-[0.18em] uppercase text-voyage-muted mb-2">
                  {t("shop.filters.search").replace("…", "")}
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-voyage-muted" />
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder={t("shop.filters.search")}
                    className="w-full pl-9 pr-3 py-2.5 text-[0.85rem] bg-parchment border border-ink/10 rounded-sm focus:outline-none focus:border-gold text-ink"
                  />
                </div>
              </div>

              {/* Destination */}
              <div className="md:col-span-3">
                <label className="block text-[0.65rem] font-semibold tracking-[0.18em] uppercase text-voyage-muted mb-2">
                  {t("shop.filters.destination")}
                </label>
                <select
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                  className="w-full px-3 py-2.5 text-[0.85rem] bg-parchment border border-ink/10 rounded-sm focus:outline-none focus:border-gold text-ink"
                >
                  <option value="">{t("shop.filters.allDestinations")}</option>
                  {destinations.map((d) => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>

              {/* Language */}
              <div className="md:col-span-2">
                <label className="block text-[0.65rem] font-semibold tracking-[0.18em] uppercase text-voyage-muted mb-2">
                  {t("shop.filters.language")}
                </label>
                <select
                  value={filterLang}
                  onChange={(e) => setFilterLang(e.target.value)}
                  className="w-full px-3 py-2.5 text-[0.85rem] bg-parchment border border-ink/10 rounded-sm focus:outline-none focus:border-gold text-ink"
                >
                  <option value="">{t("shop.filters.anyLanguage")}</option>
                  <option value="en">English</option>
                  <option value="pt">Português</option>
                  <option value="no">Norsk</option>
                </select>
              </div>

              {/* Price */}
              <div className="md:col-span-3">
                <label className="block text-[0.65rem] font-semibold tracking-[0.18em] uppercase text-voyage-muted mb-2">
                  {t("shop.filters.priceRange")}: €{effectiveRange[0]} – €{effectiveRange[1]}
                </label>
                <Slider
                  min={priceBounds[0]}
                  max={priceBounds[1]}
                  step={1}
                  value={effectiveRange}
                  onValueChange={(v) => setPriceRange([v[0], v[1]] as [number, number])}
                  className="py-2"
                />
              </div>
            </div>

            <div className="flex items-center justify-between mt-4 pt-4 border-t border-parchment-3">
              <span className="text-[0.75rem] text-voyage-muted">
                {t("shop.filters.resultsCount", { count: filtered.length })}
              </span>
              {hasActiveFilters && (
                <button
                  onClick={resetFilters}
                  className="inline-flex items-center gap-1.5 text-[0.72rem] font-medium tracking-[0.1em] uppercase text-ink hover:text-gold transition-colors"
                >
                  <X className="w-3 h-3" />
                  {t("shop.filters.reset")}
                </button>
              )}
            </div>
          </div>
        )}

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

        {!isLoading && (data?.length ?? 0) > 0 && filtered.length === 0 && (
          <div className="border border-ink/10 bg-voyage-white rounded-lg p-12 text-center">
            <p className="text-[0.9rem] text-voyage-muted mb-4">
              {t("shop.filters.noMatches")}
            </p>
            <button
              onClick={resetFilters}
              className="inline-block px-6 py-3 rounded-sm bg-ink text-voyage-white text-[0.72rem] font-medium tracking-[0.12em] uppercase hover:bg-gold hover:text-ink transition-colors"
            >
              {t("shop.filters.reset")}
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {filtered.map((trip) => {
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
                    <div className="flex items-center gap-4 text-[0.7rem] text-voyage-muted mb-4">
                      <span className="inline-flex items-center gap-1">
                        <Eye className="w-3.5 h-3.5" />
                        {trip.view_count ?? 0}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <Download className="w-3.5 h-3.5" />
                        {salesMap[trip.id] ?? 0}
                      </span>
                    </div>
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
