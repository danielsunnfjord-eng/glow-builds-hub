import { useNavigate } from "react-router-dom";
import { Mail, Linkedin, Instagram, Globe } from "lucide-react";
import ScrollReveal from "@/components/voyage/ScrollReveal";
import Navbar from "@/components/voyage/Navbar";
import Footer from "@/components/voyage/Footer";
import danielProfile from "@/assets/daniel-profile.jpg";

const About = () => {
  const navigate = useNavigate();

  return (
    <div>
      <Navbar />

      {/* Hero */}
      <section className="pt-32 pb-20 px-16 bg-ink relative overflow-hidden max-md:px-6 max-md:pt-28 max-md:pb-14">
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse 60% 70% at 80% 30%, rgba(184,135,42,0.10) 0%, transparent 60%), linear-gradient(170deg, #0a0906 0%, #1a1510 40%, #13110e 100%)",
          }}
        />
        <div className="relative z-10 flex items-center gap-12 max-md:flex-col max-md:gap-8">
          <div className="flex-1">
            <div className="inline-flex items-center gap-2.5 text-[0.68rem] font-semibold tracking-[0.2em] uppercase text-gold-2 mb-6">
              <div className="w-[30px] h-px bg-gold" />
              Founder &amp; Travel Advisor
            </div>
            <h1 className="font-serif text-[clamp(2.6rem,5vw,4.5rem)] font-bold leading-[1] text-voyage-white mb-6 tracking-tight">
              Daniel Lira<br />
              <em className="italic font-normal text-gold-2">Figueiredo</em>
            </h1>
            <p className="text-sm text-voyage-white/50 tracking-[0.12em] uppercase">
              Fora Travel Advisor · IATA Accredited · 20+ Countries Explored
            </p>
          </div>
          <div className="w-56 h-56 rounded-full overflow-hidden border-2 border-gold/30 shadow-[0_10px_40px_rgba(184,135,42,0.2)] flex-shrink-0 max-md:w-44 max-md:h-44">
            <img src={danielProfile} alt="Daniel Lira Figueiredo" className="w-full h-full object-cover" />
          </div>
        </div>
      </section>

      {/* Bio */}
      <section className="py-20 px-16 bg-parchment max-md:px-6 max-md:py-14">
        <div className="max-w-3xl mx-auto">
          <ScrollReveal>
            <p className="text-lg leading-relaxed text-voyage-muted mb-8 font-light">
              Daniel Lira Figueiredo founded Fjord &amp; Waves Tours with a singular vision: to bridge two extraordinary worlds through the art of travel. With years of experience planning international group journeys and a personal passion that spans over 20 countries, he brings a rare combination of precision and warmth to every itinerary.
            </p>
          </ScrollReveal>
          <ScrollReveal>
            <p className="text-lg leading-relaxed text-voyage-muted mb-8 font-light">
              Born in Brazil and rooted in Norway since 2010, Daniel understands both cultures from the inside. This bi-continental perspective is the foundation of Fjord &amp; Waves Tours — enabling us to design journeys that feel authentically local, whether amid the dramatic fjords of western Norway or along the sun-drenched coastline of Brazil.
            </p>
          </ScrollReveal>
          <ScrollReveal>
            <p className="text-lg leading-relaxed text-voyage-muted font-light">
              As a Fora Travel Advisor, Daniel combines industry-leading tools with deeply personal service. Every journey we design reflects his belief that great travel is not about checking boxes — it's about creating moments that stay with you long after you return home.
            </p>
          </ScrollReveal>
        </div>
      </section>

      {/* Highlights */}
      <section className="py-20 px-16 bg-parchment-2 max-md:px-6 max-md:py-14">
        <div className="max-w-3xl mx-auto grid grid-cols-2 gap-8 max-md:grid-cols-1">
          {[
            { icon: "🇧🇷", text: "Brazilian-born, living in Norway since 2010" },
            { icon: "🌍", text: "Fora Travel Advisor — 20+ countries explored" },
            { icon: "🗣️", text: "Fluent in Portuguese, Norwegian & English" },
            { icon: "🏔️", text: "Norway and Brazil specialist" },
          ].map((item) => (
            <ScrollReveal key={item.text}>
              <div className="flex items-start gap-4 p-6 rounded-sm bg-parchment border border-gold/10">
                <span className="text-2xl">{item.icon}</span>
                <p className="text-sm text-ink leading-relaxed font-medium">{item.text}</p>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-16 bg-ink text-center max-md:px-6 max-md:py-14">
        <ScrollReveal>
          <h2 className="font-serif text-3xl text-voyage-white mb-4">Ready to start planning?</h2>
          <p className="text-voyage-white/50 mb-8 max-w-md mx-auto text-sm leading-relaxed">
            Let me design a journey tailored entirely to you.
          </p>
          <button
            onClick={() => navigate("/")}
            className="px-8 py-4 bg-gold text-ink font-semibold text-[0.78rem] tracking-[0.1em] uppercase rounded-sm hover:bg-gold-2 hover:-translate-y-0.5 hover:shadow-[0_10px_30px_rgba(184,135,42,0.3)] transition-all"
          >
            Plan My Trip
          </button>
        </ScrollReveal>
      </section>

      <Footer />
    </div>
  );
};

export default About;
