import Navbar from "./Navbar";
import Footer from "./Footer";
import LocalPartnerRio from "./LocalPartnerRio";
import Reviews from "./Reviews";
import GroupReferences from "./GroupReferences";
import { RIO_TESTIMONIAL_AUTHORS, RIO_REVIEWS_LABEL } from "./home/homeCopy";
import { currentLocale } from "@/lib/locale";
import { GROUP_INTAKE_URL } from "@/lib/travelNavigation";
import arpoador from "@/assets/home/pedra_do_arpoador.jpg.asset.json";
import rio from "@/assets/home/praia_do_flamengo.jpg.asset.json";
import fjord from "@/assets/stegastein.jpg.asset.json";

const ext = { target: "_blank", rel: "noopener noreferrer" } as const;
const btnGold = "inline-flex items-center justify-center rounded-sm bg-gold px-7 py-3.5 text-[0.72rem] font-semibold uppercase tracking-[0.16em] text-ink transition hover:bg-gold-2";

interface Copy {
  h1: string; intro: string; proposal: string;
  sportsTitle: string; sports: string[]; sportsNote: string;
  surfTitle: string; surf: string[];
  oceanTitle: string; rioAlt: string; fjordAlt: string;
  beforeTitle: string; before: string;
}

const EN: Copy = {
  h1: "Sports camps and surf journeys in Rio and Norway's fjords",
  intro: "Youth and amateur teams, surf groups and outdoor clubs. Training, friendlies against local clubs, surf and nature days, hosted by local experts in both countries.",
  proposal: "Request a proposal",
  sportsTitle: "Sports camps",
  sports: [
    "Norway to Rio: escape the Norwegian winter with training sessions, friendlies against Rio clubs and beach sports.",
    "Brazil to Norway: summer camps with friendlies against clubs in Sogn og Fjordane.",
  ],
  sportsNote: "We focus on youth and amateur teams.",
  surfTitle: "Surf and outdoor",
  surf: [
    "In Rio: surf lessons, SUP and beach sports.",
    "In Norway: surf at Stad, fjord kayaking and mountain and glacier hikes with certified local guides.",
    "Cold-water surfing needs preparation. We provide wetsuit and safety guidance.",
  ],
  oceanTitle: "Same ocean, two worlds",
  rioAlt: "Praia do Flamengo, Rio de Janeiro",
  fjordAlt: "Sunset from Sukkertoppen, Norway",
  beforeTitle: "Before you fill in the form",
  before: "In the message field, please include your club or group name, sport, number of players and adults, preferred dates, destination (Rio, the fjords or both) and budget range.",
};

// Norwegian H1 + intro supplied by the owner; remaining sections translated from the English text.
const NO: Copy = {
  h1: "Idrettscamper og surfreiser i Rio og fjordene",
  intro: "Ungdoms- og breddelag, surfegrupper og friluftsklubber. Trening, kamper mot lokale klubber, surf- og naturdager, med lokale eksperter i begge land.",
  proposal: "Be om forslag",
  sportsTitle: "Idrettscamper",
  sports: [
    "Fra Norge til Rio: slipp unna den norske vinteren med treningsøkter, treningskamper mot klubber i Rio og strandidrett.",
    "Fra Brasil til Norge: sommercamper med treningskamper mot klubber i Sogn og Fjordane.",
  ],
  sportsNote: "Vi satser på ungdoms- og breddelag.",
  surfTitle: "Surf og friluftsliv",
  surf: [
    "I Rio: surfekurs, SUP og strandidrett.",
    "I Norge: surf på Stad, kajakk på fjorden og fjell- og breturer med sertifiserte lokale guider.",
    "Surfing i kaldt vann krever forberedelse. Vi sørger for våtdrakt og sikkerhetsveiledning.",
  ],
  oceanTitle: "Samme hav, to verdener",
  rioAlt: "Praia do Flamengo, Rio de Janeiro",
  fjordAlt: "Solnedgang fra Sukkertoppen",
  beforeTitle: "Før du fyller ut skjemaet",
  before: "Skriv gjerne i meldingsfeltet: navn på klubben eller gruppen, idrett, antall spillere og voksne, ønskede datoer, destinasjon (Rio, fjordene eller begge) og budsjettramme.",
};

// DRAFT – pending review: Portuguese translated from the English text; the owner reviews before publishing.
const PT: Copy = {
  h1: "Camps esportivos e viagens de surf no Rio e nos fiordes da Noruega",
  intro: "Times de base e amadores, grupos de surf e clubes de atividades ao ar livre. Treinos, amistosos contra clubes locais, dias de surf e natureza, com especialistas locais nos dois países.",
  proposal: "Solicite uma proposta",
  sportsTitle: "Camps esportivos",
  sports: [
    "Da Noruega para o Rio: fuja do inverno norueguês com treinos, amistosos contra clubes cariocas e esportes de praia.",
    "Do Brasil para a Noruega: camps de verão com amistosos contra clubes de Sogn og Fjordane.",
  ],
  sportsNote: "Nosso foco são times de base e amadores.",
  surfTitle: "Surf e atividades ao ar livre",
  surf: [
    "No Rio: aulas de surf, SUP e esportes de praia.",
    "Na Noruega: surf em Stad, caiaque nos fiordes e trilhas em montanhas e geleiras com guias locais certificados.",
    "Surfar em água fria exige preparação. Oferecemos orientação sobre roupa de neoprene e segurança.",
  ],
  oceanTitle: "O mesmo oceano, dois mundos",
  rioAlt: "Praia do Flamengo, Rio de Janeiro",
  fjordAlt: "Mirante de Stegastein, Noruega",
  beforeTitle: "Antes de preencher o formulário",
  before: "No campo de mensagem, inclua o nome do clube ou grupo, o esporte, o número de atletas e adultos, as datas preferidas, o destino (Rio, fiordes ou ambos) e a faixa de orçamento.",
};
const COPY = { en: EN, no: NO, pt: PT };

function Cta({ label }: { label: string }) {
  return <a href={GROUP_INTAKE_URL} {...ext} className={btnGold}>{label}</a>;
}

export default function SportsSurfPage() {
  const c = COPY[currentLocale()];
  const h2 = "mb-8 font-serif text-[clamp(1.8rem,3vw,2.6rem)] font-bold text-ink";
  const section = "px-16 py-20 max-md:px-6 max-md:py-14";

  return (
    <div className="flex min-h-screen flex-col bg-parchment">
      <Navbar />
      <main className="flex-1">
        <section className="relative flex min-h-[80vh] items-end overflow-hidden bg-ink px-16 pb-20 pt-48 max-md:px-6 max-md:pb-14">
          <img src={arpoador.url} alt="" aria-hidden fetchPriority="high" className="absolute inset-0 h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/60 to-ink/20" />
          <div className="relative max-w-3xl">
            <h1 className="font-serif text-[clamp(2.2rem,5vw,4.2rem)] font-bold leading-[1.05] text-parchment">{c.h1}</h1>
            <p className="mt-6 max-w-2xl text-lg leading-relaxed text-parchment/85">{c.intro}</p>
            <div className="mt-10"><Cta label={c.proposal} /></div>
          </div>
        </section>

        <section className={section}>
          <div className="mx-auto max-w-5xl">
            <h2 className={h2}>{c.sportsTitle}</h2>
            <div className="grid grid-cols-2 gap-8 max-md:grid-cols-1">
              {c.sports.map((p) => (
                <p key={p} className="border-t-2 border-gold pt-4 text-lg leading-relaxed text-ink-2">{p}</p>
              ))}
            </div>
            <p className="mt-8 text-sm italic text-voyage-muted">{c.sportsNote}</p>
          </div>
        </section>

        <section id="surf" className={`scroll-mt-40 bg-parchment-2 ${section}`}>
          <div className="mx-auto max-w-5xl">
            <h2 className={h2}>{c.surfTitle}</h2>
            <div className="space-y-4">
              {c.surf.map((p) => (
                <p key={p} className="max-w-3xl text-lg leading-relaxed text-ink-2">{p}</p>
              ))}
            </div>
            <div className="mt-10"><Cta label={c.proposal} /></div>
          </div>
        </section>

        <section className={section}>
          <div className="mx-auto max-w-6xl">
            <h2 className={`${h2} text-center`}>{c.oceanTitle}</h2>
            <div className="grid grid-cols-2 gap-4 max-md:grid-cols-1">
              <img src={rio.url} alt={c.rioAlt} loading="lazy" className="aspect-[4/5] w-full rounded-lg object-cover max-md:aspect-[4/3]" />
              <img src={fjord.url} alt={c.fjordAlt} loading="lazy" className="aspect-[4/5] w-full rounded-lg object-cover max-md:aspect-[4/3]" />
            </div>
          </div>
        </section>

        <LocalPartnerRio />
        <Reviews include={RIO_TESTIMONIAL_AUTHORS} label={RIO_REVIEWS_LABEL[currentLocale()]} />
        <GroupReferences label={currentLocale() === "no" ? "Referanser fra grupper og klubber" : currentLocale() === "pt" ? "Referências de grupos e clubes" : "Group and club references"} />

        <section className="px-16 py-20 text-center max-md:px-6">
          <div className="mx-auto max-w-2xl">
            <h2 className="mb-4 font-serif text-2xl font-bold text-ink">{c.beforeTitle}</h2>
            <p className="mb-8 leading-relaxed text-ink-2">{c.before}</p>
            <Cta label={c.proposal} />
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
