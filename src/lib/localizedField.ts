export type CatalogLang = "en" | "pt" | "no";

export const CATALOG_LANGS: CatalogLang[] = ["en", "pt", "no"];

export const normalizeLang = (lang: string | null | undefined): CatalogLang => {
  const l = (lang || "en").slice(0, 2).toLowerCase();
  return (CATALOG_LANGS as string[]).includes(l) ? (l as CatalogLang) : "en";
};

/**
 * Pick the value for the requested language, falling back to the itinerary's
 * original (primary) language, then English, then any other filled language.
 */
export function pickLocalized<T extends string | null | undefined>(
  lang: string | null | undefined,
  fields: { en: T; pt: T; no: T },
  primaryLanguage?: string | null,
): T {
  const order: CatalogLang[] = [
    normalizeLang(lang),
    normalizeLang(primaryLanguage),
    "en",
    "pt",
    "no",
  ];
  for (const key of order) {
    const value = fields[key];
    if (value != null && String(value).trim() !== "") return value;
  }
  return fields.en;
}

/**
 * Subpage JSON blocks may be stored either as a plain array (legacy: written in
 * the itinerary's primary language) or as a per-language map
 * `{ en: [...], pt: [...], no: [...] }`. This reads both shapes.
 */
export function pickLocalizedBlock<T>(
  lang: string | null | undefined,
  raw: unknown,
  primaryLanguage?: string | null,
): T[] {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw as T[];
  if (typeof raw === "object") {
    const map = raw as Record<string, unknown>;
    const order: CatalogLang[] = [
      normalizeLang(lang),
      normalizeLang(primaryLanguage),
      "en",
      "pt",
      "no",
    ];
    for (const key of order) {
      const value = map[key];
      if (Array.isArray(value) && value.length > 0) return value as T[];
    }
  }
  return [];
}

/** Writes a per-language block map, preserving other languages. */
export function setLocalizedBlock<T>(
  raw: unknown,
  lang: string | null | undefined,
  value: T[],
  primaryLanguage?: string | null,
): Record<string, T[]> {
  const base: Record<string, T[]> = {};
  if (Array.isArray(raw)) {
    base[normalizeLang(primaryLanguage)] = raw as T[];
  } else if (raw && typeof raw === "object") {
    for (const [k, v] of Object.entries(raw as Record<string, unknown>)) {
      if (Array.isArray(v)) base[k] = v as T[];
    }
  }
  base[normalizeLang(lang)] = value;
  return base;
}

export const pdfPathColumn = (lang: string | null | undefined) =>
  `pdf_path_${normalizeLang(lang)}` as "pdf_path_en" | "pdf_path_pt" | "pdf_path_no";
