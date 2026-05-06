import ScrollReveal from "./ScrollReveal";
import { useTranslation } from "react-i18next";
const FLAG_BR = "https://flagcdn.com/w80/br.png";

const scrollToId = (id: string) => {
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
};

const WHATSAPP_URL = "https://wa.me/4746866855";

const CuratedSection = () => {
  const { t, i18n } = useTranslation();

  const steps = [
    { num: "01", key: "hwStep1" },
    { num: "02", key: "hwStep2" },
    { num: "03", key: "hwStep3" },
  ];

  const values = [
    { icon: "⏱", key: "hwValue1" },
    { icon: "🛡️", key: "hwValue2" },
    { icon: "✨", key: "hwValue3" },
  ];

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

  const isPt = i18n.language === "pt";

  const brlPrices = [200, 300, 500, 750];

  const fmt = (eur: number, idx: number) => {
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
      {/* Hero + How It Works — merged */}
      <div className="min-h-screen flex flex-col justify-end relative overflow-hidden">
        {/* Background layers */}
        <div
          className="absolute inset-0"
          style={{
            background: `
              radial-gradient(ellipse 60% 70% at 80% 30%, rgba(184,135,42,0.12) 0%, transparent 60%),
              radial-gradient(ellipse 40% 50% at 10% 80%, rgba(107,124,94,0.1) 0%, transparent 50%),
              linear-gradient(170deg, #0a0906 0%, #1a1510 40%, #13110e 100%)
            `,
          }}
        />
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: "radial-gradient(circle, rgba(184,135,42,0.15) 1px, transparent 1px)",
            backgroundSize: "40px 40px",
            maskImage: "radial-gradient(ellipse 70% 70% at 80% 20%, black 0%, transparent 70%)",
            WebkitMaskImage: "radial-gradient(ellipse 70% 70% at 80% 20%, black 0%, transparent 70%)",
          }}
        />

        <div className="relative z-10 px-16 pb-24 max-md:px-6 max-md:pb-16">
          <div className="max-w-[700px]">
            <div className="inline-flex items-center gap-2.5 text-[0.68rem] font-semibold tracking-[0.2em] uppercase text-gold-2 mb-8 animate-fade-up">
              <div className="w-[30px] h-px bg-gold" />
              {t("hero.badge")}
            </div>
            <h1 className="font-serif text-[clamp(3.2rem,7vw,6rem)] font-bold leading-[0.95] text-voyage-white mb-4 tracking-tight animate-fade-up-1">
              {t("hero.title1")}
              <em className="block italic font-normal text-gold-2">{t("hero.title2")}</em>
            </h1>
            <p className="text-base font-light text-voyage-white/60 max-w-[460px] leading-relaxed mb-0 animate-fade-up-2">
              {t("hero.subtitle")}
            </p>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-12 right-16 flex flex-col items-center gap-2 text-voyage-white/30 text-[0.62rem] tracking-[0.2em] uppercase animate-fade-up-4 max-md:hidden">
          <div className="w-px h-[50px] bg-gradient-to-b from-gold/50 to-transparent animate-pulse-bar" />
          {t("hero.scroll")}
        </div>
      </div>

      {/* How it works — 3 Steps */}
      <div className="py-28 px-16 max-md:px-6 max-md:py-16">
        <ScrollReveal>
          <div className="text-[0.65rem] font-semibold tracking-[0.22em] uppercase text-gold mb-3">{t("curated.badge")}</div>
        </ScrollReveal>
        <ScrollReveal>
          <h2 className="font-serif text-[clamp(1.8rem,3vw,2.5rem)] font-bold leading-[1.1] tracking-tight mb-12 text-voyage-white">
            {t("curated.title1")}<br /><em className="italic font-normal text-gold-2">{t("curated.title2")}</em>
          </h2>
        </ScrollReveal>

        {/* 3 Steps */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {steps.map((s) => (
            <ScrollReveal key={s.key}>
              <div className="relative pl-14 max-md:pl-12">
                <span className="absolute left-0 top-0 font-serif text-[2.5rem] font-bold text-gold/20 leading-none">{s.num}</span>
                <h3 className="text-[0.95rem] font-semibold text-voyage-white mb-1.5">{t(`curated.${s.key}`)}</h3>
              </div>
            </ScrollReveal>
          ))}
        </div>

        {/* Value Props */}
        <div className="mt-16 flex flex-col md:flex-row gap-6 md:gap-12">
          {values.map((v) => (
            <ScrollReveal key={v.key}>
              <div className="flex items-center gap-3">
                <span className="text-gold text-lg">{v.icon}</span>
                <p className="text-[0.85rem] text-voyage-white/60 font-medium">{t(`curated.${v.key}`)}</p>
              </div>
            </ScrollReveal>
          ))}
        </div>

        {/* CTA after steps */}
        <ScrollReveal>
          <div className="mt-14 flex items-start">
            <button
              onClick={() => scrollToId("enquiry")}
              className="inline-flex items-center gap-2 px-8 py-4 bg-gold text-ink font-semibold text-[0.78rem] tracking-[0.1em] uppercase rounded-sm hover:bg-gold-2 hover:-translate-y-0.5 hover:shadow-[0_10px_30px_rgba(184,135,42,0.3)] transition-all"
            >
              {t("curated.ctaPrimary")}
            </button>
          </div>
        </ScrollReveal>

        {/* No-packages — soft tone */}
        <ScrollReveal>
          <div className="mt-16 mb-0 max-w-2xl">
            <span className="inline-block px-4 py-1.5 rounded-full bg-voyage-white/[0.06] border border-voyage-white/10 text-voyage-white/70 text-[0.78rem] font-semibold tracking-[0.06em] uppercase mb-4">
              ✦ {t("curated.noPackages")}
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
                <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gold/15 border border-gold/30 text-gold text-[0.82rem] font-semibold">
                  <img src={FLAG_BR} alt="Brazil" width={20} height={14} loading="lazy" className="w-5 h-3.5 rounded-[2px] object-cover" />
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

          {/* CTA after pricing */}
          <ScrollReveal>
            <div className="mt-10 flex items-center justify-center">
              <button
                onClick={() => scrollToId("enquiry")}
                className="inline-flex items-center gap-2 px-8 py-4 bg-gold text-ink font-semibold text-[0.78rem] tracking-[0.1em] uppercase rounded-sm hover:bg-gold-2 hover:-translate-y-0.5 hover:shadow-[0_10px_30px_rgba(184,135,42,0.3)] transition-all"
              >
                {t("curated.ctaPrimary")}
              </button>
            </div>
          </ScrollReveal>
        </div>
      </div>
    </section>
  );
};

export default CuratedSection;
