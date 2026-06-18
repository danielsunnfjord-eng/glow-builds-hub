import { useNavigate } from "react-router-dom";
import ScrollReveal from "./ScrollReveal";
import planTripImg from "@/assets/plan-trip-card.webp";
import { useTranslation } from "react-i18next";
import { Video } from "lucide-react";

const CALENDLY_URL = "https://calendly.com/daniel-lirafigueiredo-fora/reiseplanlegging";

const PlanMyTrip = () => {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const calendlyUrl = CALENDLY_URL;

  return (
    <section className="py-28 px-16 bg-background max-md:px-6 max-md:py-16" id="enquiry">
      <div className="max-w-2xl mx-auto">
        <ScrollReveal>
          <h2 className="font-serif text-[clamp(2rem,3.5vw,3rem)] font-bold leading-[1.05] tracking-tight mb-2 text-foreground text-center">{t("planTrip.title")}</h2>
        </ScrollReveal>
        <ScrollReveal>
          <p className="text-[0.92rem] text-muted-foreground leading-relaxed mb-10 text-center">{t("planTrip.subtitle")}</p>
        </ScrollReveal>
        <ScrollReveal>
          <button onClick={() => navigate("/start-your-journey")} className="group block w-full overflow-hidden rounded-xl border border-border shadow-md hover:shadow-xl transition-all duration-300 bg-card cursor-pointer text-left">
            <div className="relative aspect-[16/9] overflow-hidden">
              <img src={planTripImg} alt="Plan your curated trip" loading="lazy" width={1024} height={640} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
              <div className="absolute bottom-4 left-5 right-5">
                <span className="font-serif text-lg font-bold text-white">{t("planTrip.cardTitle")}</span>
              </div>
            </div>
            <div className="p-5">
              <p className="text-sm text-muted-foreground leading-relaxed">{t("planTrip.cardDesc")}</p>
            </div>
          </button>
        </ScrollReveal>

        {/* Video call CTA */}
        <ScrollReveal>
          <div className="mt-8 text-center">
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
        </ScrollReveal>
      </div>
    </section>
  );
};

export default PlanMyTrip;
