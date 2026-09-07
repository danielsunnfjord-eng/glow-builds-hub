import { useTranslation } from "react-i18next";
import Navbar from "@/components/voyage/Navbar";
import Footer from "@/components/voyage/Footer";
import { useIntakeCta } from "@/components/voyage/IntakeFormModal";
import { Video } from "lucide-react";

const CALENDLY_URL = "https://calendly.com/daniel-lirafigueiredo-fora/reiseplanlegging";

const PlanMyTripPage = () => {
  const { t } = useTranslation();
  const calendlyUrl = CALENDLY_URL;
  const { open: openIntake } = useIntakeCta();

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <main className="flex-1 py-28 px-6 max-md:py-20">
        <div className="max-w-2xl mx-auto text-center">
          <h1 className="font-serif text-[clamp(2rem,3.5vw,3rem)] font-bold leading-[1.05] tracking-tight mb-2 text-foreground">
            {t("planTrip.title")}
          </h1>
          <p className="text-[0.92rem] text-muted-foreground leading-relaxed mb-10">
            {t("planTrip.dialogDesc")}
          </p>

          <button
            onClick={openIntake}
            className="inline-flex items-center gap-2 px-10 py-4 bg-gold text-ink font-semibold text-[0.78rem] tracking-[0.1em] uppercase rounded-xs hover:bg-gold-2 transition-all"
          >
            {t("startJourney.cta")}
          </button>

          {/* Video call CTA */}
          <div className="mt-12">
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
      <Footer />
    </div>
  );
};

export default PlanMyTripPage;
