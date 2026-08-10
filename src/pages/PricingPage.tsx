import { useTranslation } from "react-i18next";
import Navbar from "@/components/voyage/Navbar";
import Footer from "@/components/voyage/Footer";
import Pricing from "@/components/voyage/Pricing";
import ScrollReveal from "@/components/voyage/ScrollReveal";
import Seo from "@/components/Seo";

const FAQ_COUNT = 5;

const PricingPage = () => {
  const { t } = useTranslation();

  const faqs = Array.from({ length: FAQ_COUNT }, (_, i) => ({
    q: t(`pricingPage.faq.${i}.q`),
    a: t(`pricingPage.faq.${i}.a`),
  }));

  return (
    <div>
      <Seo
        title={t("pricingPage.seoTitle")}
        description={t("pricingPage.seoDescription")}
        path="/pricing"
        jsonLd={{
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: faqs.map((f) => ({
            "@type": "Question",
            name: f.q,
            acceptedAnswer: { "@type": "Answer", text: f.a },
          })),
        }}
      />
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

        <Pricing />

        <section className="bg-parchment-2 py-20 px-6 md:px-16">
          <div className="max-w-[900px] mx-auto">
            <ScrollReveal>
              <div className="text-[0.65rem] font-semibold tracking-[0.22em] uppercase text-gold mb-4 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-gold" />
                {t("pricingPage.faqEyebrow")}
              </div>
              <h2 className="font-serif text-[clamp(1.7rem,3.2vw,2.4rem)] font-bold text-ink mb-10 tracking-tight">
                {t("pricingPage.faqHeading")}
              </h2>
            </ScrollReveal>
            <div className="space-y-4">
              {faqs.map((f) => (
                <ScrollReveal key={f.q}>
                  <details className="group bg-parchment border border-ink/[0.08] rounded-lg p-6">
                    <summary className="cursor-pointer list-none font-serif text-[1.1rem] font-bold text-ink flex items-start justify-between gap-4">
                      {f.q}
                      <span className="text-gold text-xl leading-none transition-transform group-open:rotate-45">
                        +
                      </span>
                    </summary>
                    <p className="mt-3 text-[0.92rem] text-voyage-muted leading-relaxed">{f.a}</p>
                  </details>
                </ScrollReveal>
              ))}
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default PricingPage;
