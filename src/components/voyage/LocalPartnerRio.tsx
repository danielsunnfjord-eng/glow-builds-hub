import { currentLocale, type Locale } from "@/lib/locale";
import rstLogo from "@/assets/home/rst_logo.jpg.asset.json";

/**
 * Reusable block A: Rio local partner.
 * Shown on: homepage, folk high school pages, sports & surf pages, About.
 * Never shown on the corporate pages.
 */
const COPY: Record<Locale, { eyebrow: string; name: string; text: string; websiteLabel: string }> = {
  en: {
    eyebrow: "Our local partner in Rio",
    name: "Rio Sports & Tour",
    text: "For over 20 years, Rio Sports & Tour has delivered educational and sports trips in Rio de Janeiro for Norwegian folk high schools, American colleges, sports clubs and cultural groups. They handle hotels, transport, training sessions, matches, cultural programs and 24/7 support on the ground.",
    websiteLabel: "Visit the Rio Sports & Tour website",
  },
  no: {
    eyebrow: "Vår lokale partner i Rio",
    name: "Rio Sports & Tour",
    text: "I over 20 år har Rio Sports & Tour gjennomført utdannings- og idrettsreiser i Rio de Janeiro for norske folkehøgskoler, amerikanske colleges, idrettslag og kulturgrupper. De tar seg av hotell, transport, treningsøkter, kamper, kulturprogram og døgnkontinuerlig støtte på bakken.",
    websiteLabel: "Besøk Rio Sports & Tours nettside", // DRAFT translation
  },
  // DRAFT – pending review: Portuguese translated from the English text.
  pt: {
    eyebrow: "Nosso parceiro local no Rio",
    name: "Rio Sports & Tour",
    text: "Há mais de 20 anos, a Rio Sports & Tour realiza viagens educacionais e esportivas no Rio de Janeiro para folk high schools norueguesas, colleges americanos, clubes esportivos e grupos culturais. Eles cuidam de hotéis, transporte, treinos, jogos, programação cultural e suporte 24 horas por dia no local.",
    websiteLabel: "Visite o site da Rio Sports & Tour", // DRAFT translation
  },
};

export default function LocalPartnerRio() {
  const c = COPY[currentLocale()];
  return (
    <section className="bg-sage px-16 py-20 max-md:px-6 max-md:py-14">
      <div className="mx-auto grid max-w-5xl grid-cols-[auto_1fr] items-center gap-10 max-md:grid-cols-1 max-md:gap-6 max-md:text-center">
        <img src={rstLogo.url} alt="Rio Sports & Tour logo" loading="lazy" className="h-36 w-36 rounded-full border border-gold/30 bg-voyage-white object-contain p-2 max-md:mx-auto" />
        <div>
          <div className="mb-3 text-[0.65rem] font-semibold uppercase tracking-[0.22em] text-gold-light">{c.eyebrow}</div>
          <h2 className="mb-3 font-serif text-[clamp(1.6rem,2.6vw,2.2rem)] font-bold text-parchment">{c.name}</h2>
          <p className="max-w-2xl text-[0.95rem] leading-relaxed text-parchment/80 max-md:mx-auto">{c.text}</p>
          <a href="https://www.riosportsandtour.com/" target="_blank" rel="noopener noreferrer" className="mt-4 inline-block text-[0.72rem] font-semibold uppercase tracking-[0.16em] text-gold-light hover:underline">
            {c.websiteLabel} →
          </a>
        </div>
      </div>
    </section>
  );
}

// REUSABLE BLOCK B PLACEHOLDER: "Local hosts in Sogn og Fjordane" — hidden until the
// owner confirms supplier names. Do not render.
