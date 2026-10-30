import { Suspense, useEffect } from "react";
import { useLocation } from "@/lib/router-compat";
import Navbar from "@/components/voyage/Navbar";
import { GroupHero, EntryCards, ConciergeSection, HowItWorks, SafetyStrip, LocalPartnerBlock, FinalCta } from "@/components/voyage/home/GroupHome";
import { HOME_TESTIMONIAL_AUTHORS } from "@/components/voyage/home/homeCopy";
import { lazyWithRetry } from "@/lib/lazyWithRetry";

const MeetDaniel = lazyWithRetry(() => import("@/components/voyage/MeetDaniel"));
const Reviews = lazyWithRetry(() => import("@/components/voyage/Reviews"));
const Footer = lazyWithRetry(() => import("@/components/voyage/Footer"));

// Private-travel sections (ClientPortal, WhyAdvisor, DualPathCards, FeaturedItineraries)
// now live on /private-travel.
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
      <main>
        <GroupHero />
        <EntryCards />
        <ConciergeSection />
        <HowItWorks />
        <HowItWorks />
        <SafetyStrip />
        <LocalPartnerBlock />
        <Suspense fallback={null}>
          <MeetDaniel concierge />
          <Reviews include={HOME_TESTIMONIAL_AUTHORS} />
        </Suspense>
        <FinalCta />
      </main>
      <Suspense fallback={null}>
        <Footer />
      </Suspense>
    </div>
  );
};

export default Index;
