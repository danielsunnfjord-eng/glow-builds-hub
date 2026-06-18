import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Previewer } from "pagedjs";
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

const PAGE_CSS = `
@page { size: 210mm 297mm; margin: 20mm; }

.fjw-paged-document {
  font-family: 'Montserrat', 'Inter', sans-serif;
  color: #1E2D3D;
  font-size: 14px;
  line-height: 1.75;
}

.fjw-cover-page {
  height: 257mm;
  max-height: 257mm;
  overflow: hidden;
  break-after: page;
  page-break-after: always;
  background: #f8f5f0;
  margin: -20mm;
  padding: 0;
  position: relative;
  display: flex;
  flex-direction: column;
}
.fjw-back-page {
  height: 257mm;
  max-height: 257mm;
  overflow: hidden;
  break-after: page;
  page-break-after: always;
  text-align: center;
}

/* Hero image — top of page */
.fjw-cover-hero {
  position: relative;
  width: 100%;
  height: 78mm;
  overflow: hidden;
  background: #1c2e38;
  flex-shrink: 0;
}
.fjw-cover-hero img { width: 100%; height: 100%; object-fit: cover; display: block; }
.fjw-cover-placeholder {
  height: 100%; display: flex; align-items: center; justify-content: center;
  color: #f8f5f0; font-family: 'Cormorant Garamond', serif; font-style: italic;
  font-size: 16px; letter-spacing: 0.1em;
}
.fjw-cover-hero .fjw-photo-credit {
  position: absolute; right: 16px; bottom: 10px;
  color: rgba(255,255,255,0.88); background: transparent;
  font-family: 'Jost', sans-serif;
  font-size: 9px; letter-spacing: 0.08em; padding: 0;
}

/* Body wrapper */
.fjw-cover-body {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: 14mm 22mm 0;
  position: relative;
}

/* Logo block */
.fjw-cover-logo-block {
  display: flex; flex-direction: column; align-items: center;
  margin-bottom: 10mm;
}
.fjw-cover-logo-mark {
  width: 44px; height: 44px; margin-bottom: 10px;
}
.fjw-cover-logo-name {
  font-family: 'Jost', 'Montserrat', sans-serif;
  font-weight: 400; font-size: 12px;
  letter-spacing: 0.34em; color: #3a4a52;
  text-transform: uppercase;
}
.fjw-cover-logo-tagline {
  font-family: 'Jost', 'Montserrat', sans-serif;
  font-weight: 300; font-size: 8px;
  letter-spacing: 0.3em; color: #8fa0a8;
  text-transform: uppercase; margin-top: 5px;
}

/* Small divider line above eyebrow */
.fjw-cover-divider-thin {
  width: 28px; height: 1px; background: #c4d4da; margin: 0 auto 7mm;
}

/* Eyebrow */
.fjw-cover-eyebrow {
  margin: 0 0 6mm; font-family: 'Jost', 'Montserrat', sans-serif;
  font-size: 9px; letter-spacing: 0.32em; text-transform: uppercase;
  color: #8fa0a8; font-weight: 400;
}

/* Title */
.fjw-cover-title {
  margin: 0 auto 4mm;
  font-family: 'Playfair Display', 'Cormorant Garamond', serif;
  font-size: 30px; font-weight: 400; line-height: 1.18;
  letter-spacing: 0.005em; color: #1c2e38;
  max-width: 150mm;
}

/* Subtitle (location · duration) */
.fjw-cover-subtitle {
  margin: 0 0 7mm;
  font-family: 'Cormorant Garamond', serif;
  font-style: italic; font-size: 13px;
  color: #8fa0a8; letter-spacing: 0.04em;
}

/* Diamond divider */
.fjw-cover-diamond-divider {
  display: flex; align-items: center; justify-content: center;
  gap: 10px; margin: 0 auto 7mm; width: 80%;
}
.fjw-cover-diamond-divider .line {
  flex: 1; height: 1px; background: #c4d4da; max-width: 60mm;
}
.fjw-cover-diamond-divider .diamond {
  width: 5px; height: 5px; background: #4C6F75;
  transform: rotate(45deg); flex-shrink: 0;
}

/* Description */
.fjw-cover-description {
  margin: 0 auto 9mm;
  font-family: 'Cormorant Garamond', serif;
  font-style: italic; font-weight: 400;
  font-size: 13px; line-height: 1.7;
  color: #4C6F75; max-width: 145mm;
}

/* Metadata strip — Duration / Region / Season */
.fjw-cover-meta {
  display: flex; justify-content: center; align-items: stretch;
  gap: 0; margin: 0 auto 8mm; width: 100%; max-width: 150mm;
}
.fjw-cover-meta-col {
  flex: 1; display: flex; flex-direction: column;
  align-items: center; justify-content: center;
  padding: 0 6mm;
}
.fjw-cover-meta-col + .fjw-cover-meta-col {
  border-left: 1px solid #c4d4da;
}
.fjw-cover-meta-label {
  font-family: 'Jost', 'Montserrat', sans-serif;
  font-size: 9px; letter-spacing: 0.28em;
  color: #8fa0a8; text-transform: uppercase;
  margin-bottom: 4mm; font-weight: 400;
}
.fjw-cover-meta-value {
  font-family: 'Playfair Display', 'Cormorant Garamond', serif;
  font-size: 15px; color: #1c2e38; font-weight: 400;
}

/* Down arrow */
.fjw-cover-arrow {
  width: 28px; height: 28px; border-radius: 50%;
  border: 1px solid #c4d4da; display: flex;
  align-items: center; justify-content: center;
  margin: auto auto 8mm; color: #4C6F75;
}

/* Footer teal accent bar */
.fjw-cover-accent-bar {
  width: 100%; height: 4mm; background: #4C6F75;
  margin-top: auto; flex-shrink: 0;
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
.fjw-back-rule { width: 60px; height: 1px; background: #4C6F75; margin: 0 auto 30px; }
.fjw-contact { font-size: 12px; line-height: 2; letter-spacing: 0.05em; }
.fjw-social { margin-top: 24px; font-size: 10px; color: #4C6F75; letter-spacing: 0.25em; text-transform: uppercase; }
`;

const PREVIEW_FRAME_CSS = `
.fjw-paged-render .pagedjs_pages {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 24px;
  width: 100%;
}
.fjw-paged-render .pagedjs_page {
  background: #ffffff;
  box-shadow: 0 8px 40px rgba(19,17,14,0.18);
  margin: 0 auto;
  overflow: hidden;
}
.fjw-paged-render .pagedjs_pagebox {
  background: rgba(220,206,184,0.26);
}
.fjw-paged-render .pagedjs_area {
  background: #ffffff;
  outline: 1px solid rgba(180,140,60,0.48);
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
  background: rgba(220,206,184,0.22);
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
  .fjw-paged-render .pagedjs_pages { display: block !important; width: 210mm !important; }
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

const PdfPreview = ({ content, project, hotels, onClose, language }: PdfPreviewProps) => {
  const { i18n } = useTranslation();
  const renderRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [pageInfo, setPageInfo] = useState({ current: 1, total: 1 });
  const [isRendering, setIsRendering] = useState(true);
  const lang = (language || i18n.language || "en").slice(0, 2).toLowerCase();
  const L = I18N[lang] || I18N.en;

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
    const bodyHtml = cleanPageBreaks(markdownToHtml(content));
    const visibleHotels = (hotels || []).filter((h) => h && h.visible !== false && (h.name || "").trim());

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

    return `<div class="fjw-paged-document">
      <section class="fjw-cover-page">
        <div class="fjw-cover-logo"><img src="${escapeHtml(logoHorizontalHd)}" alt="Fjord &amp; Waves Travel" crossorigin="anonymous" /></div>
        <div class="fjw-cover-hero">${coverHero}${project?.hero_image_credit ? `<div class="fjw-photo-credit">${escapeHtml(project.hero_image_credit)}</div>` : ""}</div>
        ${project?.hero_image_caption ? `<p class="fjw-cover-caption">${escapeHtml(project.hero_image_caption)}</p>` : ""}
        <p class="fjw-cover-eyebrow">${escapeHtml(L.preparedFor)}</p>
        <h1 class="fjw-cover-title">${escapeHtml(project?.client_name || L.valuedTraveller)}</h1>
        <div class="fjw-cover-rule"></div>
        ${project?.destination ? `<p class="fjw-cover-destination">${escapeHtml(project.destination)}</p>` : ""}
        ${dateRange ? `<p class="fjw-cover-date">${escapeHtml(dateRange)}</p>` : ""}
        ${tagline ? `<div class="fjw-cover-rule" style="margin-top:18mm"></div>` : ""}
        <p class="fjw-cover-tagline">${escapeHtml(tagline)}</p>
      </section>
      <section class="fjw-itinerary-section">
        <header class="fjw-running-header"><img src="${escapeHtml(logoHorizontal)}" alt="Fjord &amp; Waves" crossorigin="anonymous" /><p>${escapeHtml(destinationLine)}</p></header>
        <main class="pdf-preview-content">${bodyHtml}</main>
        <footer class="fjw-print-footer">© ${new Date().getFullYear()} Fjord &amp; Waves Travel · Org.nr: 928804860</footer>
      </section>
      ${hotelHtml}
      <section class="fjw-back-page">
        <img src="${escapeHtml(logoBadge)}" alt="Fjord &amp; Waves Travel" crossorigin="anonymous" />
        <h2>${escapeHtml(L.thankYou)}</h2>
        <p>${escapeHtml(L.closingNote)}</p>
        <div class="fjw-back-rule"></div>
        <div class="fjw-contact"><div>hello@fjordwavestravel.com</div><div>fjordwavestravel.com</div></div>
        <div class="fjw-social">Instagram · @fjordwavestravel<br />Facebook · Fjord &amp; Waves Travel</div>
      </section>
    </div>`;
  }, [content, hotels, project, L]);

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

  return (
    <div
      className="absolute inset-0 z-[60] bg-ink/60 flex items-stretch justify-center p-4 fjw-pdf-shell"
      onPointerDown={(e) => e.stopPropagation()}
      onMouseDown={(e) => e.stopPropagation()}
      onClick={(e) => e.stopPropagation()}
      onWheel={(e) => e.stopPropagation()}
    >
      <style>{PREVIEW_FRAME_CSS}</style>
      <div className="bg-[#f5f5f0] rounded-lg shadow-2xl w-full max-w-[940px] h-full min-h-0 flex flex-col overflow-hidden fjw-pdf-window">
        <div className="flex items-center justify-between px-5 py-3 border-b border-parchment-3 bg-voyage-white fjw-no-print">
          <h3 className="text-sm font-serif font-semibold text-ink">PDF Preview</h3>
          <div className="flex items-center gap-3">
            <span className="text-[0.68rem] font-semibold uppercase tracking-[0.14em] text-voyage-muted">
              Page {pageInfo.current} of {pageInfo.total}
            </span>
            <button onClick={handlePrint} className="px-4 py-1.5 text-[0.72rem] rounded border border-ink/30 text-ink font-semibold tracking-[0.06em] uppercase hover:bg-parchment-2 transition-colors">
              🖨 Print
            </button>
            <button onClick={handlePrint} className="px-4 py-1.5 text-[0.72rem] rounded bg-gold text-ink font-semibold tracking-[0.06em] uppercase hover:bg-gold-2 transition-colors">
              📄 Export PDF
            </button>
            <button onClick={onClose} className="text-voyage-muted hover:text-ink text-lg leading-none px-2" aria-label="Close PDF preview">
              ✕
            </button>
          </div>
        </div>
        <div ref={scrollRef} className="relative flex-1 min-h-0 h-0 overflow-y-scroll overscroll-contain touch-pan-y p-6 bg-[#e8e0d0] fjw-print-root">
          {isRendering && <div className="fjw-no-print absolute left-1/2 top-8 z-10 -translate-x-1/2 rounded bg-ink px-4 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-voyage-white shadow-lg">Paginating…</div>}
          <div ref={renderRef} className="fjw-paged-render" />
        </div>
      </div>
      <div className="fjw-page-pill fjw-no-print">Page {pageInfo.current} of {pageInfo.total}</div>
    </div>
  );
};

export default PdfPreview;