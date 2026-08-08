import { useNavigate } from "react-router-dom";
import { Mail, Linkedin, Instagram, Globe } from "lucide-react";
import ScrollReveal from "@/components/voyage/ScrollReveal";
import Navbar from "@/components/voyage/Navbar";
import Footer from "@/components/voyage/Footer";
import danielProfile from "@/assets/daniel-profile.webp";
import Seo from "@/components/Seo";
import { useTranslation } from "react-i18next";

const About = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  return (
    <div>
      <Seo
        title="About Daniel Lira Figueiredo — Fjord & Waves Travel"
        description="Meet Daniel Lira Figueiredo, founder of Fjord & Waves Travel and Fora Travel advisor (IATA accredited). Multilingual concierge travel planning."
        path="/about"
      />
      <Navbar />
      <main>

      <section className="pt-44 pb-20 px-16 bg-ink relative overflow-hidden max-lg:px-10 max-md:px-6 max-md:pt-36 max-md:pb-14">
        <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse 60% 70% at 80% 30%, rgba(169,198,193,0.10) 0%, transparent 60%), radial-gradient(ellipse 40% 50% at 10% 80%, rgba(76,111,117,0.18) 0%, transparent 55%), linear-gradient(170deg, #0d1722 0%, #1e2d3d 45%, #14202c 100%)" }} />
        <div className="relative z-10 flex items-center gap-12 max-md:flex-col max-md:gap-8">
          <div className="flex-1 min-w-0">
            <div className="inline-flex items-center gap-2.5 text-[0.68rem] font-semibold tracking-[0.2em] uppercase text-gold-2 mb-6">
              <div className="w-[30px] h-px bg-gold" />
              {t("about.badge")}
            </div>
            <h1 className="font-serif text-[clamp(2.2rem,4.2vw,3.8rem)] font-bold leading-[1.05] text-voyage-white mb-6 tracking-tight break-words">
              Daniel Lira<br /><em className="italic font-normal text-gold-2">Figueiredo</em>
            </h1>
            <p className="text-sm text-voyage-white/50 tracking-[0.12em] uppercase">{t("about.foraLine")}</p>
            <div className="flex gap-4 mt-4">
              <a href="mailto:daniel.lirafigueiredo@fora.travel" target="_blank" rel="noopener noreferrer" aria-label="Email Daniel" className="text-voyage-white/40 hover:text-gold transition-colors"><Mail size={18} /></a>
              <a href="https://www.foratravel.com/advisor/daniel-lira-figueiredo" target="_blank" rel="noopener noreferrer" aria-label="Visit Fora Travel profile" className="text-voyage-white/40 hover:text-gold transition-colors"><Globe size={18} /></a>
              <a href="https://www.linkedin.com/in/daniel-lira-figueiredo/" target="_blank" rel="noopener noreferrer" aria-label="Visit LinkedIn profile" className="text-voyage-white/40 hover:text-gold transition-colors"><Linkedin size={18} /></a>
              <a href="https://www.instagram.com/fjord_and_waves_travel/" target="_blank" rel="noopener noreferrer" aria-label="Visit Instagram profile" className="text-voyage-white/40 hover:text-gold transition-colors"><Instagram size={18} /></a>
            </div>
          </div>
          <div className="w-56 h-56 rounded-full overflow-hidden border-2 border-gold/40 shadow-[0_10px_40px_rgba(169,198,193,0.18)] flex-shrink-0 translate-y-6 max-md:w-44 max-md:h-44 max-md:translate-y-3">
            <img src={danielProfile} alt="Daniel Lira Figueiredo" width={800} height={783} className="w-full h-full object-cover object-[center_42%]" />
          </div>
        </div>
      </section>

      <section className="py-20 px-16 bg-parchment max-md:px-6 max-md:py-14">
        <div className="max-w-3xl mx-auto">
          <ScrollReveal><p className="text-lg leading-relaxed text-voyage-muted mb-8 font-light">{t("about.bio1")}</p></ScrollReveal>
          <ScrollReveal><p className="text-lg leading-relaxed text-voyage-muted mb-8 font-light">{t("about.bio2")}</p></ScrollReveal>
          <ScrollReveal><p className="text-lg leading-relaxed text-voyage-muted font-light">{t("about.bio3")}</p></ScrollReveal>
        </div>
      </section>

      <section className="py-20 px-16 bg-parchment-2 max-md:px-6 max-md:py-14">
        <div className="max-w-3xl mx-auto grid grid-cols-2 gap-8 max-md:grid-cols-1">
          {[
            { icon: "🇧🇷", text: t("about.h1") },
            { icon: "🌍", text: t("about.h2") },
            { icon: "🗣️", text: t("about.h3") },
            { icon: "🏔️", text: t("about.h4") },
          ].map((item) => (
            <ScrollReveal key={item.text}>
              <div className="flex items-start gap-4 p-6 rounded-xs bg-parchment border border-gold/20 shadow-xs">
                <span className="text-2xl">{item.icon}</span>
                <p className="text-sm text-ink leading-relaxed font-medium">{item.text}</p>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </section>

      <section className="py-20 px-16 bg-ink text-center relative overflow-hidden max-md:px-6 max-md:py-14">
        <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse 50% 60% at 50% 50%, rgba(76,111,117,0.20) 0%, transparent 60%), linear-gradient(170deg, #0d1722 0%, #1e2d3d 50%, #14202c 100%)" }} />
        <div className="relative z-10">
          <ScrollReveal>
            <h2 className="font-serif text-3xl text-voyage-white mb-4">{t("about.ctaTitle")}</h2>
            <p className="text-voyage-white/60 mb-8 max-w-md mx-auto text-sm leading-relaxed">{t("about.ctaSubtitle")}</p>
            <button onClick={() => navigate("/")} className="px-8 py-4 bg-gold text-ink font-semibold text-[0.78rem] tracking-[0.1em] uppercase rounded-xs hover:bg-gold-2 hover:-translate-y-0.5 hover:shadow-[0_10px_30px_rgba(169,198,193,0.25)] transition-all">
              {t("about.ctaBtn")}
            </button>
          </ScrollReveal>
        </div>
      </section>

      </main>
      <Footer />
    </div>
  );
};

export default About;
