import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Check } from "lucide-react";
import ScrollReveal from "./ScrollReveal";

const PT_BADGES = [
  "Atendimento em português",
  "Pagamento em reais",
  "Roteiros feitos por quem vive na Europa",
];

const DualPathCards = () => {
  const { t, i18n } = useTranslation();
  const isPt = i18n.language === "pt";

  return (
    <section className="bg-parchment pt-60 pb-24 px-6 md:px-16">
      <div className="max-w-[1200px] mx-auto">
        <ScrollReveal>
          <div className="text-center max-w-2xl mx-auto mb-14">
            <div className="text-[0.65rem] font-semibold tracking-[0.22em] uppercase text-gold mb-4">
              {t("home.dual.eyebrow")}
            </div>
            <h1 className="font-serif text-[clamp(2rem,4vw,3rem)] font-bold leading-[1.05] tracking-tight text-ink mb-4">
              {t("home.dual.title")}
            </h1>
            <p className="text-[0.95rem] text-voyage-muted leading-relaxed">
              {t("home.dual.subtitle")}
            </p>
            {isPt && (
              <>
                <p className="mt-4 text-[0.95rem] text-voyage-muted leading-relaxed">
                  Criado por um brasileiro que vive na Europa desde 2010 — roteiros com
                  conhecimento real, não só pesquisa no Google. Atendimento em português, com
                  pagamento facilitado em reais.
                </p>
                <ul className="mt-6 flex flex-wrap justify-center gap-x-6 gap-y-3">
                  {PT_BADGES.map((badge) => (
                    <li
                      key={badge}
                      className="flex items-center gap-2 text-[0.72rem] font-medium tracking-[0.06em] uppercase text-ink/80"
                    >
                      <Check className="h-3.5 w-3.5 text-gold" strokeWidth={3} />
                      {badge}
                    </li>
                  ))}
                </ul>
              </>
            )}
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

      </div>
    </section>
  );
};

export default DualPathCards;
