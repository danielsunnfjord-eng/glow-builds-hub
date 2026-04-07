import ScrollReveal from "./ScrollReveal";
import { useTranslation } from "react-i18next";
import flagBr from "@/assets/flag-br.png";

const CuratedSection = () => {
  const { t, i18n } = useTranslation();

  const perks = [
    { icon: "🏨", title: t("curated.perk1Title"), desc: t("curated.perk1Desc") },
    { icon: "🗺️", title: t("curated.perk2Title"), desc: t("curated.perk2Desc") },
    { icon: "📞", title: t("curated.perk3Title"), desc: t("curated.perk3Desc") },
  ];

  const services = [
    { icon: "✈️", title: t("experiences.flights"), desc: t("experiences.flightsDesc") },
    { icon: "🏨", title: t("experiences.accommodation"), desc: t("experiences.accommodationDesc") },
    { icon: "🎭", title: t("experiences.activities"), desc: t("experiences.activitiesDesc") },
    { icon: "🚗", title: t("experiences.transfers"), desc: t("experiences.transfersDesc") },
    { icon: "🛳️", title: t("experiences.cruises"), desc: t("experiences.cruisesDesc") },
    { icon: "🛡️", title: t("experiences.insurance"), desc: t("experiences.insuranceDesc") },
    { icon: "🍷", title: t("experiences.dining"), desc: t("experiences.diningDesc") },
    { icon: "🌿", title: t("experiences.wellness"), desc: t("experiences.wellnessDesc") },
  ];

  const isNok = i18n.language === "no";
  const isPt = i18n.language === "pt";

  const brlPrices = [200, 300, 500, 750];
  const nokPrices = [2600, 3150, 4000, 4900];

  const fmt = (eur: number, idx: number) => {
    if (isNok) return `kr ${nokPrices[idx].toLocaleString("nb-NO")}`;
    if (isPt) return `R$ ${brlPrices[idx]}`;
    return `€${eur}`;
  };

  const pricingData = [
    { group: t("pricingData.r1group"), duration: t("pricingData.r1dur"), price: fmt(225, 0) },
    { group: t("pricingData.r2group"), duration: t("pricingData.r2dur"), price: fmt(275, 1) },
    { group: t("pricingData.r3group"), duration: t("pricingData.r3dur"), price: fmt(300, 2) },
    { group: t("pricingData.r4group"), duration: t("pricingData.r4dur"), price: fmt(425, 3) },
  ];

  return (
    <section className="bg-ink text-voyage-white" id="curated">
      {/* Part 1 — Intro + No-packages disclaimer */}
      <div className="py-28 px-16 max-md:px-6 max-md:py-16">
        <ScrollReveal>
          <div className="text-[0.65rem] font-semibold tracking-[0.22em] uppercase text-gold mb-3">{t("curated.badge")}</div>
        </ScrollReveal>
        <ScrollReveal>
          <h2 className="font-serif text-[clamp(2rem,3.5vw,3rem)] font-bold leading-[1.05] tracking-tight mb-4 text-voyage-white">
            {t("curated.title1")}<br /><em className="italic font-normal text-gold-2">{t("curated.title2")}</em>
          </h2>
        </ScrollReveal>
        <ScrollReveal>
          <p className="text-[0.92rem] text-voyage-white/50 max-w-[480px] leading-relaxed">{t("curated.subtitle")}</p>
        </ScrollReveal>

        {/* No-packages disclaimer */}
        <ScrollReveal>
          <div className="mt-10 mb-0 max-w-2xl">
            <span className="inline-block px-4 py-1.5 rounded-full bg-red-500/15 border border-red-400/30 text-red-300 text-[0.78rem] font-semibold tracking-[0.06em] uppercase mb-4">
              ⚠️ {t("curated.noPackages")}
            </span>
            <p className="text-[0.88rem] text-voyage-white/50 leading-relaxed">
              {t("curated.noPackagesDesc")}
            </p>
          </div>
        </ScrollReveal>

        {/* Advisor role + perks */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 mt-16 items-start">
          <ScrollReveal>
            <div className="border border-voyage-white/[0.06] rounded-lg bg-voyage-white/[0.03] p-6">
              <h3 className="font-serif text-[1.15rem] font-bold text-voyage-white mb-3">{t("curated.whatDoes")}</h3>
              <p className="text-[0.82rem] text-voyage-white/50 leading-relaxed mb-3">{t("curated.whatDoesP1")}</p>
              <p className="text-[0.82rem] text-voyage-white/50 leading-relaxed">{t("curated.whatDoesP2")}</p>
            </div>
          </ScrollReveal>

          <ScrollReveal>
            <div className="flex flex-col gap-5">
              {perks.map((p) => (
                <div key={p.title} className="flex gap-4 items-start p-5 border border-voyage-white/[0.06] rounded-lg bg-voyage-white/[0.03] hover:border-gold/30 transition-colors">
                  <span className="text-[1.4rem] shrink-0 mt-0.5">{p.icon}</span>
                  <div>
                    <h4 className="text-[0.85rem] font-semibold text-voyage-white mb-1">{p.title}</h4>
                    <p className="text-[0.78rem] text-voyage-white/45 leading-relaxed">{p.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </ScrollReveal>
        </div>
      </div>

      {/* Part 2 — What we arrange (service boxes) */}
      <div className="px-16 pb-12 max-md:px-6" id="experiences">
        <ScrollReveal>
          <div className="text-[0.65rem] font-semibold tracking-[0.22em] uppercase text-gold mb-3">{t("experiences.badge")}</div>
        </ScrollReveal>
        <ScrollReveal>
          <h3 className="font-serif text-[clamp(1.4rem,2.5vw,2rem)] font-bold leading-[1.1] tracking-tight mb-8 text-voyage-white">
            {t("experiences.title1")}<br /><em className="italic font-normal text-gold-2">{t("experiences.title2")}</em>
          </h3>
        </ScrollReveal>
        <ScrollReveal>
          <div className="grid grid-cols-4 max-md:grid-cols-1 gap-px bg-voyage-white/[0.06] rounded-lg overflow-hidden">
            {services.map((s) => (
              <div key={s.title} className="bg-ink p-8 max-md:p-6 hover:bg-voyage-white/[0.04] transition-all cursor-default">
                <span className="text-[2rem] mb-4 block">{s.icon}</span>
                <h4 className="font-serif text-base font-bold mb-1.5 text-voyage-white">{s.title}</h4>
                <p className="text-[0.78rem] text-voyage-white/45 leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </ScrollReveal>
      </div>

      {/* Part 3 — Pricing */}
      <div className="px-16 pb-28 max-md:px-6 max-md:pb-16" id="pricing">
        <div className="max-w-3xl mx-auto mt-16">
          <ScrollReveal>
            <div className="text-[0.65rem] font-semibold tracking-[0.22em] uppercase text-gold mb-3 text-center">{t("curated.pricingBadge")}</div>
          </ScrollReveal>
          <ScrollReveal>
            <p className="text-[0.88rem] text-voyage-white/50 max-w-[560px] mx-auto leading-relaxed text-center mb-10">{t("curated.pricingSubtitle")}</p>
          </ScrollReveal>

          <ScrollReveal>
            {isPt && (
              <div className="mb-4 text-center">
                <span className="inline-block px-4 py-2 rounded-full bg-gold/15 border border-gold/30 text-gold text-[0.82rem] font-semibold">
                  {t("curated.pricingDomestic")}
                </span>
              </div>
            )}
            <div className="overflow-hidden rounded-lg border border-voyage-white/[0.06]">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-voyage-white/[0.05]">
                    <th className="text-left py-3.5 px-5 font-semibold text-voyage-white text-[0.82rem]">{t("curated.groupSize")}</th>
                    <th className="text-left py-3.5 px-5 font-semibold text-voyage-white text-[0.82rem]">{t("curated.duration")}</th>
                    <th className="text-right py-3.5 px-5 font-semibold text-voyage-white text-[0.82rem]">{t("curated.price")}</th>
                    <th className="text-right py-3.5 px-5 font-semibold text-voyage-white text-[0.82rem]">{t("curated.bookingFee")}</th>
                  </tr>
                </thead>
                <tbody>
                  {pricingData.map((row, i) => (
                    <tr key={i} className="border-t border-voyage-white/[0.06] hover:bg-voyage-white/[0.03] transition-colors">
                      <td className="py-3.5 px-5 text-voyage-white text-[0.85rem]">{row.group}</td>
                      <td className="py-3.5 px-5 text-voyage-white/50 text-[0.85rem]">{row.duration}</td>
                      <td className="py-3.5 px-5 text-right font-semibold text-gold text-[0.85rem]">{row.price}</td>
                      <td className="py-3.5 px-5 text-right text-voyage-white/50 text-[0.82rem]">{t("curated.bookingFeeValue")}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {isPt && (
              <p className="text-[0.85rem] text-gold/80 mt-4 text-center font-medium">
                ✈️ {t("curated.pricingInternational")}
              </p>
            )}
          </ScrollReveal>

          <ScrollReveal>
            <p className="text-[0.78rem] text-voyage-white/40 mt-5 text-center leading-relaxed whitespace-pre-line">{t("curated.pricingNote")}</p>
          </ScrollReveal>
        </div>
      </div>
    </section>
  );
};

export default CuratedSection;
