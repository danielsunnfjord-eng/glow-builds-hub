// Language <-> URL prefix mapping.
// English lives at the root, Norwegian at /no/, Brazilian Portuguese at /pt-br/.

export const LOCALES = ["en", "pt", "no"] as const;
export type Locale = (typeof LOCALES)[number];

export const LOCALE_PREFIX: Record<Locale, string> = {
  en: "",
  pt: "/pt-br",
  no: "/no",
};

/** hreflang codes used in <link rel="alternate"> tags. */
export const HREFLANG: Record<Locale, string> = {
  en: "en",
  pt: "pt-BR",
  no: "no",
};

/** <html lang="..."> values. */
export const HTML_LANG: Record<Locale, string> = {
  en: "en",
  pt: "pt-BR",
  no: "nb",
};

export const SITE_URL = "https://fjordwavestravel.com";

/** Which language does this absolute pathname belong to? */
export function detectLocaleFromPath(pathname: string): Locale {
  if (pathname === "/pt-br" || pathname.startsWith("/pt-br/")) return "pt";
  if (pathname === "/no" || pathname.startsWith("/no/")) return "no";
  return "en";
}

/** Strip the language prefix, returning the router-level path (always starts with "/"). */
export function stripLocalePrefix(pathname: string): string {
  const locale = detectLocaleFromPath(pathname);
  const prefix = LOCALE_PREFIX[locale];
  if (!prefix) return pathname || "/";
  const rest = pathname.slice(prefix.length);
  return rest.startsWith("/") ? rest : `/${rest}`;
}

/** Build a full site path for a language, e.g. ("/about", "pt") -> "/pt-br/about". */
export function localePath(path: string, locale: Locale): string {
  const clean = path.startsWith("/") ? path : `/${path}`;
  const prefix = LOCALE_PREFIX[locale];
  if (!prefix) return clean;
  return clean === "/" ? `${prefix}/` : `${prefix}${clean}`;
}

// During SSR there is no window; the root route's beforeLoad records the
// request's locale here so render-time currentLocale() calls match the URL.
let serverLocale: Locale = "en";

/** Called from the root route on the server before rendering. */
export function setServerLocale(locale: Locale): void {
  serverLocale = locale;
}

/** Current locale derived from the browser URL (safe during SSR/build). */
export function currentLocale(): Locale {
  if (typeof window === "undefined") return serverLocale;
  return detectLocaleFromPath(window.location.pathname);
}

/** Router basename for the current locale. */
export function currentBasename(): string {
  return LOCALE_PREFIX[currentLocale()] || "/";
}
