import { useEffect, useMemo, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useTranslation } from "react-i18next";
import type { ItineraryDay, ItineraryItem } from "@/lib/itineraryParser";
import logo from "@/assets/logo.png";

interface SharedItinerary {
  id: string;
  share_token: string;
  client_name: string;
  destination: string | null;
  trip_duration: string | null;
  start_date: string | null;
  end_date: string | null;
  group_size: number;
  language: string;
  cover_image_url: string | null;
  markdown_content: string;
  days: ItineraryDay[];
  practical_info: Record<string, string>;
  is_published: boolean;
}

const TYPE_ICON: Record<NonNullable<ItineraryItem["type"]>, string> = {
  activity: "🌟",
  meal: "🍽️",
  transport: "✈️",
  stay: "🏨",
  note: "📝",
};

const SharedItinerary = () => {
  const { token } = useParams<{ token: string }>();
  const { t, i18n } = useTranslation();
  const [data, setData] = useState<SharedItinerary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeDay, setActiveDay] = useState(0);
  const [showInstall, setShowInstall] = useState(false);
  const [installPrompt, setInstallPrompt] = useState<any>(null);

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    (async () => {
      const { data: row, error: err } = await supabase
        .from("shared_itineraries")
        .select("*")
        .eq("share_token", token)
        .eq("is_published", true)
        .maybeSingle();
      if (cancelled) return;
      if (err || !row) {
        setError("not_found");
        setLoading(false);
        return;
      }
      setData(row as unknown as SharedItinerary);
      if (row.language && i18n.language !== row.language) {
        i18n.changeLanguage(row.language);
      }
      setLoading(false);
      // Fire-and-forget view counter
      supabase.rpc("increment_itinerary_view", { _token: token });
    })();
    return () => {
      cancelled = true;
    };
  }, [token, i18n]);

  // PWA install prompt
  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e);
      setShowInstall(true);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstall = async () => {
    if (!installPrompt) return;
    installPrompt.prompt();
    await installPrompt.userChoice;
    setShowInstall(false);
    setInstallPrompt(null);
  };

  const days = useMemo(() => data?.days ?? [], [data]);
  const current = days[activeDay];

  if (loading) {
    return (
      <div className="min-h-screen bg-parchment flex items-center justify-center">
        <div className="text-voyage-muted text-sm tracking-[0.15em] uppercase">{t("share.loading", "Loading your trip...")}</div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-parchment flex flex-col items-center justify-center p-6 text-center">
        <img src={logo} alt="Fjord & Waves Travel" className="h-12 mb-6 opacity-70" />
        <h1 className="font-serif text-2xl text-ink mb-2">{t("share.notFoundTitle", "Itinerary not found")}</h1>
        <p className="text-voyage-muted text-sm mb-6 max-w-sm">{t("share.notFoundDesc", "This link may have expired or been removed. Please contact your travel advisor.")}</p>
        <Link to="/" className="text-gold text-sm tracking-[0.1em] uppercase hover:underline">← {t("share.backHome", "Back to home")}</Link>
      </div>
    );
  }

  const coverImg = data.cover_image_url;

  return (
    <div className="min-h-screen bg-parchment pb-20">
      {/* Install banner */}
      {showInstall && (
        <div className="sticky top-0 z-50 bg-ink text-voyage-white px-4 py-2.5 flex items-center justify-between gap-3 text-xs">
          <span>📱 {t("share.installPrompt", "Install this trip as an app for offline access")}</span>
          <div className="flex gap-2 flex-shrink-0">
            <button onClick={handleInstall} className="px-3 py-1 bg-gold text-ink rounded font-semibold tracking-[0.06em] uppercase">
              {t("share.install", "Install")}
            </button>
            <button onClick={() => setShowInstall(false)} className="text-voyage-white/60 hover:text-voyage-white">✕</button>
          </div>
        </div>
      )}

      {/* Hero */}
      <header className="relative">
        <div
          className="h-[55vh] min-h-[320px] max-h-[480px] bg-ink relative overflow-hidden"
          style={
            coverImg
              ? { backgroundImage: `url(${coverImg})`, backgroundSize: "cover", backgroundPosition: "center" }
              : undefined
          }
        >
          <div className="absolute inset-0 bg-gradient-to-b from-ink/40 via-ink/30 to-ink/80" />
          <div className="relative h-full flex flex-col justify-between p-6 max-w-3xl mx-auto">
            <img src={logo} alt="Fjord & Waves Travel" className="h-9 invert opacity-90" />
            <div className="text-voyage-white">
              <p className="text-[0.65rem] tracking-[0.25em] uppercase text-gold mb-2">
                {t("share.preparedFor", "Prepared for")} {data.client_name}
              </p>
              <h1 className="font-serif text-3xl sm:text-4xl md:text-5xl leading-tight mb-3">
                {data.destination || t("aa.itinerary", "Itinerary")}
              </h1>
              <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs sm:text-sm text-voyage-white/85">
                {data.trip_duration && <span>📅 {data.trip_duration}</span>}
                {data.start_date && data.end_date && (
                  <span>
                    {new Date(data.start_date).toLocaleDateString(i18n.language, { day: "numeric", month: "short" })}
                    {" – "}
                    {new Date(data.end_date).toLocaleDateString(i18n.language, { day: "numeric", month: "short", year: "numeric" })}
                  </span>
                )}
                {data.group_size > 1 && <span>👥 {data.group_size} {t("aa.travellers", "travellers")}</span>}
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 sm:px-6">
        {/* Day tabs */}
        {days.length > 0 && (
          <nav className="sticky top-0 z-30 -mx-4 sm:-mx-6 px-4 sm:px-6 py-3 bg-parchment/95 backdrop-blur border-b border-parchment-3 overflow-x-auto">
            <div className="flex gap-2 min-w-max">
              {days.map((d, i) => (
                <button
                  key={d.day}
                  onClick={() => setActiveDay(i)}
                  className={`px-4 py-2 rounded-full text-xs font-semibold tracking-[0.08em] uppercase whitespace-nowrap transition-colors ${
                    i === activeDay
                      ? "bg-ink text-voyage-white"
                      : "bg-voyage-white text-ink border border-parchment-3 hover:border-gold"
                  }`}
                >
                  {t("share.day", "Day")} {d.day}
                </button>
              ))}
            </div>
          </nav>
        )}

        {/* Active day */}
        {current ? (
          <section className="py-6 sm:py-8">
            <div className="mb-6">
              <p className="text-[0.65rem] tracking-[0.25em] uppercase text-gold mb-2">
                {t("share.day", "Day")} {current.day}
              </p>
              <h2 className="font-serif text-2xl sm:text-3xl text-ink leading-tight">{current.title}</h2>
              {current.location && (
                <p className="text-voyage-muted text-sm mt-1">📍 {current.location}</p>
              )}
              {current.summary && (
                <p className="text-ink/80 text-sm mt-3 leading-relaxed">{current.summary}</p>
              )}
            </div>

            {/* Timeline */}
            <ol className="relative space-y-4">
              {current.items.map((item, idx) => (
                <li key={idx} className="bg-voyage-white border border-parchment-3 rounded-lg overflow-hidden shadow-sm">
                  {item.image_url && (
                    <img src={item.image_url} alt={item.title} className="w-full h-44 object-cover" loading="lazy" />
                  )}
                  <div className="p-4">
                    <div className="flex items-start gap-3">
                      <div className="text-xl flex-shrink-0 mt-0.5">{TYPE_ICON[item.type || "activity"]}</div>
                      <div className="flex-1 min-w-0">
                        {item.time && (
                          <p className="text-[0.65rem] tracking-[0.2em] uppercase text-gold font-semibold mb-1">{item.time}</p>
                        )}
                        <h3 className="font-serif text-base text-ink leading-snug">{item.title}</h3>
                        {item.description && (
                          <p className="text-ink/75 text-sm mt-1.5 leading-relaxed">{item.description}</p>
                        )}
                        {item.location && (
                          <a
                            href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(item.location)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 mt-2 text-xs text-gold hover:underline"
                          >
                            📍 {item.location}
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ol>

            {current.items.length === 0 && (
              <p className="text-voyage-muted text-sm italic text-center py-8">{t("share.noItems", "No activities planned for this day yet.")}</p>
            )}
          </section>
        ) : (
          // No structured days — fallback: render markdown plainly
          <section className="py-8">
            <div className="bg-voyage-white border border-parchment-3 rounded-lg p-6 prose prose-sm max-w-none whitespace-pre-wrap text-ink/85 leading-relaxed">
              {data.markdown_content}
            </div>
          </section>
        )}

        {/* Practical info */}
        {data.practical_info && Object.keys(data.practical_info).length > 0 && (
          <section className="mt-4 mb-8 bg-voyage-white border border-parchment-3 rounded-lg p-5">
            <h3 className="font-serif text-lg text-ink mb-3">{t("share.practicalInfo", "Practical information")}</h3>
            <dl className="space-y-2 text-sm">
              {Object.entries(data.practical_info).map(([k, v]) => (
                <div key={k}>
                  <dt className="text-[0.65rem] tracking-[0.15em] uppercase text-voyage-muted">{k}</dt>
                  <dd className="text-ink mt-0.5">{v}</dd>
                </div>
              ))}
            </dl>
          </section>
        )}

        {/* Footer */}
        <footer className="text-center text-[0.65rem] tracking-[0.15em] uppercase text-voyage-muted pt-6">
          <img src={logo} alt="" className="h-8 mx-auto mb-2 opacity-60" />
          Fjord &amp; Waves Travel · Org.nr 928804860
        </footer>
      </main>
    </div>
  );
};

export default SharedItinerary;
