import { lazy, Suspense, useEffect } from "react";
import { useLocation } from "react-router-dom";
import Navbar from "@/components/voyage/Navbar";
import CuratedSection from "@/components/voyage/CuratedSection";
import Seo from "@/components/Seo";

// Below-the-fold sections are code-split to keep the initial JS small.
const MeetDaniel = lazy(() => import("@/components/voyage/MeetDaniel"));
const DualPathCards = lazy(() => import("@/components/voyage/DualPathCards"));
const FeaturedItineraries = lazy(() => import("@/components/voyage/FeaturedItineraries"));
const WhatsAppBanner = lazy(() => import("@/components/voyage/WhatsAppBanner"));

const Reviews = lazy(() => import("@/components/voyage/Reviews"));
const PlanMyTrip = lazy(() => import("@/components/voyage/PlanMyTrip"));
const Footer = lazy(() => import("@/components/voyage/Footer"));

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
          <WhatsAppBanner />
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
