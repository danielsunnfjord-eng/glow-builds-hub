import { useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { Link, useParams } from "react-router-dom";
import { ChevronRight, MapPin, Calendar, Compass } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/voyage/Navbar";
import Footer from "@/components/voyage/Footer";
import ScrollReveal from "@/components/voyage/ScrollReveal";
import Seo from "@/components/Seo";

interface RouteRow {
  id: string;
  slug: string;
  title: string;
  summary: string;
  destination: string | null;
  duration_label: string | null;
  hero_image_url: string | null;
  gallery_images: string[];
  price_eur: number;
  route: unknown;
  days: unknown;
  experiences: unknown;
  accommodations: unknown;
  logistics: unknown;
  packing: unknown;
  sales_copy: unknown;
  pdf_intro: string | null;
  upsell: string | null;
}

const extractSequence = (route: unknown): string[] => {
  if (!route || typeof route !== "object") return [];
  const r = route as Record<string, unknown>;
  const candidates = [r.destination_sequence, r.sequence, r.destinations, r.stops];
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

const asArray = <T,>(v: unknown): T[] => (Array.isArray(v) ? (v as T[]) : []);
const asObj = (v: unknown): Record<string, unknown> | null =>
  v && typeof v === "object" && !Array.isArray(v) ? (v as Record<string, unknown>) : null;

const extractDays = (days: unknown) => {
  const o = asObj(days);
  if (o && Array.isArray(o.days)) return o.days as Record<string, unknown>[];
  if (Array.isArray(days)) return days as Record<string, unknown>[];
  return [];
};

const extractHighlights = (sales: unknown): string[] => {
  const o = asObj(sales);
  if (!o) return [];
  const h = o.highlights ?? o.highlights_section;
  if (Array.isArray(h)) return h.map((x) => (typeof x === "string" ? x : (asObj(x)?.title ?? asObj(x)?.text ?? "") as string)).filter(Boolean);
  return [];
};

const RouteDetail = () => {
  const { slug } = useParams();
  const { t } = useTranslation();

  const { data, isLoading } = useQuery({
    queryKey: ["public-route", slug],
    enabled: !!slug,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("route_maker_itineraries")
        .select("id, slug, title, summary, destination, duration_label, hero_image_url, gallery_images, price_eur, route, days, experiences, accommodations, logistics, packing, sales_copy, pdf_intro, upsell")
        .eq("slug", slug!)
        .eq("is_published", true)
        .maybeSingle();
      if (error) throw error;
      return data as unknown as RouteRow | null;
    },
  });

  useEffect(() => {
    if (data?.title) document.title = `${data.title} · Fjord & Waves Travel`;
    if (data?.slug) supabase.rpc("increment_route_maker_view", { _slug: data.slug });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data?.id]);

  const sequence = useMemo(() => extractSequence(data?.route), [data?.route]);
  const days = useMemo(() => extractDays(data?.days), [data?.days]);
  const highlights = useMemo(() => extractHighlights(data?.sales_copy), [data?.sales_copy]);

  const jsonLd = useMemo(() => {
    if (!data) return undefined;
    const base = "https://fjordwavestravel.com";
    const url = `${base}/routes/${data.slug}`;
    const trip: Record<string, unknown> = {
      "@context": "https://schema.org",
      "@type": "TouristTrip",
      name: data.title,
      description: data.summary || "A curated journey from Fjord & Waves Travel.",
      url,
      provider: {
        "@type": "TravelAgency",
        name: "Fjord & Waves Travel",
        url: base,
      },
    };
    if (data.hero_image_url) trip.image = data.hero_image_url;
    if (data.destination) trip.touristType = "Independent travellers";
    if (sequence.length > 0) {
      trip.itinerary = {
        "@type": "ItemList",
        numberOfItems: sequence.length,
        itemListElement: sequence.map((s, i) => ({
          "@type": "ListItem",
          position: i + 1,
          item: { "@type": "TouristDestination", name: s },
        })),
      };
    } else if (days.length > 0) {
      trip.itinerary = {
        "@type": "ItemList",
        numberOfItems: days.length,
        itemListElement: days.map((d, i) => ({
          "@type": "ListItem",
          position: i + 1,
          name: (d.title ?? d.day_title ?? `Day ${i + 1}`) as string,
          description: (d.summary ?? d.experience_summary ?? d.description ?? "") as string,
        })),
      };
    }
    if (typeof data.price_eur === "number" && data.price_eur > 0) {
      trip.offers = {
        "@type": "Offer",
        price: data.price_eur,
        priceCurrency: "EUR",
        url,
        availability: "https://schema.org/InStock",
      };
    }
    const breadcrumbs = {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: `${base}/` },
        { "@type": "ListItem", position: 2, name: "Routes", item: `${base}/routes` },
        { "@type": "ListItem", position: 3, name: data.title, item: url },
      ],
    };
    return [trip, breadcrumbs];
  }, [data, sequence, days]);

  const salesObj = asObj(data?.sales_copy);
  const heroSubhead = (salesObj?.subheadline ?? salesObj?.subheading ?? "") as string;
  const longDesc = (salesObj?.long_description ?? salesObj?.description ?? "") as string;
  const idealFor = (salesObj?.who_this_trip_is_ideal_for ?? salesObj?.ideal_for ?? "") as string;

  const experiences = asArray<Record<string, unknown>>(asObj(data?.experiences)?.recommendations ?? data?.experiences);
  const accommodations = asArray<Record<string, unknown>>(asObj(data?.accommodations)?.recommendations ?? data?.accommodations);
  const logistics = asObj(data?.logistics);
  const packing = asObj(data?.packing);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-voyage-white">
        <Navbar />
        <div className="pt-32 px-16 max-md:px-6">
          <div className="max-w-[1200px] mx-auto">
            <div className="h-[60vh] bg-parchment-2 animate-pulse rounded-lg" />
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-voyage-white">
        <Navbar />
        <div className="pt-40 pb-20 px-16 max-md:px-6 text-center">
          <h1 className="font-serif text-3xl text-ink mb-4">Route not found</h1>
          <Link to="/routes" className="text-gold underline">Back to all routes</Link>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-voyage-white">
      <Seo
        title={`${data.title} — Fjord & Waves Travel`}
        description={data.summary || "A curated journey from Fjord & Waves Travel."}
        path={`/routes/${data.slug}`}
        image={data.hero_image_url ?? undefined}
        jsonLd={jsonLd}
      />
      <Navbar />

      {/* Hero */}
      <section className="relative h-[88vh] min-h-[560px] w-full overflow-hidden">
        {data.hero_image_url ? (
          <img src={data.hero_image_url} alt={data.title} className="absolute inset-0 w-full h-full object-cover" />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-fjord to-ocean" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-ink/85 via-ink/30 to-ink/20" />

        <div className="relative h-full max-w-[1200px] mx-auto px-16 max-md:px-6 flex flex-col justify-end pb-20 max-md:pb-12">
          <div className="text-[0.65rem] font-semibold tracking-[0.22em] uppercase text-voyage-white/80 mb-4">
            {[data.destination, data.duration_label].filter(Boolean).join(" · ") || "Curated route"}
          </div>
          <h1 className="font-serif text-[clamp(2.2rem,5.5vw,4.5rem)] font-bold leading-[1.02] tracking-tight text-voyage-white max-w-4xl">
            {data.title}
          </h1>
          {heroSubhead && (
            <p className="mt-5 text-[1.1rem] md:text-[1.25rem] leading-relaxed text-voyage-white/90 max-w-2xl font-light">
              {heroSubhead}
            </p>
          )}
          {sequence.length > 0 && (
            <div className="mt-8 flex flex-wrap items-center gap-x-2 gap-y-2 max-w-3xl">
              {sequence.map((s, i) => (
                <div key={i} className="flex items-center gap-2">
                  <span className="px-3 py-1 rounded-full bg-voyage-white/15 backdrop-blur border border-voyage-white/20 text-voyage-white text-[0.78rem]">
                    {s}
                  </span>
                  {i < sequence.length - 1 && <ChevronRight className="w-3.5 h-3.5 text-voyage-white/50" />}
                </div>
              ))}
            </div>
          )}
          <div className="mt-10 flex flex-wrap items-center gap-4">
            <Link
              to={`/plan-my-trip?destination=${encodeURIComponent(data.destination ?? data.title)}`}
              className="px-8 py-3.5 rounded-sm bg-gold text-ink text-[0.72rem] font-semibold tracking-[0.12em] uppercase hover:bg-voyage-white transition-colors"
            >
              Plan this trip
            </Link>
            {Number(data.price_eur) > 0 && (
              <div className="text-voyage-white/90 text-[0.85rem]">
                Or buy the full guide · <span className="font-serif text-[1.2rem] font-bold">€{Number(data.price_eur).toFixed(0)}</span>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Breadcrumbs */}
      <div className="bg-parchment/60 border-b border-parchment-3">
        <div className="max-w-[1200px] mx-auto px-16 max-md:px-6 py-4 text-[0.72rem] tracking-[0.1em] uppercase text-voyage-muted">
          <Link to="/" className="hover:text-ink">Home</Link>
          <span className="mx-2">/</span>
          <Link to="/routes" className="hover:text-ink">All routes</Link>
          <span className="mx-2">/</span>
          <span className="text-ink">{data.title}</span>
        </div>
      </div>

      <main className="max-w-[1200px] mx-auto px-16 max-md:px-6 py-20 max-md:py-12">
        <div className="grid grid-cols-12 gap-12 max-md:gap-8">
          {/* Editorial body */}
          <article className="col-span-12 lg:col-span-8 space-y-16">
            {/* Intro */}
            <ScrollReveal>
              <section>
                {data.pdf_intro ? (
                  <div className="font-serif text-[1.25rem] md:text-[1.4rem] leading-[1.55] text-ink whitespace-pre-line">
                    {data.pdf_intro}
                  </div>
                ) : data.summary ? (
                  <p className="font-serif text-[1.25rem] md:text-[1.4rem] leading-[1.55] text-ink">
                    {data.summary}
                  </p>
                ) : null}
                {longDesc && (
                  <div className="mt-8 prose prose-ink max-w-none text-[1rem] leading-[1.8] text-ink-2 whitespace-pre-line">
                    {longDesc}
                  </div>
                )}
              </section>
            </ScrollReveal>

            {/* Highlights */}
            {highlights.length > 0 && (
              <ScrollReveal>
                <section className="border-t border-parchment-3 pt-12">
                  <h2 className="font-serif text-[2rem] font-bold text-ink mb-8">Highlights</h2>
                  <ul className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                    {highlights.map((h, i) => (
                      <li key={i} className="flex gap-3 text-[0.95rem] text-ink-2 leading-relaxed">
                        <span className="text-gold mt-1.5">◆</span>
                        <span>{h}</span>
                      </li>
                    ))}
                  </ul>
                </section>
              </ScrollReveal>
            )}

            {/* Day by day */}
            {days.length > 0 && (
              <ScrollReveal>
                <section className="border-t border-parchment-3 pt-12">
                  <h2 className="font-serif text-[2rem] font-bold text-ink mb-2">Day by day</h2>
                  <p className="text-[0.9rem] text-voyage-muted mb-10">A sample pace — every detail can be tailored.</p>
                  <div className="space-y-10">
                    {days.map((d, idx) => {
                      const title = (d.title ?? d.day_title ?? `Day ${idx + 1}`) as string;
                      const location = (d.location ?? d.place ?? "") as string;
                      const summary = (d.summary ?? d.experience_summary ?? d.description ?? "") as string;
                      const activities = asArray<unknown>(d.activities ?? d.recommended_activities);
                      const transport = (d.transport ?? d.transport_notes ?? "") as string;
                      const meals = (d.meals ?? d.meal_suggestions ?? "") as string;
                      return (
                        <div key={idx} className="relative pl-8 border-l-2 border-gold/40">
                          <div className="absolute -left-[7px] top-1 w-3 h-3 rounded-full bg-gold" />
                          <div className="text-[0.65rem] font-semibold tracking-[0.2em] uppercase text-gold mb-2">
                            Day {idx + 1}
                            {location && <span className="text-voyage-muted ml-2">· {location}</span>}
                          </div>
                          <h3 className="font-serif text-[1.4rem] font-bold text-ink mb-3 leading-snug">{title}</h3>
                          {summary && <p className="text-[0.95rem] text-ink-2 leading-relaxed mb-4 whitespace-pre-line">{summary}</p>}
                          {activities.length > 0 && (
                            <ul className="space-y-1.5 mb-4">
                              {activities.map((a, i) => {
                                const text = typeof a === "string" ? a : ((a as Record<string, unknown>)?.title ?? (a as Record<string, unknown>)?.name ?? "") as string;
                                return (
                                  <li key={i} className="flex gap-2 text-[0.88rem] text-ink-2">
                                    <span className="text-gold mt-1">·</span>
                                    <span>{text}</span>
                                  </li>
                                );
                              })}
                            </ul>
                          )}
                          {(transport || meals) && (
                            <div className="mt-3 text-[0.78rem] text-voyage-muted space-y-1">
                              {transport && <div><span className="font-semibold text-ink-2 uppercase tracking-wider mr-2">Transport</span>{transport}</div>}
                              {meals && <div><span className="font-semibold text-ink-2 uppercase tracking-wider mr-2">Meals</span>{meals}</div>}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </section>
              </ScrollReveal>
            )}

            {/* Experiences */}
            {experiences.length > 0 && (
              <ScrollReveal>
                <section className="border-t border-parchment-3 pt-12">
                  <h2 className="font-serif text-[2rem] font-bold text-ink mb-8">Curated experiences</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {experiences.map((e, i) => (
                      <div key={i} className="border border-parchment-3 rounded-md p-5 bg-parchment/30">
                        <div className="text-[0.65rem] uppercase tracking-[0.16em] text-gold mb-1.5">{(e.category ?? "") as string}</div>
                        <h4 className="font-serif text-[1.1rem] font-bold text-ink mb-2">{(e.title ?? e.experience_title ?? "") as string}</h4>
                        <p className="text-[0.85rem] text-ink-2 leading-relaxed">{(e.why_it_fits ?? e.description ?? "") as string}</p>
                      </div>
                    ))}
                  </div>
                </section>
              </ScrollReveal>
            )}

            {/* Accommodations */}
            {accommodations.length > 0 && (
              <ScrollReveal>
                <section className="border-t border-parchment-3 pt-12">
                  <h2 className="font-serif text-[2rem] font-bold text-ink mb-8">Where you'll stay</h2>
                  <div className="space-y-4">
                    {accommodations.map((a, i) => (
                      <div key={i} className="border-l-2 border-fjord/50 pl-5">
                        <div className="text-[0.7rem] uppercase tracking-[0.14em] text-voyage-muted mb-1">{(a.accommodation_type ?? a.type ?? "") as string}</div>
                        <h4 className="font-serif text-[1.15rem] font-bold text-ink mb-1">{(a.accommodation_name ?? a.name ?? "") as string}</h4>
                        <p className="text-[0.88rem] text-ink-2 leading-relaxed">{(a.why_it_fits ?? a.description ?? "") as string}</p>
                      </div>
                    ))}
                  </div>
                </section>
              </ScrollReveal>
            )}

            {/* Packing */}
            {packing && (
              <ScrollReveal>
                <section className="border-t border-parchment-3 pt-12">
                  <h2 className="font-serif text-[2rem] font-bold text-ink mb-8">What to pack</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {Object.entries(packing).map(([cat, items]) => {
                      const arr = Array.isArray(items) ? items : [];
                      if (arr.length === 0) return null;
                      return (
                        <div key={cat}>
                          <h4 className="text-[0.75rem] uppercase tracking-[0.16em] text-gold font-semibold mb-3">
                            {cat.replace(/_/g, " ")}
                          </h4>
                          <ul className="space-y-1.5">
                            {arr.map((it, i) => (
                              <li key={i} className="text-[0.88rem] text-ink-2">· {typeof it === "string" ? it : JSON.stringify(it)}</li>
                            ))}
                          </ul>
                        </div>
                      );
                    })}
                  </div>
                </section>
              </ScrollReveal>
            )}

            {/* Upsell / personalization call */}
            {data.upsell && (
              <ScrollReveal>
                <section className="border-t border-parchment-3 pt-12">
                  <div className="bg-gradient-to-br from-fjord/10 to-ocean/10 border border-fjord/20 rounded-lg p-8 md:p-10">
                    <div className="text-[0.65rem] font-semibold tracking-[0.22em] uppercase text-gold mb-3">
                      Personalize with Daniel
                    </div>
                    <div className="font-serif text-[1.15rem] md:text-[1.3rem] leading-[1.55] text-ink whitespace-pre-line mb-6">
                      {data.upsell}
                    </div>
                    <Link
                      to="/plan-my-trip"
                      className="inline-block px-7 py-3 rounded-sm bg-ink text-voyage-white text-[0.72rem] font-medium tracking-[0.12em] uppercase hover:bg-gold hover:text-ink transition-colors"
                    >
                      Book a consultation
                    </Link>
                  </div>
                </section>
              </ScrollReveal>
            )}
          </article>

          {/* Sticky sidebar */}
          <aside className="col-span-12 lg:col-span-4">
            <div className="lg:sticky lg:top-32 space-y-6">
              <div className="border border-parchment-3 rounded-lg bg-voyage-white shadow-sm overflow-hidden">
                <div className="p-6 border-b border-parchment-3 bg-parchment/30">
                  <div className="text-[0.65rem] uppercase tracking-[0.18em] text-voyage-muted mb-1">From</div>
                  <div className="font-serif text-[2rem] font-bold text-ink leading-none">
                    {Number(data.price_eur) > 0 ? `€${Number(data.price_eur).toFixed(0)}` : "On request"}
                  </div>
                  <div className="text-[0.78rem] text-voyage-muted mt-1">per traveler · planning fee</div>
                </div>
                <div className="p-6 space-y-3 text-[0.85rem] text-ink-2">
                  {data.destination && (
                    <div className="flex items-center gap-3">
                      <MapPin className="w-4 h-4 text-gold flex-shrink-0" />
                      <span>{data.destination}</span>
                    </div>
                  )}
                  {data.duration_label && (
                    <div className="flex items-center gap-3">
                      <Calendar className="w-4 h-4 text-gold flex-shrink-0" />
                      <span>{data.duration_label}</span>
                    </div>
                  )}
                  {sequence.length > 0 && (
                    <div className="flex items-start gap-3">
                      <Compass className="w-4 h-4 text-gold flex-shrink-0 mt-0.5" />
                      <span>{sequence.length} stops</span>
                    </div>
                  )}
                </div>
                <div className="p-6 pt-0">
                  <Link
                    to={`/plan-my-trip?destination=${encodeURIComponent(data.destination ?? data.title)}`}
                    className="block w-full text-center px-6 py-3.5 rounded-sm bg-ink text-voyage-white text-[0.72rem] font-medium tracking-[0.12em] uppercase hover:bg-gold hover:text-ink transition-colors"
                  >
                    Plan this trip
                  </Link>
                </div>
              </div>

              {idealFor && (
                <div className="border border-parchment-3 rounded-lg p-6 bg-parchment/30">
                  <h4 className="text-[0.7rem] uppercase tracking-[0.16em] text-gold font-semibold mb-3">
                    Ideal for
                  </h4>
                  <p className="text-[0.88rem] text-ink-2 leading-relaxed whitespace-pre-line">{idealFor}</p>
                </div>
              )}

              {logistics && (
                <div className="border border-parchment-3 rounded-lg p-6">
                  <h4 className="text-[0.7rem] uppercase tracking-[0.16em] text-gold font-semibold mb-3">
                    Getting around
                  </h4>
                  <div className="text-[0.85rem] text-ink-2 leading-relaxed space-y-2">
                    {Object.entries(logistics).slice(0, 4).map(([k, v]) => (
                      <div key={k}>
                        <div className="text-[0.7rem] uppercase tracking-wider text-voyage-muted">{k.replace(/_/g, " ")}</div>
                        <div>{typeof v === "string" ? v : Array.isArray(v) ? v.join(", ") : JSON.stringify(v).slice(0, 200)}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </aside>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default RouteDetail;
