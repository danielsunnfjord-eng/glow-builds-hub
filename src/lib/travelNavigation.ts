import type { Locale } from "./locale";

export const GROUP_INTAKE_URL = "https://secure.foratravel.com/intake/98VwtEFIcy";
export const PRIVATE_INTAKE_URL = "https://secure.foratravel.com/intake/uRYFCpSsUZ";
export const CALENDLY_URL = "https://calendly.com/daniel-lirafigueiredo-fora/reiseplanlegging";

export const travelNavigation = [
  { key: "folkHighSchools", path: "/folkehogskole" },
  { key: "sportsAndSurf", path: "/sports-and-surf" },
  { key: "corporate", path: "/corporate" },
  { key: "destinations", path: "/destinations" },
  { key: "safety", path: "/safety" },
  { key: "about", path: "/about" },
] as const;

export const navigationCopy = {
  en: { folkHighSchools: "For Folk High Schools", sportsAndSurf: "Sports & Surf", corporate: "Corporate", destinations: "Destinations", safety: "Safety", about: "About", privateTravel: "Private Travel", proposal: "Request a proposal", startJourney: "Start your journey" },
  no: { folkHighSchools: "For folkehøgskoler", sportsAndSurf: "Idrett og surf", corporate: "Bedrift", destinations: "Reisemål", safety: "Trygghet", about: "Om oss", privateTravel: "Privatreiser", proposal: "Be om forslag", startJourney: "Begynn planleggingen" },
  pt: { folkHighSchools: "Para escolas e grupos", sportsAndSurf: "Esporte e surf", corporate: "Empresas", destinations: "Destinos", safety: "Segurança", about: "Sobre", privateTravel: "Viagens privadas", proposal: "Solicite uma proposta", startJourney: "Começar a planejar" },
} satisfies Record<Locale, Record<string, string>>;

export type TravelPageKey = "folkHighSchools" | "sportsAndSurf" | "corporate" | "destinations" | "safety" | "privateTravel";

export type GroupPageKey = "folkHighSchools" | "sportsAndSurf" | "corporate" | "safety";

/**
 * Group pages go live one by one as their content steps are finished.
 * A page set to false stays out of the published site (redirects home, noindex,
 * left out of the sitemap); it still opens in the preview for review.
 */
export const LIVE_GROUP_PAGES: Record<GroupPageKey, boolean> = {
  folkHighSchools: false,
  sportsAndSurf: false,
  corporate: false,
  safety: false,
};

export function isGroupPageAvailable(page: GroupPageKey, isProduction: boolean): boolean {
  return LIVE_GROUP_PAGES[page] || !isProduction;
}

export function isPrivateTravelPath(path: string): boolean {
  return ["/private-travel", "/catalogue", "/pricing", "/start-your-journey", "/plan-my-trip", "/itineraries-shop", "/routes", "/trip"].some(
    (base) => path === base || path.startsWith(`${base}/`),
  );
}
