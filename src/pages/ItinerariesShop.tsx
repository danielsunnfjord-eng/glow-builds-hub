import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { Search, X, ArrowRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/voyage/Navbar";
import Footer from "@/components/voyage/Footer";
import ScrollReveal from "@/components/voyage/ScrollReveal";
import Seo from "@/components/Seo";
import LanguageSelector from "@/components/voyage/LanguageSelector";
import { toast } from "sonner";
import heroImage from "@/assets/catalogue-hero.jpg";

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
  experience_type: string[] | null;
  season: string[] | null;
  created_at: string;
  primary_language: string | null;
}


const pickLang = <T extends string | null>(
  lang: string,
  en: T,
  pt: T,
  no: T,
): T => ((lang === "pt" && pt) || (lang === "no" && no) || en) as T;

const EXPERIENCE_OPTIONS = [
  "Adventure", "Culture", "Gastronomy", "Nature", "City Break", "Relaxation",
  "Beach", "Romantic", "Family", "Wellness", "Luxury", "Wildlife", "Road Trip",
  "Photography", "Nightlife", "Festivals & Events", "Hiking", "Scenic Railways",
  "Cruises", "History", "Shopping", "Surfing", "Local Experiences", "Winter Activities",
];
const SEASON_OPTIONS = ["Spring", "Summer", "Autumn", "Winter"];

const parseDurationDays = (s: string | null): number | null => {
  if (!s) return null;
  const m = s.match(/(\d+)/);
  return m ? parseInt(m[1], 10) : null;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const formatDuration = (s: string | null, t: any): string | null => {
  if (!s) return null;
  const n = parseDurationDays(s);
  if (n !== null) return `${n} ${t("catalogue.daysWord", "days")}`;
  if (/not a route|standalone/i.test(s)) return t("catalogue.standaloneGuide", s);
  return s;
};



const ItinerariesShop = () => {
  const { t, i18n } = useTranslation();
  const lang = (i18n.language?.substring(0, 2) || "en") as "en" | "pt" | "no";

  useEffect(() => {
    document.title = `${t("catalogue.title")} · Fjord & Waves Travel`;
  }, [t]);

  const { data, isLoading } = useQuery({
    queryKey: ["catalog-itineraries-public"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("catalog_itineraries")
        .select(
          "id, slug, title_en, title_pt, title_no, summary_en, summary_pt, summary_no, destination, duration, hero_image_url, price_eur, sort_order, experience_type, season, created_at, primary_language",
        )
        .eq("is_published", true)
        .order("sort_order", { ascending: true })
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as CatalogItem[];
    },
  });

  // Filter state
  const [search, setSearch] = useState("");
  const [destination, setDestination] = useState("");
  const [experience, setExperience] = useState("");
  const [duration, setDuration] = useState("");
  const [season, setSeason] = useState("");

  const destinations = useMemo(() => {
    const set = new Set<string>();
    (data ?? []).forEach((d) => d.destination && set.add(d.destination));
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [data]);

  const filtered = useMemo(() => {
    if (!data) return [];
    const q = search.trim().toLowerCase();
    return data.filter((d) => {
      if (destination && d.destination !== destination) return false;
      if (experience && !(d.experience_type || []).some((x) => x.toLowerCase() === experience.toLowerCase())) return false;
      if (season && !(d.season || []).some((s) => s.toLowerCase() === season.toLowerCase())) return false;
      if (duration) {

        const days = parseDurationDays(d.duration);
        if (days === null) return false;
        if (duration === "short" && !(days >= 1 && days <= 4)) return false;
        if (duration === "medium" && !(days >= 5 && days <= 9)) return false;
        if (duration === "long" && !(days >= 10)) return false;
      }
      if (q) {
        const hay = [
          d.title_en, d.title_pt, d.title_no,
          d.summary_en, d.summary_pt, d.summary_no,
          d.destination, d.duration, (d.experience_type || []).join(" "), (d.season || []).join(" "),
        ].filter(Boolean).join(" ").toLowerCase();

        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [data, search, destination, experience, duration, season]);

  const hasActiveFilters = !!(search || destination || experience || duration || season);

  const resetFilters = () => {
    setSearch(""); setDestination(""); setExperience(""); setDuration(""); setSeason("");
  };

  // Suggestion form
  const [sg, setSg] = useState({ destination: "", experience: "", details: "", email: "" });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const submitSuggestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sg.destination.trim() || !sg.email.trim()) {
      toast.error(t("catalogue.suggestion.required"));
      return;
    }
    if (!/^\S+@\S+\.\S+$/.test(sg.email)) {
      toast.error(t("catalogue.suggestion.invalidEmail"));
      return;
    }
    setSubmitting(true);
    try {
      const { error } = await supabase.from("customer_suggestions" as any).insert({
        destination: sg.destination.trim().slice(0, 200),
        experience_type: sg.experience.trim().slice(0, 100) || null,
        details: sg.details.trim().slice(0, 2000) || null,
        email: sg.email.trim().slice(0, 255),
      } as any);
      if (error) throw error;
      setSubmitted(true);
      setSg({ destination: "", experience: "", details: "", email: "" });
    } catch (err: any) {
      toast.error(err?.message || "Submission failed");
    } finally {
      setSubmitting(false);
    }
  };

  const inputCls = "w-full px-3.5 py-3 text-[0.9rem] bg-voyage-white border border-ink/15 rounded-sm focus:outline-none focus:border-gold text-ink placeholder:text-voyage-muted/70 transition-colors";
  const filterSelectCls = "w-full px-3 py-2.5 text-[0.85rem] bg-voyage-white border border-ink/10 rounded-sm focus:outline-none focus:border-gold text-ink";

  return (
    <div className="min-h-screen bg-parchment">
      <Seo
        title="Curated Journeys — Travel Catalogue · Fjord & Waves Travel"
        description="Handcrafted, ready-to-travel itineraries from Daniel Lira Figueiredo. Filter by destination, experience and season, and download instantly."
        path="/catalogue"
      />
      <Navbar />

      {/* HERO */}
      <section className="relative isolate w-full overflow-hidden">
        <img
          src={heroImage}
          alt=""
          width={1920}
          height={1080}
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-ink/70 via-ink/50 to-ink/80" />
        <div className="hidden md:block absolute top-28 right-10 z-10">
          <LanguageSelector variant="dark" />
        </div>
        <div className="relative z-0 max-w-[1200px] mx-auto px-6 md:px-16 pt-28 pb-20 md:pt-52 md:pb-44 text-voyage-white">
          <div className="text-[0.65rem] font-semibold tracking-[0.28em] uppercase text-gold mb-4 md:mb-5">
            {t("catalogue.eyebrow")}
          </div>
          <h1 className="font-serif text-[clamp(2rem,6vw,5rem)] font-bold leading-[1.05] tracking-tight mb-4 md:mb-6 max-w-3xl">
            {t("catalogue.title")}
          </h1>
          {t("catalogue.subtitle") && (
            <p className="text-[0.95rem] md:text-[1.1rem] text-voyage-white/85 max-w-xl leading-relaxed font-light">
              {t("catalogue.subtitle")}
            </p>
          )}
          <p className="mt-4 md:mt-5 text-[0.85rem] md:text-[0.95rem] text-voyage-white/70 max-w-2xl leading-relaxed font-light">
            {t("catalogue.description")}
          </p>
        </div>
      </section>

      {/* FILTER BAR */}
      <section className="border-b border-ink/10 bg-voyage-white sticky top-0 z-30 shadow-sm">
        <div className="max-w-[1200px] mx-auto px-4 md:px-16 py-3 md:py-5">
          <div className="grid grid-cols-2 md:grid-cols-12 gap-2 md:gap-3">
            <div className="col-span-2 md:col-span-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-voyage-muted" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder={t("catalogue.filters.searchPlaceholder")}
                  className={`${filterSelectCls} pl-9`}
                />
              </div>
            </div>
            <div className="md:col-span-2">
              <select value={destination} onChange={(e) => setDestination(e.target.value)} className={filterSelectCls}>
                <option value="">{t("catalogue.filters.destination")}</option>
                {destinations.map((d) => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
            <div className="md:col-span-2">
              <select value={experience} onChange={(e) => setExperience(e.target.value)} className={filterSelectCls}>
                <option value="">{t("catalogue.filters.experience")}</option>
                {EXPERIENCE_OPTIONS.map((x) => (
                  <option key={x} value={x}>{t(`catalogue.experience.${x.replace(/\s/g, "").toLowerCase()}`, x)}</option>
                ))}
              </select>
            </div>
            <div className="md:col-span-2">
              <select value={duration} onChange={(e) => setDuration(e.target.value)} className={filterSelectCls}>
                <option value="">{t("catalogue.filters.duration")}</option>
                <option value="short">{t("catalogue.duration.short")}</option>
                <option value="medium">{t("catalogue.duration.medium")}</option>
                <option value="long">{t("catalogue.duration.long")}</option>
              </select>
            </div>
            <div className="md:col-span-2">
              <select value={season} onChange={(e) => setSeason(e.target.value)} className={filterSelectCls}>
                <option value="">{t("catalogue.filters.season")}</option>
                {SEASON_OPTIONS.map((s) => (
                  <option key={s} value={s}>{t(`catalogue.season.${s.toLowerCase()}`, s)}</option>
                ))}
              </select>
            </div>
            {hasActiveFilters && (
              <div className="col-span-2 md:col-span-1 flex items-center md:justify-end">
                <button onClick={resetFilters} className="inline-flex items-center gap-1 text-[0.7rem] font-medium tracking-[0.1em] uppercase text-voyage-muted hover:text-ink transition-colors">
                  <X className="w-3 h-3" />
                  {t("catalogue.filters.reset")}
                </button>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* GRID */}
      <main className="max-w-[1200px] mx-auto px-4 md:px-16 py-10 md:py-24">
        {isLoading && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[0, 1, 2].map((i) => (
              <div key={i} className="aspect-[4/5] bg-parchment-2 animate-pulse rounded-lg" />
            ))}
          </div>
        )}

        {!isLoading && (data?.length ?? 0) === 0 && (
          <div className="border border-ink/10 bg-voyage-white rounded-lg p-12 text-center">
            <p className="text-[0.9rem] text-voyage-muted mb-4">{t("catalogue.empty")}</p>
            <Link to="/plan-my-trip" className="inline-block px-6 py-3 rounded-sm bg-ink text-voyage-white text-[0.72rem] font-medium tracking-[0.12em] uppercase hover:bg-gold hover:text-ink transition-colors">
              {t("nav.planMyTrip")}
            </Link>
          </div>
        )}

        {!isLoading && (data?.length ?? 0) > 0 && filtered.length === 0 && (
          <div className="border border-ink/10 bg-voyage-white rounded-lg p-12 text-center">
            <p className="text-[0.9rem] text-voyage-muted mb-4">{t("catalogue.noMatches")}</p>
            <button onClick={resetFilters} className="inline-block px-6 py-3 rounded-sm bg-ink text-voyage-white text-[0.72rem] font-medium tracking-[0.12em] uppercase hover:bg-gold hover:text-ink transition-colors">
              {t("catalogue.filters.reset")}
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
          {filtered.map((trip) => {
            const title = pickLang(lang, trip.title_en, trip.title_pt, trip.title_no) || trip.title_en;
            const summary = pickLang(lang, trip.summary_en, trip.summary_pt, trip.summary_no) || trip.summary_en;
            return (
              <ScrollReveal key={trip.id} className="h-full">
                <Link
                  to={`/catalogue/${trip.slug}`}
                  className="group flex flex-col h-full w-full rounded-lg overflow-hidden border border-ink/[0.08] bg-voyage-white shadow-sm hover:shadow-xl transition-all duration-300 text-left"
                >
                  <div className="relative aspect-[4/5] overflow-hidden bg-parchment-2">
                    {trip.hero_image_url && (
                      <img
                        src={trip.hero_image_url}
                        alt={title}
                        loading="lazy"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                      />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-ink/85 via-ink/10 to-transparent" />
                    <div className="absolute bottom-0 left-0 right-0 p-6">
                      <h3 className="font-serif text-[1.35rem] font-bold leading-tight text-voyage-white line-clamp-2">
                        {title}
                      </h3>
                    </div>
                  </div>
                  <div className="p-6 flex-1 flex flex-col">
                    <div className="flex items-center flex-wrap gap-2 mb-3">
                      {trip.destination && (
                        <span className="text-[0.62rem] font-semibold tracking-[0.18em] uppercase text-gold">
                          {trip.destination}
                        </span>
                      )}
                      {trip.experience_type && trip.experience_type.length > 0 && (
                        <>
                          <span className="text-voyage-muted/40 text-[0.62rem]">·</span>
                          <span className="text-[0.62rem] font-medium tracking-[0.12em] uppercase text-voyage-muted">
                            {trip.experience_type
                              .map((x) => t(`catalogue.experience.${x.replace(/\s/g, "").toLowerCase()}`, x))
                              .join(" · ")}
                          </span>
                        </>
                      )}
                    </div>
                    {summary && (
                      <p className="text-[0.85rem] text-voyage-muted line-clamp-3 mb-4 leading-relaxed">
                        {summary}
                      </p>
                    )}
                    {(() => {
                      const pl = (trip.primary_language || "en").toLowerCase();
                      const langKey = pl === "pt" || pl === "no" ? pl : "en";
                      const created = new Date(trip.created_at).toLocaleDateString(
                        lang === "pt" ? "pt-BR" : lang === "no" ? "nb-NO" : "en-GB",
                        { day: "2-digit", month: "short", year: "numeric" },
                      );
                      return (
                        <div className="flex items-center flex-wrap gap-x-3 gap-y-1 mb-4 text-[0.62rem] tracking-[0.12em] uppercase text-voyage-muted">
                          <span className="inline-flex items-center gap-1.5">
                            <span className="font-semibold text-ink/70">{t("catalogue.cardLanguage")}:</span>
                            <span className="px-1.5 py-0.5 rounded-sm border border-ink/15 text-ink/80 font-semibold">
                              {t(`catalogue.language.${langKey}`)}
                            </span>
                          </span>
                          <span className="inline-flex items-center gap-1.5">
                            <span className="font-semibold text-ink/70">{t("catalogue.cardCreated")}:</span>
                            <span>{created}</span>
                          </span>
                        </div>
                      );
                    })()}
                    <div className="flex items-baseline justify-between border-t border-parchment-3 pt-4 mt-auto">
                      <div className="flex flex-col">
                        {formatDuration(trip.duration, t) && (
                          <span className="text-[0.72rem] uppercase tracking-[0.1em] text-voyage-muted mb-0.5">
                            {formatDuration(trip.duration, t)}
                          </span>
                        )}
                        <span className="font-serif text-[1.25rem] font-bold text-ink">
                          €{Number(trip.price_eur).toFixed(0)}
                        </span>
                      </div>
                      <span className="inline-flex items-center gap-1.5 px-4 py-2 rounded-sm border border-ink/30 text-[0.68rem] font-semibold tracking-[0.12em] uppercase text-ink group-hover:bg-ink group-hover:text-voyage-white transition-colors">
                        {t("catalogue.viewItinerary")}
                        <ArrowRight className="w-3 h-3" />
                      </span>
                    </div>
                  </div>
                </Link>
              </ScrollReveal>

            );
          })}
        </div>
      </main>

      {/* TAILOR-MADE SECTION */}
      <section className="bg-voyage-white border-t border-parchment-3">
        <div className="max-w-[900px] mx-auto px-6 md:px-16 py-20 md:py-28 text-center">
          <ScrollReveal>
            <div className="text-[0.65rem] font-semibold tracking-[0.28em] uppercase text-gold mb-5">
              {t("catalogue.tailor.eyebrow")}
            </div>
            <h2 className="font-serif text-[clamp(1.8rem,3.5vw,2.75rem)] font-bold leading-tight tracking-tight mb-5 text-ink">
              {t("catalogue.tailor.title")}
            </h2>
            <p className="text-[1rem] text-voyage-muted leading-relaxed mb-8 max-w-2xl mx-auto">
              {t("catalogue.tailor.text")}
            </p>
            <Link
              to="/plan-my-trip"
              className="inline-flex items-center gap-2 px-7 py-3.5 rounded-sm bg-ink text-voyage-white text-[0.72rem] font-semibold tracking-[0.14em] uppercase hover:bg-gold hover:text-ink transition-colors"
            >
              {t("catalogue.tailor.cta")}
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </ScrollReveal>
        </div>
      </section>

      {/* SUGGESTION FORM */}
      <section className="bg-parchment border-t border-parchment-3">
        <div className="max-w-[760px] mx-auto px-6 md:px-16 py-20 md:py-28">
          <ScrollReveal>
            <div className="text-center mb-10">
              <div className="text-[0.65rem] font-semibold tracking-[0.28em] uppercase text-gold mb-5">
                {t("catalogue.suggestion.eyebrow")}
              </div>
              <h2 className="font-serif text-[clamp(1.8rem,3.5vw,2.75rem)] font-bold leading-tight tracking-tight mb-5 text-ink">
                {t("catalogue.suggestion.title")}
              </h2>
              <p className="text-[1rem] text-voyage-muted leading-relaxed max-w-xl mx-auto">
                {t("catalogue.suggestion.subtitle")}
              </p>
            </div>

            {submitted ? (
              <div className="bg-voyage-white border border-gold/30 rounded-lg p-10 text-center">
                <p className="font-serif text-[1.15rem] text-ink leading-relaxed">
                  {t("catalogue.suggestion.thanks")}
                </p>
                <button
                  onClick={() => setSubmitted(false)}
                  className="mt-6 text-[0.72rem] font-medium tracking-[0.12em] uppercase text-voyage-muted hover:text-ink transition-colors"
                >
                  {t("catalogue.suggestion.another")}
                </button>
              </div>
            ) : (
              <form onSubmit={submitSuggestion} className="bg-voyage-white border border-parchment-3 rounded-lg p-7 md:p-10 flex flex-col gap-5">
                <div>
                  <label className="block text-[0.7rem] font-semibold tracking-[0.16em] uppercase text-voyage-muted mb-2">
                    {t("catalogue.suggestion.destinationLabel")} *
                  </label>
                  <input
                    required
                    value={sg.destination}
                    maxLength={200}
                    onChange={(e) => setSg({ ...sg, destination: e.target.value })}
                    placeholder={t("catalogue.suggestion.destinationPlaceholder")}
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className="block text-[0.7rem] font-semibold tracking-[0.16em] uppercase text-voyage-muted mb-2">
                    {t("catalogue.suggestion.experienceLabel")}
                  </label>
                  <select value={sg.experience} onChange={(e) => setSg({ ...sg, experience: e.target.value })} className={inputCls}>
                    <option value="">{t("catalogue.suggestion.experiencePlaceholder")}</option>
                    {EXPERIENCE_OPTIONS.map((x) => (
                      <option key={x} value={x}>{t(`catalogue.experience.${x.replace(/\s/g, "").toLowerCase()}`, x)}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[0.7rem] font-semibold tracking-[0.16em] uppercase text-voyage-muted mb-2">
                    {t("catalogue.suggestion.detailsLabel")}
                  </label>
                  <textarea
                    value={sg.details}
                    maxLength={2000}
                    rows={4}
                    onChange={(e) => setSg({ ...sg, details: e.target.value })}
                    placeholder={t("catalogue.suggestion.detailsPlaceholder")}
                    className={`${inputCls} resize-none`}
                  />
                </div>
                <div>
                  <label className="block text-[0.7rem] font-semibold tracking-[0.16em] uppercase text-voyage-muted mb-2">
                    {t("catalogue.suggestion.emailLabel")} *
                  </label>
                  <input
                    required
                    type="email"
                    value={sg.email}
                    maxLength={255}
                    onChange={(e) => setSg({ ...sg, email: e.target.value })}
                    placeholder="you@email.com"
                    className={inputCls}
                  />
                </div>
                <button
                  type="submit"
                  disabled={submitting}
                  className="self-start px-7 py-3.5 rounded-sm bg-gold text-ink text-[0.72rem] font-semibold tracking-[0.14em] uppercase hover:bg-ink hover:text-voyage-white transition-colors disabled:opacity-60"
                >
                  {submitting ? t("catalogue.suggestion.sending") : t("catalogue.suggestion.send")}
                </button>
              </form>
            )}
          </ScrollReveal>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default ItinerariesShop;
