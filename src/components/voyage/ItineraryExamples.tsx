import ScrollReveal from "./ScrollReveal";
import { useTranslation } from "react-i18next";

const itineraries = [
  {
    title: "Rio Flow Experience — Surf. Move. Live.",
    location: "Rio de Janeiro, Brazil",
    duration: "10 Days",
    image: "https://media.fora.travel/foratravelportal/image/upload/c_limit,w_1600/f_auto/q_auto/v1/64947bea-5a0e-49a2-a2c4-63b4562dabb4?_a=BAVAZGID0",
    url: "https://trips.foratravel.com/i/0mksXRyeML",
    lang: "pt",
  },
  {
    title: "Fjord & Waves — Norway Surf & Fjord Experience",
    location: "Nordfjord, Norway",
    duration: "6 Days",
    image: "https://media.fora.travel/foratravelportal/image/upload/c_limit,w_1600/f_auto/q_auto/v1/736dbd04-9878-47d8-92b7-ca0f931a2e3e?_a=BAVAZGID0",
    url: "https://trips.foratravel.com/i/Ui0sRK66Lf",
    lang: "en",
  },
  {
    title: "Norway's Hidden Gems",
    location: "Western Norway",
    duration: "10 Attractions",
    image: "https://media.fora.travel/foratravelportal/image/upload/c_limit,w_1600/f_auto/q_auto/v1/1d567416-cca5-4a8d-bba2-589cc915b4b8?_a=BAVAZGID0",
    url: "https://trips.foratravel.com/i/uopAhms8vz",
    lang: "en",
  },
];

const langFlags: Record<string, { src: string; alt: string }> = {
  en: { src: "https://flagcdn.com/w40/gb.png", alt: "English" },
  pt: { src: "https://flagcdn.com/w40/br.png", alt: "Português" },
  no: { src: "https://flagcdn.com/w40/no.png", alt: "Norsk" },
};

const ItineraryExamples = () => {
  const { t } = useTranslation();

  return (
    <section className="py-28 px-16 bg-parchment max-md:px-6 max-md:py-16" id="itineraries">
      <ScrollReveal>
        <div className="text-[0.65rem] font-semibold tracking-[0.22em] uppercase text-gold mb-3">{t("itineraryExamples.badge")}</div>
      </ScrollReveal>
      <ScrollReveal>
        <h2 className="font-serif text-[clamp(2rem,3.5vw,3rem)] font-bold leading-[1.05] tracking-tight mb-4 text-ink">{t("itineraryExamples.title")}</h2>
      </ScrollReveal>
      <ScrollReveal>
        <p className="text-[0.92rem] text-voyage-muted max-w-[520px] leading-relaxed mb-14">{t("itineraryExamples.subtitle")}</p>
      </ScrollReveal>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl">
        {itineraries.map((trip) => (
          <ScrollReveal key={trip.url}>
            <a href={trip.url} target="_blank" rel="noopener noreferrer" className="group block w-full rounded-lg overflow-hidden border border-ink/[0.06] bg-voyage-white shadow-sm hover:shadow-lg transition-shadow text-left cursor-pointer">
              <div className="aspect-[16/10] overflow-hidden">
                <img src={trip.image} alt={trip.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" />
              </div>
              <div className="p-6">
                <h3 className="font-serif text-[1.1rem] font-bold text-ink mb-1.5 group-hover:text-gold transition-colors">{trip.title}</h3>
                <p className="text-[0.8rem] text-voyage-muted">{trip.location} · {trip.duration}</p>
              </div>
            </a>
          </ScrollReveal>
        ))}
      </div>
    </section>
  );
};

export default ItineraryExamples;
