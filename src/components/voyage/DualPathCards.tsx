import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import ScrollReveal from "./ScrollReveal";

const DualPathCards = () => {
  const { t } = useTranslation();

  return (
    <section className="bg-parchment py-24 px-6 md:px-16">
      <div className="max-w-[1200px] mx-auto">
        <ScrollReveal>
          <div className="text-center max-w-2xl mx-auto mb-14">
            <div className="text-[0.65rem] font-semibold tracking-[0.22em] uppercase text-gold mb-4">
              {t("home.dual.eyebrow")}
            </div>
            <h2 className="font-serif text-[clamp(2rem,4vw,3rem)] font-bold leading-[1.05] tracking-tight text-ink mb-4">
              {t("home.dual.title")}
            </h2>
            <p className="text-[0.95rem] text-voyage-muted leading-relaxed">
              {t("home.dual.subtitle")}
            </p>
          </div>
        </ScrollReveal>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <ScrollReveal>
            <div className="h-full flex flex-col bg-parchment-2 border border-ink/[0.06] rounded-lg p-8 md:p-10">
              <div className="text-[0.65rem] font-semibold tracking-[0.2em] uppercase text-emerald-800 mb-4 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-700" />
                {t("home.dual.readyEyebrow")}
              </div>
              <h3 className="font-serif text-[1.65rem] font-bold text-ink mb-3">
                {t("home.dual.readyTitle")}
              </h3>
              <p className="text-[0.92rem] text-voyage-muted leading-relaxed mb-8 flex-1">
                {t("home.dual.readyDesc")}
              </p>
              <Link
                to="/catalogue"
                className="inline-flex items-center justify-center self-start px-6 py-3 bg-ink text-voyage-white font-semibold text-[0.78rem] tracking-[0.1em] uppercase rounded-sm hover:bg-ink/85 transition-colors"
              >
                {t("home.dual.readyCta")}
              </Link>
            </div>
          </ScrollReveal>

          <ScrollReveal>
            <div className="h-full flex flex-col bg-[#f0e3cf]/60 border border-gold/25 rounded-lg p-8 md:p-10">
              <div className="text-[0.65rem] font-semibold tracking-[0.2em] uppercase text-gold mb-4 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-gold" />
                {t("home.dual.bespokeEyebrow")}
              </div>
              <h3 className="font-serif text-[1.65rem] font-bold text-ink mb-3">
                {t("home.dual.bespokeTitle")}
              </h3>
              <p className="text-[0.92rem] text-voyage-muted leading-relaxed mb-8 flex-1">
                {t("home.dual.bespokeDesc")}
              </p>
              <Link
                to="/start-your-journey"
                className="inline-flex items-center justify-center self-start px-6 py-3 bg-gold text-ink font-semibold text-[0.78rem] tracking-[0.1em] uppercase rounded-sm hover:bg-gold-2 transition-colors"
              >
                {t("home.dual.bespokeCta")}
              </Link>
            </div>
          </ScrollReveal>
        </div>

        {/* Credentials strip */}
        <ScrollReveal>
          <div className="mt-8 bg-ink rounded-lg px-6 md:px-8 py-6 flex flex-col md:flex-row items-start md:items-center gap-6 md:gap-8">
            <div className="flex items-center gap-4 flex-1 min-w-0">
              <div className="w-14 h-14 shrink-0 rounded-full bg-[#7a9080] flex items-center justify-center font-serif text-xl text-voyage-white font-bold">
                D
              </div>
              <div className="min-w-0">
                <p className="font-semibold text-voyage-white text-[0.95rem] leading-tight">
                  {t("home.dual.credName")}
                </p>
                <p className="text-[0.8rem] text-voyage-white/60 mt-1 leading-snug">
                  {t("home.dual.credBio")}
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2 md:gap-3">
              <span className="px-3 py-1.5 text-[0.62rem] font-semibold tracking-[0.14em] uppercase text-voyage-white/85 border border-voyage-white/25 rounded-full">
                {t("home.dual.credBadge1")}
              </span>
              <span className="px-3 py-1.5 text-[0.62rem] font-semibold tracking-[0.14em] uppercase text-voyage-white/85 border border-voyage-white/25 rounded-full">
                {t("home.dual.credBadge2")}
              </span>
              <span className="px-3 py-1.5 text-[0.62rem] font-semibold tracking-[0.14em] uppercase text-voyage-white/85 border border-voyage-white/25 rounded-full">
                {t("home.dual.credBadge3")}
              </span>
            </div>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
};

export default DualPathCards;
