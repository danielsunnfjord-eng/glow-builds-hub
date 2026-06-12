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

const formatDateRange = (start?: string | null, end?: string | null) => {
  if (!start && !end) return "";
  const fmt = (d: string) =>
    new Date(d).toLocaleDateString("en-GB", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  if (start && end) return `${fmt(start)} — ${fmt(end)}`;
  return fmt((start || end) as string);
};

const PdfPreview = ({ content, project, onClose, onExport }: PdfPreviewProps) => {
  const { t } = useTranslation();
  const htmlContent = markdownToHtml(content);
  const tagline = project?.cover_tagline?.trim() || "Your Journey, Curated.";
  const dateRange = formatDateRange(project?.start_date, project?.end_date);

  const pageStyle: React.CSSProperties = {
    width: "210mm",
    maxWidth: "100%",
    minHeight: "297mm",
    background: "#F6F4EE",
    margin: "0 auto 24px",
    boxShadow: "0 8px 40px rgba(19,17,14,0.18)",
    fontFamily: "'Montserrat', 'Inter', sans-serif",
    color: "#1E2D3D",
    position: "relative",
    overflow: "hidden",
  };

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
            👁️ {t("aa.pdfPreview", "PDF Preview")}
          </h3>
          <div className="flex gap-2">
            <button
              onClick={onExport}
              className="px-4 py-1.5 text-[0.72rem] rounded bg-gold text-ink font-semibold tracking-[0.06em] uppercase hover:bg-gold-2 transition-colors"
            >
              📄 {t("aa.exportPdf")}
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
          <div className="fjw-print-page" style={pageStyle}>
            {/* Top logo bar */}
            <div
              style={{
                padding: "12mm 20mm 0",
                display: "flex",
                justifyContent: "center",
              }}
            >
              <img
                src={logoHorizontalHd}
                alt="Fjord & Waves Travel"
                style={{ height: "150px", width: "auto", maxWidth: "150mm", objectFit: "contain", display: "block" }}
              />
            </div>

            {/* Hero image */}
            <div
              style={{
                margin: "18mm 20mm 4mm",
                height: "120mm",
                borderRadius: "4px",
                overflow: "hidden",
                background: project?.hero_image_url
                  ? `#1E2D3D url(${project.hero_image_url}) center/cover no-repeat`
                  : "linear-gradient(135deg, #A9C6C1 0%, #4C6F75 100%)",
                position: "relative",
                boxShadow: "0 10px 30px rgba(30,45,61,0.25)",
              }}
            >
              {!project?.hero_image_url && (
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
                  — A Journey Awaits —
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
                  margin: "0 20mm 10mm",
                  fontFamily: "'Cormorant Garamond', serif",
                  fontStyle: "italic",
                  fontSize: "13px",
                  color: "#4C6F75",
                  textAlign: "center",
                }}
              >
                {project.hero_image_caption}
              </p>
            )}

            {/* Client name + meta */}
            <div style={{ padding: "0 20mm", textAlign: "center" }}>
              <p
                style={{
                  fontFamily: "'Montserrat', sans-serif",
                  fontSize: "10px",
                  letterSpacing: "0.32em",
                  textTransform: "uppercase",
                  color: "#4C6F75",
                  marginBottom: "10px",
                }}
              >
                Prepared exclusively for
              </p>
              <h1
                style={{
                  fontFamily: "'Cormorant Garamond', serif",
                  fontSize: "48px",
                  fontWeight: 500,
                  color: "#1E2D3D",
                  margin: "0 0 14px",
                  lineHeight: 1.1,
                  letterSpacing: "0.01em",
                }}
              >
                {project?.client_name || "Valued Traveller"}
              </h1>
              <div
                style={{
                  width: "60px",
                  height: "1px",
                  background: "#DCCEB8",
                  margin: "12px auto 14px",
                }}
              />
              <p
                style={{
                  fontFamily: "'Cormorant Garamond', serif",
                  fontSize: "22px",
                  fontStyle: "italic",
                  color: "#4C6F75",
                  margin: "0 0 4px",
                }}
              >
                {project?.destination || ""}
              </p>
              {dateRange && (
                <p
                  style={{
                    fontSize: "12px",
                    color: "#1E2D3D",
                    letterSpacing: "0.15em",
                    textTransform: "uppercase",
                    margin: "8px 0 0",
                  }}
                >
                  {dateRange}
                </p>
              )}
            </div>

            {/* Tagline at bottom */}
            <div
              style={{
                position: "absolute",
                left: 0,
                right: 0,
                bottom: "24mm",
                textAlign: "center",
              }}
            >
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
          <div
            className="fjw-print-page"
            style={{
              ...pageStyle,
              background: "#FFFFFF",
              padding: "22mm 22mm 26mm",
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
                {project?.destination || "Itinerary"}
                {dateRange ? ` · ${dateRange}` : ""}
              </p>
            </div>

            <div
              className="pdf-preview-content"
              dangerouslySetInnerHTML={{ __html: htmlContent }}
            />

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
          </div>

          {/* ============ BACK PAGE ============ */}
          <div
            className="fjw-print-page"
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
                }}
              >
                Thank you for trusting us
                <br />
                with your journey.
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
                We are here every step of the way — before, during,
                and long after you return home.
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

      {/* Print isolation: hide app shell, show only print pages */}
      <style>{`
        @media print {
          body * { visibility: hidden !important; }
          .fjw-pdf-shell, .fjw-pdf-shell * { visibility: visible !important; }
          .fjw-pdf-shell {
            position: fixed !important;
            inset: 0 !important;
            padding: 0 !important;
            background: #fff !important;
          }
          .fjw-pdf-shell > div {
            max-width: none !important;
            max-height: none !important;
            box-shadow: none !important;
            border-radius: 0 !important;
            overflow: visible !important;
            background: #fff !important;
          }
          .fjw-print-root {
            padding: 0 !important;
            background: #fff !important;
            overflow: visible !important;
          }
        }
      `}</style>
    </div>
  );
};

export default PdfPreview;
