import { useState } from "react";
import ScrollReveal from "./ScrollReveal";
import { useTranslation } from "react-i18next";

const openTripPopup = (url: string) => {
  const w = Math.min(1200, window.screen.availWidth - 80);
  const h = Math.min(900, window.screen.availHeight - 80);
  const left = window.screen.availWidth / 2 - w / 2;
  const top = window.screen.availHeight / 2 - h / 2;
  const features = `popup=yes,width=${w},height=${h},left=${left},top=${top},scrollbars=yes,resizable=yes,noopener,noreferrer`;
  const win = window.open(url, "fjordwaves_trip_preview", features);
  if (win) win.focus();
};

const itineraries = [
  {
    title: "Rio Flow Experience — Surf. Move. Live.",
    location: "Rio de Janeiro, Brazil",
    duration: "10 Days",
    image: "https://media.fora.travel/foratravelportal/image/upload/c_limit,w_1600/f_auto/q_auto/v1/64947bea-5a0e-49a2-a2c4-63b4562dabb4?_a=BAVAZGID0",
    url: "https://trips.foratravel.com/i/0mksXRyeML",
    lang: "en",
  },
  {
    title: "Fjord & Waves — Norway Surf & Fjord Experience",
    location: "Nordfjord, Norway",
    duration: "6 Days",
    image: "https://media.fora.travel/foratravelportal/image/upload/c_limit,w_1600/f_auto/q_auto/v1/736dbd04-9878-47d8-92b7-ca0f931a2e3e?_a=BAVAZGID0",
    url: "https://trips.foratravel.com/i/Ui0sRK66Lf",
    lang: "en",
  },
  {
    title: "Norway's Hidden Gems",
    location: "Western Norway",
    duration: "10 Attractions",
    image: "https://media.fora.travel/foratravelportal/image/upload/c_limit,w_1600/f_auto/q_auto/v1/1d567416-cca5-4a8d-bba2-589cc915b4b8?_a=BAVAZGID0",
    url: "https://trips.foratravel.com/i/uopAhms8vz",
    lang: "en",
  },
  {
    title: "Verão na Noruega — Condado de Vestland",
    location: "Vestland, Norway",
    duration: "Itinerário Base",
    image: "https://media.fora.travel/foratravelportal/image/upload/c_limit,w_1600/f_auto/q_auto/v1/44024830-0b55-4ade-9055-9a7ab4d2acfd?_a=BAVAZGID0",
    url: "https://trips.foratravel.com/i/UqWIpF4Vw7",
    lang: "pt",
  },
  {
    title: "Norte da Itália — Experiência Premium",
    location: "Italy",
    duration: "10 Days",
    image: "https://media.fora.travel/foratravelportal/image/upload/c_limit,w_1600/f_auto/q_auto/v1/30fb1b96-88fb-4189-9801-55c4e975b70e?_a=BAVAZGID0",
    url: "https://trips.foratravel.com/i/vM5gVsy5yP",
    lang: "pt",
  },
  {
    title: "Sul da Itália — Experiência Premium",
    location: "Italy",
    duration: "10 Days",
    image: "https://media.fora.travel/foratravelportal/image/upload/c_limit,w_1600/f_auto/q_auto/v1/21f7e340-795e-40d0-9619-fe60374a329b?_a=BAVAZGID0",
    url: "https://trips.foratravel.com/i/D7NaPKgMr2",
    lang: "pt",
  },
];

const langFilters = [
  { key: "all", labelKey: "itineraryExamples.filterAll", flag: null },
  { key: "en", labelKey: "itineraryExamples.filterEn", flag: "https://flagcdn.com/w40/gb.png" },
  { key: "pt", labelKey: "itineraryExamples.filterPt", flag: "https://flagcdn.com/w40/br.png" },
];

const langFlags: Record<string, { src: string; alt: string }> = {
  en: { src: "https://flagcdn.com/w40/gb.png", alt: "English" },
  pt: { src: "https://flagcdn.com/w40/br.png", alt: "Português" },
  no: { src: "https://flagcdn.com/w40/no.png", alt: "Norsk" },
};

const getTripPreviewUrl = (url: string) => {
  const functionsUrl = import.meta.env.VITE_SUPABASE_URL;
  return `${functionsUrl}/functions/v1/trip-proxy?url=${encodeURIComponent(url)}`;
};

const ItineraryExamples = () => {
  const { t } = useTranslation();
  const [activeLang, setActiveLang] = useState<string>("all");
  const [openUrl, setOpenUrl] = useState<string | null>(null);
  const [openTitle, setOpenTitle] = useState<string>("");
  const [previewHtml, setPreviewHtml] = useState<string>("");
  const [previewError, setPreviewError] = useState<string>("");

  const displayItems = activeLang === "all" ? itineraries : itineraries.filter((trip) => trip.lang === activeLang);

  useEffect(() => {
    if (!openUrl) {
      setPreviewHtml("");
      setPreviewError("");
      return;
    }

    const controller = new AbortController();
    setPreviewHtml("");
    setPreviewError("");

    fetch(getTripPreviewUrl(openUrl), { signal: controller.signal, cache: "no-store" })
      .then(async (response) => {
        const html = await response.text();
        if (!response.ok) throw new Error(html || "Unable to load this trip preview");
        setPreviewHtml(html);
      })
      .catch((error) => {
        if (error.name !== "AbortError") setPreviewError(error.message || "Unable to load this trip preview");
      });

    return () => controller.abort();
  }, [openUrl]);

  return (
    <section className="py-28 px-16 bg-parchment max-md:px-6 max-md:py-16" id="itineraries">
      <ScrollReveal>
        <div className="text-[0.65rem] font-semibold tracking-[0.22em] uppercase text-gold mb-3">{t("itineraryExamples.badge")}</div>
      </ScrollReveal>
      <ScrollReveal>
        <h2 className="font-serif text-[clamp(2rem,3.5vw,3rem)] font-bold leading-[1.05] tracking-tight mb-4 text-ink">{t("itineraryExamples.title")}</h2>
      </ScrollReveal>
      <ScrollReveal>
        <p className="text-[0.92rem] text-voyage-muted max-w-[520px] leading-relaxed mb-8">{t("itineraryExamples.subtitle")}</p>
      </ScrollReveal>

      <div className="flex items-center gap-2 mb-10">
        {langFilters.map((f) => (
          <button
            key={f.key}
            onClick={() => setActiveLang(f.key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-full text-[0.8rem] font-medium border transition-all ${
              activeLang === f.key
                ? "bg-ink text-parchment border-ink"
                : "bg-transparent text-ink border-ink/20 hover:border-ink/40"
            }`}
          >
            {f.flag && (
              <img src={f.flag} alt={t(f.labelKey)} className="w-5 h-3.5 rounded-[2px] object-cover" />
            )}
            {t(f.labelKey)}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl">
        {displayItems.map((trip) => (
          <ScrollReveal key={trip.url}>
            <button
              type="button"
              onClick={() => { setOpenUrl(trip.url); setOpenTitle(trip.title); }}
              className="group block w-full rounded-lg overflow-hidden border border-ink/[0.06] bg-voyage-white shadow-sm hover:shadow-lg transition-shadow text-left cursor-pointer"
            >
              <div className="aspect-[16/10] overflow-hidden">
                <img src={trip.image} alt={trip.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" />
              </div>
              <div className="p-6 flex items-start justify-between gap-3">
                <div>
                  <h3 className="font-serif text-[1.1rem] font-bold text-ink mb-1.5 group-hover:text-gold transition-colors">{trip.title}</h3>
                  <p className="text-[0.8rem] text-voyage-muted">{trip.location} · {trip.duration}</p>
                </div>
                {langFlags[trip.lang] && (
                  <img
                    src={langFlags[trip.lang].src}
                    alt={langFlags[trip.lang].alt}
                    width={24}
                    height={16}
                    loading="lazy"
                    className="w-6 h-4 rounded-[2px] object-cover shrink-0 mt-1"
                    title={langFlags[trip.lang].alt}
                  />
                )}
              </div>
            </button>
          </ScrollReveal>
        ))}
      </div>

      {openUrl && (
        <div
          className="fixed inset-0 z-[100] bg-ink/70 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in"
          onClick={() => setOpenUrl(null)}
        >
          <div
            className="bg-voyage-white w-full max-w-6xl h-[90vh] rounded-lg overflow-hidden shadow-2xl flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 py-3 border-b border-ink/10 bg-parchment">
              <p className="font-serif text-[0.95rem] text-ink truncate pr-4">{openTitle}</p>
              <div className="flex items-center gap-3 flex-shrink-0">
                <a
                  href={openUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[0.7rem] tracking-[0.12em] uppercase text-gold hover:underline"
                >
                  {t("itineraryExamples.openInNewTab", "Open in new tab ↗")}
                </a>
                <button
                  type="button"
                  onClick={() => setOpenUrl(null)}
                  className="w-8 h-8 rounded-full hover:bg-ink/5 flex items-center justify-center text-ink text-lg leading-none"
                  aria-label="Close"
                >
                  ×
                </button>
              </div>
            </div>
            {previewError ? (
              <div className="flex-1 flex items-center justify-center bg-voyage-white px-6 text-center text-sm text-voyage-muted">
                {previewError}
              </div>
            ) : previewHtml ? (
              <iframe
                srcDoc={previewHtml}
                title={openTitle}
                className="flex-1 w-full border-0 bg-voyage-white"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="flex-1 flex items-center justify-center bg-voyage-white text-sm text-voyage-muted">
                {t("common.loading", "Loading...")}
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  );
};

export default ItineraryExamples;
