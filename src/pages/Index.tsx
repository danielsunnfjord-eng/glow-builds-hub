import { lazy, Suspense, useEffect } from "react";
import { useLocation } from "@/lib/router-compat";
import Navbar from "@/components/voyage/Navbar";
import { GroupHero, EntryCards, ProofStrip, HowItWorks, SafetyStrip, LocalPartnerBlock, FinalCta } from "@/components/voyage/home/GroupHome";
import { HOME_TESTIMONIAL_AUTHORS } from "@/components/voyage/home/homeCopy";

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
        <ProofStrip />
        <HowItWorks />
        <SafetyStrip />
        <LocalPartnerBlock />
        <Suspense fallback={null}>
          {/* FOUNDER PLACEHOLDER: replace MeetDaniel copy with the step 4 founder text when supplied. */}
          <MeetDaniel />
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
