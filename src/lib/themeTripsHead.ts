import { buildHead } from "./seoHead";
import { localeFromParam } from "./seoHead";
import { THEME_COPY, themeTripBySlug } from "./themeTrips";

/** Hub head: /trips, /no/reiser, /pt-br/trips. */
export function themeTripsHubHead(param: string | undefined) {
  const locale = localeFromParam(param);
  const c = THEME_COPY[locale];
  const title =
    locale === "no"
      ? "Temareiser: surf, beach sports og friluftsliv | Fjord & Waves Travel"
      : locale === "pt"
        ? "Viagens temáticas: surf, esportes de praia e ao ar livre | Fjord & Waves Travel"
        : "Theme Travels: Surf, Beach Sports and Outdoor | Fjord & Waves Travel";
  return buildHead({ path: "/trips", locale, title, description: c.hubIntro });
}

/** Trip detail head: unique title + description per trip and language. */
export function themeTripHead(param: string | undefined, slug: string) {
  const locale = localeFromParam(param);
  const trip = themeTripBySlug(slug);
  if (!trip) return buildHead({ path: "/trips", locale, title: THEME_COPY[locale].hubTitle, description: THEME_COPY[locale].hubIntro });
  const c = trip.copy[locale];
  return buildHead({
    path: `/trips/${slug}`,
    locale,
    title: `${c.title} | Fjord & Waves Travel`,
    description: c.metaDescription,
  });
}
