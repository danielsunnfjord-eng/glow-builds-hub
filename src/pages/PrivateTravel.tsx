import Navbar from "@/components/voyage/Navbar";
import Footer from "@/components/voyage/Footer";
import DualPathCards from "@/components/voyage/DualPathCards";
import FeaturedItineraries from "@/components/voyage/FeaturedItineraries";
import ClientPortal from "@/components/voyage/ClientPortal";
import WhyAdvisor from "@/components/voyage/WhyAdvisor";
import Reviews from "@/components/voyage/Reviews";
import { HOME_TESTIMONIAL_AUTHORS } from "@/components/voyage/home/homeCopy";

/** Private bespoke travel: sections moved here from the former homepage. */
export default function PrivateTravel() {
  return (
    <div>
      <Navbar />
      <main>
        <DualPathCards />
        <FeaturedItineraries />
        <ClientPortal />
        <WhyAdvisor />
        <Reviews exclude={HOME_TESTIMONIAL_AUTHORS} />
      </main>
      <Footer />
    </div>
  );
}
