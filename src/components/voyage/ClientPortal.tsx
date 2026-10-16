import { useTranslation } from "react-i18next";
import ScrollReveal from "./ScrollReveal";

export const CLIENT_PORTAL_URL = "https://trips.foratravel.com/daniel-lira-figueiredo/book";

const ClientPortal = ({ className = "" }: { className?: string }) => {
  const { t } = useTranslation();
  return (
    <section className={`bg-parchment-2 py-20 px-16 max-md:px-6 max-md:py-14 ${className}`}>
      <ScrollReveal>
        <div className="max-w-3xl mx-auto text-center">
          <div className="text-[0.65rem] font-semibold tracking-[0.22em] uppercase text-gold mb-3">
            {t("clientPortal.badge")}
          </div>
          <h2 className="font-serif text-[clamp(1.6rem,2.6vw,2.2rem)] font-bold leading-[1.1] tracking-tight mb-5 text-ink">
            {t("clientPortal.title")}
          </h2>
          <p className="text-[0.95rem] text-voyage-muted leading-relaxed mb-4">{t("clientPortal.p1")}</p>
          <p className="text-[0.95rem] text-voyage-muted leading-relaxed mb-8">{t("clientPortal.p2")}</p>
          <a
            href={CLIENT_PORTAL_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-8 py-4 bg-gold text-ink font-semibold text-[0.78rem] tracking-[0.1em] uppercase rounded-xs hover:bg-gold-2 transition-all"
          >
            {t("clientPortal.cta")}
          </a>
        </div>
      </ScrollReveal>
    </section>
  );
};

export default ClientPortal;
