import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import Navbar from "@/components/voyage/Navbar";
import Hero from "@/components/voyage/Hero";
import CuratedSection from "@/components/voyage/CuratedSection";
import ExperiencesStrip from "@/components/voyage/ExperiencesStrip";
import ItineraryExamples from "@/components/voyage/ItineraryExamples";

import PlanMyTrip from "@/components/voyage/PlanMyTrip";
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
      <Testimonials />
      <PlanMyTrip />
      <Footer />
    </div>
  );
};

export default Index;
