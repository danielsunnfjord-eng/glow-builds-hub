import ScrollReveal from "./ScrollReveal";
import { useTranslation } from "react-i18next";
import { Hotel, Map, Phone } from "lucide-react";

const WhyAdvisor = () => {
  const { t } = useTranslation();

  const perks = [
    { Icon: Hotel, title: t("curated.perk1Title"), desc: t("curated.perk1Desc") },
    { Icon: Map, title: t("curated.perk2Title"), desc: t("curated.perk2Desc") },
    { Icon: Phone, title: t("curated.perk3Title"), desc: t("curated.perk3Desc") },
  ];

  return (
    <section className="bg-ink text-voyage-white py-28 px-16 max-md:px-6 max-md:py-16">
      <div className="max-w-[1200px] mx-auto">
        <ScrollReveal>
          <div className="text-[0.65rem] font-semibold tracking-[0.22em] uppercase text-gold mb-3">
            {t("curated.badge")}
          </div>
        </ScrollReveal>
        <ScrollReveal>
          <h2 className="font-serif text-[clamp(1.8rem,3vw,2.5rem)] font-bold leading-[1.1] tracking-tight mb-12 text-voyage-white">
            {t("curated.whatDoes")}
          </h2>
        </ScrollReveal>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-start">
          <ScrollReveal>
            <div className="border border-voyage-white/[0.06] rounded-lg bg-voyage-white/[0.03] p-6 h-full">
              <h3 className="font-serif text-[1.15rem] font-bold text-voyage-white mb-3">
                {t("curated.whatDoes")}
              </h3>
              <p className="text-[0.82rem] text-voyage-white/50 leading-relaxed mb-3">
                {t("curated.whatDoesP1")}
              </p>
              <p className="text-[0.82rem] text-voyage-white/50 leading-relaxed">
                {t("curated.whatDoesP2")}
              </p>
            </div>
          </ScrollReveal>

          <ScrollReveal>
            <div className="flex flex-col gap-5">
              {perks.map((p) => (
                <div
                  key={p.title}
                  className="flex gap-4 items-start p-5 border border-voyage-white/[0.06] rounded-lg bg-voyage-white/[0.03] hover:border-gold/30 transition-colors"
                >
                  <p.Icon className="text-gold w-6 h-6 shrink-0 mt-0.5" strokeWidth={1.5} />
                  <div>
                    <h4 className="text-[0.85rem] font-semibold text-voyage-white mb-1">
                      {p.title}
                    </h4>
                    <p className="text-[0.78rem] text-voyage-white/45 leading-relaxed">
                      {p.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </ScrollReveal>
        </div>
      </div>
    </section>
  );
};

export default WhyAdvisor;
