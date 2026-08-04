import { useNavigate, useLocation } from "react-router-dom";
import { openCookieSettings } from "@/components/voyage/CookieConsent";
import { Mail, Linkedin, Instagram, Globe } from "lucide-react";
import { useTranslation } from "react-i18next";
import logo from "@/assets/logo-badge.webp";
import { currentLocale, localePath } from "@/lib/locale";

const scrollToId = (id: string) => {
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
};


const Footer = () => {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { t } = useTranslation();

  const goToSection = (id: string) => {
    if (pathname === "/") {
      scrollToId(id);
    } else {
      navigate(`/#${id}`);
    }
  };


  return (
    <>
      <footer className="bg-ink text-voyage-white p-16 grid grid-cols-[1.5fr_1fr_1fr] gap-16 max-md:grid-cols-1 max-md:p-8">
        <div>
          <img src={logo} alt="Fjord & Waves Travel" width={600} height={600} className="h-40 w-auto mb-3 brightness-0 invert [filter:brightness(0)_invert(1)_contrast(1.3)]" />
          <p className="text-[0.78rem] text-voyage-white/40 leading-relaxed">
            {t("footer.tagline")}
          </p>
        </div>
        <div>
          <h5 className="text-[0.65rem] font-semibold tracking-[0.2em] uppercase text-voyage-white/30 mb-5">{t("footer.explore")}</h5>
          <button onClick={() => navigate("/about")} className="block text-[0.82rem] text-voyage-white/50 hover:text-voyage-white transition-colors mb-2.5 text-left">{t("nav.about")}</button>
          <button onClick={() => goToSection("why-advisor")} className="block text-[0.82rem] text-voyage-white/50 hover:text-voyage-white transition-colors mb-2.5 text-left">{t("nav.whyAdvisor")}</button>
          <button onClick={() => goToSection("reviews")} className="block text-[0.82rem] text-voyage-white/50 hover:text-voyage-white transition-colors mb-2.5 text-left">{t("nav.reviews")}</button>
          <button onClick={() => navigate("/catalogue")} className="block text-[0.82rem] text-voyage-white/50 hover:text-voyage-white transition-colors mb-2.5 text-left">{t("nav.shop")}</button>

        </div>
        <div>
          <h5 className="text-[0.65rem] font-semibold tracking-[0.2em] uppercase text-voyage-white/30 mb-5">{t("footer.getInTouch")}</h5>
          <button onClick={() => scrollToId("enquiry")} className="block text-[0.82rem] text-voyage-white/50 hover:text-voyage-white transition-colors mb-2.5">{t("footer.planMyTrip")}</button>
          <div className="flex gap-4 mt-4">
            <a href="mailto:daniel.lirafigueiredo@fora.travel" target="_blank" rel="noopener noreferrer" className="text-voyage-white/40 hover:text-gold transition-colors"><Mail size={18} /></a>
            <a href="https://www.foratravel.com/advisor/daniel-lira-figueiredo" target="_blank" rel="noopener noreferrer" className="text-voyage-white/40 hover:text-gold transition-colors"><Globe size={18} /></a>
            <a href="https://www.linkedin.com/in/daniel-lira-figueiredo/" target="_blank" rel="noopener noreferrer" className="text-voyage-white/40 hover:text-gold transition-colors"><Linkedin size={18} /></a>
            <a href="https://www.instagram.com/fjord_and_waves_travel/" target="_blank" rel="noopener noreferrer" className="text-voyage-white/40 hover:text-gold transition-colors"><Instagram size={18} /></a>
          </div>
        </div>
      </footer>
      <div className="bg-ink-2 px-16 py-5 flex justify-between items-center border-t border-voyage-white/[0.06] max-md:px-6 max-md:flex-col max-md:gap-2">
        <p className="text-[0.72rem] text-voyage-white/25">{t("footer.rights")}</p>
        <div className="flex items-center gap-5">
          <a href={localePath("/privacy", currentLocale())} className="text-[0.68rem] text-voyage-white/30 hover:text-voyage-white/60 transition-colors">Privacy</a>
          <a href={localePath("/terms", currentLocale())} className="text-[0.68rem] text-voyage-white/30 hover:text-voyage-white/60 transition-colors">Terms</a>
          <button onClick={openCookieSettings} className="text-[0.68rem] text-voyage-white/30 hover:text-voyage-white/60 transition-colors">Cookies</button>
          <button onClick={() => navigate("/login")} className="text-[0.68rem] text-voyage-white/20 hover:text-voyage-white/50 transition-colors">{t("footer.admin")}</button>
        </div>
      </div>
    </>
  );
};

export default Footer;
