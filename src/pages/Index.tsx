import Navbar from "@/components/voyage/Navbar";
import Hero from "@/components/voyage/Hero";
import TwoWays from "@/components/voyage/TwoWays";
import SearchSection from "@/components/voyage/SearchSection";
import CuratedSection from "@/components/voyage/CuratedSection";
import ExperiencesStrip from "@/components/voyage/ExperiencesStrip";
import Testimonials from "@/components/voyage/Testimonials";
import Footer from "@/components/voyage/Footer";

const Index = () => {
  return (
    <div>
      <Navbar />
      <Hero />
      <TwoWays />
      <SearchSection />
      <CuratedSection />
      <ExperiencesStrip />
      <Testimonials />
      <Footer />
    </div>
  );
};

export default Index;
