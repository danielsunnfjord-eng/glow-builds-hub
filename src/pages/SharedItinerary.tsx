import { useEffect, useMemo, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useTranslation } from "react-i18next";
import type { ItineraryDay } from "@/lib/itineraryParser";
import logo from "@/assets/logo.webp";
import logoWhite from "@/assets/logo-white.webp";
import { markdownToHtml } from "@/components/voyage/editor/markdownHelpers";
import Seo from "@/components/Seo";

interface SharedItinerary {
  id: string;
  share_token: string;
  client_first_name: string;
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
}

const SharedItinerary = () => {
  const { token } = useParams<{ token: string }>();
  const { t, i18n } = useTranslation();
  const [data, setData] = useState<SharedItinerary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showInstall, setShowInstall] = useState(false);
  const [installPrompt, setInstallPrompt] = useState<any>(null);

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    (async () => {
      const { data: rows, error: err } = await supabase
        .rpc("get_shared_itinerary", { _token: token });
      if (cancelled) return;
      const row = Array.isArray(rows) ? rows[0] : rows;
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

  const htmlContent = useMemo(
    () => (data?.markdown_content ? markdownToHtml(data.markdown_content) : ""),
    [data?.markdown_content]
  );

  const handleExportPdf = () => {
    if (!data) return;
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;
    const title = `${t("aa.itinerary", "Itinerary")} — ${data.client_first_name}`;
    const headerTitle = data.destination
      ? `${data.destination} ${t("aa.itinerary", "Itinerary")}`
      : t("aa.itinerary", "Itinerary");
    const meta = [
      data.trip_duration,
      data.group_size > 1 ? `${data.group_size} ${t("aa.travellers", "travellers")}` : null,
    ]
      .filter(Boolean)
      .join(" · ");

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8" />
        <title>${title}</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700&family=Inter:wght@400;500;600&display=swap');
          body { font-family: 'Inter', sans-serif; color: #1a1a2e; max-width: 800px; margin: 0 auto; padding: 40px; line-height: 1.7; }
          h1, h2, h3 { font-family: 'Playfair Display', serif; color: #1a1a2e; }
          h1 { font-size: 28px; border-bottom: 2px solid #c9a96e; padding-bottom: 12px; margin-bottom: 24px; }
          h2 { font-size: 20px; color: #c9a96e; margin-top: 32px; }
          h3 { font-size: 16px; }
          p { margin: 8px 0; font-size: 14px; }
          ul, ol { margin: 8px 0; padding-left: 24px; font-size: 14px; }
          li { margin: 4px 0; }
          strong { color: #1a1a2e; }
          hr { border: none; border-top: 1px solid #e8e0d0; margin: 24px 0; }
          img { max-width: 100%; border-radius: 8px; margin: 16px 0; }
          figure { margin: 16px 0; }
          figcaption { font-size: 11px; color: #999; text-align: center; margin-top: 4px; }
          em { font-size: 11px; color: #999; }
          blockquote { border-left: 3px solid #c9a96e; padding-left: 16px; margin: 16px 0; color: #666; font-style: italic; }
          .header { text-align: center; margin-bottom: 40px; }
          .header .brand { font-family: 'Playfair Display', serif; font-size: 14px; letter-spacing: 0.15em; text-transform: uppercase; color: #c9a96e; }
          .footer { text-align: center; margin-top: 48px; font-size: 11px; color: #999; border-top: 1px solid #e8e0d0; padding-top: 16px; }
          @media print { body { padding: 20px; } img { page-break-inside: avoid; } h1, h2, h3 { page-break-after: avoid; } }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="brand">Fjord & Waves Travel</div>
          <h1>${headerTitle}</h1>
          <p style="font-size:13px;color:#777;">${t("aa.preparedFor", "Prepared for")} <strong>${data.client_first_name}</strong>${meta ? ` · ${meta}` : ""}</p>
        </div>
        <div id="content">${htmlContent}</div>
        <div class="footer">© ${new Date().getFullYear()} Fjord &amp; Waves Travel · Org.nr: 928804860</div>
        <script>setTimeout(() => window.print(), 400);<\/script>
      </body>
      </html>
    `);
    printWindow.document.close();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-parchment flex items-center justify-center">
        <div className="text-voyage-muted text-sm tracking-[0.15em] uppercase">
          {t("share.loading", "Loading your trip...")}
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-parchment flex flex-col items-center justify-center p-6 text-center">
        <img src={logo} alt="Fjord & Waves Travel" width={400} height={224} className="h-14 mb-6 opacity-90" />
        <h1 className="font-serif text-2xl text-ink mb-2">
          {t("share.notFoundTitle", "Itinerary not found")}
        </h1>
        <p className="text-voyage-muted text-sm mb-6 max-w-sm">
          {t("share.notFoundDesc", "This link may have expired or been removed. Please contact your travel advisor.")}
        </p>
        <Link to="/" className="text-gold text-sm tracking-[0.1em] uppercase hover:underline">
          ← {t("share.backHome", "Back to home")}
        </Link>
      </div>
    );
  }

  const coverImg = data.cover_image_url;
  const meta = [
    data.trip_duration,
    data.start_date && data.end_date
      ? `${new Date(data.start_date).toLocaleDateString(i18n.language, { day: "numeric", month: "short" })} – ${new Date(data.end_date).toLocaleDateString(i18n.language, { day: "numeric", month: "short", year: "numeric" })}`
      : null,
    data.group_size > 1 ? `${data.group_size} ${t("aa.travellers", "travellers")}` : null,
  ].filter(Boolean);

  return (
    <div className="min-h-screen bg-parchment pb-20">
      <Seo
        title={`${data.destination || "Itinerary"} — Fjord & Waves Travel`}
        description={`Private itinerary prepared for ${data.client_first_name} by Fjord & Waves Travel.`}
        path={`/trip/${token}`}
        noindex
      />
      {/* Install banner */}
      {showInstall && (
        <div className="sticky top-0 z-50 bg-ink text-voyage-white px-4 py-2.5 flex items-center justify-between gap-3 text-xs">
          <span>📱 {t("share.installPrompt", "Install this trip as an app for offline access")}</span>
          <div className="flex gap-2 flex-shrink-0">
            <button
              onClick={handleInstall}
              className="px-3 py-1 bg-gold text-ink rounded-sm font-semibold tracking-[0.06em] uppercase"
            >
              {t("share.install", "Install")}
            </button>
            <button
              onClick={() => setShowInstall(false)}
              className="text-voyage-white/60 hover:text-voyage-white"
            >
              ✕
            </button>
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
          <div className="absolute inset-0 bg-gradient-to-b from-ink/40 via-ink/30 to-ink/85" />
          <div className="relative h-full flex flex-col justify-between p-6 max-w-3xl mx-auto">
            {/* White logo on transparent background — crisp on dark cover */}
            <img
              src={logoWhite}
              alt="Fjord & Waves Travel"
              width={400}
              height={224}
              className="self-start h-12 w-auto block drop-shadow-md"
            />
            <div className="text-voyage-white">
              <p className="text-[0.65rem] tracking-[0.25em] uppercase text-gold mb-2">
                {t("share.preparedFor", "Prepared for")} {data.client_first_name}
              </p>
              <h1 className="font-serif text-3xl sm:text-4xl md:text-5xl leading-tight mb-3">
                {data.destination || t("aa.itinerary", "Itinerary")}
              </h1>
              <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs sm:text-sm text-voyage-white/85">
                {meta.map((m, i) => <span key={i}>{m}</span>)}
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 sm:px-6">
        {/* Action bar */}
        <div className="sticky top-0 z-30 -mx-4 sm:-mx-6 px-4 sm:px-6 py-3 bg-parchment/95 backdrop-blur-sm border-b border-parchment-3 flex items-center justify-between gap-3">
          <p className="text-[0.65rem] tracking-[0.2em] uppercase text-voyage-muted truncate">
            {t("share.yourItinerary", "Your itinerary")}
          </p>
          <button
            onClick={handleExportPdf}
            className="px-3 py-1.5 rounded-sm bg-gold text-ink text-[0.68rem] font-semibold tracking-[0.08em] uppercase hover:bg-gold-2 transition-colors flex-shrink-0"
          >
            📄 {t("aa.exportPdf", "Export PDF")}
          </button>
        </div>

        {/* Rich itinerary — renders the same markdown as the advisor preview / PDF */}
        <article className="py-6 sm:py-8">
          <div
            className="shared-itinerary-content bg-voyage-white border border-parchment-3 rounded-lg p-5 sm:p-8 shadow-xs"
            dangerouslySetInnerHTML={{ __html: htmlContent }}
          />
        </article>

        {/* Practical info */}
        {data.practical_info && Object.keys(data.practical_info).length > 0 && (
          <section className="mt-4 mb-8 bg-voyage-white border border-parchment-3 rounded-lg p-5">
            <h3 className="font-serif text-lg text-ink mb-3">
              {t("share.practicalInfo", "Practical information")}
            </h3>
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
        <footer className="text-center pt-8 pb-4">
          <img src={logo} alt="Fjord & Waves Travel" width={400} height={224} className="h-12 w-auto mx-auto mb-3 opacity-90" />
          <p className="text-[0.65rem] tracking-[0.2em] uppercase text-voyage-muted">
            Fjord &amp; Waves Travel · Org.nr 928804860
          </p>
        </footer>
      </main>

      {/* Scoped styles — mirror the PdfPreview component for visual parity */}
      <style>{`
        .shared-itinerary-content {
          font-family: 'Inter', 'Jost', sans-serif;
          color: hsl(var(--ink, 230 25% 14%));
          line-height: 1.75;
          font-size: 15px;
        }
        .shared-itinerary-content h1,
        .shared-itinerary-content h2,
        .shared-itinerary-content h3,
        .shared-itinerary-content h4 {
          font-family: 'Playfair Display', 'Libre Baskerville', serif;
          color: #1a1a2e;
        }
        .shared-itinerary-content h1 {
          font-size: 26px;
          border-bottom: 2px solid #c9a96e;
          padding-bottom: 10px;
          margin: 28px 0 16px;
        }
        .shared-itinerary-content h1:first-child { margin-top: 0; }
        .shared-itinerary-content h2 {
          font-size: 22px;
          color: #c9a96e;
          margin: 32px 0 12px;
        }
        .shared-itinerary-content h3 {
          font-size: 17px;
          margin: 22px 0 8px;
        }
        .shared-itinerary-content h4 {
          font-size: 15px;
          margin: 18px 0 6px;
          letter-spacing: 0.04em;
        }
        .shared-itinerary-content p {
          margin: 10px 0;
        }
        .shared-itinerary-content ul,
        .shared-itinerary-content ol {
          margin: 10px 0;
          padding-left: 24px;
        }
        .shared-itinerary-content li { margin: 6px 0; }
        .shared-itinerary-content strong { color: #1a1a2e; }
        .shared-itinerary-content hr {
          border: none;
          border-top: 1px solid #e8e0d0;
          margin: 28px 0;
        }
        .shared-itinerary-content img {
          max-width: 100%;
          height: auto;
          border-radius: 10px;
          margin: 18px 0;
          display: block;
        }
        .shared-itinerary-content figure { margin: 20px 0; }
        .shared-itinerary-content figure img { margin: 0 0 6px; }
        .shared-itinerary-content figcaption {
          font-size: 11px;
          color: #999;
          text-align: center;
        }
        .shared-itinerary-content em {
          font-style: italic;
          color: #555;
        }
        .shared-itinerary-content blockquote {
          border-left: 3px solid #c9a96e;
          padding-left: 16px;
          margin: 18px 0;
          color: #666;
          font-style: italic;
        }
        @media (max-width: 640px) {
          .shared-itinerary-content { font-size: 14px; }
          .shared-itinerary-content h1 { font-size: 22px; }
          .shared-itinerary-content h2 { font-size: 19px; }
        }
      `}</style>
    </div>
  );
};

export default SharedItinerary;
