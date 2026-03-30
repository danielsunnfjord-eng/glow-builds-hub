import Navbar from "@/components/voyage/Navbar";
import Hero from "@/components/voyage/Hero";
import CuratedSection from "@/components/voyage/CuratedSection";
import ExperiencesStrip from "@/components/voyage/ExperiencesStrip";
import ItineraryExamples from "@/components/voyage/ItineraryExamples";
import Testimonials from "@/components/voyage/Testimonials";
import PlanMyTrip from "@/components/voyage/PlanMyTrip";
import Footer from "@/components/voyage/Footer";

const Index = () => {
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
