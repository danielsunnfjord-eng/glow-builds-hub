import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { Search, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/voyage/Navbar";
import Footer from "@/components/voyage/Footer";
import ScrollReveal from "@/components/voyage/ScrollReveal";
import Seo from "@/components/Seo";

interface RouteCard {
  id: string;
  slug: string | null;
  title: string;
  summary: string;
  destination: string | null;
  duration_label: string | null;
  hero_image_url: string | null;
  price_eur: number;
  view_count: number;
  route: unknown;
}

const extractSequence = (route: unknown): string[] => {
  if (!route || typeof route !== "object") return [];
  const r = route as Record<string, unknown>;
  const candidates = [
    r.destination_sequence,
    r.sequence,
    r.destinations,
    r.stops,
    (r.itinerary as Record<string, unknown> | undefined)?.destination_sequence,
  ];
  for (const c of candidates) {
    if (Array.isArray(c)) {
      return c
        .map((s) => {
          if (typeof s === "string") return s;
          if (s && typeof s === "object") {
            const o = s as Record<string, unknown>;
            return (o.location ?? o.name ?? o.city ?? o.title ?? "") as string;
          }
          return "";
        })
        .filter(Boolean) as string[];
    }
  }
  return [];
};

const Routes = () => {
  const { t } = useTranslation();
  useEffect(() => {
    document.title = `All Routes · Fjord & Waves Travel`;
  }, []);

  const { data, isLoading } = useQuery({
    queryKey: ["public-routes"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("route_maker_itineraries")
        .select("id, slug, title, summary, destination, duration_label, hero_image_url, price_eur, view_count, route, sort_order, created_at")
        .eq("is_published", true)
        .order("sort_order", { ascending: true })
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as unknown as RouteCard[];
    },
  });

  const [search, setSearch] = useState("");
  const [destination, setDestination] = useState("");

  const destinations = useMemo(() => {
    const s = new Set<string>();
    (data ?? []).forEach((d) => d.destination && s.add(d.destination));
    return Array.from(s).sort((a, b) => a.localeCompare(b));
  }, [data]);

  const filtered = useMemo(() => {
    if (!data) return [];
    const q = search.trim().toLowerCase();
    return data.filter((d) => {
      if (destination && d.destination !== destination) return false;
      if (q) {
        const hay = [d.title, d.summary, d.destination, d.duration_label].filter(Boolean).join(" ").toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [data, search, destination]);

  const hasFilters = search !== "" || destination !== "";

  return (
    <div className="min-h-screen bg-voyage-white">
      <Seo
        title="All Routes — Fjord & Waves Travel"
        description="A handpicked collection of curated journeys across Norway and beyond. Book as they are, or adapt them with us to make them your own."
        path="/routes"
      />
      <Navbar />

      {/* Editorial hero */}
      <section className="relative h-[68vh] min-h-[420px] w-full overflow-hidden">
        <img
          src="https://images.unsplash.com/photo-1531366936337-7c912a4589a7?auto=format&fit=crop&w=2400&q=80"
          alt="Aerial view of fjord waters"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-ink/55 via-ink/25 to-transparent" />
        <div className="relative h-full max-w-[1200px] mx-auto px-16 max-md:px-6 flex flex-col justify-end pb-20 max-md:pb-12">
          <ScrollReveal>
            <div className="text-[0.65rem] font-semibold tracking-[0.22em] uppercase text-voyage-white/80 mb-4">
              Our Journeys
            </div>
          </ScrollReveal>
          <ScrollReveal>
            <h1 className="font-serif text-[clamp(2.4rem,5vw,4.5rem)] font-bold leading-[1.02] tracking-tight text-voyage-white max-w-3xl">
              All our routes
            </h1>
          </ScrollReveal>
          <ScrollReveal>
            <p className="mt-6 text-[1.05rem] leading-relaxed text-voyage-white/90 max-w-xl">
              Explore our handpicked collection of routes — easy to browse, easy to book, and easy to travel.
            </p>
          </ScrollReveal>
        </div>
      </section>

      <main className="px-16 max-md:px-6 py-20 max-md:py-12">
        {/* Editorial intro */}
        <ScrollReveal>
          <div className="max-w-[760px] mx-auto text-center mb-20">
            <p className="font-serif text-[1.25rem] md:text-[1.4rem] leading-[1.55] text-ink mb-6">
              They're not the only journeys we offer. We've been custom-building trips since 2016 — these routes are
              a curated starting point: proven journeys you can book as they are, or adapt with us to make them
              entirely your own.
            </p>
            <p className="text-[0.95rem] text-voyage-muted leading-relaxed italic">
              We are a small team of travel curators who live in Norway and know it deeply. This page features the
              routes we truly believe in. Simple, personal, and shaped by local insight.
            </p>
          </div>
        </ScrollReveal>

        {/* Filters */}
        {!isLoading && (data?.length ?? 0) > 0 && (
          <div className="max-w-[1200px] mx-auto mb-12 border border-ink/10 bg-parchment/40 rounded-lg p-5 md:p-6">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
              <div className="md:col-span-7">
                <label className="block text-[0.65rem] font-semibold tracking-[0.18em] uppercase text-voyage-muted mb-2">
                  Search
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-voyage-muted" />
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search routes…"
                    className="w-full pl-9 pr-3 py-2.5 text-[0.85rem] bg-voyage-white border border-ink/10 rounded-sm focus:outline-none focus:border-gold text-ink"
                  />
                </div>
              </div>
              <div className="md:col-span-3">
                <label className="block text-[0.65rem] font-semibold tracking-[0.18em] uppercase text-voyage-muted mb-2">
                  Destination
                </label>
                <select
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                  className="w-full px-3 py-2.5 text-[0.85rem] bg-voyage-white border border-ink/10 rounded-sm focus:outline-none focus:border-gold text-ink"
                >
                  <option value="">All destinations</option>
                  {destinations.map((d) => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>
              <div className="md:col-span-2 flex md:justify-end">
                {hasFilters && (
                  <button
                    onClick={() => { setSearch(""); setDestination(""); }}
                    className="inline-flex items-center gap-1.5 px-3 py-2.5 text-[0.72rem] font-medium tracking-[0.1em] uppercase text-ink hover:text-gold transition-colors"
                  >
                    <X className="w-3 h-3" />
                    Reset
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Grid */}
        <div className="max-w-[1200px] mx-auto">
          {isLoading && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[0,1,2,3,4,5].map((i) => (
                <div key={i} className="aspect-[4/5] bg-parchment-2 animate-pulse rounded-lg" />
              ))}
            </div>
          )}

          {!isLoading && (data?.length ?? 0) === 0 && (
            <div className="border border-ink/10 bg-parchment/40 rounded-lg p-16 text-center">
              <p className="text-[0.95rem] text-voyage-muted mb-6 max-w-md mx-auto">
                We're polishing the first routes right now. In the meantime, let us design one just for you.
              </p>
              <Link
                to="/plan-my-trip"
                className="inline-block px-8 py-3 rounded-sm bg-ink text-voyage-white text-[0.72rem] font-medium tracking-[0.12em] uppercase hover:bg-gold hover:text-ink transition-colors"
              >
                {t("nav.planMyTrip")}
              </Link>
            </div>
          )}

          {!isLoading && filtered.length === 0 && (data?.length ?? 0) > 0 && (
            <div className="border border-ink/10 bg-parchment/40 rounded-lg p-12 text-center">
              <p className="text-[0.9rem] text-voyage-muted">No routes match those filters.</p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filtered.map((r) => {
              const seq = extractSequence(r.route);
              const slug = r.slug ?? r.id;
              return (
                <ScrollReveal key={r.id}>
                  <Link
                    to={`/routes/${slug}`}
                    className="group block w-full rounded-lg overflow-hidden bg-voyage-white border border-ink/[0.06] shadow-sm hover:shadow-xl transition-all duration-300"
                  >
                    <div className="aspect-[4/5] overflow-hidden bg-parchment-2 relative">
                      {r.hero_image_url ? (
                        <img
                          src={r.hero_image_url}
                          alt={r.title}
                          loading="lazy"
                          className="w-full h-full object-cover group-hover:scale-[1.04] transition-transform duration-700"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-fjord/40 to-ocean/30" />
                      )}
                      {Number(r.price_eur) > 0 && (
                        <div className="absolute top-4 right-4 bg-voyage-white/95 backdrop-blur px-3 py-1.5 rounded-full text-[0.72rem] font-semibold text-ink tracking-wide">
                          €{Number(r.price_eur).toFixed(0)}
                        </div>
                      )}
                    </div>
                    <div className="p-6">
                      <div className="text-[0.65rem] tracking-[0.18em] uppercase text-gold mb-3">
                        {[r.destination, r.duration_label].filter(Boolean).join(" · ") || "Curated journey"}
                      </div>
                      <h3 className="font-serif text-[1.3rem] font-bold text-ink mb-3 group-hover:text-gold transition-colors leading-snug">
                        {r.title}
                      </h3>
                      {r.summary && (
                        <p className="text-[0.85rem] text-voyage-muted line-clamp-3 mb-4 leading-relaxed">
                          {r.summary}
                        </p>
                      )}
                      {seq.length > 0 && (
                        <div className="pt-4 border-t border-parchment-3 text-[0.78rem] text-ink-2 leading-relaxed">
                          {seq.slice(0, 6).join(" — ")}
                          {seq.length > 6 && " …"}
                        </div>
                      )}
                    </div>
                  </Link>
                </ScrollReveal>
              );
            })}
          </div>
        </div>

        {/* Bespoke CTA */}
        <ScrollReveal>
          <div className="max-w-[920px] mx-auto mt-24 border-t border-parchment-3 pt-16 text-center">
            <div className="text-[0.65rem] font-semibold tracking-[0.22em] uppercase text-gold mb-3">
              Tailor your trip
            </div>
            <h2 className="font-serif text-[clamp(1.6rem,3vw,2.4rem)] font-bold text-ink mb-4 leading-tight">
              Want something entirely your own?
            </h2>
            <p className="text-[0.95rem] text-voyage-muted max-w-xl mx-auto mb-8 leading-relaxed">
              Every route here can be adjusted, extended, or rebuilt from scratch. Tell us your dates, your pace,
              and what matters most — we'll design the rest.
            </p>
            <Link
              to="/plan-my-trip"
              className="inline-block px-8 py-3.5 rounded-sm bg-ink text-voyage-white text-[0.72rem] font-medium tracking-[0.12em] uppercase hover:bg-gold hover:text-ink transition-colors"
            >
              {t("nav.planMyTrip")}
            </Link>
          </div>
        </ScrollReveal>
      </main>

      <Footer />
    </div>
  );
};

export default Routes;
