import { lazy, Suspense, useEffect } from "react";
import { useLocation } from "react-router-dom";
import Navbar from "@/components/voyage/Navbar";

import Seo from "@/components/Seo";

// Retry a dynamic import once, then hard-reload if the chunk hash is stale
// (happens after a new deploy when the browser still holds the old index.html).
const lazyWithRetry = <T extends React.ComponentType<any>>(
  factory: () => Promise<{ default: T }>,
) =>
  lazy(async () => {
    try {
      return await factory();
    } catch (err) {
      const reloaded = sessionStorage.getItem("chunk-reloaded");
      if (!reloaded) {
        sessionStorage.setItem("chunk-reloaded", "1");
        window.location.reload();
        return new Promise<never>(() => {});
      }
      throw err;
    }
  });

// Below-the-fold sections are code-split to keep the initial JS small.
const MeetDaniel = lazyWithRetry(() => import("@/components/voyage/MeetDaniel"));
const DualPathCards = lazyWithRetry(() => import("@/components/voyage/DualPathCards"));
const FeaturedItineraries = lazyWithRetry(() => import("@/components/voyage/FeaturedItineraries"));


const Reviews = lazyWithRetry(() => import("@/components/voyage/Reviews"));
const PlanMyTrip = lazyWithRetry(() => import("@/components/voyage/PlanMyTrip"));
const Footer = lazyWithRetry(() => import("@/components/voyage/Footer"));

const Index = () => {
  const { hash } = useLocation();

  useEffect(() => {
    if (hash) {
      setTimeout(() => {
        document.getElementById(hash.slice(1))?.scrollIntoView({ behavior: "smooth" });
      }, 100);
    }
  }, [hash]);
  return (
    <div>
      <Seo
        title="Fjord & Waves Travel — Bespoke Travel Designed Around You"
        description="Bespoke journeys planned by Daniel Lira Figueiredo, a Fora Travel advisor (IATA accredited). Flights, hotels and hidden-gem experiences tailored to you."
        path="/"
      />
      <Navbar />
      <main>
        <Suspense fallback={null}>
          <DualPathCards />
          <FeaturedItineraries />
          <MeetDaniel />
          <Reviews />

          <PlanMyTrip />
        </Suspense>
      </main>
      <Suspense fallback={null}>
        <Footer />
      </Suspense>
    </div>
  );
};

export default Index;
