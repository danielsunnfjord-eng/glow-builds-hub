import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useTranslation } from "react-i18next";
import { Previewer } from "pagedjs";
import { markdownToHtml } from "./editor/markdownHelpers";
import PdfJsViewer from "./PdfJsViewer";
import logoHorizontal from "@/assets/logo-horizontal.webp";
import logoBadgeHd from "@/assets/logo-badge-hd.png";
import logoBadge from "@/assets/logo-badge.webp";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";


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
  contentHtml?: string; // pre-sanitised HTML; overrides markdown rendering when present
  bodyPdfUrl?: string | null; // when present, the body HTML is skipped and this PDF is merged between cover and hotels/back
  language?: string;
  project: {
    client_name: string;
    title?: string | null;
    destination?: string | null;
    trip_duration?: string | null;
    start_date?: string | null;
    end_date?: string | null;
    group_size?: number;
    hero_image_url?: string | null;
    hero_image_credit?: string | null;
    hero_image_caption?: string | null;
    cover_tagline?: string | null;
    season?: string[] | string | null;
    estimated_trip_budget?: string | null;
  } | null;
  hotels?: HotelRecPreview[];
  onClose: () => void;
  onExport: () => void;
  attachToCatalogId?: string; // when set, shows an "Attach to Store" button that uploads the merged PDF to catalog-pdfs and updates pdf_path
}


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
    coverEyebrow: "A pre-designed and inspirational itinerary",
    duration: "Duration",
    region: "Region",
    season: "Season",
    estimatedBudget: "Estimated Budget",
    advisorRole: "Your Travel Advisor · Fjord & Waves Travel",
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
    coverEyebrow: "Um roteiro pré-desenhado e inspirador",
    duration: "Duração",
    region: "Região",
    season: "Estação",
    estimatedBudget: "Orçamento Estimado",
    advisorRole: "Seu Consultor de Viagem · Fjord & Waves Travel",
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
    coverEyebrow: "En forhåndsdesignet og inspirerende reiserute",
    duration: "Varighet",
    region: "Region",
    season: "Sesong",
    estimatedBudget: "Estimert budsjett",
    advisorRole: "Din reiserådgiver · Fjord & Waves Travel",
  },
};

const PAGE_CSS = `
@page { size: 210mm 297mm; margin: 20mm; }
@page cover { size: 210mm 297mm; margin: 0; }
@page back { size: 210mm 297mm; margin: 0; }

.fjw-paged-document {
  font-family: 'Montserrat', 'Inter', sans-serif;
  color: #1E2D3D;
  font-size: 14px;
  line-height: 1.75;
}

/* ========== COVER PAGE ==========
   Fixed-height layout. Every section has an explicit height in mm so
   Paged.js can never split the cover across two pages, and no child
   can push another off the bottom. Heights sum to 297mm (A4). */
.fjw-cover-page {
  page: cover;
  height: 297mm;
  width: 210mm;
  max-height: 297mm;
  overflow: hidden;
  background: #f5f1ea;
  margin: 0;
  padding: 0;
  position: relative;
  display: block;
  page-break-after: always;
  break-after: page;
}
.fjw-cover-page,
.fjw-cover-page * {
  box-sizing: border-box;
}
.fjw-back-page {
  page: back;
  height: 297mm;
  max-height: 297mm;
  overflow: hidden;
  break-after: page;
  page-break-after: always;
  text-align: center;
  display: flex;
  flex-direction: column;
}

/* 1. Logo block — 10% */
.fjw-cover-logo-block {
  height: 30mm;
  display: flex; align-items: center; justify-content: center;
  background: #f5f1ea;
  overflow: hidden;
}
.fjw-cover-logo-img {
  max-height: 24mm; width: auto; display: block;
}

/* 2. Hero image — 32% */
.fjw-cover-hero {
  position: relative;
  width: 100%;
  height: 95mm;
  overflow: hidden;
  background: #1c2e38;
}
.fjw-cover-hero img {
  width: 100%; height: 100%; object-fit: cover; display: block;
}
.fjw-cover-placeholder {
  height: 100%; width: 100%; background: #1c2e38;
}

/* 3. Photo credit — 3% (fixed; rendered even when empty so layout never shifts) */
.fjw-cover-credit {
  height: 9mm;
  width: 100%;
  text-align: right;
  font-family: 'Jost', 'Montserrat', sans-serif;
  font-size: 8px;
  font-weight: 300;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: #8fa0a8;
  padding: 3mm 14mm 0;
  overflow: hidden;
}

/* Body wrapper — fills the remaining 158mm with fixed-height children */
.fjw-cover-body {
  height: 158mm;
  display: block;
  text-align: center;
  padding: 0 22mm;
  overflow: hidden;
  position: relative;
}

/* 4. Eyebrow / tagline — 4% (~12mm) */
.fjw-cover-eyebrow {
  height: 12mm;
  margin: 0;
  padding-top: 4mm;
  font-family: 'Jost', 'Montserrat', sans-serif;
  font-size: 9px; letter-spacing: 0.32em; text-transform: uppercase;
  color: #8fa0a8; font-weight: 400;
  overflow: hidden;
}

/* 5. Title — 12% (~36mm) */
.fjw-cover-title {
  height: 36mm;
  margin: 0 auto 8px;
  padding: 0;
  display: flex; align-items: center; justify-content: center;
  font-family: 'Playfair Display', 'Cormorant Garamond', serif;
  font-size: 30px; font-weight: 500; line-height: 1.15;
  letter-spacing: -0.005em; color: #1c2e38;
  max-width: 150mm;
  overflow: hidden;
}

/* 6. Short description — expanded to fit longer intros without clipping. */
.fjw-cover-description {
  height: 70mm;
  margin: 8px auto 0;
  padding: 0 0 4mm;
  font-family: 'Cormorant Garamond', serif;
  font-style: italic; font-weight: 400;
  font-size: clamp(12px, 1.3vw, 16px); line-height: 1.6;
  color: #2e4450; max-width: 145mm;
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 9;
  -webkit-box-orient: vertical;
}

/* 7. Metadata strip — pinned to bottom of body */
.fjw-cover-meta {
  height: 35mm;
  display: flex; justify-content: center; align-items: center;
  margin: 0 auto; width: 100%; max-width: 170mm;
  padding: 4mm 0;
  overflow: hidden;
}

.fjw-cover-meta-col {
  flex: 1; display: flex; flex-direction: column;
  align-items: center; justify-content: center;
  padding: 0 4mm;
  min-width: 0;
}
.fjw-cover-meta-col + .fjw-cover-meta-col {
  border-left: 1px solid #c4d4da;
}
.fjw-cover-meta-label {
  font-family: 'Jost', 'Montserrat', sans-serif;
  font-size: 8px; letter-spacing: 0.24em;
  color: #8fa0a8; text-transform: uppercase;
  margin-bottom: 3mm; font-weight: 400;
  white-space: nowrap;
}
.fjw-cover-meta-value {
  font-family: 'Playfair Display', 'Cormorant Garamond', serif;
  font-size: 14px; color: #1c2e38; font-weight: 400;
  line-height: 1.25;
}

/* 8. Footer teal accent bar */
.fjw-cover-page::after {
  content: "";
  position: absolute; left: 0; right: 0; bottom: 0;
  width: 100%; height: 5mm; background: #4C6F75;
}


.fjw-photo-credit {
  position: absolute; right: 8px; bottom: 5px; color: rgba(255,255,255,0.92);
  background: rgba(0,0,0,0.35); padding: 2px 5px; border-radius: 2px;
  font-size: 7px; letter-spacing: 0.04em;
}

.fjw-running-header {
  display: flex; justify-content: space-between; align-items: center;
  border-bottom: 1px solid #DCCEB8; padding-bottom: 10px; margin-bottom: 20px;
  break-inside: avoid; page-break-inside: avoid;
}
.fjw-running-header img { height: 22px; width: auto; display: block; }
.fjw-running-header p { margin: 0; font-size: 10px; letter-spacing: 0.18em; text-transform: uppercase; color: #4C6F75; }
.fjw-print-footer {
  text-align: center; margin-top: 32px; font-size: 10px; color: #4C6F75;
  border-top: 1px solid #DCCEB8; padding-top: 12px; letter-spacing: 0.1em;
}

.pdf-preview-content,
.fjw-hotels-section {
  font-family: 'Montserrat', 'Inter', sans-serif;
  color: #1E2D3D;
  line-height: 1.75;
  font-size: 14px;
}
.pdf-preview-content h1,
.pdf-preview-content h2,
.pdf-preview-content h3,
.pdf-preview-content h4,
.fjw-hotels-section h2,
.fjw-hotels-section h3 {
  font-family: 'Cormorant Garamond', serif;
  color: #1E2D3D;
  font-weight: 600;
}
.pdf-preview-content h1 { font-size: 26px; border-bottom: 2px solid #DCCEB8; padding-bottom: 10px; margin: 28px 0 16px; letter-spacing: 0.02em; }
.pdf-preview-content h2 { font-size: 21px; color: #4C6F75; margin: 26px 0 10px; }
.pdf-preview-content h3 { font-size: 17px; margin: 18px 0 8px; }
.pdf-preview-content p { margin: 8px 0; orphans: 3; widows: 3; }
.pdf-preview-content ul,
.pdf-preview-content ol { margin: 8px 0; padding-left: 24px; }
.pdf-preview-content li { margin: 4px 0; }
.pdf-preview-content hr { border: none; border-top: 1px solid #DCCEB8; margin: 24px 0; }
.pdf-preview-content img {
  max-width: 100%; max-height: 145mm; width: auto; height: auto; object-fit: contain;
  border-radius: 6px; margin: 16px auto; display: block; box-shadow: 0 4px 16px rgba(30,45,61,0.12);
}
.pdf-preview-content em { font-style: italic; color: #4C6F75; }
.pdf-preview-content strong { color: #1E2D3D; font-weight: 600; }
.pdf-preview-content blockquote {
  border-left: 3px solid #DCCEB8; padding-left: 16px; margin: 16px 0;
  color: #4C6F75; font-style: italic;
}
.pdf-preview-content figure { margin: 16px 0; }
.pdf-preview-content figcaption { font-size: 11px; color: #4C6F75; text-align: center; margin-top: 6px; font-style: italic; }
.pdf-preview-content .fjw-img-credit { font-size: 10px; color: #6e6e6e; text-align: center; margin-top: 2px; letter-spacing: 0.04em; }
.pdf-preview-content figure,
.pdf-preview-content img,
.pdf-preview-content table,
.pdf-preview-content blockquote,
.pdf-preview-content h1,
.pdf-preview-content h2,
.pdf-preview-content h3,
.pdf-preview-content h4,
.pdf-preview-content li,
.fjw-hotel-card,
.fjw-hotel-photos { page-break-inside: avoid; break-inside: avoid; }
.pdf-preview-content h1,
.pdf-preview-content h2,
.pdf-preview-content h3,
.pdf-preview-content h4 { page-break-after: avoid; break-after: avoid-page; }
.fjw-page-break { break-before: page; page-break-before: always; height: 0; margin: 0; overflow: hidden; visibility: hidden; }

.fjw-hotels-section { break-before: page; page-break-before: always; }
.fjw-section-kicker { font-size: 10px; letter-spacing: 0.2em; color: #B48C3C; font-weight: 700; text-transform: uppercase; }
.fjw-section-rule { width: 30px; height: 1px; background: #B48C3C; margin: 6px 0 14px; }
.fjw-hotels-section h2 { font-size: 30px; margin: 0 0 20px; }
.fjw-hotel-card { margin-bottom: 26px; padding-bottom: 20px; border-bottom: 1px solid #DCCEB8; }
.fjw-hotel-card h3 { font-size: 20px; margin: 0 0 4px; }
.fjw-hotel-location { font-family: 'Cormorant Garamond', serif; font-style: italic; font-size: 13px; color: #6E6E6E; margin-bottom: 8px; }
.fjw-hotel-description { font-family: 'Cormorant Garamond', serif; font-size: 13px; line-height: 1.55; margin: 0 0 10px; }
.fjw-perks-label { font-size: 9px; letter-spacing: 0.18em; color: #B48C3C; font-weight: 700; text-transform: uppercase; margin-bottom: 6px; }
.fjw-perks { list-style: none; padding: 0; margin: 0 0 12px; }
.fjw-perks li { font-size: 12px; padding: 2px 0 2px 18px; position: relative; }
.fjw-perks li::before { content: '✓'; position: absolute; left: 0; color: #B48C3C; font-weight: 700; }
.fjw-hotel-photos { display: grid; gap: 6px; margin-top: 10px; }
.fjw-hotel-photo-frame { position: relative; aspect-ratio: 1.38 / 1; border-radius: 3px; overflow: hidden; background: #1E2D3D; }
.fjw-hotel-photo-frame img { width: 100%; height: 100%; object-fit: cover; display: block; }
.fjw-hotel-caption { font-family: 'Cormorant Garamond', serif; font-style: italic; font-size: 9px; color: #6E6E6E; margin-top: 4px; line-height: 1.35; }

.fjw-back-page { align-items: center; justify-content: center; background: linear-gradient(180deg, rgba(246,244,238,0.72), rgba(220,206,184,0.82)); }
.fjw-back-page img { width: 110px; height: 110px; object-fit: contain; margin-bottom: 30px; }
.fjw-back-page h2 { font-family: 'Cormorant Garamond', serif; font-size: 34px; font-weight: 500; line-height: 1.2; white-space: pre-line; margin: 0 0 18px; }
.fjw-back-page p { font-family: 'Cormorant Garamond', serif; font-style: italic; font-size: 18px; color: #4C6F75; max-width: 120mm; margin: 0 auto 36px; line-height: 1.6; }
.fjw-back-rule { width: 60px; height: 1px; background: #4C6F75; margin: 0 auto 22px; }
.fjw-advisor-signature { margin-bottom: 26px; }
.fjw-advisor-name { font-family: 'Cormorant Garamond', serif; font-size: 18px; color: #1c2e38; font-weight: 500; letter-spacing: 0.02em; }
.fjw-advisor-role { font-family: 'Jost', 'Montserrat', sans-serif; font-size: 9px; letter-spacing: 0.22em; text-transform: uppercase; color: #8fa0a8; margin-top: 4px; }
.fjw-contact { font-size: 12px; line-height: 2; letter-spacing: 0.05em; }
.fjw-social { margin-top: 24px; font-size: 10px; color: #4C6F75; letter-spacing: 0.25em; text-transform: uppercase; }
`;

const PREVIEW_FRAME_CSS = `
.fjw-pdf-shell { pointer-events: auto; }
.pdf-preview-content a,
.pdf-preview-content a:visited { color: #1a56db; text-decoration: underline; }
.fjw-paged-render .pagedjs_pages {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 24px;
  width: 100%;
  /* Paged.js renders pages with their own root flexbox that can otherwise
     intercept pointer events across the whole modal. Let clicks pass through
     to the underlying scroll container; individual pages re-enable them. */
  pointer-events: none;
}
.fjw-paged-render .pagedjs_page {
  background: #ffffff;
  box-shadow: 0 8px 40px rgba(19,17,14,0.18);
  margin: 0 auto;
  overflow: hidden;
  pointer-events: auto;
}
.fjw-paged-render .pagedjs_pagebox {
  background: #ffffff;
}
.fjw-paged-render .pagedjs_area {
  background: #ffffff;
  outline: none;
}
.fjw-paged-render .pagedjs_margin,
.fjw-paged-render .pagedjs_margin-top-left-corner-holder,
.fjw-paged-render .pagedjs_margin-top-right-corner-holder,
.fjw-paged-render .pagedjs_margin-bottom-left-corner-holder,
.fjw-paged-render .pagedjs_margin-bottom-right-corner-holder,
.fjw-paged-render .pagedjs_margin-top,
.fjw-paged-render .pagedjs_margin-bottom,
.fjw-paged-render .pagedjs_margin-left,
.fjw-paged-render .pagedjs_margin-right {
  background: #ffffff;
}
@media print {
  @page { size: A4; margin: 0; }
  html, body { margin: 0 !important; padding: 0 !important; background: #fff !important; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
  body * { visibility: hidden !important; }
  .fjw-pdf-shell, .fjw-pdf-shell * { visibility: visible !important; }
  .fjw-no-print { display: none !important; }
  .fjw-pdf-shell { position: absolute !important; inset: auto !important; top: 0 !important; left: 0 !important; right: 0 !important; padding: 0 !important; margin: 0 !important; background: #fff !important; display: block !important; height: auto !important; overflow: visible !important; }
  .fjw-pdf-window { width: auto !important; max-width: none !important; height: auto !important; min-height: 0 !important; box-shadow: none !important; border-radius: 0 !important; overflow: visible !important; background: #fff !important; display: block !important; }
  .fjw-print-root { padding: 0 !important; background: #fff !important; overflow: visible !important; height: auto !important; min-height: 0 !important; display: block !important; }
  .fjw-paged-render .pagedjs_pages { display: block !important; width: 210mm !important; pointer-events: auto !important; }
  .fjw-paged-render .pagedjs_page { margin: 0 !important; box-shadow: none !important; page-break-after: always !important; break-after: page !important; }
  .fjw-paged-render .pagedjs_page:last-child { page-break-after: auto !important; break-after: auto !important; }
}
`;

const escapeHtml = (value?: string | number | null) =>
  String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

const normalizePhoto = (p: HotelPhoto | string | undefined | null): HotelPhoto | null => {
  if (!p) return null;
  if (typeof p === "string") return { url: p, credit: "", caption: "" };
  if (typeof p === "object" && p.url) return { url: p.url, credit: p.credit || "", caption: p.caption || "" };
  return null;
};

const isMeaningfulChunk = (html: string) => {
  const stripped = html.replace(/<[^>]+>/g, "").replace(/&nbsp;/g, " ").trim();
  return stripped.length > 0 || /<img\b/i.test(html);
};

const cleanPageBreaks = (html: string) =>
  html
    .split(/<div[^>]*class=["'][^"']*fjw-page-break[^"']*["'][^>]*>\s*<\/div>/i)
    .filter(isMeaningfulChunk)
    .join('<div class="fjw-page-break" data-page-break="true"></div>');

const PdfPreview = ({ content, contentHtml, bodyPdfUrl, project, hotels, onClose, language, attachToCatalogId }: PdfPreviewProps) => {
  const { i18n } = useTranslation();
  const renderRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [pageInfo, setPageInfo] = useState({ current: 1, total: 1 });
  const [isRendering, setIsRendering] = useState(true);
  const [mergedPdfUrl, setMergedPdfUrl] = useState<string | null>(null);
  const [merging, setMerging] = useState(false);
  const [mergeError, setMergeError] = useState<string | null>(null);
  const [translatedHotels, setTranslatedHotels] = useState<HotelRecPreview[] | null>(null);
  const [translatingHotels, setTranslatingHotels] = useState(false);
  const lang = (language || i18n.language || "en").slice(0, 2).toLowerCase();
  const L = I18N[lang] || I18N.en;
  const usePdfMerge = !!bodyPdfUrl;

  // Auto-translate hotel content to the itinerary's language.
  // Fires whenever `lang` or the hotels payload changes; caches the result in
  // `translatedHotels` so subsequent re-renders reuse it. On error, falls back
  // to the original hotels silently.
  const hotelsKey = useMemo(() => {
    try {
      return JSON.stringify(
        (hotels || []).map((h) => ({
          n: h?.name || "",
          l: h?.location || "",
          d: h?.description || "",
          p: Array.isArray(h?.perks) ? h.perks : [],
          c: Array.isArray(h?.photos)
            ? h.photos.map((ph: any) => (typeof ph === "string" ? "" : ph?.caption || ""))
            : [],
        })),
      );
    } catch { return ""; }
  }, [hotels]);

  useEffect(() => {
    let cancelled = false;
    setTranslatedHotels(null);
    const list = (hotels || []).filter((h) => h && (h.name || "").trim());
    if (!list.length || !["en", "pt", "no"].includes(lang)) return;
    const hasText = list.some((h) =>
      (h.location || "").trim() || (h.description || "").trim() ||
      (Array.isArray(h.perks) && h.perks.some((p) => (p || "").trim())) ||
      (Array.isArray(h.photos) && h.photos.some((p) => typeof p !== "string" && (p?.caption || "").trim())),
    );
    if (!hasText) return;
    setTranslatingHotels(true);
    supabase.functions
      .invoke("translate-hotels", { body: { language: lang, hotels: list } })
      .then(({ data, error }) => {
        if (cancelled) return;
        if (error || !data?.hotels) return;
        setTranslatedHotels(data.hotels as HotelRecPreview[]);
      })
      .catch(() => { /* silent fallback */ })
      .finally(() => { if (!cancelled) setTranslatingHotels(false); });
    return () => { cancelled = true; };
  }, [lang, hotelsKey]);


  const formatDateRange = (start?: string | null, end?: string | null) => {
    if (!start && !end) return "";
    const fmt = (d: string) =>
      new Date(d).toLocaleDateString(L.dateLocale, { day: "numeric", month: "long", year: "numeric" });
    if (start && end) return `${fmt(start)} — ${fmt(end)}`;
    return fmt((start || end) as string);
  };

  const sourceHtml = useMemo(() => {
    const dateRange = formatDateRange(project?.start_date, project?.end_date);
    const tagline = project?.cover_tagline?.trim() || L.defaultTagline;
    const destinationLine = [project?.destination || L.itinerary, dateRange].filter(Boolean).join(" · ");
    const bodyHtml = cleanPageBreaks(contentHtml && contentHtml.trim() ? contentHtml : markdownToHtml(content));
    const effectiveHotels = translatedHotels || hotels || [];
    const visibleHotels = effectiveHotels.filter((h) => h && h.visible !== false && (h.name || "").trim());

    const coverHero = project?.hero_image_url
      ? `<img src="${escapeHtml(project.hero_image_url)}" alt="${escapeHtml(project?.destination || "")}" crossorigin="anonymous" />`
      : `<div class="fjw-cover-placeholder">${escapeHtml(L.journeyAwaits)}</div>`;

    const hotelHtml = visibleHotels.length
      ? `<section class="fjw-hotels-section">
          <div class="fjw-section-kicker">${escapeHtml(L.whereToStayLabel)}</div>
          <div class="fjw-section-rule"></div>
          <h2>${escapeHtml(L.hotelRecs)}</h2>
          ${visibleHotels
            .map((h) => {
              const photos = (h.photos || []).map(normalizePhoto).filter((p): p is HotelPhoto => !!p && !!p.url).slice(0, 3);
              return `<article class="fjw-hotel-card">
                <h3>${escapeHtml(h.name)}</h3>
                ${h.location ? `<div class="fjw-hotel-location">${escapeHtml(h.location)}</div>` : ""}
                ${h.description ? `<p class="fjw-hotel-description">${escapeHtml(h.description)}</p>` : ""}
                ${Array.isArray(h.perks) && h.perks.length ? `<div class="fjw-perks-label">${escapeHtml(L.perks)}</div><ul class="fjw-perks">${h.perks.map((p) => `<li>${escapeHtml(p)}</li>`).join("")}</ul>` : ""}
                ${photos.length ? `<div class="fjw-hotel-photos" style="grid-template-columns: repeat(${photos.length}, 1fr);">${photos.map((ph) => `<div><div class="fjw-hotel-photo-frame"><img src="${escapeHtml(ph.url)}" alt="${escapeHtml(ph.caption || "")}" crossorigin="anonymous" />${ph.credit ? `<div class="fjw-photo-credit">${escapeHtml(ph.credit)}</div>` : ""}</div>${ph.caption ? `<div class="fjw-hotel-caption">${escapeHtml(ph.caption)}</div>` : ""}</div>`).join("")}</div>` : ""}
              </article>`;
            })
            .join("")}
        </section>`
      : "";

    const seasonFromProject = Array.isArray(project?.season)
      ? project!.season.join(" · ")
      : (project?.season || "");
    const seasonLabel = seasonFromProject || dateRange || (project?.start_date ? new Date(project.start_date).toLocaleDateString(L.dateLocale, { month: "long", year: "numeric" }) : "");

    // Use the explicit title from the edit form first, then the first H1 in
    // the markdown, then destination, then a localized default.
    const firstH1 = (content || "").match(/^\s*#\s+(.+?)\s*$/m)?.[1]?.trim();
    const coverTitle = project?.title || firstH1 || project?.destination || L.itinerary;
    const truncateSentences = (text: string, max: number) => {
      const parts = text.replace(/\s+/g, " ").trim().match(/[^.!?]+[.!?]+(\s|$)|[^.!?]+$/g) || [];
      return parts.slice(0, max).join("").trim();
    };
    const shortTagline = tagline ? truncateSentences(tagline, 4) : "";
    const heroBlock = project?.hero_image_url
      ? `<img src="${escapeHtml(project.hero_image_url)}" alt="${escapeHtml(coverTitle)}" crossorigin="anonymous" />`
      : `<div class="fjw-cover-placeholder"></div>`;

    return `<div class="fjw-paged-document">
      <section class="fjw-cover-page">
        <!-- 1. Logo block -->
        <div class="fjw-cover-logo-block">
          <img class="fjw-cover-logo-img" src="${escapeHtml(logoBadgeHd)}" alt="Fjord &amp; Waves" crossorigin="anonymous" width="1024" height="1024" />
        </div>

        <!-- 2. Hero image -->
        <div class="fjw-cover-hero">${heroBlock}</div>

        <!-- 3. Photo credit (always rendered to keep layout fixed) -->
        <div class="fjw-cover-credit">${project?.hero_image_credit ? escapeHtml(project.hero_image_credit) : ""}</div>


        <!-- 4–7. Text content -->
        <div class="fjw-cover-body">
          <p class="fjw-cover-eyebrow">${escapeHtml(L.coverEyebrow)}</p>
          <h1 class="fjw-cover-title">${escapeHtml(coverTitle)}</h1>
          ${shortTagline ? `<p class="fjw-cover-description">${escapeHtml(shortTagline)}</p>` : ""}
          <div class="fjw-cover-meta">
            <div class="fjw-cover-meta-col">
              <div class="fjw-cover-meta-label">${escapeHtml(L.duration)}</div>
              <div class="fjw-cover-meta-value">${escapeHtml(project?.trip_duration || "—")}</div>
            </div>
            <div class="fjw-cover-meta-col">
              <div class="fjw-cover-meta-label">${escapeHtml(L.region)}</div>
              <div class="fjw-cover-meta-value">${escapeHtml(project?.destination || "—")}</div>
            </div>
            <div class="fjw-cover-meta-col">
              <div class="fjw-cover-meta-label">${escapeHtml(L.season)}</div>
              <div class="fjw-cover-meta-value">${escapeHtml(seasonLabel || "—")}</div>
            </div>
            ${project?.estimated_trip_budget ? `<div class="fjw-cover-meta-col">
              <div class="fjw-cover-meta-label">${escapeHtml(L.estimatedBudget)}</div>
              <div class="fjw-cover-meta-value">${escapeHtml(project.estimated_trip_budget)}</div>
            </div>` : ""}
          </div>
        </div>

      </section>
      ${usePdfMerge ? "" : `<section class="fjw-itinerary-section">
        <header class="fjw-running-header"><img src="${escapeHtml(logoHorizontal)}" alt="Fjord &amp; Waves" crossorigin="anonymous" /><p>${escapeHtml(destinationLine)}</p></header>
        <main class="pdf-preview-content">${bodyHtml}</main>
        <footer class="fjw-print-footer">© ${new Date().getFullYear()} Fjord &amp; Waves Travel · Org.nr: 928804860</footer>
      </section>`}
      ${hotelHtml}
      <section class="fjw-back-page">
        <img src="${escapeHtml(logoBadgeHd)}" alt="Fjord &amp; Waves Travel" crossorigin="anonymous" />
        <h2>${escapeHtml(L.thankYou)}</h2>
        <p>${escapeHtml(L.closingNote)}</p>
        <div class="fjw-back-rule"></div>
        <div class="fjw-advisor-signature">
          <div class="fjw-advisor-name">Daniel Lira Figueiredo</div>
          <div class="fjw-advisor-role">${escapeHtml(L.advisorRole)}</div>
        </div>
        <div class="fjw-contact">
          <div>hello@fjordwavestravel.com</div>
          <div>fjordwavestravel.com</div>
        </div>
        <div class="fjw-social">Instagram · @fjordwavestravel<br />Facebook · Fjord &amp; Waves Travel</div>
      </section>
    </div>`;
  }, [content, contentHtml, hotels, translatedHotels, project, L, usePdfMerge]);

  useEffect(() => {
    let cancelled = false;
    const render = async () => {
      const target = renderRef.current;
      if (!target) return;
      setIsRendering(true);
      target.innerHTML = "";
      const previewer = new Previewer();
      const flow = await previewer.preview(sourceHtml, [{ "fjord-waves-paged-preview.css": PAGE_CSS }], target);
      if (cancelled) return;
      const pages = Array.from(target.querySelectorAll<HTMLElement>(".pagedjs_page"));
      pages.forEach((page, index) => page.setAttribute("data-page-number", String(index + 1)));
      setPageInfo({ current: 1, total: Math.max(1, flow.total || pages.length) });
      setIsRendering(false);
    };
    render().catch((error) => {
      console.error("[PdfPreview] Paged preview render failed", error);
      setIsRendering(false);
    });
    return () => {
      cancelled = true;
      if (renderRef.current) renderRef.current.innerHTML = "";
    };
  }, [sourceHtml]);

  useEffect(() => {
    const scroller = scrollRef.current;
    const target = renderRef.current;
    if (!scroller || !target) return;
    const updatePage = () => {
      const pages = Array.from(target.querySelectorAll<HTMLElement>(".pagedjs_page"));
      if (!pages.length) return;
      const marker = scroller.getBoundingClientRect().top + scroller.clientHeight * 0.38;
      const current = pages.reduce((best, page, index) => {
        const rect = page.getBoundingClientRect();
        const distance = Math.abs(rect.top - marker);
        return distance < best.distance ? { index: index + 1, distance } : best;
      }, { index: 1, distance: Number.POSITIVE_INFINITY }).index;
      setPageInfo((prev) => (prev.current === current && prev.total === pages.length ? prev : { current, total: pages.length }));
    };
    updatePage();
    scroller.addEventListener("scroll", updatePage, { passive: true });
    window.addEventListener("resize", updatePage);
    return () => {
      scroller.removeEventListener("scroll", updatePage);
      window.removeEventListener("resize", updatePage);
    };
  }, [isRendering]);

  const handlePrint = () => window.requestAnimationFrame(() => window.print());

  const handleExportMerged = () => {
    if (!mergedPdfUrl) return;
    const a = document.createElement("a");
    a.href = mergedPdfUrl;
    a.download = `${project?.title || project?.client_name || "itinerary"}.pdf`;
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  const [attaching, setAttaching] = useState(false);
  const handleAttachToStore = async () => {
    if (!attachToCatalogId || !mergedPdfUrl) return;
    setAttaching(true);
    try {
      const blob = await fetch(mergedPdfUrl).then((r) => r.blob());
      const path = `${attachToCatalogId}/itinerary-${Date.now()}.pdf`;
      const { error: upErr } = await supabase.storage
        .from("catalog-pdfs")
        .upload(path, blob, { contentType: "application/pdf", upsert: true });
      if (upErr) throw upErr;
      const { error: dbErr } = await supabase
        .from("catalog_itineraries")
        .update({ pdf_path: path })
        .eq("id", attachToCatalogId);
      if (dbErr) throw dbErr;
      toast.success("PDF attached to store. Customers will download this file.");
    } catch (e: any) {
      console.error("[PdfPreview] attach to store failed", e);
      toast.error(e?.message || "Failed to attach PDF to store");
    } finally {
      setAttaching(false);
    }
  };


  // Merge: capture Paged.js pages (cover + hotels + back) and splice the
  // uploaded body PDF between the cover (page 1) and the tail pages.
  useEffect(() => {
    if (!usePdfMerge || isRendering) return;
    let cancelled = false;
    let createdUrl: string | null = null;
    setMerging(true);
    setMergeError(null);
    (async () => {
      try {
        const target = renderRef.current;
        if (!target) return;
        const pages = Array.from(target.querySelectorAll<HTMLElement>(".pagedjs_page"));
        if (!pages.length) throw new Error("Cover/back pages did not render.");
        const [{ default: html2canvas }, { PDFDocument }] = await Promise.all([
          import("html2canvas"),
          import("pdf-lib"),
        ]);
        const merged = await PDFDocument.create();
        const A4_W = 595.28;
        const A4_H = 841.89;
        const addRenderedPage = async (el: HTMLElement) => {
          const canvas = await html2canvas(el, { scale: 2, useCORS: true, backgroundColor: "#ffffff", logging: false });
          const dataUrl = canvas.toDataURL("image/jpeg", 0.92);
          const bytes = await (await fetch(dataUrl)).arrayBuffer();
          const img = await merged.embedJpg(bytes);
          const page = merged.addPage([A4_W, A4_H]);
          page.drawImage(img, { x: 0, y: 0, width: A4_W, height: A4_H });
        };
        // 1. Cover (first rendered page).
        await addRenderedPage(pages[0]);
        // 2. Uploaded body PDF.
        const bodyBytes = await fetch(bodyPdfUrl!).then((r) => {
          if (!r.ok) throw new Error(`Could not fetch uploaded PDF (${r.status})`);
          return r.arrayBuffer();
        });
        const bodyDoc = await PDFDocument.load(bodyBytes);
        const copied = await merged.copyPages(bodyDoc, bodyDoc.getPageIndices());
        copied.forEach((p) => merged.addPage(p));
        // 3. Tail pages (hotels + back).
        for (let i = 1; i < pages.length; i++) await addRenderedPage(pages[i]);
        const out = await merged.save();
        const blob = new Blob([out as BlobPart], { type: "application/pdf" });
        createdUrl = URL.createObjectURL(blob);
        if (!cancelled) {
          setMergedPdfUrl(createdUrl);
          setPageInfo({ current: 1, total: merged.getPageCount() });
        }
      } catch (e: any) {
        console.error("[PdfPreview] PDF merge failed", e);
        if (!cancelled) setMergeError(e?.message || "PDF merge failed");
      } finally {
        if (!cancelled) setMerging(false);
      }
    })();
    return () => {
      cancelled = true;
      if (createdUrl) URL.revokeObjectURL(createdUrl);
    };
  }, [usePdfMerge, isRendering, bodyPdfUrl]);

  // Escape closes the preview — match the visual ✕ button.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        onClose();
      }
    };
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  }, [onClose]);

  const showMergedViewer = usePdfMerge && mergedPdfUrl;

  const overlay = (
    <div
      className="fixed inset-0 z-[9999] bg-ink/60 flex items-stretch justify-center p-4 fjw-pdf-shell"
      style={{ pointerEvents: "auto" }}
      onPointerDown={(e) => e.stopPropagation()}
      onMouseDown={(e) => e.stopPropagation()}
      onClick={(e) => e.stopPropagation()}
      onWheel={(e) => e.stopPropagation()}
    >
      <style>{PREVIEW_FRAME_CSS}</style>
      <div className="bg-[#f5f5f0] rounded-lg shadow-2xl w-full max-w-[940px] h-full min-h-0 flex flex-col overflow-hidden fjw-pdf-window">
        <div className="relative z-[10000] flex items-center justify-between px-5 py-3 border-b border-parchment-3 bg-voyage-white fjw-no-print" style={{ pointerEvents: "auto" }}>
          <h3 className="text-sm font-serif font-semibold text-ink">PDF Preview</h3>
          <div className="flex items-center gap-3">
            <span className="text-[0.68rem] font-semibold uppercase tracking-[0.14em] text-voyage-muted">
              {usePdfMerge
                ? (mergedPdfUrl ? `${pageInfo.total} pages` : (merging ? "Merging…" : "Preparing…"))
                : `Page ${pageInfo.current} of ${pageInfo.total}`}
            </span>
            {showMergedViewer ? (
              <>
                {attachToCatalogId && (
                  <button
                    type="button"
                    onClick={handleAttachToStore}
                    disabled={attaching}
                    title="Upload this PDF to the store. Customers who purchase this itinerary will download exactly this file."
                    className="px-4 py-1.5 text-[0.72rem] rounded border border-ink/40 text-ink font-semibold tracking-[0.06em] uppercase hover:bg-parchment-2 transition-colors disabled:opacity-40"
                  >
                    {attaching ? "Attaching…" : "🛒 Attach to Store"}
                  </button>
                )}
                <button type="button" onClick={handleExportMerged} className="px-4 py-1.5 text-[0.72rem] rounded bg-gold text-ink font-semibold tracking-[0.06em] uppercase hover:bg-gold-2 transition-colors">
                  📄 Download PDF
                </button>
              </>

            ) : (
              <>
                <button type="button" onClick={handlePrint} disabled={usePdfMerge} className="px-4 py-1.5 text-[0.72rem] rounded border border-ink/30 text-ink font-semibold tracking-[0.06em] uppercase hover:bg-parchment-2 transition-colors disabled:opacity-40">
                  🖨 Print
                </button>
                <button type="button" onClick={handlePrint} disabled={usePdfMerge} className="px-4 py-1.5 text-[0.72rem] rounded bg-gold text-ink font-semibold tracking-[0.06em] uppercase hover:bg-gold-2 transition-colors disabled:opacity-40">
                  📄 Export PDF
                </button>
              </>
            )}
            <button
              type="button"
              onClick={onClose}
              aria-label="Close PDF preview"
              className="ml-1 inline-flex items-center justify-center w-8 h-8 rounded-full border border-ink/20 bg-voyage-white text-ink hover:bg-destructive hover:text-white hover:border-destructive transition-colors text-base leading-none shadow-sm"
            >
              ✕
            </button>
          </div>
        </div>
        <div ref={scrollRef} className="relative flex-1 min-h-0 h-0 overflow-y-scroll overscroll-contain touch-pan-y bg-[#e8e0d0] fjw-print-root">
          {(isRendering || (usePdfMerge && merging)) && (
            <div className="fjw-no-print absolute left-1/2 top-8 z-10 -translate-x-1/2 rounded bg-ink px-4 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-voyage-white shadow-lg">
              {usePdfMerge ? "Merging uploaded body PDF…" : "Paginating…"}
            </div>
          )}
          {mergeError && (
            <div className="fjw-no-print absolute left-1/2 top-8 z-10 -translate-x-1/2 rounded bg-destructive px-4 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-voyage-white shadow-lg">
              {mergeError}
            </div>
          )}
          {/* Paged.js render. When merging, keep mounted but visually hidden (html2canvas needs layout). */}
          <div
            ref={renderRef}
            className="fjw-paged-render"
            style={
              showMergedViewer
                ? { position: "absolute", left: -100000, top: 0, width: "210mm", visibility: "hidden", pointerEvents: "none" }
                : { padding: 24 }
            }
          />
          {showMergedViewer && (
            <div className="flex flex-col h-full">
              <PdfJsViewer url={mergedPdfUrl} />
            </div>
          )}
        </div>
      </div>
      <div className="fjw-page-pill fjw-no-print">{usePdfMerge ? `${pageInfo.total} pages` : `Page ${pageInfo.current} of ${pageInfo.total}`}</div>
    </div>
  );

  if (typeof document === "undefined") return overlay;
  return createPortal(overlay, document.body);
};

export default PdfPreview;