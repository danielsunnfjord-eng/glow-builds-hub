import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Menu, X } from "lucide-react";
import LanguageSelector from "./LanguageSelector";
import logo from "@/assets/logo.png";

const CALENDLY_LINKS: Record<string, string> = {
  en: "https://calendly.com/daniel-lirafigueiredo-fora/travel_planning",
  no: "https://calendly.com/daniel-lirafigueiredo-fora/reiseplanlegging",
  pt: "https://calendly.com/daniel-lirafigueiredo-fora/planejamento_de_viagem",
};

const Navbar = () => {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { t, i18n } = useTranslation();
  const lang = i18n.language?.substring(0, 2) || "en";
  const calendlyUrl = CALENDLY_LINKS[lang] || CALENDLY_LINKS.en;
  const [open, setOpen] = useState(false);

  const goToSection = (id: string) => {
    setOpen(false);
    if (pathname === "/") {
      document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
    } else {
      navigate(`/#${id}`);
    }
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-parchment/90 backdrop-blur-lg border-b border-gold/15 transition-all">
      <div className="flex justify-between items-center px-16 py-5 max-md:px-6 max-md:py-4">
        <a href="/" className="cursor-pointer no-underline">
          <img src={logo} alt="Fjord & Waves Travel" className="h-[4.5rem] max-md:h-12 w-auto" />
        </a>
        <div className="hidden md:flex gap-10 items-center">
          <a href="/about" className="text-[0.78rem] font-medium tracking-[0.1em] uppercase text-voyage-muted hover:text-ink transition-colors no-underline">
            {t("nav.about")}
          </a>
          <button onClick={() => goToSection("curated")} className="text-[0.78rem] font-medium tracking-[0.1em] uppercase text-voyage-muted hover:text-ink transition-colors">
            {t("nav.howItWorks")}
          </button>
          <button onClick={() => goToSection("experiences")} className="text-[0.78rem] font-medium tracking-[0.1em] uppercase text-voyage-muted hover:text-ink transition-colors">
            {t("nav.whatWeArrange")}
          </button>
          <LanguageSelector variant="light" />
          <a
            href={calendlyUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="px-5 py-2.5 rounded-sm border border-gold/40 text-ink text-[0.72rem] font-medium tracking-[0.12em] uppercase hover:bg-gold hover:text-ink hover:border-gold transition-colors"
          >
            {t("nav.bookCall")}
          </a>
          <button
            onClick={() => goToSection("enquiry")}
            className="px-5 py-2.5 rounded-sm bg-ink text-voyage-white text-[0.72rem] font-medium tracking-[0.12em] uppercase hover:bg-gold hover:text-ink transition-colors"
          >
            {t("nav.planMyTrip")}
          </button>
        </div>
        <button
          onClick={() => setOpen((v) => !v)}
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
          className="md:hidden p-2 -mr-2 text-ink"
        >
          {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {open && (
        <div className="md:hidden border-t border-gold/15 bg-parchment/95 backdrop-blur-lg px-6 py-4 flex flex-col gap-4">
          <a
            href="/about"
            onClick={() => setOpen(false)}
            className="text-[0.78rem] font-medium tracking-[0.1em] uppercase text-voyage-muted hover:text-ink transition-colors no-underline"
          >
            {t("nav.about")}
          </a>
          <button onClick={() => goToSection("curated")} className="text-left text-[0.78rem] font-medium tracking-[0.1em] uppercase text-voyage-muted hover:text-ink transition-colors">
            {t("nav.howItWorks")}
          </button>
          <button onClick={() => goToSection("experiences")} className="text-left text-[0.78rem] font-medium tracking-[0.1em] uppercase text-voyage-muted hover:text-ink transition-colors">
            {t("nav.whatWeArrange")}
          </button>
          <button onClick={() => goToSection("pricing")} className="text-left text-[0.78rem] font-medium tracking-[0.1em] uppercase text-voyage-muted hover:text-ink transition-colors">
            {t("nav.pricing")}
          </button>
          <a
            href="/itineraries-shop"
            onClick={() => setOpen(false)}
            className="text-[0.78rem] font-medium tracking-[0.1em] uppercase text-voyage-muted hover:text-ink transition-colors no-underline"
          >
            {t("nav.shop")}
          </a>
          <div className="pt-2">
            <LanguageSelector variant="light" />
          </div>
          <a
            href={calendlyUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => setOpen(false)}
            className="px-5 py-2.5 rounded-sm border border-gold/40 text-ink text-[0.72rem] font-medium tracking-[0.12em] uppercase text-center hover:bg-gold hover:text-ink hover:border-gold transition-colors no-underline"
          >
            {t("nav.bookCall")}
          </a>
          <button
            onClick={() => goToSection("enquiry")}
            className="px-5 py-2.5 rounded-sm bg-ink text-voyage-white text-[0.72rem] font-medium tracking-[0.12em] uppercase hover:bg-gold hover:text-ink transition-colors"
          >
            {t("nav.planMyTrip")}
          </button>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
