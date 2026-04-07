import ScrollReveal from "./ScrollReveal";
import { useTranslation } from "react-i18next";

const CuratedSection = () => {
  const { t, i18n } = useTranslation();

  const perks = [
    { icon: "🏨", title: t("curated.perk1Title"), desc: t("curated.perk1Desc") },
    { icon: "🗺️", title: t("curated.perk2Title"), desc: t("curated.perk2Desc") },
    { icon: "📞", title: t("curated.perk3Title"), desc: t("curated.perk3Desc") },
  ];

  const isNok = i18n.language === "no";
  const isPt = i18n.language === "pt";

  const brlPrices = [200, 300, 500, 750];
  const nokPrices = [2600, 3150, 4000, 4900];

  const fmt = (eur: number, idx: number) => {
    if (isNok) {
      return `kr ${nokPrices[idx].toLocaleString("nb-NO")}`;
    }
    if (isPt) {
      return `R$ ${brlPrices[idx]}`;
    }
    return `€${eur}`;
  };

  const pricingData = [
    { group: t("pricingData.r1group"), duration: t("pricingData.r1dur"), price: fmt(225, 0) },
    { group: t("pricingData.r2group"), duration: t("pricingData.r2dur"), price: fmt(275, 1) },
    { group: t("pricingData.r3group"), duration: t("pricingData.r3dur"), price: fmt(300, 2) },
    { group: t("pricingData.r4group"), duration: t("pricingData.r4dur"), price: fmt(425, 3) },
  ];

  return (
    <section className="py-28 px-16 bg-ink text-voyage-white max-md:px-6 max-md:py-16" id="curated">
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

      <div className="mt-24 max-w-3xl mx-auto" id="pricing">
        <ScrollReveal>
          <div className="text-[0.65rem] font-semibold tracking-[0.22em] uppercase text-gold mb-3 text-center">{t("curated.pricingBadge")}</div>
        </ScrollReveal>
        <ScrollReveal>
          <p className="text-[0.88rem] text-voyage-white/50 max-w-[560px] mx-auto leading-relaxed text-center mb-10">{t("curated.pricingSubtitle")}</p>
        </ScrollReveal>

        <ScrollReveal>
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
        </ScrollReveal>

        <ScrollReveal>
          <p className="text-[0.78rem] text-voyage-white/40 mt-5 text-center leading-relaxed whitespace-pre-line">{t("curated.pricingNote")}</p>
        </ScrollReveal>
      </div>
    </section>
  );
};

export default CuratedSection;
