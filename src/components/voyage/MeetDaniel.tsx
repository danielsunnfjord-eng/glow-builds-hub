import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import danielProfile from "@/assets/daniel-profile.webp";
import ScrollReveal from "./ScrollReveal";

const MeetDaniel = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  return (
    <section className="bg-parchment py-20 px-16 max-md:px-6 max-md:py-14">
      <ScrollReveal>
        <div className="max-w-5xl mx-auto grid grid-cols-[auto_1fr] gap-10 items-center max-md:grid-cols-1 max-md:gap-6 max-md:text-center">
          <div className="w-44 h-44 rounded-full overflow-hidden border border-gold/30 shadow-elegant flex-shrink-0 max-md:w-36 max-md:h-36 max-md:mx-auto">
            <img src={danielProfile} alt="Daniel Lira Figueiredo" width={800} height={783} className="w-full h-full object-cover" loading="lazy" />
          </div>
          <div>
            <div className="text-[0.65rem] font-semibold tracking-[0.22em] uppercase text-gold mb-3">
              {t("meetDaniel.badge")}
            </div>
            <h2 className="font-serif text-[clamp(1.6rem,2.6vw,2.2rem)] font-bold leading-[1.1] tracking-tight mb-3 text-ink">
              {t("meetDaniel.title")}
            </h2>
            <p className="text-[0.95rem] text-voyage-muted leading-relaxed max-w-xl mb-5 max-md:mx-auto">
              {t("meetDaniel.bio")}
            </p>
            <button
              onClick={() => navigate("/about")}
              className="inline-flex items-center gap-2 px-6 py-3 border border-ink/25 text-ink text-[0.72rem] font-medium tracking-[0.12em] uppercase rounded-xs hover:bg-ink hover:text-voyage-white transition-colors"
            >
              {t("meetDaniel.cta")}
            </button>
          </div>
        </div>
      </ScrollReveal>
    </section>
  );
};

export default MeetDaniel;
