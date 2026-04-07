import ScrollReveal from "./ScrollReveal";
import { useTranslation } from "react-i18next";

const ExperiencesStrip = () => {
  const { t } = useTranslation();

  const experiences = [
    { icon: "✈️", title: t("experiences.flights"), desc: t("experiences.flightsDesc") },
    { icon: "🏨", title: t("experiences.accommodation"), desc: t("experiences.accommodationDesc") },
    { icon: "🎭", title: t("experiences.activities"), desc: t("experiences.activitiesDesc") },
    { icon: "🚗", title: t("experiences.transfers"), desc: t("experiences.transfersDesc") },
    { icon: "🛳️", title: t("experiences.cruises"), desc: t("experiences.cruisesDesc") },
    { icon: "🛡️", title: t("experiences.insurance"), desc: t("experiences.insuranceDesc") },
    { icon: "🍷", title: t("experiences.dining"), desc: t("experiences.diningDesc") },
    { icon: "🌿", title: t("experiences.wellness"), desc: t("experiences.wellnessDesc") },
  ];

  return (
    <section className="py-28 px-16 bg-voyage-white max-md:px-6 max-md:py-16" id="experiences">
      <ScrollReveal>
        <div className="text-[0.65rem] font-semibold tracking-[0.22em] uppercase text-gold mb-3">{t("experiences.badge")}</div>
      </ScrollReveal>
      <ScrollReveal>
        <h2 className="font-serif text-[clamp(2rem,3.5vw,3rem)] font-bold leading-[1.05] tracking-tight mb-4">
          {t("experiences.title1")}<br /><em className="italic font-normal">{t("experiences.title2")}</em>
        </h2>
      </ScrollReveal>
      <ScrollReveal>
        <div className="grid grid-cols-4 max-md:grid-cols-1 gap-px bg-parchment-3 mt-16 rounded-lg overflow-hidden">
          {experiences.map((e) => (
            <div key={e.title} className="bg-voyage-white p-8 max-md:p-6 hover:bg-parchment hover:-translate-y-1 hover:shadow-[var(--shadow-elegant)] transition-all cursor-default relative z-0 hover:z-10">
              <span className="text-[2rem] mb-4 block">{e.icon}</span>
              <h4 className="font-serif text-base font-bold mb-1.5">{e.title}</h4>
              <p className="text-[0.78rem] text-voyage-muted leading-relaxed">{e.desc}</p>
            </div>
          ))}
        </div>
      </ScrollReveal>
    </section>
  );
};

export default ExperiencesStrip;
