import { CONCIERGE_COPY } from "./conciergeCopy";
import { HREFLANG, LOCALES, SITE_URL, localePath } from "./locale";
import { localeFromParam } from "./seoHead";
import cristo from "@/assets/home/cristo_redentor.jpg.asset.json";
import surf from "@/assets/home/pedra_do_arpoador.jpg.asset.json";

export function conciergeHead(param: string | undefined, page: "groups" | "start" | "trips") {
  const locale = localeFromParam(param);
  const c = CONCIERGE_COPY[locale];
  const title = `${c[page]} | Fjord & Waves Travel`;
  const description = page === "groups" ? c.intro : page === "trips" ? c.themeIntro : `${c.privateChoice}. ${c.groupChoice}. ${c.themeChoice}.`;
  const image = page === "groups" ? cristo.url : page === "trips" ? surf.url : undefined;
  return {
    meta: [
      { title }, { name: "description", content: description },
      { property: "og:title", content: title }, { property: "og:description", content: description },
      { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" },
      ...(image ? [{ property: "og:image", content: image }, { name: "twitter:image", content: image }] : []),
    ],
    links: [
      { rel: "canonical", href: `${SITE_URL}${localePath(`/${page}`, locale)}` },
      ...LOCALES.map((lng) => ({ rel: "alternate", hrefLang: HREFLANG[lng], href: `${SITE_URL}${localePath(`/${page}`, lng)}` })),
      { rel: "alternate", hrefLang: "x-default", href: `${SITE_URL}/${page}` },
    ],
  };
}