import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { Link, useParams, useSearchParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import Navbar from "@/components/voyage/Navbar";
import Footer from "@/components/voyage/Footer";

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
  gallery_images: string[];
  price_eur: number;
  is_published: boolean;
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

  const { data, isLoading } = useQuery({
    queryKey: ["catalog-itinerary", slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("catalog_itineraries")
        .select("*")
        .eq("slug", slug!)
        .eq("is_published", true)
        .maybeSingle();
      if (error) throw error;
      return data as CatalogItem | null;
    },
    enabled: !!slug,
  });

  const title = data ? pick(lang, data.title_en, data.title_pt, data.title_no) : "";
  const summary = data ? pick(lang, data.summary_en, data.summary_pt, data.summary_no) : "";
  const description = data ? pick(lang, data.description_en, data.description_pt, data.description_no) : "";
  const whatYouGet = data ? pick(lang, data.what_you_get_en, data.what_you_get_pt, data.what_you_get_no) : "";

  const wygItems = useMemo(
    () =>
      whatYouGet
        .split("\n")
        .map((s) => s.replace(/^[-•*]\s*/, "").trim())
        .filter(Boolean),
    [whatYouGet],
  );

  useEffect(() => {
    if (title) document.title = `${title} · Fjord & Waves Travel`;
  }, [title]);

  const handleBuy = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!data) return;
    setSubmitting(true);
    try {
      const { data: res, error } = await supabase.functions.invoke(
        "create-catalog-checkout",
        {
          body: {
            itinerary_id: data.id,
            email,
            origin: window.location.origin,
            language: lang,
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
          <Link to="/itineraries-shop" className="text-gold hover:underline">
            {t("shop.backToShop")}
          </Link>
        </main>
        <Footer />
      </div>
    );
  }

  const gallery = Array.isArray(data.gallery_images) ? data.gallery_images : [];

  return (
    <div className="min-h-screen bg-parchment">
      <Navbar />
      <main className="pt-28 pb-20 max-md:pt-24">
        {/* Hero */}
        <section className="px-16 max-md:px-6 mb-10">
          <Link
            to="/itineraries-shop"
            className="text-[0.75rem] text-voyage-muted hover:text-ink transition-colors no-underline"
          >
            {t("shop.backToShop")}
          </Link>
        </section>

        <section className="px-16 max-md:px-6 grid grid-cols-1 lg:grid-cols-[1.4fr_1fr] gap-12 max-w-7xl mx-auto">
          <div>
            {data.hero_image_url && (
              <div className="aspect-[16/10] overflow-hidden rounded-lg mb-6">
                <img
                  src={data.hero_image_url}
                  alt={title}
                  className="w-full h-full object-cover"
                />
              </div>
            )}
            <div className="text-[0.65rem] font-semibold tracking-[0.22em] uppercase text-gold mb-3">
              {[data.destination, data.duration].filter(Boolean).join(" · ")}
            </div>
            <h1 className="font-serif text-[clamp(1.8rem,3.5vw,3rem)] font-bold leading-[1.1] tracking-tight mb-4 text-ink">
              {title}
            </h1>
            {summary && (
              <p className="text-[1rem] text-voyage-muted leading-relaxed mb-8">
                {summary}
              </p>
            )}

            {description && (
              <div className="mb-10">
                <h2 className="font-serif text-[1.4rem] font-bold text-ink mb-3">
                  {t("shop.aboutItinerary")}
                </h2>
                <div className="text-[0.92rem] text-ink/80 leading-relaxed whitespace-pre-line">
                  {description}
                </div>
              </div>
            )}

            {gallery.length > 0 && (
              <div className="grid grid-cols-2 gap-3 mb-10">
                {gallery.map((url, i) => (
                  <img
                    key={i}
                    src={url}
                    alt={`${title} ${i + 1}`}
                    loading="lazy"
                    className="w-full aspect-[4/3] object-cover rounded"
                  />
                ))}
              </div>
            )}
          </div>

          {/* Buy panel */}
          <aside className="lg:sticky lg:top-28 self-start">
            <div className="bg-voyage-white border border-ink/[0.06] rounded-lg shadow-sm p-7">
              <div className="flex items-baseline justify-between mb-1">
                <span className="text-[0.7rem] uppercase tracking-[0.12em] text-voyage-muted">
                  {t("shop.buyNow")}
                </span>
                <span className="font-serif text-[2.2rem] font-bold text-ink leading-none">
                  €{Number(data.price_eur).toFixed(0)}
                </span>
              </div>
              <p className="text-[0.72rem] text-voyage-muted mb-6">
                {t("shop.instantDownload")}
              </p>

              {canceled && (
                <div className="mb-4 p-3 rounded bg-destructive/10 text-destructive text-[0.78rem]">
                  {t("shop.canceled")}
                </div>
              )}

              <form onSubmit={handleBuy} className="space-y-3">
                <label className="block text-[0.72rem] uppercase tracking-[0.1em] text-ink/70">
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
                  className="w-full px-5 py-3 rounded-sm bg-ink text-voyage-white text-[0.78rem] font-medium tracking-[0.12em] uppercase hover:bg-gold hover:text-ink transition-colors disabled:opacity-50"
                >
                  {submitting
                    ? t("shop.processing")
                    : `${t("shop.buyFor")} €${Number(data.price_eur).toFixed(0)}`}
                </button>
                <p className="text-[0.65rem] text-voyage-muted text-center pt-1">
                  🔒 {t("shop.securePayment")}
                </p>
              </form>

              {wygItems.length > 0 && (
                <div className="mt-7 pt-6 border-t border-parchment-3">
                  <h3 className="text-[0.72rem] uppercase tracking-[0.1em] text-ink/70 font-semibold mb-3">
                    {t("shop.whatYouGet")}
                  </h3>
                  <ul className="space-y-2">
                    {wygItems.map((item, i) => (
                      <li
                        key={i}
                        className="text-[0.85rem] text-ink/80 flex gap-2"
                      >
                        <span className="text-gold mt-1">✓</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="mt-6 grid gap-2 text-[0.78rem] text-voyage-muted">
                {data.duration && (
                  <div className="flex justify-between">
                    <span>{t("shop.duration")}</span>
                    <span className="text-ink">{data.duration}</span>
                  </div>
                )}
                {data.destination && (
                  <div className="flex justify-between">
                    <span>{t("shop.destination")}</span>
                    <span className="text-ink">{data.destination}</span>
                  </div>
                )}
                {data.group_size_label && (
                  <div className="flex justify-between">
                    <span>{t("shop.groupSize")}</span>
                    <span className="text-ink">{data.group_size_label}</span>
                  </div>
                )}
                {data.estimated_trip_budget && (
                  <div className="flex justify-between">
                    <span>{t("shop.estimatedBudget")}</span>
                    <span className="text-ink">{data.estimated_trip_budget}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Plan instead CTA */}
            <div className="mt-5 text-center">
              <span className="text-[0.78rem] text-voyage-muted">
                {t("shop.or")}{" "}
              </span>
              <button
                onClick={() => navigate("/plan-my-trip")}
                className="text-[0.78rem] text-gold hover:underline font-medium"
              >
                {t("shop.planInstead")}
              </button>
            </div>
          </aside>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default ItineraryShopDetail;
