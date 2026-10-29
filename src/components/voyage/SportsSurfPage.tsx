import Navbar from "./Navbar";
import Footer from "./Footer";
import LocalPartnerRio from "./LocalPartnerRio";
import Reviews from "./Reviews";
import GroupReferences from "./GroupReferences";
import { ProposalCta, TwoColTable, NumberedSteps } from "./GroupBlocks";
import { RIO_TESTIMONIAL_AUTHORS, RIO_REVIEWS_LABEL } from "./home/homeCopy";
import { currentLocale, localePath } from "@/lib/locale";
import { isGroupPageAvailable } from "@/lib/travelNavigation";
import arpoador from "@/assets/home/pedra_do_arpoador.jpg.asset.json";

interface Copy {
  h1: string; intro: string; proposal: string;
  campTitle: string; camp: string[]; campNote: string;
  rioTitle: string; rioIntro: string; periodHead: string; likeHead: string; periods: [string, string][];
  weekTitle: string; weekNote: string; dayHead: string; programHead: string; week: string[];
  howTitle: string; steps: string[];
  safetyLinkLabel: string; before: string; refsLabel: string;
}

const EN: Copy = {
  h1: "Training camps and trips for sports teams and clubs",
  intro: "Training and matches against local clubs, for youth and amateur teams. Rio Sport & Tour runs its own beach volleyball center in Leme and has hosted teams and groups for over 20 years.",
  proposal: "Request a proposal",
  campTitle: "What a camp can include",
  camp: [
    "Training sessions with local clubs, adapted to level and sport",
    "Matches against local teams",
    "Beach volleyball, footvolley, beach tennis, beach soccer and beach handball",
    "Football, volleyball, beach tennis, SUP, surf, diving and capoeira",
    "Self-organized tournaments, friendlies, sightseeing and cultural experiences, and a football match as a spectator",
  ],
  campNote: "We focus on youth and amateur teams. For elite and professional teams, please contact us directly.",
  rioTitle: "From Norway to Rio",
  rioIntro: "A training camp when the Norwegian winter is long. Choose the period by weather and prices in Rio.",
  periodHead: "Period", likeHead: "What it is like",
  periods: [
    ["December to March", "High season: very hot and humid (often above 35 °C), the most rain, the highest prices"],
    ["April to May and September to November", "Milder weather (24 to 28 °C), fewer tourists, lower prices"],
    ["June to August", "Rio winter: dry and cooler, evenings around 15 to 18 °C, sea around 18 to 22 °C"],
  ],
  weekTitle: "Sample week",
  weekNote: "An example. The program is adapted to sport, age and level.",
  dayHead: "Day", programHead: "Program",
  week: [
    "Arrival and welcome meeting at the hotel",
    "Morning session (beach volleyball or strength in the sand), afternoon session (beach volleyball, beach tennis or footvolley) and a run",
    "Early surf, SUP or open-water swim, sand football and sand running in the afternoon",
    "Christ the Redeemer, Lapa and Santa Teresa, then training",
    // HIDDEN until confirmed: "and a friendly against a local team"
    "Training",
    "Self-organized tournament (2x2 and 4x4). For youth teams we replace the evening program with our own plan",
    "Football match at the Maracanã as spectators and farewell",
  ],
  howTitle: "How it works",
  steps: [
    "A 20-minute call, no obligation: goals, sport, numbers and dates",
    "A proposal with program and price per participant for different group sizes",
    "Agreement with clear terms",
    "Preparation: information, trip rules, documents",
    "The trip, with local hosts and a 24/7 contact line",
    "Evaluation and a suggestion for next year",
  ],
  safetyLinkLabel: "Read about safety",
  before: "In the message field, please include your club, sport, age group, number of players and adults, preferred dates, destination and budget range.",
  refsLabel: "Group and club references",
};

const NO: Copy = {
  h1: "Treningsreiser og camper for idrettslag og klubber",
  intro: "Trening og kamper mot lokale klubber, for ungdoms- og breddelag. Rio Sport & Tour driver eget beachvolleysenter i Leme og har vært vert for lag og grupper i over 20 år.",
  proposal: "Be om forslag",
  campTitle: "Hva en camp kan inneholde",
  camp: [
    "Treningsøkter med lokale klubber, tilpasset nivå og idrett",
    "Kamper mot lokale lag",
    "Beachvolleyball, footvolley, beach tennis, sandfotball og beach håndball",
    "Fotball, volleyball, beach tennis, SUP, surf, dykking og capoeira",
    "Egenorganiserte turneringer, vennskapskamper, sightseeing og kulturopplevelser, og en fotballkamp som tilskuer",
  ],
  campNote: "Vi fokuserer på ungdoms- og breddelag. Elitelag og profesjonelle ber du om å ta direkte kontakt.",
  rioTitle: "Fra Norge til Rio",
  rioIntro: "Treningscamp når vinteren i Norge er lang. Velg tidspunkt ut fra været og prisene i Rio.",
  periodHead: "Periode", likeHead: "Slik er det",
  periods: [
    ["Desember til mars", "Høysesong: veldig varmt og fuktig (ofte over 35 °C), mest regn, høyest priser"],
    ["April til mai og september til november", "Mildere vær (24 til 28 °C), færre turister, lavere priser"],
    ["Juni til august", "Rios vinter: tørt og kjøligere, kvelder ned mot 15 til 18 °C, sjøen rundt 18 til 22 °C"],
  ],
  weekTitle: "Eksempeluke",
  weekNote: "Et eksempel. Programmet tilpasses idrett, alder og nivå.",
  dayHead: "Dag", programHead: "Program",
  week: [
    "Ankomst og velkomstmøte på hotellet",
    "Morgenøkt (beachvolleyball eller styrke i sanden), ettermiddagsøkt (beachvolleyball, beach tennis eller footvolley) og løpetur",
    "Tidlig surf, SUP eller utesvømming, sandfotball og løping i sand på ettermiddagen",
    "Tur til Kristusstatuen, Lapa og Santa Teresa, deretter trening",
    // HIDDEN until confirmed: "og vennskapskamp mot lokalt lag"
    "Trening",
    "Egenorganisert turnering (2x2 og 4x4). For ungdomslag erstatter vi kveldsprogrammet med et eget opplegg",
    "Fotballkamp på Maracanã som tilskuer og avslutning",
  ],
  howTitle: "Slik fungerer det",
  steps: [
    "Samtale (20 minutter, uforpliktende): mål, idrett, antall og tidspunkt",
    "Forslag med program og pris per deltaker ved ulike gruppestørrelser",
    "Avtale med klare vilkår",
    "Forberedelser: informasjon, reiseregler, dokumenter",
    "Turen med lokale verter og døgnåpen kontaktlinje",
    "Evaluering og forslag til neste år",
  ],
  safetyLinkLabel: "Les om trygghet",
  before: "Skriv gjerne i meldingsfeltet: klubbens navn, idrett, aldersgruppe, antall spillere og voksne, ønsket tidspunkt, destinasjon og budsjettramme.",
  refsLabel: "Referanser fra grupper og klubber",
};

// PORTUGUESE PLACEHOLDER: no Portuguese text supplied yet; /pt-br shows the English version.
const COPY = { en: EN, no: NO, pt: EN };

// HIDDEN SECTION until the owner confirms local clubs and facilities in Sogn og Fjordane:
// EN "From Brazil and other countries to the fjords" / NO "Fra fjordene".

export default function SportsSurfPage() {
  const locale = currentLocale();
  const c = COPY[locale];
  const safetyLive = isGroupPageAvailable("safety", import.meta.env.PROD);
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
            <div className="mt-10"><ProposalCta label={c.proposal} /></div>
          </div>
        </section>

        {/* id="surf" kept so older #surf links still land on this page's activities. */}
        <section id="surf" className={`scroll-mt-40 ${section}`}>
          <div className="mx-auto max-w-5xl">
            <h2 className={h2}>{c.campTitle}</h2>
            <ul className="grid gap-x-10 gap-y-5 md:grid-cols-2">
              {c.camp.map((p) => <li key={p} className="border-l-2 border-gold pl-4 leading-relaxed text-ink-2">{p}</li>)}
            </ul>
            <p className="mt-8 text-sm italic text-voyage-muted">{c.campNote}</p>
          </div>
        </section>

        <section className={`bg-parchment-2 ${section}`}>
          <div className="mx-auto max-w-4xl">
            <h2 className={h2}>{c.rioTitle}</h2>
            <p className="mb-6 text-lg leading-relaxed text-ink-2">{c.rioIntro}</p>
            <TwoColTable head={[c.periodHead, c.likeHead]} rows={c.periods} />
          </div>
        </section>

        <section className={section}>
          <div className="mx-auto max-w-4xl">
            <h2 className={h2}>{c.weekTitle}</h2>
            <p className="mb-6 text-sm italic text-voyage-muted">{c.weekNote}</p>
            <TwoColTable head={[c.dayHead, c.programHead]} rows={c.week.map((d, n) => [String(n + 1), d])} narrow />
            <div className="mt-10"><ProposalCta label={c.proposal} /></div>
          </div>
        </section>

        <section className={`bg-parchment-2 ${section}`}>
          <div className="mx-auto max-w-6xl">
            <h2 className={h2}>{c.howTitle}</h2>
            <NumberedSteps steps={c.steps} />
            {safetyLive && (
              <a href={localePath("/safety", locale)} className="mt-10 inline-block text-[0.72rem] font-semibold uppercase tracking-[0.16em] text-gold hover:underline">{c.safetyLinkLabel} →</a>
            )}
          </div>
        </section>

        <LocalPartnerRio />
        <Reviews include={RIO_TESTIMONIAL_AUTHORS} label={RIO_REVIEWS_LABEL[locale]} />
        <GroupReferences label={c.refsLabel} />

        <section className="px-16 py-20 text-center max-md:px-6">
          <div className="mx-auto max-w-2xl">
            <p className="mb-8 text-lg leading-relaxed text-ink-2">{c.before}</p>
            <ProposalCta label={c.proposal} />
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
