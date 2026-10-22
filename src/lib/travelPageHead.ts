import { HREFLANG, LOCALES, SITE_URL, localePath } from "./locale";
import { localeFromParam } from "./seoHead";
import { navigationCopy, type TravelPageKey } from "./travelNavigation";

export function travelPageHead(param: string | undefined, page: TravelPageKey, path: string) {
  const locale = localeFromParam(param);
  const label = navigationCopy[locale][page];
  const title = `${label} | Fjord & Waves Travel`;
  // CONTENT PLACEHOLDER: Replace the label-only description with user-supplied copy.
  return {
    meta: [
      { title },
      { name: "description", content: title },
      { property: "og:title", content: title },
      { property: "og:description", content: title },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
    links: [
      { rel: "canonical", href: `${SITE_URL}${localePath(path, locale)}` },
      ...LOCALES.map((lng) => ({ rel: "alternate", hrefLang: HREFLANG[lng], href: `${SITE_URL}${localePath(path, lng)}` })),
      { rel: "alternate", hrefLang: "x-default", href: `${SITE_URL}${localePath(path, "en")}` },
    ],
  };
}