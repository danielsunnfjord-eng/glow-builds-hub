import { useTranslation } from "react-i18next";
import { Check } from "lucide-react";
import Navbar from "@/components/voyage/Navbar";
import Footer from "@/components/voyage/Footer";
import Pricing from "@/components/voyage/Pricing";
import { useIntakeCta } from "@/components/voyage/IntakeFormModal";
import { Link } from "@/lib/router-compat";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const FAQ_KEYS = ["0", "1", "2", "3", "4", "5", "6", "7"];

const PricingPage = () => {
  const { t } = useTranslation();
  const { onIntakeClick } = useIntakeCta();

  return (
    <div>
      <Navbar />
      <main>
        <section className="pt-44 pb-16 px-16 bg-ink relative overflow-hidden max-lg:px-10 max-md:px-6 max-md:pt-36 max-md:pb-12">
          <div
            className="absolute inset-0"
            style={{
              background:
                "radial-gradient(ellipse 60% 70% at 80% 30%, rgba(169,198,193,0.10) 0%, transparent 60%), radial-gradient(ellipse 40% 50% at 10% 80%, rgba(76,111,117,0.18) 0%, transparent 55%), linear-gradient(170deg, #0d1722 0%, #1e2d3d 45%, #14202c 100%)",
            }}
          />
          <div className="relative z-10 max-w-3xl">
            <div className="inline-flex items-center gap-2.5 text-[0.68rem] font-semibold tracking-[0.2em] uppercase text-gold-2 mb-6">
              <div className="w-[30px] h-px bg-gold" />
              {t("pricingPage.badge")}
            </div>
            <h1 className="font-serif text-[clamp(2.1rem,4vw,3.4rem)] font-bold leading-[1.08] text-voyage-white mb-5 tracking-tight">
              {t("pricingPage.title")}
            </h1>
            <p className="text-[1rem] text-voyage-white/60 leading-relaxed">
              {t("pricingPage.subtitle")}
            </p>
          </div>
        </section>

        {/* Fee terminology */}
        <section className="bg-parchment-2 py-20 px-6 md:px-16">
          <div className="max-w-[1200px] mx-auto">
            <div className="text-[0.65rem] font-semibold tracking-[0.2em] uppercase text-gold mb-3 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-gold" />
              {t("pricingPage.terms.eyebrow")}
            </div>
            <h2 className="font-serif text-[clamp(1.6rem,3vw,2.3rem)] font-bold text-ink mb-8 tracking-tight max-w-3xl">
              {t("pricingPage.terms.heading")}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="rounded-lg border border-ink/[0.08] bg-parchment p-8">
                <h3 className="font-serif text-[1.35rem] font-bold text-ink mb-3">
                  {t("pricingPage.terms.planningTitle")}
                </h3>
                <p className="text-[0.92rem] text-voyage-muted leading-relaxed">
                  {t("pricingPage.terms.planningBody")}
                </p>
              </div>
              <div className="rounded-lg border border-ink/[0.08] bg-parchment p-8">
                <h3 className="font-serif text-[1.35rem] font-bold text-ink mb-3">
                  {t("pricingPage.terms.serviceTitle")}
                </h3>
                <p className="text-[0.92rem] text-voyage-muted leading-relaxed">
                  {t("pricingPage.terms.serviceBody")}
                </p>
              </div>
            </div>
            <p className="mt-5 text-[0.8rem] text-voyage-muted">
              {t("pricingPage.terms.note")}
            </p>
          </div>
        </section>

        <Pricing />

        {/* Value of the fee */}
        <section className="bg-parchment-2 py-20 px-6 md:px-16">
          <div className="max-w-[1200px] mx-auto">
            <div className="text-[0.65rem] font-semibold tracking-[0.2em] uppercase text-gold mb-3 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-gold" />
              {t("pricingPage.value.eyebrow")}
            </div>
            <h2 className="font-serif text-[clamp(1.6rem,3vw,2.3rem)] font-bold text-ink mb-8 tracking-tight max-w-3xl">
              {t("pricingPage.value.heading")}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="rounded-lg border border-ink/[0.08] bg-parchment p-7"
                >
                  <h3 className="font-serif text-[1.25rem] font-bold text-ink mb-3">
                    {t(`pricingPage.value.blocks.${i}.title`)}
                  </h3>
                  <p className="text-[0.9rem] text-voyage-muted leading-relaxed">
                    {t(`pricingPage.value.blocks.${i}.body`)}
                  </p>
                </div>
              ))}
            </div>
            <div className="rounded-lg border border-gold/25 bg-[#f0e3cf]/60 p-8">
              <div className="text-[0.65rem] font-semibold tracking-[0.2em] uppercase text-gold mb-4">
                {t("pricingPage.value.hoursLabel")}
              </div>
              <ul className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-2.5">
                {[0, 1, 2, 3, 4].map((i) => (
                  <li key={i} className="flex items-start gap-2 text-[0.88rem] text-ink/85">
                    <Check className="h-4 w-4 mt-0.5 shrink-0 text-gold" strokeWidth={3} />
                    <span>{t(`pricingPage.value.hours.${i}`)}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* What happens next */}
        <section className="bg-parchment py-20 px-6 md:px-16">
          <div className="max-w-[1200px] mx-auto">
            <div className="text-[0.65rem] font-semibold tracking-[0.2em] uppercase text-gold mb-3 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-gold" />
              {t("pricingPage.steps.eyebrow")}
            </div>
            <h2 className="font-serif text-[clamp(1.6rem,3vw,2.3rem)] font-bold text-ink mb-8 tracking-tight">
              {t("pricingPage.steps.heading")}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {[0, 1, 2, 3].map((i) => (
                <div key={i} className="rounded-lg bg-parchment-2 border border-ink/[0.06] p-6">
                  <div className="font-serif text-[1.6rem] font-bold text-gold leading-none mb-3">
                    {String(i + 1).padStart(2, "0")}
                  </div>
                  <h3 className="font-serif text-[1.1rem] font-bold text-ink mb-2">
                    {t(`pricingPage.steps.items.${i}.title`)}
                  </h3>
                  <p className="text-[0.86rem] text-voyage-muted leading-relaxed">
                    {t(`pricingPage.steps.items.${i}.body`)}
                  </p>
                </div>
              ))}
            </div>
            <Link
              to="/start-your-journey"
              onClick={onIntakeClick}
              className="mt-8 inline-flex items-center justify-center bg-gold text-ink hover:bg-gold-2 px-7 py-3.5 font-semibold text-[0.75rem] tracking-[0.1em] uppercase rounded-xs transition-colors no-underline"
            >
              {t("pricingPage.steps.cta")}
            </Link>
          </div>
        </section>

        {/* FAQ */}
        <section className="bg-parchment-2 py-20 px-6 md:px-16">
          <div className="max-w-[820px] mx-auto">
            <div className="text-[0.65rem] font-semibold tracking-[0.2em] uppercase text-gold mb-3 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-gold" />
              {t("pricingPage.faqEyebrow")}
            </div>
            <h2 className="font-serif text-[clamp(1.6rem,3vw,2.3rem)] font-bold text-ink mb-8 tracking-tight">
              {t("pricingPage.faqHeading")}
            </h2>
            <Accordion type="single" collapsible className="w-full">
              {FAQ_KEYS.map((k) => (
                <AccordionItem key={k} value={k} className="border-ink/[0.1]">
                  <AccordionTrigger className="text-left font-serif text-[1.05rem] font-bold text-ink hover:no-underline">
                    {t(`pricingPage.faq.${k}.q`)}
                  </AccordionTrigger>
                  <AccordionContent className="text-[0.92rem] text-voyage-muted leading-relaxed">
                    {t(`pricingPage.faq.${k}.a`)}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default PricingPage;
