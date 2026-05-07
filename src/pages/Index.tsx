import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import Navbar from "@/components/voyage/Navbar";
import CuratedSection from "@/components/voyage/CuratedSection";
import Reviews from "@/components/voyage/Reviews";
import Newsletter from "@/components/voyage/Newsletter";
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
      <CuratedSection />
      <Reviews />
      <PlanMyTrip />
      <Newsletter />
      <Footer />
    </div>
  );
};

export default Index;
