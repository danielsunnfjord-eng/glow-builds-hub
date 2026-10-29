import { Link } from "@/lib/router-compat";
import { Button } from "@/components/ui/button";
import { travelNavigation, navigationCopy, GROUP_INTAKE_URL, PRIVATE_INTAKE_URL } from "@/lib/travelNavigation";
import { openCookieSettings } from "@/components/voyage/CookieConsent";
import { Mail, Linkedin, Instagram, Globe } from "lucide-react";
import { useTranslation } from "react-i18next";
import logo from "@/assets/logo-badge.webp";
import { currentLocale, localizedRoutePath } from "@/lib/locale";

const Footer = () => {
  const { t } = useTranslation();
  const locale = currentLocale();
  const copy = navigationCopy[locale];
  const linkClass = "block text-[0.82rem] text-voyage-white/50 hover:text-voyage-white transition-colors mb-2.5 text-left";

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
          <Link to="/private-travel" className={linkClass}>{copy.privateTravel}</Link>
          {travelNavigation.map((item) => <Link key={item.key} to={localizedRoutePath(item.path, locale)} className={linkClass}>{copy[item.key]}</Link>)}
          <Link to={localizedRoutePath("/start", locale)} className={linkClass}>{copy.start}</Link>
          <Link to="/catalogue" className={linkClass}>{t("nav.shop")}</Link>
          <Link to="/pricing" className={linkClass}>{t("nav.pricing")}</Link>
          <Link to="/start-your-journey" className={linkClass}>{copy.startJourney}</Link>

        </div>
        <div>
          <h5 className="text-[0.65rem] font-semibold tracking-[0.2em] uppercase text-voyage-white/30 mb-5">{t("footer.getInTouch")}</h5>
          <a href={GROUP_INTAKE_URL} target="_blank" rel="noopener noreferrer" className={linkClass}>{copy.proposal}</a>
          <a href={PRIVATE_INTAKE_URL} target="_blank" rel="noopener noreferrer" className={linkClass}>{t("footer.planMyTrip")}</a>
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
          <Link to="/privacy" className="text-[0.68rem] text-voyage-white/30 hover:text-voyage-white/60 transition-colors">Privacy</Link>
          <Link to="/terms" className="text-[0.68rem] text-voyage-white/30 hover:text-voyage-white/60 transition-colors">Terms</Link>
          <Button variant="ghost" onClick={openCookieSettings} className="h-auto p-0 text-[0.68rem] text-voyage-white/30 hover:text-voyage-white/60 hover:bg-transparent">Cookies</Button>
          <Link to="/login" className="text-[0.68rem] text-voyage-white/20 hover:text-voyage-white/50 transition-colors">{t("footer.admin")}</Link>
        </div>
      </div>
    </>
  );
};

export default Footer;
