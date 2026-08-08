import { lazy, Suspense, useEffect, useState } from "react";
import type { QueryClient } from "@tanstack/react-query";
import { QueryClientProvider } from "@tanstack/react-query";
import {
  HeadContent,
  Outlet,
  Scripts,
  createRootRouteWithContext,
  useRouter,
  useRouterState,
} from "@tanstack/react-router";
import { HelmetProvider } from "react-helmet-async";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import CookieConsent from "@/components/voyage/CookieConsent";
import NotFound from "@/pages/NotFound";
import { reportLovableError } from "@/lib/lovable-error-reporting";
import { HTML_LANG, detectLocaleFromPath } from "@/lib/locale";
// ported from main.tsx — i18next must initialise before any component renders
import i18n from "../i18n";
// ported from main.tsx — Google Analytics loader (browser-only, fired in useEffect)
import { loadGoogleAnalytics } from "../AnalyticsLoader";
import appCss from "../styles.css?url";

const FONTS_HREF =
  "https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;0,700;1,400&family=Montserrat:wght@300;400;500;600;700&display=swap";

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  beforeLoad: async ({ location }) => {
    // The URL is the single source of truth for language (/, /no/, /pt-br/).
    const locale = detectLocaleFromPath(location.pathname);
    if (i18n.language !== locale) {
      await i18n.changeLanguage(locale);
    }
  },
  head: () => ({
    meta: [
      { charSet: "UTF-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1.0" },
      { title: "Fjord & Waves Travel — Bespoke Travel Designed Around You" },
      {
        name: "description",
        content:
          "Bespoke journeys planned by Daniel Lira Figueiredo, a Fora Travel advisor (IATA accredited). Flights, hotels and hidden-gem experiences tailored to you.",
      },
      { name: "author", content: "Fjord & Waves Travel" },
      { name: "google-site-verification", content: "aL2xU73S8WjDOuTcmi8o5abULAkSaTRdPWIyrFrSpaE" },
      { name: "theme-color", content: "#1a1a2e" },
      { name: "apple-mobile-web-app-capable", content: "yes" },
      { name: "apple-mobile-web-app-status-bar-style", content: "black-translucent" },
      { name: "apple-mobile-web-app-title", content: "F&W Travel" },
      { property: "og:type", content: "website" },
      { property: "og:site_name", content: "Fjord & Waves Travel" },
      { property: "og:title", content: "Fjord & Waves Travel — Travel Designed Around You" },
      {
        property: "og:description",
        content:
          "Bespoke journeys designed around you by Daniel Lira Figueiredo — Fora Travel advisor, IATA accredited.",
      },
      { property: "og:image", content: "https://fjordwavestravel.com/og-image.png" },
      { property: "og:image:width", content: "1200" },
      { property: "og:image:height", content: "630" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "Fjord & Waves Travel — Travel Designed Around You" },
      {
        name: "twitter:description",
        content:
          "Bespoke journeys designed around you by Daniel Lira Figueiredo — Fora Travel advisor, IATA accredited.",
      },
      { name: "twitter:image", content: "https://fjordwavestravel.com/og-image.png" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "icon", type: "image/png", href: "/favicon.png?v=2" },
      { rel: "manifest", href: "/manifest.webmanifest" },
      { rel: "apple-touch-icon", href: "/apple-touch-icon.png?v=2" },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      { rel: "preload", as: "style", href: FONTS_HREF },
      { rel: "stylesheet", href: FONTS_HREF },
    ],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Organization",
          name: "Fjord & Waves Travel",
          url: "https://fjordwavestravel.com",
          logo: "https://fjordwavestravel.com/icon-512.png",
          description:
            "Bespoke concierge travel planning by Daniel Lira Figueiredo, a Fora Travel advisor (IATA accredited).",
          founder: { "@type": "Person", name: "Daniel Lira Figueiredo" },
          areaServed: "Worldwide",
          sameAs: [
            "https://www.foratravel.com/advisor/daniel-lira-figueiredo",
            "https://www.linkedin.com/in/daniel-lira-figueiredo/",
            "https://www.instagram.com/fjord_and_waves_travel/",
          ],
        }),
      },
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "WebSite",
          name: "Fjord & Waves Travel",
          url: "https://fjordwavestravel.com",
        }),
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: () => <NotFound />,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const lang = HTML_LANG[detectLocaleFromPath(pathname)] ?? "en";
  return (
    <html lang={lang} suppressHydrationWarning>
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <noscript>
          <header>
            <h1>Fjord &amp; Waves Travel — Bespoke Travel Designed Around You</h1>
            <p>
              Bespoke journeys planned by Daniel Lira Figueiredo, a Fora Travel advisor (IATA
              accredited). Flights, hotels and hidden-gem experiences tailored to you, with a focus
              on Norway, the Nordics and beyond.
            </p>
            <nav>
              <ul>
                <li>
                  <a href="/">Home</a>
                </li>
                <li>
                  <a href="/about">About Daniel</a>
                </li>
                <li>
                  <a href="/destinations/norway">Norway itineraries</a>
                </li>
                <li>
                  <a href="/routes">All routes</a>
                </li>
                <li>
                  <a href="/catalogue">Itinerary shop</a>
                </li>
                <li>
                  <a href="/plan-my-trip">Plan my trip</a>
                </li>
                <li>
                  <a href="/legal">Privacy &amp; terms</a>
                </li>
              </ul>
            </nav>
            <p>
              This site requires JavaScript for the full experience. Please enable JavaScript or
              contact daniel.lirafigueiredo@fora.travel.
            </p>
          </header>
        </noscript>
        <Scripts />
      </body>
    </html>
  );
}

// Defer non-critical 3rd-party widget so it doesn't block first paint.
// ported from src/App.tsx
const CalendlyBadge = lazy(() => import("@/components/voyage/CalendlyBadge"));

const DeferredCalendly = () => {
  const [show, setShow] = useState(false);
  useEffect(() => {
    const idle =
      (window as unknown as { requestIdleCallback?: (cb: () => void) => number })
        .requestIdleCallback ?? ((cb: () => void) => window.setTimeout(cb, 2000));
    const handle = idle(() => setShow(true));
    return () => {
      const cancel =
        (window as unknown as { cancelIdleCallback?: (h: number) => void }).cancelIdleCallback ??
        window.clearTimeout;
      cancel(handle as number);
    };
  }, []);
  if (!show) return null;
  return (
    <Suspense fallback={null}>
      <CalendlyBadge />
    </Suspense>
  );
};

function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  useEffect(() => {
    // ported from main.tsx — GA only runs in the browser
    loadGoogleAnalytics();
  }, []);

  return (
    <HelmetProvider>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <CookieConsent />
          <DeferredCalendly />
          <Suspense fallback={null}>
            <Outlet />
          </Suspense>
        </TooltipProvider>
      </QueryClientProvider>
    </HelmetProvider>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);
  return (
    <div className="min-h-screen flex items-center justify-center bg-background text-foreground p-6">
      <div className="max-w-md w-full text-center space-y-4">
        <h1 className="text-2xl font-serif-display">This page didn't load</h1>
        <p className="text-muted-foreground text-sm">
          Something went wrong on our end. You can try again or head back home.
        </p>
        <div className="flex items-center justify-center gap-3">
          <button
            className="px-4 py-2 rounded-sm bg-primary text-primary-foreground text-sm"
            onClick={() => {
              void router.invalidate();
              reset();
            }}
          >
            Try again
          </button>
          <a
            className="px-4 py-2 rounded-sm border border-border text-sm"
            href="/"
          >
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}
