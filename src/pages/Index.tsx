import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import Navbar from "@/components/voyage/Navbar";
import Hero from "@/components/voyage/Hero";
import CuratedSection from "@/components/voyage/CuratedSection";
import ExperiencesStrip from "@/components/voyage/ExperiencesStrip";
import ItineraryExamples from "@/components/voyage/ItineraryExamples";

import Newsletter from "@/components/voyage/Newsletter";
import PlanMyTrip from "@/components/voyage/PlanMyTrip";
import Pricing from "@/components/voyage/Pricing";
import Footer from "@/components/voyage/Footer";

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
      <Navbar />
      <Hero />
      <CuratedSection />
      <ItineraryExamples />
      <ExperiencesStrip />
      <PlanMyTrip />
      <Newsletter />
      <Footer />
    </div>
  );
};

export default Index;
