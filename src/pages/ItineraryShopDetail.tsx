import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { Link, useParams, useSearchParams, useNavigate } from "react-router-dom";
import {
  ChevronRight,
  Clock,
  MapPin,
  Users,
  Wallet,
  Sun,
  FileDown,
  Compass,
  Sparkles,
  Heart,
  Coffee,
  Moon as MoonIcon,
  MessageCircle,
  Award,
  Info,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import Navbar from "@/components/voyage/Navbar";
import Footer from "@/components/voyage/Footer";
import Seo from "@/components/Seo";
import { markdownToHtml } from "@/components/voyage/editor/markdownHelpers";
import danielProfile from "@/assets/daniel-profile.webp";
import {
  CurrencyToggle,
  formatPrice,
  usePreferredCurrency,
} from "@/lib/pricing";

// --- Day-by-day markdown parser ---------------------------------------------
// Splits a day-by-day catalogue guide markdown into:
//   { intro, overview (markdown of Trip Overview section), days [{ heading, body }], practical }
// Headings detected: `## Day N — Theme`, `## Trip Overview`, `## Practical Tips`
// (and their PT/NO variants: Dia, Dag, Visão Geral / Reiseoversikt, Dicas / Tips).
const OVERVIEW_LABELS = /^(trip\s*overview|vis[ãa]o\s*geral.*|reiseoversikt.*|oversikt)$/i;
const PRACTICAL_LABELS = /^(practical\s*tips|dicas\s*pr[áa]ticas|praktiske\s*tips|praktisk)$/i;
const DAY_HEADING = /^(?:day|dia|dag)\s*(\d+)\s*[—\-:]?\s*(.*)$/i;

const parseDurationDays = (s: string | null | undefined): number | null => {
  if (!s) return null;
  const m = s.match(/(\d+)/);
  return m ? parseInt(m[1], 10) : null;
};
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const formatDuration = (s: string | null | undefined, t: any): string | null => {
  if (!s) return null;
  const n = parseDurationDays(s);
  if (n !== null) return `${n} ${t("catalogue.daysWord", "days")}`;
  if (/not a route|standalone/i.test(s)) return t("catalogue.standaloneGuide", s);
  return s;
};

function parseDayByDay(md: string) {
  const result = {
    intro: "" as string,
    overview: "" as string,
    days: [] as Array<{ day: number; title: string; body: string }>,
    practical: "" as string,
  };
  if (!md) return result;
  // Split on ## headings, keep the heading with each block
  const parts = md.split(/^##\s+/m);
  result.intro = (parts.shift() || "").trim();
  for (const raw of parts) {
    const nlIdx = raw.indexOf("\n");
    const heading = (nlIdx === -1 ? raw : raw.slice(0, nlIdx)).trim();
    const body = (nlIdx === -1 ? "" : raw.slice(nlIdx + 1)).trim();
    if (OVERVIEW_LABELS.test(heading)) {
      result.overview = body;
      continue;
    }
    if (PRACTICAL_LABELS.test(heading)) {
      result.practical = body;
      continue;
    }
    const dm = heading.match(DAY_HEADING);
    if (dm) {
      result.days.push({
        day: parseInt(dm[1], 10),
        title: (dm[2] || "").trim(),
        body,
      });
    }
  }
  return result;
}

interface CatalogItem {
  id: string;
  slug: string;
  title_en: string;
  title_pt: string | null;
  title_no: string | null;
  summary_en: string;
  summary_pt: string | null;
  summary_no: string | null;
  description_en: string;
  description_pt: string | null;
  description_no: string | null;
  what_you_get_en: string;
  what_you_get_pt: string | null;
  what_you_get_no: string | null;
  destination: string | null;
  duration: string | null;
  group_size_label: string | null;
  estimated_trip_budget: string | null;
  hero_image_url: string | null;
  hero_image_credit: string | null;
  hero_image_caption: string | null;
  gallery_images: string[];
  price_eur: number;
  price_usd: number | null;
  price_brl: number | null;
  price_nok: number | null;
  is_published: boolean;
  itinerary_content_en: string | null;
  itinerary_content_pt: string | null;
  itinerary_content_no: string | null;
  season: string[] | null;
  subpage_checklist: string[] | null;
  subpage_day_overview: { label: string; description: string }[] | null;
  subpage_expectations: { title: string; description: string }[] | null;
  subpage_map_url: string | null;
}



const pick = (lang: string, en: string, pt: string | null, no: string | null) =>
  (lang === "pt" && pt) || (lang === "no" && no) || en;


const ItineraryShopDetail = () => {
  const { slug } = useParams();
  const { t, i18n } = useTranslation();
  const lang = i18n.language?.substring(0, 2) || "en";
  const [params] = useSearchParams();
  const canceled = params.get("canceled") === "1";
  const { toast } = useToast();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const { enPref } = usePreferredCurrency();

  const { data, isLoading } = useQuery({
    queryKey: ["catalog-itinerary", slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("catalog_itineraries")
        .select("*")
        .eq("slug", slug!)
        .maybeSingle();
      if (error) throw error;
      return data as unknown as CatalogItem | null;
    },
    enabled: !!slug,
  });

  const { data: related = [] } = useQuery({
    queryKey: ["catalog-related", slug],
    queryFn: async () => {
      const { data: res, error } = await supabase
        .from("catalog_itineraries")
        .select("id, slug, title_en, title_pt, title_no, destination, duration, hero_image_url, price_eur, price_usd, price_brl, price_nok")
        .eq("is_published", true)
        .neq("slug", slug!)
        .order("sort_order", { ascending: true })
        .limit(3);
      if (error) throw error;
      return (res ?? []) as Array<Pick<CatalogItem, "id" | "slug" | "title_en" | "title_pt" | "title_no" | "destination" | "duration" | "hero_image_url" | "price_eur" | "price_usd" | "price_brl" | "price_nok">>;
    },
    enabled: !!slug,
  });

  const title = data ? pick(lang, data.title_en, data.title_pt, data.title_no) : "";
  const summary = data ? pick(lang, data.summary_en, data.summary_pt, data.summary_no) : "";
  const description = data ? pick(lang, data.description_en, data.description_pt, data.description_no) : "";
  const whatYouGet = data ? pick(lang, data.what_you_get_en, data.what_you_get_pt, data.what_you_get_no) : "";
  const itineraryMd = data ? pick(lang, data.itinerary_content_en || "", data.itinerary_content_pt, data.itinerary_content_no) : "";
  const journey = useMemo(() => parseDayByDay(itineraryMd), [itineraryMd]);

  const wygItems = useMemo(
    () =>
      whatYouGet
        .split("\n")
        .map((s) => s.replace(/^[-•*]\s*/, "").trim())
        .filter(Boolean),
    [whatYouGet],
  );

  // Fallback "what you receive" checklist if catalog field is empty
  const defaultIncludes = [
    t("shop.includes.thematic", "Thematic editorial guide to the destination"),
    t("shop.includes.areas", "Where to stay — best neighbourhoods & areas"),
    t("shop.includes.highlights", "Must-see highlights with insider context"),
    t("shop.includes.hidden", "Hidden gems and local favourites"),
    t("shop.includes.food", "Food & drink — specific places and dishes"),
    t("shop.includes.practical", "Practical tips, logistics & best times to visit"),
    t("shop.includes.pdf", "Instant premium PDF download"),
  ];
  const checklistFromDb = Array.isArray(data?.subpage_checklist)
    ? (data!.subpage_checklist as string[]).map((s) => String(s ?? "").trim()).filter(Boolean)
    : [];
  const includes = checklistFromDb.length > 0
    ? checklistFromDb
    : (wygItems.length > 0 ? wygItems : defaultIncludes);

  const dayOverview = Array.isArray(data?.subpage_day_overview)
    ? (data!.subpage_day_overview as { label: string; description: string }[])
        .map((d) => ({
          label: String(d?.label ?? "").trim(),
          description: String(d?.description ?? "").trim(),
        }))
        .filter((d) => d.label.length > 0 || d.description.length > 0)
    : [];


  useEffect(() => {
    if (title) document.title = `${title} · Fjord & Waves Travel`;
  }, [title]);

  useEffect(() => {
    if (slug) {
      supabase.rpc("increment_catalog_view", { _slug: slug }).then(() => {});
    }
  }, [slug]);

  const handleBuy = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!data) return;
    setSubmitting(true);
    try {
      const { getPaymentsEnvironment } = await import("@/lib/payments-env");
      const { data: res, error } = await supabase.functions.invoke(
        "create-catalog-checkout",
        {
          body: {
            itinerary_id: data.id,
            email,
            origin: window.location.origin,
            language: lang,
            environment: getPaymentsEnvironment(),
          },
        },
      );
      if (error || !res?.url) throw error || new Error("No URL");
      window.location.href = res.url;
    } catch (err) {
      console.error(err);
      toast({ title: "Error", description: String(err), variant: "destructive" });
      setSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-parchment">
        <Navbar />
        <main className="pt-32 px-16 max-md:px-6 max-md:pt-24">
          <div className="h-96 bg-parchment-2 animate-pulse rounded-lg" />
        </main>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-parchment">
        <Navbar />
        <main className="pt-32 px-16 max-md:px-6 max-md:pt-24 min-h-[60vh]">
          <p className="text-voyage-muted mb-4">{t("shop.notFound")}</p>
          <Link to="/catalogue" className="text-gold hover:underline">
            {t("shop.backToShop")}
          </Link>
        </main>
        <Footer />
      </div>
    );
  }

  const gallery = Array.isArray(data.gallery_images) ? data.gallery_images : [];

  const defaultExpectations = [
    {
      icon: Coffee,
      label: t("shop.expect.mornings", "Unhurried mornings"),
      text: t("shop.expect.morningsText", "Slow starts in places worth lingering — markets, coastlines, quiet cafés."),
    },
    {
      icon: Compass,
      label: t("shop.expect.local", "Local insider access"),
      text: t("shop.expect.localText", "Hand-picked guides, family-run tables and out-of-the-way detours you'd miss alone."),
    },
    {
      icon: Sparkles,
      label: t("shop.expect.signature", "Signature moments"),
      text: t("shop.expect.signatureText", "One unforgettable experience each day — the kind you'll still talk about years later."),
    },
    {
      icon: MoonIcon,
      label: t("shop.expect.evenings", "Evenings, considered"),
      text: t("shop.expect.eveningsText", "Where to dine, where to walk, and where to watch the day end well."),
    },
  ];

  const expectationsFromDb = Array.isArray(data?.subpage_expectations)
    ? (data!.subpage_expectations as { title: string; description: string }[])
        .map((e) => ({
          label: String(e?.title ?? "").trim(),
          text: String(e?.description ?? "").trim(),
          icon: Sparkles,
        }))
        .filter((e) => e.label.length > 0 || e.text.length > 0)
    : [];

  const expectations = expectationsFromDb.length > 0 ? expectationsFromDb : defaultExpectations;

  const valueProps = [
    {
      icon: Award,
      label: t("shop.values.curated", "Curated by experienced travel designers"),
    },
    {
      icon: MapPin,
      label: t("shop.values.local", "Built on local knowledge and insider access"),
    },
    {
      icon: FileDown,
      label: t("shop.values.delivered", "Delivered as a premium PDF the moment you purchase"),
    },
    {
      icon: MessageCircle,
      label: t("shop.values.support", "Always here if you need personal support"),
    },
  ];

  const productJsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: title,
    description: summary || description?.slice(0, 200),
    image: data.hero_image_url || undefined,
    brand: { "@type": "Brand", name: "Fjord & Waves Travel" },
    offers: {
      "@type": "Offer",
      price: Number(data.price_eur).toFixed(2),
      priceCurrency: "EUR",
      availability: "https://schema.org/InStock",
      url: `https://fjordwavestravel.com/catalogue/${data.slug}`,
    },
  };

  const priceLabel = formatPrice(data, lang, enPref);
  const showCurrencyToggle = lang === "en";

  return (
    <div className="min-h-screen bg-parchment">
      <Seo
        title={`${title} — Fjord & Waves Travel`}
        description={(summary || description || "").slice(0, 160)}
        path={`/catalogue/${data.slug}`}
        image={data.hero_image_url || undefined}
        type="product"
        jsonLd={productJsonLd}
      />
      <Navbar />

      <main>
        {/* 1. HERO */}
        <section className="relative w-full h-[78vh] min-h-[440px] md:min-h-[520px] max-h-[820px] overflow-hidden bg-ink">
          {data.hero_image_url && (
            <img
              src={data.hero_image_url}
              alt={title}
              className="absolute inset-0 w-full h-full object-cover"
            />
          )}
          {/* Gradient for readability */}
          <div className="absolute inset-0 bg-gradient-to-t from-ink/85 via-ink/20 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-r from-ink/30 to-transparent" />

          <div className="relative h-full flex flex-col justify-end px-16 max-md:px-6 pb-16 max-md:pb-10 pt-28">
            <div className="max-w-4xl">
              <div className="inline-flex items-center gap-2 text-[0.65rem] font-semibold tracking-[0.28em] uppercase text-gold mb-5">
                <span className="h-px w-8 bg-gold" />
                {t("shop.badge")}
              </div>
              <h1 className="font-serif text-voyage-white text-[clamp(2.2rem,5.5vw,4.6rem)] font-bold leading-[1.02] tracking-tight mb-6 drop-shadow-md">
                {title}
              </h1>

              <div className="flex flex-wrap items-center gap-2 mb-7">
                {data.destination && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-voyage-white/10 backdrop-blur-md border border-voyage-white/20 text-voyage-white text-[0.72rem] tracking-[0.1em] uppercase">
                    <MapPin className="w-3 h-3" /> {data.destination}
                  </span>
                )}
                {data.duration && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-voyage-white/10 backdrop-blur-md border border-voyage-white/20 text-voyage-white text-[0.72rem] tracking-[0.1em] uppercase">
                    <Clock className="w-3 h-3" /> {formatDuration(data.duration, t)}
                  </span>
                )}
                {data.group_size_label && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-voyage-white/10 backdrop-blur-md border border-voyage-white/20 text-voyage-white text-[0.72rem] tracking-[0.1em] uppercase">
                    <Users className="w-3 h-3" /> {data.group_size_label}
                  </span>
                )}
              </div>

              <a
                href="#buy"
                className="inline-flex items-center gap-2 md:gap-3 px-5 md:px-7 py-3 md:py-4 rounded-sm bg-gold text-ink text-[0.7rem] md:text-[0.78rem] font-semibold tracking-[0.14em] md:tracking-[0.16em] uppercase hover:bg-voyage-white transition-colors shadow-lg"
              >
                {t("shop.getThis", "Get this itinerary")}
                <span className="h-3 md:h-4 w-px bg-ink/30" />
                {priceLabel}
              </a>
            </div>
          </div>
          {data.hero_image_credit && (
            <div className="absolute bottom-3 right-4 max-md:right-3 text-[0.62rem] tracking-[0.08em] text-voyage-white/85 bg-ink/45 backdrop-blur-sm px-2 py-1 rounded-sm">
              {data.hero_image_credit}
            </div>
          )}
        </section>

        {data.hero_image_caption && (
          <div className="px-16 max-md:px-6 py-4 bg-parchment border-b border-ink/[0.06]">
            <p className="max-w-3xl mx-auto text-center font-serif italic text-[0.95rem] text-voyage-muted">
              {data.hero_image_caption}
            </p>
          </div>
        )}

        {/* 2. BREADCRUMB */}
        <nav
          aria-label="breadcrumb"
          className="px-16 max-md:px-6 py-5 border-b border-ink/[0.06] bg-parchment"
        >
          <ol className="flex items-center gap-2 text-[0.72rem] tracking-[0.08em] text-voyage-muted whitespace-nowrap overflow-x-auto">
            <li>
              <Link to="/" className="hover:text-ink transition-colors">
                {t("nav.home", "Home")}
              </Link>
            </li>
            <ChevronRight className="w-3 h-3 shrink-0" />
            <li>
              <Link to="/catalogue" className="hover:text-ink transition-colors">
                {t("nav.shop", "Catalogue")}
              </Link>
            </li>
            <ChevronRight className="w-3 h-3 shrink-0" />
            <li className="text-ink truncate max-w-[50vw]">{title}</li>
          </ol>
        </nav>

        {/* 3. TWO-COLUMN MAIN */}
        <section className="px-16 max-md:px-6 py-16 max-md:py-10 max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-14 max-lg:gap-10">
            {/* RIGHT (main) column comes first in source on desktop via order — keep natural for mobile */}
            <div className="lg:order-2">
              {/* Sticky sidebar */}
              <aside id="buy" className="lg:sticky lg:top-28 self-start scroll-mt-28 space-y-6">
                {/* Price + buy */}
                <div className="bg-voyage-white border border-ink/[0.08] rounded-lg shadow-sm p-5 md:p-7">
                  <div className="flex items-baseline justify-between gap-3 mb-1">
                    <span className="text-[0.68rem] uppercase tracking-[0.16em] text-voyage-muted">
                      {t("shop.buyNow")}
                    </span>
                    <span className="font-serif text-[1.7rem] md:text-[2.2rem] font-bold text-ink leading-none">
                      {priceLabel}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-3 mb-5">
                    <p className="text-[0.72rem] text-voyage-muted">
                      {t("shop.instantDownload")}
                    </p>
                    {showCurrencyToggle && <CurrencyToggle variant="light" />}
                  </div>

                  {canceled && (
                    <div className="mb-4 p-3 rounded bg-destructive/10 text-destructive text-[0.78rem]">
                      {t("shop.canceled")}
                    </div>
                  )}

                  <form onSubmit={handleBuy} className="space-y-3">
                    <label className="block text-[0.68rem] uppercase tracking-[0.14em] text-ink/70">
                      {t("shop.emailLabel")}
                    </label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder={t("shop.emailPlaceholder")}
                      className="w-full px-4 py-3 rounded-sm border border-ink/15 bg-parchment text-[0.9rem] focus:outline-none focus:border-gold"
                    />
                    <p className="text-[0.7rem] text-voyage-muted">{t("shop.emailHelp")}</p>
                    <button
                      type="submit"
                      disabled={submitting}
                      className="w-full px-5 py-3.5 rounded-sm bg-ink text-voyage-white text-[0.78rem] font-semibold tracking-[0.14em] uppercase hover:bg-gold hover:text-ink transition-colors disabled:opacity-50"
                    >
                      {submitting
                        ? t("shop.processing")
                        : `${t("shop.buyFor")} ${priceLabel}`}
                    </button>
                    <p className="text-[0.65rem] text-voyage-muted text-center pt-1">
                      🔒 {t("shop.securePayment")}
                    </p>
                  </form>
                </div>


                {/* What you receive */}
                <div className="bg-voyage-white border border-ink/[0.08] rounded-lg p-6">
                  <h3 className="text-[0.65rem] font-semibold tracking-[0.2em] uppercase text-gold mb-4">
                    {t("shop.whatYouGet")}
                  </h3>
                  <ul className="space-y-2.5">
                    {includes.map((item, i) => (
                      <li key={i} className="flex gap-2.5 text-[0.85rem] text-ink/85 leading-snug">
                        <span className="text-gold mt-0.5">✓</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Tailor-made CTA */}
                <div className="bg-ink text-voyage-white rounded-lg p-6 text-center">
                  <Heart className="w-5 h-5 text-gold mx-auto mb-2.5" />
                  <p className="text-[0.85rem] text-voyage-white/85 mb-4 leading-relaxed">
                    {t("shop.tailorIntro", "Prefer a tailor-made trip?")}
                  </p>
                  <button
                    onClick={() => navigate("/plan-my-trip")}
                    className="w-full px-4 py-2.5 rounded-sm bg-gold text-ink text-[0.72rem] font-semibold tracking-[0.14em] uppercase hover:bg-voyage-white transition-colors"
                  >
                    {t("shop.tailorCta", "Contact us")}
                  </button>
                </div>

                {/* WhatsApp CTA */}
                <div className="bg-parchment border border-ink/[0.08] rounded-lg p-6 text-center">
                  <MessageCircle className="w-5 h-5 text-gold mx-auto mb-2.5" />
                  <a
                    href="https://wa.me/+4799191574"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex w-full justify-center items-center gap-2 px-4 py-2.5 rounded-sm bg-gold text-ink text-[0.72rem] font-semibold tracking-[0.14em] uppercase hover:bg-voyage-white transition-colors no-underline"
                  >
                    {t("curated.ctaWhatsapp")}
                  </a>
                </div>
              </aside>
            </div>

            {/* MAIN editorial column */}
            <div className="lg:order-1 min-w-0">
              {/* Editorial intro */}
              {(summary || description) && (
                <div className="mb-14">
                  <div className="text-[0.65rem] font-semibold tracking-[0.22em] uppercase text-gold mb-4">
                    {t("shop.intro", "The journey")}
                  </div>
                  {summary && (
                    <p className="font-serif text-[clamp(1.3rem,2.2vw,1.7rem)] leading-[1.4] text-ink mb-6 italic">
                      {summary}
                    </p>
                  )}
                  {description && (
                    <div className="text-[1rem] text-ink/80 leading-[1.8] whitespace-pre-line space-y-4 max-w-prose">
                      {description}
                    </div>
                  )}
                </div>
              )}

              {/* SELF-GUIDED NOTE */}
              <div className="mb-14 rounded-lg border border-gold/40 bg-gold/10 p-6 max-md:p-5 flex gap-4 items-start shadow-sm">
                <div className="shrink-0 w-9 h-9 rounded-full bg-gold/25 flex items-center justify-center mt-0.5">
                  <Info className="w-4 h-4 text-ink" aria-hidden="true" />
                </div>
                <div>
                  <div className="text-[0.7rem] font-semibold tracking-[0.18em] uppercase text-ink mb-2">
                    {t("shop.selfGuidedHeading", "Good to know")}
                  </div>
                  <p className="text-[0.95rem] text-ink/85 leading-relaxed">
                    {t(
                      "shop.selfGuidedNote",
                      "This itinerary is a self-guided plan — flights, accommodation, and activity bookings are not included. Need help putting it all together? We offer optional booking assistance, custom edits, and trip support for a small additional fee.",
                    )}
                  </p>
                </div>
              </div>


              {/* What to expect */}
              <div className="mb-14">
                <h2 className="font-serif text-[clamp(1.5rem,2.4vw,2rem)] font-bold text-ink mb-2">
                  {t("shop.whatToExpect", "What to expect")}
                </h2>
                <div className="h-px w-12 bg-gold mb-7" />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  {expectations.map((ex, i) => {
                    const Icon = ex.icon;
                    return (
                      <div
                        key={i}
                        className="flex gap-4 p-5 rounded-lg border border-ink/[0.06] bg-voyage-white"
                      >
                        <div className="shrink-0 w-10 h-10 rounded-full bg-parchment-2 flex items-center justify-center">
                          <Icon className="w-4 h-4 text-gold" />
                        </div>
                        <div>
                          <div className="font-serif text-[1.05rem] font-bold text-ink mb-1">
                            {ex.label}
                          </div>
                          <p className="text-[0.85rem] text-ink/70 leading-relaxed">
                            {ex.text}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Day overview */}
              {dayOverview.length > 0 && (
                <div className="mb-14">
                  <h2 className="font-serif text-[clamp(1.5rem,2.4vw,2rem)] font-bold text-ink mb-2">
                    {t("shop.dayOverview", "Day-by-day overview")}
                  </h2>
                  <div className="h-px w-12 bg-gold mb-7" />
                  <ol className="space-y-4">
                    {dayOverview.map((d, i) => (
                      <li
                        key={i}
                        className="p-5 rounded-lg border border-ink/[0.06] bg-voyage-white"
                      >
                        {d.label && (
                          <div className="font-serif text-[1.05rem] font-bold text-ink">
                            {d.label}
                          </div>
                        )}
                      </li>
                    ))}
                  </ol>
                </div>
              )}

              {/* Highlights */}
              <div className="mb-14">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div className="flex flex-col items-center text-center p-5 rounded-lg border border-ink/[0.06] bg-voyage-white">
                    <Clock className="w-5 h-5 text-gold mb-2" />
                    <span className="text-[0.65rem] uppercase tracking-[0.14em] text-voyage-muted mb-1">
                      {t("shop.duration")}
                    </span>
                    <span className="text-[0.85rem] font-semibold text-ink">
                      {formatDuration(data.duration, t) || "—"}
                    </span>
                  </div>
                  <div className="flex flex-col items-center text-center p-5 rounded-lg border border-ink/[0.06] bg-voyage-white">
                    <MapPin className="w-5 h-5 text-gold mb-2" />
                    <span className="text-[0.65rem] uppercase tracking-[0.14em] text-voyage-muted mb-1">
                      {t("shop.destination")}
                    </span>
                    <span className="text-[0.85rem] font-semibold text-ink">
                      {data.destination || "—"}
                    </span>
                  </div>
                  <div className="flex flex-col items-center text-center p-5 rounded-lg border border-ink/[0.06] bg-voyage-white">
                    <Sun className="w-5 h-5 text-gold mb-2" />
                    <span className="text-[0.65rem] uppercase tracking-[0.14em] text-voyage-muted mb-1">
                      {t("shop.bestSeason", "Best season")}
                    </span>
                    <span className="text-[0.85rem] font-semibold text-ink">
                      {data.season && data.season.length > 0
                        ? (() => {
                            const map: Record<string, string> = {
                              spring: "shop.season.spring",
                              summer: "shop.season.summer",
                              autumn: "shop.season.autumn",
                              fall: "shop.season.autumn",
                              winter: "shop.season.winter",
                            };
                            const labels = data.season.map((s) => {
                              const key = String(s).toLowerCase();
                              return map[key] ? t(map[key]) : s;
                            });
                            const andWord = lang === "pt" ? " e " : lang === "no" ? " og " : " and ";
                            if (labels.length === 1) return labels[0];
                            if (labels.length === 2) return labels.join(andWord);
                            return labels.slice(0, -1).join(", ") + andWord + labels[labels.length - 1];
                          })()
                        : "—"}
                    </span>
                  </div>
                  <div className="flex flex-col items-center text-center p-5 rounded-lg border border-ink/[0.06] bg-voyage-white">
                    <Wallet className="w-5 h-5 text-gold mb-2" />
                    <span className="text-[0.65rem] uppercase tracking-[0.14em] text-voyage-muted mb-1">
                      {t("shop.estimatedBudget")}
                    </span>
                    <span className="text-[0.85rem] font-semibold text-ink">
                      {data.estimated_trip_budget || "—"}
                    </span>
                  </div>
                </div>
              </div>



              {/* Gallery — asymmetric masonry */}
              {gallery.length > 0 && (
                <div className="mb-14">
                  <h2 className="font-serif text-[clamp(1.5rem,2.4vw,2rem)] font-bold text-ink mb-2">
                    {t("shop.gallery", "Glimpses")}
                  </h2>
                  <div className="h-px w-12 bg-gold mb-7" />
                  <div className="columns-1 sm:columns-2 lg:columns-3 gap-3 [column-fill:_balance]">
                    {gallery.map((url, i) => (
                      <img
                        key={i}
                        src={url}
                        alt={`${title} ${i + 1}`}
                        loading="lazy"
                        className="w-full mb-3 rounded-md object-cover break-inside-avoid"
                        style={{
                          aspectRatio: i % 3 === 0 ? "4/5" : i % 3 === 1 ? "3/2" : "1/1",
                        }}
                      />
                    ))}
                  </div>
                </div>
              )}
              </div>
            </div>

            {/* Route map */}
            {data.subpage_map_url && (
              <div className="mb-14">
                <h2 className="font-serif text-[clamp(1.5rem,2.4vw,2rem)] font-bold text-ink mb-2">
                  {t("shop.routeMap", "Route map")}
                </h2>
                <div className="h-px w-12 bg-gold mb-7" />
                <div className="rounded-lg overflow-hidden border border-ink/[0.06] bg-voyage-white aspect-[16/9]">
                  <iframe
                    src={data.subpage_map_url}
                    title={t("shop.routeMap", "Route map")}
                    className="w-full h-full"
                    style={{ border: 0 }}
                    allowFullScreen
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                  />
                </div>
              </div>
            )}
          </section>


        {/* 4. ABOUT TRAVEL DESIGNER */}
        <section className="bg-voyage-white border-y border-ink/[0.06]">
          <div className="max-w-6xl mx-auto px-16 max-md:px-6 py-20 max-md:py-14 grid grid-cols-1 md:grid-cols-[280px_1fr] gap-12 items-center">
            <div className="mx-auto md:mx-0">
              <div className="relative w-[240px] h-[300px] overflow-hidden rounded-md shadow-lg">
                <img
                  src={danielProfile}
                  alt="Daniel Lira Figueiredo"
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              </div>
            </div>
            <div>
              <div className="text-[0.65rem] font-semibold tracking-[0.22em] uppercase text-gold mb-4">
                {t("shop.designerBadge", "Designed for you")}
              </div>
              <h2 className="font-serif text-[clamp(1.6rem,2.6vw,2.2rem)] font-bold text-ink leading-tight mb-5">
                {t("shop.designerTitle", "Designed for you by Fjord & Waves Travel")}
              </h2>
              <p className="text-[0.95rem] text-ink/80 leading-relaxed mb-4">
                {t(
                  "shop.designerBio",
                  "I'm Daniel — a travel designer based between Norway and Brazil, with years of building journeys for travellers who want depth over checklists. Each itinerary in this catalogue began as a private trip plan, refined and shared so you can travel with the same care.",
                )}
              </p>
              <p className="font-serif italic text-[1.05rem] text-ink/80 leading-relaxed border-l-2 border-gold pl-5">
                {t(
                  "shop.designerQuote",
                  "Every itinerary is crafted with care, local knowledge, and a deep passion for meaningful travel.",
                )}
              </p>
            </div>
          </div>
        </section>

        {/* 5. WHY FJORD & WAVES */}
        <section className="px-16 max-md:px-6 py-20 max-md:py-14 max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <div className="text-[0.65rem] font-semibold tracking-[0.22em] uppercase text-gold mb-3">
              {t("shop.whyBadge", "Why Fjord & Waves")}
            </div>
            <h2 className="font-serif text-[clamp(1.6rem,2.6vw,2.2rem)] font-bold text-ink">
              {t("shop.whyTitle", "Travel, designed with intention")}
            </h2>
            <div className="h-px w-12 bg-gold mx-auto mt-5" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-7">
            {valueProps.map((v, i) => {
              const Icon = v.icon;
              return (
                <div key={i} className="text-center px-3">
                  <div className="w-12 h-12 mx-auto rounded-full bg-parchment-2 flex items-center justify-center mb-4">
                    <Icon className="w-5 h-5 text-gold" />
                  </div>
                  <p className="text-[0.9rem] text-ink/80 leading-relaxed">{v.label}</p>
                </div>
              );
            })}
          </div>
        </section>

        {/* 6. RELATED ITINERARIES */}
        {related.length > 0 && (
          <section className="bg-parchment-2 border-t border-ink/[0.06]">
            <div className="px-16 max-md:px-6 py-20 max-md:py-14 max-w-7xl mx-auto">
              <div className="flex items-end justify-between mb-10 max-md:flex-col max-md:items-start max-md:gap-4">
                <div>
                  <div className="text-[0.65rem] font-semibold tracking-[0.22em] uppercase text-gold mb-3">
                    {t("shop.relatedBadge", "More journeys")}
                  </div>
                  <h2 className="font-serif text-[clamp(1.6rem,2.6vw,2.2rem)] font-bold text-ink">
                    {t("shop.relatedTitle", "You might also love")}
                  </h2>
                </div>
                <Link
                  to="/catalogue"
                  className="text-[0.72rem] font-semibold tracking-[0.14em] uppercase text-ink hover:text-gold transition-colors"
                >
                  {t("shop.viewAll", "View all")} →
                </Link>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {related.map((r) => {
                  const rTitle = pick(lang, r.title_en, r.title_pt, r.title_no);
                  return (
                    <Link
                      key={r.id}
                      to={`/catalogue/${r.slug}`}
                      className="group block rounded-lg overflow-hidden border border-ink/[0.06] bg-voyage-white shadow-sm hover:shadow-lg transition-shadow"
                    >
                      <div className="aspect-[4/5] overflow-hidden bg-parchment-2">
                        {r.hero_image_url && (
                          <img
                            src={r.hero_image_url}
                            alt={rTitle}
                            loading="lazy"
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                        )}
                      </div>
                      <div className="p-6">
                        <div className="text-[0.65rem] tracking-[0.18em] uppercase text-gold mb-2">
                          {[r.destination, formatDuration(r.duration, t)].filter(Boolean).join(" · ")}
                        </div>
                        <h3 className="font-serif text-[1.15rem] font-bold text-ink mb-4 group-hover:text-gold transition-colors leading-snug">
                          {rTitle}
                        </h3>
                        <div className="flex items-center justify-between border-t border-parchment-3 pt-4">
                          <span className="font-serif text-[1.3rem] font-bold text-ink">
                            {formatPrice(r, lang, enPref)}
                          </span>
                          <span className="text-[0.7rem] font-semibold tracking-[0.14em] uppercase text-ink group-hover:text-gold transition-colors">
                            {t("shop.viewItinerary", "View")} →
                          </span>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          </section>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default ItineraryShopDetail;
