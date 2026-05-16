import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import Navbar from "@/components/voyage/Navbar";
import CuratedSection from "@/components/voyage/CuratedSection";
import MeetDaniel from "@/components/voyage/MeetDaniel";
import ItineraryExamples from "@/components/voyage/ItineraryExamples";
import Reviews from "@/components/voyage/Reviews";
import PlanMyTrip from "@/components/voyage/PlanMyTrip";
import Footer from "@/components/voyage/Footer";
import Seo from "@/components/Seo";

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
        <CuratedSection />
        <MeetDaniel />
        <ItineraryExamples />
        <Reviews />
        <PlanMyTrip />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
