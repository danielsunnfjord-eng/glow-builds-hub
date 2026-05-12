import { useState } from "react";
import ScrollReveal from "./ScrollReveal";
import { useTranslation } from "react-i18next";

const itineraries = [
  {
    title: "Rio Flow Experience — Surf. Move. Live.",
    location: "Rio de Janeiro, Brazil",
    duration: "10 Days",
    image: "https://media.fora.travel/foratravelportal/image/upload/c_limit,w_1600/f_auto/q_auto/v1/64947bea-5a0e-49a2-a2c4-63b4562dabb4?_a=BAVAZGID0",
    url: "https://trips.foratravel.com/i/0mksXRyeML",
    lang: "en",
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
  {
    title: "Verão na Noruega — Condado de Vestland",
    location: "Vestland, Norway",
    duration: "Itinerário Base",
    image: "https://media.fora.travel/foratravelportal/image/upload/c_limit,w_1600/f_auto/q_auto/v1/44024830-0b55-4ade-9055-9a7ab4d2acfd?_a=BAVAZGID0",
    url: "https://trips.foratravel.com/i/UqWIpF4Vw7",
    lang: "pt",
  },
  {
    title: "Norte da Itália — Experiência Premium",
    location: "Italy",
    duration: "10 Days",
    image: "https://media.fora.travel/foratravelportal/image/upload/c_limit,w_1600/f_auto/q_auto/v1/30fb1b96-88fb-4189-9801-55c4e975b70e?_a=BAVAZGID0",
    url: "https://trips.foratravel.com/i/vM5gVsy5yP",
    lang: "pt",
  },
  {
    title: "Sul da Itália — Experiência Premium",
    location: "Italy",
    duration: "10 Days",
    image: "https://media.fora.travel/foratravelportal/image/upload/c_limit,w_1600/f_auto/q_auto/v1/21f7e340-795e-40d0-9619-fe60374a329b?_a=BAVAZGID0",
    url: "https://trips.foratravel.com/i/D7NaPKgMr2",
    lang: "pt",
  },
];

const langFilters = [
  { key: "all", labelKey: "itineraryExamples.filterAll", flag: null },
  { key: "en", labelKey: "itineraryExamples.filterEn", flag: "https://flagcdn.com/w40/gb.png" },
  { key: "pt", labelKey: "itineraryExamples.filterPt", flag: "https://flagcdn.com/w40/br.png" },
];

const langFlags: Record<string, { src: string; alt: string }> = {
  en: { src: "https://flagcdn.com/w40/gb.png", alt: "English" },
  pt: { src: "https://flagcdn.com/w40/br.png", alt: "Português" },
  no: { src: "https://flagcdn.com/w40/no.png", alt: "Norsk" },
};

const ItineraryExamples = () => {
  const { t } = useTranslation();
  const [activeLang, setActiveLang] = useState<string>("all");
  const [openUrl, setOpenUrl] = useState<string | null>(null);
  const [openTitle, setOpenTitle] = useState<string>("");

  return (
    <section className="py-28 px-16 bg-parchment max-md:px-6 max-md:py-16" id="itineraries">
      <ScrollReveal>
        <div className="text-[0.65rem] font-semibold tracking-[0.22em] uppercase text-gold mb-3">{t("itineraryExamples.badge")}</div>
      </ScrollReveal>
      <ScrollReveal>
        <h2 className="font-serif text-[clamp(2rem,3.5vw,3rem)] font-bold leading-[1.05] tracking-tight mb-4 text-ink">{t("itineraryExamples.title")}</h2>
      </ScrollReveal>
      <ScrollReveal>
        <p className="text-[0.92rem] text-voyage-muted max-w-[520px] leading-relaxed mb-8">{t("itineraryExamples.subtitle")}</p>
      </ScrollReveal>

      <div className="flex items-center gap-2 mb-10">
        {langFilters.map((f) => (
          <button
            key={f.key}
            onClick={() => setActiveLang(f.key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-full text-[0.8rem] font-medium border transition-all ${
              activeLang === f.key
                ? "bg-ink text-parchment border-ink"
                : "bg-transparent text-ink border-ink/20 hover:border-ink/40"
            }`}
          >
            {f.flag && (
              <img src={f.flag} alt={t(f.labelKey)} className="w-5 h-3.5 rounded-[2px] object-cover" />
            )}
            {t(f.labelKey)}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl">
        {displayItems.map((trip) => (
          <ScrollReveal key={trip.url}>
            <a href={trip.url} rel="noreferrer" referrerPolicy="no-referrer" className="group block w-full rounded-lg overflow-hidden border border-ink/[0.06] bg-voyage-white shadow-sm hover:shadow-lg transition-shadow text-left cursor-pointer">
              <div className="aspect-[16/10] overflow-hidden">
                <img src={trip.image} alt={trip.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" />
              </div>
              <div className="p-6 flex items-start justify-between gap-3">
                <div>
                  <h3 className="font-serif text-[1.1rem] font-bold text-ink mb-1.5 group-hover:text-gold transition-colors">{trip.title}</h3>
                  <p className="text-[0.8rem] text-voyage-muted">{trip.location} · {trip.duration}</p>
                </div>
                {langFlags[trip.lang] && (
                  <img
                    src={langFlags[trip.lang].src}
                    alt={langFlags[trip.lang].alt}
                    width={24}
                    height={16}
                    loading="lazy"
                    className="w-6 h-4 rounded-[2px] object-cover shrink-0 mt-1"
                    title={langFlags[trip.lang].alt}
                  />
                )}
              </div>
            </a>
          </ScrollReveal>
        ))}
      </div>
    </section>
  );
};

export default ItineraryExamples;
