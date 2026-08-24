import { HREFLANG, LOCALES, SITE_URL, localePath, type Locale } from "./locale";

/** Route param ("no" | "pt-br" | undefined) -> internal locale code. */
export function localeFromParam(param?: string): Locale {
  if (param === "pt-br") return "pt";
  if (param === "no") return "no";
  return "en";
}

export interface HeadInput {
  /** Router-level path without language prefix, e.g. "/pricing". */
  path: string;
  locale: Locale;
  title: string;
  description: string;
  image?: string;
  type?: "website" | "article" | "product";
  jsonLd?: Record<string, unknown> | Record<string, unknown>[];
  noindex?: boolean;
}

const DEFAULT_IMAGE = `${SITE_URL}/og-image.png`;

export const OG_IMAGE_WIDTH = 1200;
export const OG_IMAGE_HEIGHT = 630;

/**
 * Social crawlers reject or drop oversized images (WhatsApp caps around
 * 300 KB), and uploaded cover photos are full-resolution originals. Rewrite
 * Cloud storage public URLs to the on-the-fly 1200x630 render so every shared
 * link gets a light, correctly proportioned preview image.
 */
export function socialImageUrl(url: string): string {
  if (!url.includes("/storage/v1/object/public/")) return url;
  const base = url.split("?")[0].replace(
    "/storage/v1/object/public/",
    "/storage/v1/render/image/public/",
  );
  return `${base}?width=${OG_IMAGE_WIDTH}&height=${OG_IMAGE_HEIGHT}&resize=cover&quality=80`;
}

const OG_LOCALE: Record<Locale, string> = {
  en: "en_US",
  pt: "pt_BR",
  no: "nb_NO",
};

/**
 * Server-rendered head data: canonical + hreflang alternates for the three
 * language versions, localized Open Graph / Twitter tags and optional JSON-LD.
 */
export function buildHead({
  path,
  locale,
  title,
  description,
  image,
  type = "website",
  jsonLd,
  noindex,
}: HeadInput) {
  const url = `${SITE_URL}${localePath(path, locale)}`;
  const img = image || DEFAULT_IMAGE;
  const desc = description.length > 158 ? `${description.slice(0, 155).trimEnd()}…` : description;
  const blocks = Array.isArray(jsonLd) ? jsonLd : jsonLd ? [jsonLd] : [];

  const links: Array<Record<string, string>> = [{ rel: "canonical", href: url }];
  if (!noindex) {
    for (const lng of LOCALES) {
      links.push({
        rel: "alternate",
        hrefLang: HREFLANG[lng],
        href: `${SITE_URL}${localePath(path, lng)}`,
      });
    }
    links.push({
      rel: "alternate",
      hrefLang: "x-default",
      href: `${SITE_URL}${localePath(path, "en")}`,
    });
  }

  const meta: Array<Record<string, string>> = [
    { title },
    { name: "description", content: desc },
    { property: "og:title", content: title },
    { property: "og:description", content: desc },
    { property: "og:url", content: url },
    { property: "og:type", content: type },
    { property: "og:image", content: img },
    { property: "og:locale", content: OG_LOCALE[locale] },
    { name: "twitter:card", content: "summary_large_image" },
    { name: "twitter:title", content: title },
    { name: "twitter:description", content: desc },
    { name: "twitter:image", content: img },
  ];
  if (noindex) meta.push({ name: "robots", content: "noindex,nofollow" });

  return {
    meta,
    links,
    ...(blocks.length
      ? {
          scripts: blocks.map((obj) => ({
            type: "application/ld+json",
            children: JSON.stringify(obj),
          })),
        }
      : {}),
  };
}

/** Convenience for route files: build head straight from the URL param. */
export function headFor(
  param: string | undefined,
  input: Omit<HeadInput, "locale">,
) {
  return buildHead({ ...input, locale: localeFromParam(param) });
}
