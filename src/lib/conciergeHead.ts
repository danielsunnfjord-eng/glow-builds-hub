import { CONCIERGE_COPY } from "./conciergeCopy";
import { HREFLANG, LOCALES, SITE_URL, localePath } from "./locale";
import { localeFromParam } from "./seoHead";

export function conciergeHead(param: string | undefined, page: "groups" | "start" | "trips") {
  const locale = localeFromParam(param);
  const c = CONCIERGE_COPY[locale];
  const title = `${c[page]} | Fjord & Waves Travel`;
  const description = page === "groups" ? c.intro : page === "trips" ? c.themeIntro : `${c.privateChoice}. ${c.groupChoice}. ${c.themeChoice}.`;
  const image = page === "groups" ? `${SITE_URL}/og/groups.jpg` : page === "trips" ? `${SITE_URL}/og/trips.jpg` : `${SITE_URL}/og-image.png`;
  return {
    meta: [
      { title }, { name: "description", content: description },
      { property: "og:title", content: title }, { property: "og:description", content: description },
      { name: "twitter:title", content: title }, { name: "twitter:description", content: description },
      { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" },
      { property: "og:image", content: image }, { name: "twitter:image", content: image }, { property: "og:url", content: `${SITE_URL}${localePath(`/${page}`, locale)}` },
    ],
    links: [
      { rel: "canonical", href: `${SITE_URL}${localePath(`/${page}`, locale)}` },
      ...LOCALES.map((lng) => ({ rel: "alternate", hrefLang: HREFLANG[lng], href: `${SITE_URL}${localePath(`/${page}`, lng)}` })),
      { rel: "alternate", hrefLang: "x-default", href: `${SITE_URL}/${page}` },
    ],
  };
}