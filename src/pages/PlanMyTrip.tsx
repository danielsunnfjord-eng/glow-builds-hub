import { useTranslation } from "react-i18next";
import Navbar from "@/components/voyage/Navbar";
import Footer from "@/components/voyage/Footer";
import Seo from "@/components/Seo";
import TripRequestForm from "@/components/voyage/TripRequestForm";
import { useState } from "react";
import { Video } from "lucide-react";

const CALENDLY_URL = "https://calendly.com/daniel-lirafigueiredo-fora/reiseplanlegging";

const PlanMyTripPage = () => {
  const { t, i18n } = useTranslation();
  const [submitted, setSubmitted] = useState(false);
  const calendlyUrl = CALENDLY_URL;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Seo
        title="Plan My Trip — Bespoke Itinerary Brief | Fjord & Waves"
        description="Brief your bespoke itinerary in 3 minutes. Share dates, destinations and travel style — Daniel will design a tailored proposal for you."
        path="/plan-my-trip"
        jsonLd={{
          "@context": "https://schema.org",
          "@type": "ContactPage",
          name: "Plan My Trip — Fjord & Waves Travel",
          url: "https://fjordwavestravel.com/plan-my-trip",
          description: "Submit a trip brief to Fjord & Waves Travel.",
          provider: { "@type": "TravelAgency", name: "Fjord & Waves Travel", url: "https://fjordwavestravel.com" },
        }}
      />
      <Navbar />
      <main>
      <main className="flex-1 py-28 px-6 max-md:py-20">
        <div className="max-w-2xl mx-auto">
          <h1 className="font-serif text-[clamp(2rem,3.5vw,3rem)] font-bold leading-[1.05] tracking-tight mb-2 text-foreground text-center">
            {t("planTrip.title")}
          </h1>
          <p className="text-[0.92rem] text-muted-foreground leading-relaxed mb-10 text-center">
            {t("planTrip.dialogDesc")}
          </p>

          <div className="bg-card border border-border rounded-xl p-6 md:p-8 shadow-xs">
            <TripRequestForm onSuccess={() => setSubmitted(true)} />
          </div>

          {/* Video call CTA */}
          <div className="mt-10 text-center">
            <p className="text-[0.92rem] text-muted-foreground leading-relaxed mb-4">
              {t("planTrip.videoCallText")}
            </p>
            <a
              href={calendlyUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-primary text-primary-foreground font-semibold text-sm tracking-wide hover:opacity-90 transition-opacity"
            >
              <Video className="w-4 h-4" />
              {t("planTrip.bookCall")}
            </a>
          </div>
        </div>
      </main>
      </main>
      <Footer />
    </div>
  );
};

export default PlanMyTripPage;
