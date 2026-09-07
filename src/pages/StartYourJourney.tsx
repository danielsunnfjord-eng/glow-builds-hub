import { useTranslation } from "react-i18next";
import Navbar from "@/components/voyage/Navbar";
import Footer from "@/components/voyage/Footer";
import { useIntakeCta } from "@/components/voyage/IntakeFormModal";
import heroImage from "@/assets/start-journey-hero.jpg";

const StartYourJourney = () => {
  const { t } = useTranslation();
  const { open: openIntake } = useIntakeCta();

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <main className="flex-1">
        {/* Hero */}
        <section className="relative min-h-[80vh] flex items-center justify-center overflow-hidden bg-ink">
          <img
            src={heroImage}
            alt="Norwegian fjord at golden hour"
            width={1920}
            height={1080}
            className="absolute inset-0 w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-ink/70 via-ink/40 to-ink/80" />
          <div className="relative z-10 max-w-3xl px-6 text-center pt-24 pb-16">
            <div className="inline-flex items-center gap-2.5 text-[0.68rem] font-semibold tracking-[0.2em] uppercase text-gold-2 mb-6">
              <div className="w-[30px] h-px bg-gold" />
              {t("startJourney.eyebrow")}
              <div className="w-[30px] h-px bg-gold" />
            </div>
            <h1 className="font-serif text-[clamp(2.6rem,6vw,5rem)] font-bold leading-[0.98] text-voyage-white mb-6 tracking-tight">
              {t("startJourney.titleStart")} <em className="italic font-normal text-gold-2">{t("startJourney.titleAccent")}</em>
            </h1>
            <p className="text-base md:text-lg font-light text-voyage-white/75 max-w-xl mx-auto leading-relaxed mb-10">
              {t("startJourney.subtitle")}
            </p>
            <button
              onClick={openIntake}
              className="inline-flex items-center gap-2 px-10 py-4 bg-gold text-ink font-semibold text-[0.78rem] tracking-[0.1em] uppercase rounded-xs hover:bg-gold-2 hover:-translate-y-0.5 hover:shadow-[0_10px_30px_rgba(184,135,42,0.3)] transition-all"
            >
              {t("startJourney.cta")}
            </button>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default StartYourJourney;
