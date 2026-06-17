import { useTranslation } from "react-i18next";
import { markdownToHtml } from "./editor/markdownHelpers";
import logoHorizontal from "@/assets/logo-horizontal.webp";
import logoHorizontalHd from "@/assets/logo-horizontal-hd.png";
import logoBadge from "@/assets/logo-badge.webp";

interface HotelPhoto {
  url?: string;
  credit?: string;
  caption?: string;
}

interface HotelRecPreview {
  id?: string;
  name?: string;
  location?: string;
  description?: string;
  perks?: string[];
  photos?: Array<HotelPhoto | string>;
  visible?: boolean;
}

interface PdfPreviewProps {
  content: string;
  language?: string;
  project: {
    client_name: string;
    destination?: string | null;
    trip_duration?: string | null;
    start_date?: string | null;
    end_date?: string | null;
    group_size?: number;
    hero_image_url?: string | null;
    hero_image_credit?: string | null;
    hero_image_caption?: string | null;
    cover_tagline?: string | null;
  } | null;
  hotels?: HotelRecPreview[];
  onClose: () => void;
  onExport: () => void;
}

const normalizePhoto = (p: HotelPhoto | string | undefined | null): HotelPhoto | null => {
  if (!p) return null;
  if (typeof p === "string") return { url: p, credit: "", caption: "" };
  if (typeof p === "object" && p.url) return { url: p.url, credit: p.credit || "", caption: p.caption || "" };
  return null;
};

const I18N: Record<string, Record<string, string>> = {
  en: {
    preparedFor: "Prepared exclusively for",
    valuedTraveller: "Valued Traveller",
    defaultTagline: "Your Journey, Curated.",
    journeyAwaits: "— A Journey Awaits —",
    whereToStayLabel: "Where to Stay",
    hotelRecs: "Hotel Recommendations",
    perks: "Exclusive perks",
    itinerary: "Itinerary",
    thankYou: "Thank you for trusting us\nwith your journey.",
    closingNote: "We are here every step of the way — before, during, and long after you return home.",
    dateLocale: "en-GB",
  },
  pt: {
    preparedFor: "Preparado exclusivamente para",
    valuedTraveller: "Viajante Especial",
    defaultTagline: "Sua Jornada, Curada.",
    journeyAwaits: "— Uma Jornada Espera Você —",
    whereToStayLabel: "Onde Ficar",
    hotelRecs: "Recomendações de Hotéis",
    perks: "Benefícios exclusivos",
    itinerary: "Roteiro",
    thankYou: "Obrigado por confiar a nós\na sua jornada.",
    closingNote: "Estamos com você em cada etapa — antes, durante e muito depois do seu retorno.",
    dateLocale: "pt-BR",
  },
  no: {
    preparedFor: "Utarbeidet eksklusivt for",
    valuedTraveller: "Verdsatt Reisende",
    defaultTagline: "Din Reise, Kuratert.",
    journeyAwaits: "— En Reise Venter —",
    whereToStayLabel: "Hvor du skal bo",
    hotelRecs: "Hotellanbefalinger",
    perks: "Eksklusive fordeler",
    itinerary: "Reiserute",
    thankYou: "Takk for at du betror oss\nreisen din.",
    closingNote: "Vi er med deg hele veien — før, under og lenge etter at du kommer hjem.",
    dateLocale: "nb-NO",
  },
};

const PdfPreview = ({ content, project, hotels, onClose, onExport, language }: PdfPreviewProps) => {
  const { i18n } = useTranslation();
  const lang = (language || i18n.language || "en").slice(0, 2).toLowerCase();
  const L = I18N[lang] || I18N.en;

  const formatDateRange = (start?: string | null, end?: string | null) => {
    if (!start && !end) return "";
    const fmt = (d: string) =>
      new Date(d).toLocaleDateString(L.dateLocale, {
        day: "numeric",
        month: "long",
        year: "numeric",
      });
    if (start && end) return `${fmt(start)} — ${fmt(end)}`;
    return fmt((start || end) as string);
  };

  const htmlContent = markdownToHtml(content);
  // Split the body content on manual page breaks so each chunk renders on its own A4 sheet.
  // Filter out empty / whitespace-only chunks (leading, trailing, or consecutive breaks) — these
  // would otherwise render as fully blank A4 sheets in both the preview and the printed PDF.
  const isMeaningfulChunk = (html: string) => {
    const stripped = html.replace(/<[^>]+>/g, "").replace(/&nbsp;/g, " ").trim();
    return stripped.length > 0 || /<img\b/i.test(html);
  };
  const contentChunks = htmlContent
    .split(/<div[^>]*class=["'][^"']*fjw-page-break[^"']*["'][^>]*>\s*<\/div>/i)
    .filter(isMeaningfulChunk);
  const tagline = project?.cover_tagline?.trim() || L.defaultTagline;
  const dateRange = formatDateRange(project?.start_date, project?.end_date);
  const visibleHotels = (hotels || []).filter((h) => h && h.visible !== false && (h.name || "").trim());

  const pageStyle: React.CSSProperties = {
    width: "210mm",
    maxWidth: "100%",
    minHeight: "297mm",
    maxHeight: "297mm",
    background: "#F6F4EE",
    margin: "0 auto 24px",
    boxShadow: "0 8px 40px rgba(19,17,14,0.18)",
    fontFamily: "'Montserrat', 'Inter', sans-serif",
    color: "#1E2D3D",
    position: "relative",
    overflow: "hidden",
    WebkitPrintColorAdjust: "exact",
    printColorAdjust: "exact",
  } as React.CSSProperties;

  return (
    <div
      className="absolute inset-0 z-[60] bg-ink/60 flex items-stretch justify-center p-4 fjw-pdf-shell"
      onPointerDown={(e) => e.stopPropagation()}
      onMouseDown={(e) => e.stopPropagation()}
      onClick={(e) => e.stopPropagation()}
      onWheel={(e) => e.stopPropagation()}
    >
      <div className="bg-[#f5f5f0] rounded-lg shadow-2xl w-full max-w-[940px] h-full min-h-0 flex flex-col overflow-hidden">
        {/* Header bar */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-parchment-3 bg-voyage-white fjw-no-print">
          <h3 className="text-sm font-serif font-semibold text-ink">
            👁️ PDF Preview
          </h3>
          <div className="flex gap-2">
            <button
              onClick={() => window.print()}
              className="px-4 py-1.5 text-[0.72rem] rounded border border-ink/30 text-ink font-semibold tracking-[0.06em] uppercase hover:bg-parchment-2 transition-colors"
            >
              🖨 Print
            </button>
            <button
              onClick={onExport}
              className="px-4 py-1.5 text-[0.72rem] rounded bg-gold text-ink font-semibold tracking-[0.06em] uppercase hover:bg-gold-2 transition-colors"
            >
              📄 Export PDF
            </button>
            <button
              onClick={onClose}
              className="text-voyage-muted hover:text-ink text-lg leading-none px-2"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Preview pages */}
        <div className="flex-1 min-h-0 h-0 overflow-y-scroll overscroll-contain touch-pan-y p-6 bg-[#e8e0d0] fjw-print-root">
          {/* ============ COVER PAGE ============ */}
          <div
            className="fjw-print-page"
            style={{
              ...pageStyle,
              display: "flex",
              flexDirection: "column",
            }}
          >
            {/* Top logo bar */}
            <div
              style={{
                padding: "12mm 20mm 0",
                display: "flex",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <img
                src={logoHorizontalHd}
                alt="Fjord & Waves Travel"
                crossOrigin="anonymous"
                style={{ height: "120px", width: "auto", maxWidth: "150mm", objectFit: "contain", display: "block" }}
              />
            </div>

            {/* Hero image — using <img> so it prints reliably */}
            <div
              style={{
                margin: "10mm 20mm 4mm",
                height: "95mm",
                borderRadius: "4px",
                overflow: "hidden",
                background: "linear-gradient(135deg, #A9C6C1 0%, #4C6F75 100%)",
                position: "relative",
                boxShadow: "0 10px 30px rgba(30,45,61,0.25)",
                flexShrink: 0,
              }}
            >
              {project?.hero_image_url ? (
                <img
                  src={project.hero_image_url}
                  alt={project?.destination || ""}
                  crossOrigin="anonymous"
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                    display: "block",
                  }}
                />
              ) : (
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#F6F4EE",
                    fontFamily: "'Cormorant Garamond', serif",
                    fontStyle: "italic",
                    fontSize: "18px",
                    letterSpacing: "0.1em",
                  }}
                >
                  {L.journeyAwaits}
                </div>
              )}
              {project?.hero_image_credit && (
                <div
                  style={{
                    position: "absolute",
                    bottom: 6,
                    right: 10,
                    fontSize: "8px",
                    color: "rgba(255,255,255,0.9)",
                    background: "rgba(0,0,0,0.35)",
                    padding: "2px 6px",
                    borderRadius: "2px",
                    letterSpacing: "0.04em",
                  }}
                >
                  {project.hero_image_credit}
                </div>
              )}
            </div>
            {project?.hero_image_caption && (
              <p
                style={{
                  margin: "0 20mm 6mm",
                  fontFamily: "'Cormorant Garamond', serif",
                  fontStyle: "italic",
                  fontSize: "13px",
                  color: "#4C6F75",
                  textAlign: "center",
                  flexShrink: 0,
                }}
              >
                {project.hero_image_caption}
              </p>
            )}

            {/* Client name + meta */}
            <div style={{ padding: "0 20mm", textAlign: "center", flexShrink: 0 }}>
              <p
                style={{
                  fontFamily: "'Montserrat', sans-serif",
                  fontSize: "10px",
                  letterSpacing: "0.32em",
                  textTransform: "uppercase",
                  color: "#4C6F75",
                  margin: "0 0 14px",
                }}
              >
                {L.preparedFor}
              </p>
              <h1
                style={{
                  fontFamily: "'Cormorant Garamond', serif",
                  fontSize: "42px",
                  fontWeight: 500,
                  color: "#1E2D3D",
                  margin: "0 0 14px",
                  lineHeight: 1.15,
                  letterSpacing: "0.01em",
                }}
              >
                {project?.client_name || L.valuedTraveller}
              </h1>
              <div
                style={{
                  width: "60px",
                  height: "1px",
                  background: "#DCCEB8",
                  margin: "0 auto 14px",
                }}
              />
              {project?.destination && (
                <p
                  style={{
                    fontFamily: "'Cormorant Garamond', serif",
                    fontSize: "20px",
                    fontStyle: "italic",
                    color: "#4C6F75",
                    margin: "0 0 12px",
                  }}
                >
                  {project.destination}
                </p>
              )}
              {dateRange && (
                <>
                  <div
                    style={{
                      width: "40px",
                      height: "1px",
                      background: "#DCCEB8",
                      margin: "0 auto 12px",
                    }}
                  />
                  <p
                    style={{
                      fontSize: "11px",
                      color: "#1E2D3D",
                      letterSpacing: "0.15em",
                      textTransform: "uppercase",
                      margin: 0,
                    }}
                  >
                    {dateRange}
                  </p>
                </>
              )}
            </div>

            {/* Spacer pushes tagline to bottom */}
            <div style={{ flex: 1, minHeight: "12mm" }} />

            {/* Tagline at bottom (in normal flow, not absolute, so it never overlaps) */}
            <div style={{ textAlign: "center", padding: "0 20mm 18mm", flexShrink: 0 }}>
              <p
                style={{
                  fontFamily: "'Cormorant Garamond', serif",
                  fontStyle: "italic",
                  fontSize: "20px",
                  color: "#1E2D3D",
                  letterSpacing: "0.04em",
                  margin: 0,
                }}
              >
                {tagline}
              </p>
              <div
                style={{
                  width: "30px",
                  height: "1px",
                  background: "#DCCEB8",
                  margin: "12px auto 0",
                }}
              />
            </div>
          </div>

          {/* ============ CONTENT PAGE(S) ============ */}
          {contentChunks.map((chunk, ci) => (
            <div
              key={`content-${ci}`}
              className="fjw-print-page"
              style={{
                ...pageStyle,
                background: "#FFFFFF",
                padding: "26mm 22mm 28mm",
                maxHeight: "none",
                overflow: "visible",
              }}
            >
              {/* Small header */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  borderBottom: "1px solid #DCCEB8",
                  paddingBottom: "10px",
                  marginBottom: "20px",
                }}
              >
                <img
                  src={logoHorizontal}
                  alt="Fjord & Waves"
                  crossOrigin="anonymous"
                  style={{ height: "22px" }}
                />
                <p
                  style={{
                    fontSize: "10px",
                    letterSpacing: "0.18em",
                    textTransform: "uppercase",
                    color: "#4C6F75",
                    margin: 0,
                  }}
                >
                  {project?.destination || L.itinerary}
                  {dateRange ? ` · ${dateRange}` : ""}
                </p>
              </div>

              <div
                className="pdf-preview-content"
                dangerouslySetInnerHTML={{ __html: chunk }}
              />

              {ci === contentChunks.length - 1 && (
                <div
                  style={{
                    textAlign: "center",
                    marginTop: "32px",
                    fontSize: "10px",
                    color: "#4C6F75",
                    borderTop: "1px solid #DCCEB8",
                    paddingTop: "12px",
                    letterSpacing: "0.1em",
                  }}
                >
                  © {new Date().getFullYear()} Fjord & Waves Travel · Org.nr: 928804860
                </div>
              )}
            </div>
          ))}

          {/* ============ WHERE TO STAY ============ */}
          {visibleHotels.length > 0 && (
            <div className="fjw-print-page" style={pageStyle}>
              <div style={{ padding: "20mm 20mm 18mm" }}>
                <div style={{ fontSize: "10px", letterSpacing: "0.2em", color: "#B48C3C", fontWeight: 700, textTransform: "uppercase" }}>
                  {L.whereToStayLabel}
                </div>
                <div style={{ width: "30px", height: "1px", background: "#B48C3C", margin: "6px 0 14px" }} />
                <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "30px", fontWeight: 600, color: "#1E2D3D", margin: "0 0 20px" }}>
                  {L.hotelRecs}
                </h2>

                {visibleHotels.map((h, idx) => {
                  const photos = (h.photos || [])
                    .map(normalizePhoto)
                    .filter((p): p is HotelPhoto => !!p && !!p.url)
                    .slice(0, 3);
                  return (
                    <div key={h.id || idx} style={{ marginBottom: "26px", paddingBottom: "20px", borderBottom: "1px solid #DCCEB8", pageBreakInside: "avoid", breakInside: "avoid" }}>
                      <h3 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "20px", fontWeight: 600, color: "#1E2D3D", margin: "0 0 4px" }}>
                        {h.name}
                      </h3>
                      {h.location && (
                        <div style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: "italic", fontSize: "13px", color: "#6E6E6E", marginBottom: "8px" }}>
                          {h.location}
                        </div>
                      )}
                      {h.description && (
                        <p style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "13px", color: "#1E2D3D", lineHeight: 1.55, margin: "0 0 10px" }}>
                          {h.description}
                        </p>
                      )}
                      {Array.isArray(h.perks) && h.perks.length > 0 && (
                        <div style={{ margin: "8px 0 12px" }}>
                          <div style={{ fontSize: "9px", letterSpacing: "0.18em", color: "#B48C3C", fontWeight: 700, textTransform: "uppercase", marginBottom: "6px" }}>
                            {L.perks}
                          </div>
                          <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                            {h.perks.map((p, i) => (
                              <li key={i} style={{ fontSize: "12px", color: "#1E2D3D", padding: "2px 0 2px 18px", position: "relative" }}>
                                <span style={{ position: "absolute", left: 0, color: "#B48C3C", fontWeight: 700 }}>✓</span>
                                {p}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {photos.length > 0 && (
                        <div style={{ display: "grid", gridTemplateColumns: `repeat(${photos.length}, 1fr)`, gap: "6px", marginTop: "10px" }}>
                          {photos.map((ph, i) => (
                            <div key={i}>
                              <div style={{ position: "relative", width: "100%", paddingBottom: "72%", borderRadius: "3px", overflow: "hidden", background: "#1E2D3D" }}>
                                <img
                                  src={ph.url}
                                  alt={ph.caption || ""}
                                  crossOrigin="anonymous"
                                  style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                                />
                                {ph.credit && (
                                  <div style={{ position: "absolute", right: 0, bottom: 0, background: "rgba(0,0,0,0.45)", color: "#fff", fontSize: "7px", padding: "2px 5px", letterSpacing: "0.04em" }}>
                                    {ph.credit}
                                  </div>
                                )}
                              </div>
                              {ph.caption && (
                                <div style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: "italic", fontSize: "9px", color: "#6E6E6E", marginTop: "4px", lineHeight: 1.35 }}>
                                  {ph.caption}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ============ BACK PAGE ============ */}
          <div
            className="fjw-print-page fjw-print-page-last"
            style={{
              ...pageStyle,
              background:
                "linear-gradient(180deg, #F6F4EE 0%, #DCCEB8 100%)",
            }}
          >
            <div
              style={{
                padding: "60mm 20mm 20mm",
                textAlign: "center",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                height: "100%",
              }}
            >
              <img
                src={logoBadge}
                alt="Fjord & Waves Travel"
                crossOrigin="anonymous"
                style={{ width: "110px", height: "110px", objectFit: "contain", marginBottom: "30px" }}
              />

              <h2
                style={{
                  fontFamily: "'Cormorant Garamond', serif",
                  fontSize: "34px",
                  fontWeight: 500,
                  color: "#1E2D3D",
                  margin: "0 0 18px",
                  lineHeight: 1.2,
                  whiteSpace: "pre-line",
                }}
              >
                {L.thankYou}
              </h2>

              <p
                style={{
                  fontFamily: "'Cormorant Garamond', serif",
                  fontStyle: "italic",
                  fontSize: "18px",
                  color: "#4C6F75",
                  maxWidth: "120mm",
                  margin: "0 auto 36px",
                  lineHeight: 1.6,
                }}
              >
                {L.closingNote}
              </p>

              <div
                style={{
                  width: "60px",
                  height: "1px",
                  background: "#4C6F75",
                  margin: "0 auto 30px",
                }}
              />

              {/* Contact */}
              <div
                style={{
                  fontSize: "12px",
                  color: "#1E2D3D",
                  lineHeight: 2,
                  letterSpacing: "0.05em",
                }}
              >
                <div>hello@fjordwavestravel.com</div>
                <div>fjordwavestravel.com</div>
              </div>

              {/* Social */}
              <div
                style={{
                  marginTop: "24px",
                  fontSize: "10px",
                  color: "#4C6F75",
                  letterSpacing: "0.25em",
                  textTransform: "uppercase",
                }}
              >
                Instagram · @fjordwavestravel
                <br />
                Facebook · Fjord &amp; Waves Travel
              </div>

              {/* Closing element */}
              <div style={{ marginTop: "auto", paddingTop: "30px" }}>
                <div
                  style={{
                    width: "1px",
                    height: "40px",
                    background: "#4C6F75",
                    margin: "0 auto 14px",
                  }}
                />
                <p
                  style={{
                    fontFamily: "'Cormorant Garamond', serif",
                    fontStyle: "italic",
                    fontSize: "14px",
                    color: "#1E2D3D",
                    margin: 0,
                    letterSpacing: "0.08em",
                  }}
                >
                  Fjord &amp; Waves Travel
                </p>
                <p
                  style={{
                    fontSize: "9px",
                    color: "#4C6F75",
                    margin: "6px 0 0",
                    letterSpacing: "0.18em",
                    textTransform: "uppercase",
                  }}
                >
                  Org.nr 928804860
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Print isolation + reliable image/page rendering */}
      <style>{`
        @media print {
          @page { size: A4; margin: 0; }
          html, body {
            margin: 0 !important;
            padding: 0 !important;
            background: #fff !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          body * { visibility: hidden !important; }
          .fjw-pdf-shell, .fjw-pdf-shell * { visibility: visible !important; }
          .fjw-no-print { display: none !important; }
          .fjw-pdf-shell {
            position: absolute !important;
            inset: auto !important;
            top: 0 !important;
            left: 0 !important;
            right: 0 !important;
            padding: 0 !important;
            margin: 0 !important;
            background: #fff !important;
            display: block !important;
            height: auto !important;
            min-height: 0 !important;
            overflow: visible !important;
          }
          .fjw-pdf-shell > div {
            width: 100% !important;
            max-width: none !important;
            max-height: none !important;
            height: auto !important;
            min-height: 0 !important;
            box-shadow: none !important;
            border-radius: 0 !important;
            overflow: visible !important;
            background: #fff !important;
            display: block !important;
          }
          .fjw-print-root {
            padding: 0 !important;
            background: #fff !important;
            overflow: visible !important;
            height: auto !important;
            min-height: 0 !important;
            display: block !important;
          }
          .fjw-print-page {
            margin: 0 !important;
            box-shadow: none !important;
            border-radius: 0 !important;
            width: 210mm !important;
            /* Let each sheet grow with its content so long chunks auto-paginate;
               page-break-after below forces a clean A4 break between sheets. */
            min-height: 0 !important;
            height: auto !important;
            page-break-after: always !important;
            break-after: page !important;
            page-break-inside: auto !important;
            break-inside: auto !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .fjw-print-page-last {
            page-break-after: auto !important;
            break-after: auto !important;
          }
          .fjw-print-page img {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            image-rendering: auto;
          }
        }
      `}</style>
    </div>
  );
};

export default PdfPreview;
