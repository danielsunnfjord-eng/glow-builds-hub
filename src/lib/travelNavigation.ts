import type { Locale } from "./locale";

export const GROUP_INTAKE_URL = "https://secure.foratravel.com/intake/98VwtEFIcy";
export const PRIVATE_INTAKE_URL = "https://secure.foratravel.com/intake/uRYFCpSsUZ";

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

export function isPrivateTravelPath(path: string): boolean {
  return ["/private-travel", "/catalogue", "/pricing", "/start-your-journey", "/plan-my-trip", "/itineraries-shop", "/routes", "/trip"].some(
    (base) => path === base || path.startsWith(`${base}/`),
  );
}