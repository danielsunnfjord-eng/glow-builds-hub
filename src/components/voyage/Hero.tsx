import { useTranslation } from "react-i18next";
import heroBg from "@/assets/hero-fjord.png.asset.json";

const scrollToId = (id: string) => {
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
};

const Hero = () => {
  const { t } = useTranslation();

  return (
    <section
      className="min-h-[90vh] flex flex-col justify-center px-16 pt-40 pb-24 relative overflow-hidden max-md:px-6 max-md:pb-20 max-md:min-h-[80vh] max-md:pt-32"
      style={{
        backgroundImage: `url(${heroBg.url})`,
        backgroundSize: "cover",
        backgroundPosition: "center top",
      }}
    >
      {/* Subtle left-side wash to ensure HTML text sits cleanly over the image text */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(90deg, rgba(246,244,238,0.55) 0%, rgba(246,244,238,0.25) 35%, transparent 65%)",
        }}
      />

      <div className="relative z-10 max-w-[700px]">
        <div className="inline-flex items-center gap-2.5 text-[0.68rem] font-semibold tracking-[0.2em] uppercase text-ink mb-8 animate-fade-up">
          <div className="w-[30px] h-px bg-ink" />
          {t("hero.badge")}
        </div>
        <h1 className="font-serif text-[clamp(3.2rem,7vw,6rem)] font-bold leading-[0.95] text-ink mb-8 tracking-tight animate-fade-up-1">
          {t("hero.title1")}
          <em className="block italic font-normal text-gold">{t("hero.title2")}</em>
        </h1>
        <p className="text-base font-light text-ink/70 max-w-[460px] leading-relaxed mb-12 animate-fade-up-2">
          {t("hero.subtitle")}
        </p>
        <div className="flex gap-4 flex-wrap animate-fade-up-3">
          <button
            onClick={() => scrollToId("enquiry")}
            className="inline-flex items-center gap-2 px-8 py-4 bg-gold text-ink font-semibold text-[0.78rem] tracking-[0.1em] uppercase rounded-sm hover:bg-gold-2 hover:-translate-y-0.5 hover:shadow-[0_10px_30px_rgba(184,135,42,0.3)] transition-all"
          >
            {t("hero.cta")}
          </button>
          <button
            onClick={() => scrollToId("curated")}
            className="inline-flex items-center gap-2 px-8 py-4 bg-transparent border border-ink/25 text-ink/80 font-medium text-[0.78rem] tracking-[0.1em] uppercase rounded-sm hover:border-gold hover:text-gold hover:-translate-y-0.5 transition-all"
          >
            {t("hero.howItWorks")}
          </button>
        </div>
      </div>

      <div className="absolute bottom-12 right-16 flex flex-col items-center gap-2 text-ink/30 text-[0.62rem] tracking-[0.2em] uppercase animate-fade-up-4 max-md:hidden">
        <div className="w-px h-[50px] bg-gradient-to-b from-ink/50 to-transparent animate-pulse-bar" />
        {t("hero.scroll")}
      </div>
    </section>
  );
};

export default Hero;
