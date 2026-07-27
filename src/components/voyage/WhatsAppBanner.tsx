import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { MessageCircle } from "lucide-react";
import ScrollReveal from "./ScrollReveal";
import { WHATSAPP_URL } from "@/lib/whatsapp";

const WhatsAppBanner = () => {
  const { t } = useTranslation();

  return (
    <section className="bg-parchment px-6 md:px-16 py-12">
      <div className="max-w-[1200px] mx-auto">
        <ScrollReveal>
          <div className="bg-ink rounded-lg px-6 md:px-10 py-8 md:py-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="max-w-xl">
              <h3 className="font-serif text-[1.6rem] md:text-[1.9rem] font-bold text-voyage-white leading-tight mb-2">
                {t("home.waBanner.title")}
              </h3>
              <p className="text-[0.9rem] text-voyage-white/65 leading-relaxed">
                {t("home.waBanner.subtitle")}
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 shrink-0 w-full md:w-auto">
              <a
                href={WHATSAPP_URL}
                className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-sm bg-emerald-700 text-voyage-white font-semibold text-[0.78rem] tracking-[0.1em] uppercase hover:bg-emerald-800 transition-colors"
              >
                <MessageCircle className="w-4 h-4" />
                {t("home.waBanner.whatsapp")}
              </a>
              <Link
                to="/catalogue"
                className="inline-flex items-center justify-center px-6 py-3 rounded-sm bg-gold text-ink font-semibold text-[0.78rem] tracking-[0.1em] uppercase hover:bg-gold-2 transition-colors"
              >
                {t("home.waBanner.shop")}
              </Link>
            </div>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
};

export default WhatsAppBanner;
