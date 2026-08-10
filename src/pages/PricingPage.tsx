import { useTranslation } from "react-i18next";
import Navbar from "@/components/voyage/Navbar";
import Footer from "@/components/voyage/Footer";
import Pricing from "@/components/voyage/Pricing";

const PricingPage = () => {
  const { t } = useTranslation();

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

        <Pricing />

      </main>
      <Footer />
    </div>
  );
};

export default PricingPage;
