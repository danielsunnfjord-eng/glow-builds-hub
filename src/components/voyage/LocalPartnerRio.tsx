import { currentLocale, type Locale } from "@/lib/locale";
import rstLogo from "@/assets/home/rst_logo.jpg.asset.json";

/**
 * Reusable block A: Rio local partner.
 * Shown on: homepage, folk high school pages, sports & surf pages, About.
 * Never shown on the corporate pages.
 */
const COPY: Record<Locale, { eyebrow: string; name: string; text: string }> = {
  en: {
    eyebrow: "Our local partner in Rio",
    name: "Rio Sport & Tour",
    text: "For over 20 years, Rio Sport & Tour has delivered educational and sports trips in Rio de Janeiro for Norwegian folk high schools, American colleges, sports clubs and cultural groups. They handle hotels, transport, training sessions, matches, cultural programs and 24/7 support on the ground.",
  },
  no: {
    eyebrow: "Vår lokale partner i Rio",
    name: "Rio Sport & Tour",
    text: "I over 20 år har Rio Sport & Tour gjennomført utdannings- og idrettsreiser i Rio de Janeiro for norske folkehøgskoler, amerikanske colleges, idrettslag og kulturgrupper. De tar seg av hotell, transport, treningsøkter, kamper, kulturprogram og døgnkontinuerlig støtte på bakken.",
  },
  // DRAFT – pending review: Portuguese translated from the English text.
  pt: {
    eyebrow: "Nosso parceiro local no Rio",
    name: "Rio Sport & Tour",
    text: "Há mais de 20 anos, a Rio Sport & Tour realiza viagens educacionais e esportivas no Rio de Janeiro para folk high schools norueguesas, colleges americanos, clubes esportivos e grupos culturais. Eles cuidam de hotéis, transporte, treinos, jogos, programação cultural e suporte 24 horas por dia no local.",
  },
};

export default function LocalPartnerRio() {
  const c = COPY[currentLocale()];
  return (
    <section className="bg-parchment-2 px-16 py-20 max-md:px-6 max-md:py-14">
      <div className="mx-auto grid max-w-5xl grid-cols-[auto_1fr] items-center gap-10 max-md:grid-cols-1 max-md:gap-6 max-md:text-center">
        <img src={rstLogo.url} alt="Rio Sport & Tour logo" loading="lazy" className="h-36 w-36 rounded-full border border-gold/30 bg-voyage-white object-contain p-2 max-md:mx-auto" />
        <div>
          <div className="mb-3 text-[0.65rem] font-semibold uppercase tracking-[0.22em] text-gold">{c.eyebrow}</div>
          <h2 className="mb-3 font-serif text-[clamp(1.6rem,2.6vw,2.2rem)] font-bold text-ink">{c.name}</h2>
          <p className="max-w-2xl text-[0.95rem] leading-relaxed text-voyage-muted max-md:mx-auto">{c.text}</p>
        </div>
      </div>
    </section>
  );
}

// REUSABLE BLOCK B PLACEHOLDER: "Local hosts in Sogn og Fjordane" — hidden until the
// owner confirms supplier names. Do not render.
