import Navbar from "./Navbar";
import Footer from "./Footer";
import { currentLocale } from "@/lib/locale";
import { GROUP_INTAKE_URL } from "@/lib/travelNavigation";
import fjord from "@/assets/home/sunset_sukkertooppen.jpg.asset.json";
import museu from "@/assets/home/museu_do_amanha.jpg.asset.json";

// Corporate pages: no Rio Sport & Tour block and no individual traveller testimonials (owner rule).
const ext = { target: "_blank", rel: "noopener noreferrer" } as const;
const btnGold = "inline-flex items-center justify-center rounded-sm bg-gold px-7 py-3.5 text-[0.72rem] font-semibold uppercase tracking-[0.16em] text-ink transition hover:bg-gold-2";

interface Copy {
  h1: string; sub: string; proposal: string;
  offersTitle: string; offers: { name: string; text: string }[];
  whyTitle: string; why: string[];
  howTitle: string; steps: string[];
  beforeTitle: string; before: string;
}

const EN: Copy = {
  h1: "Corporate trips and team experiences in Rio and Norway's fjords",
  sub: "One partner, two destinations, three languages. Planned and hosted by locals, handled from first call to final invoice.",
  proposal: "Request a proposal",
  offersTitle: "What we arrange",
  offers: [
    { name: "Team building", text: "Kayaking, hikes and surf sessions, with local food and a facilitator if you want one." },
    { name: "Incentive trips", text: "Unique experiences for teams and top performers in Rio and the fjords." },
    { name: "Meetings and retreats", text: "Off-site workshops in scenic locations for small and mid-size groups." },
    // PLACEHOLDER: append sectors once the owner confirms them.
    { name: "Delegations and site visits", text: "Visits and meetings in Norway or Brazil, arranged with local contacts." },
  ],
  whyTitle: "Why work with us",
  why: [
    "Trilingual advisor (Portuguese, Norwegian, English).",
    "Local hosts in Rio and Sogn og Fjordane.",
    "IATA accredited.",
    "24/7 support during the trip.",
    "One point of contact for the whole project.",
  ],
  howTitle: "How it works",
  // PLACEHOLDER: step 2 timing ("within 48-72 hours") awaits owner confirmation.
  steps: ["Brief", "Proposal", "Agreement and deposit", "Planning", "Event", "Follow-up report"],
  beforeTitle: "Before you fill in the form",
  before: "In the message field, please include your company, your role, the type of event (team building, incentive, meeting or delegation), number of participants, destination, dates and budget range. Invoicing details can follow once we agree the scope.",
};

// Norwegian H1 + subheadline supplied by the owner; other sections translated from English.
const NO: Copy = {
  h1: "Bedriftsreiser og teamopplevelser i Rio og fjordene",
  sub: "Én partner, to reisemål, tre språk. Planlagt og gjennomført av lokale eksperter, fra første samtale til siste faktura.",
  proposal: "Be om forslag",
  offersTitle: "Dette tilbyr vi",
  offers: [
    { name: "Teambuilding", text: "Kajakk, turer og surfeøkter, med lokal mat og fasilitator om dere ønsker det." },
    { name: "Incentivturer", text: "Unike opplevelser for team og toppytere i Rio og fjordene." },
    { name: "Møter og samlinger", text: "Workshops utenfor kontoret på naturskjønne steder, for små og mellomstore grupper." },
    { name: "Delegasjoner og bedriftsbesøk", text: "Besøk og møter i Norge eller Brasil, tilrettelagt gjennom lokale kontakter." },
  ],
  whyTitle: "Hvorfor velge oss",
  why: [
    "Trespråklig rådgiver (portugisisk, norsk, engelsk).",
    "Lokale verter i Rio og Sogn og Fjordane.",
    "IATA-akkreditert.",
    "Døgnåpen støtte under reisen.",
    "Én kontaktperson for hele prosjektet.",
  ],
  howTitle: "Slik jobber vi",
  steps: ["Behov", "Forslag", "Avtale og depositum", "Planlegging", "Gjennomføring", "Oppfølgingsrapport"],
  beforeTitle: "Før du fyller ut skjemaet",
  before: "Skriv gjerne i meldingsfeltet: bedriftens navn, din rolle, type arrangement (teambuilding, incentiv, møte eller delegasjon), antall deltakere, reisemål, datoer og budsjettramme. Fakturadetaljer kan komme når vi har avtalt omfanget.",
};

// CONTENT PLACEHOLDER: Portuguese not supplied — /pt-br/corporate shows English for now.
const COPY = { en: EN, no: NO, pt: EN };

// HIDDEN SECTION PLACEHOLDERS (render nothing until the owner supplies text):
// - "Contracts and invoicing": short factual text on invoicing, payment terms, cancellation and insurance.
// - "Sample program": one-day fjord team session OR 4-5 day Rio incentive.
// - "References": only a real company reference or testimonial.

function Cta({ label }: { label: string }) {
  return <a href={GROUP_INTAKE_URL} {...ext} className={btnGold}>{label}</a>;
}

export default function CorporatePage() {
  const c = COPY[currentLocale()];
  const h2 = "mb-10 font-serif text-[clamp(1.8rem,3vw,2.6rem)] font-bold text-ink";
  const section = "px-16 py-20 max-md:px-6 max-md:py-14";

  return (
    <div className="flex min-h-screen flex-col bg-parchment">
      <Navbar />
      <main className="flex-1">
        <section className="relative flex min-h-[75vh] items-end overflow-hidden bg-ink px-16 pb-20 pt-48 max-md:px-6 max-md:pb-14">
          <img src={fjord.url} alt="" aria-hidden fetchPriority="high" className="absolute inset-0 h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/70 to-ink/30" />
          <div className="relative max-w-3xl">
            <h1 className="font-serif text-[clamp(2.1rem,4.6vw,3.8rem)] font-bold leading-[1.08] text-parchment">{c.h1}</h1>
            <p className="mt-6 max-w-2xl text-lg leading-relaxed text-parchment/85">{c.sub}</p>
            <div className="mt-10"><Cta label={c.proposal} /></div>
          </div>
        </section>

        <section className={section}>
          <div className="mx-auto max-w-6xl">
            <h2 className={h2}>{c.offersTitle}</h2>
            <div className="grid grid-cols-4 gap-6 max-lg:grid-cols-2 max-sm:grid-cols-1">
              {c.offers.map((o) => (
                <div key={o.name} className="rounded-sm border border-parchment-3 bg-voyage-white p-6">
                  <h3 className="mb-3 font-serif text-xl font-bold text-ink">{o.name}</h3>
                  <p className="leading-relaxed text-ink-2">{o.text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className={`bg-parchment-2 ${section}`}>
          <div className="mx-auto grid max-w-6xl grid-cols-[1fr_1fr] items-center gap-12 max-lg:grid-cols-1">
            <div>
              <h2 className={h2}>{c.whyTitle}</h2>
              <ul className="space-y-4">
                {c.why.map((w) => (
                  <li key={w} className="border-l-2 border-gold pl-4 text-lg text-ink-2">{w}</li>
                ))}
              </ul>
            </div>
            <img src={museu.url} alt="Museu do Amanhã, Rio de Janeiro" loading="lazy" className="max-h-[520px] w-full rounded-lg object-cover" />
          </div>
        </section>

        <section className={section}>
          <div className="mx-auto max-w-6xl">
            <h2 className={h2}>{c.howTitle}</h2>
            <ol className="grid grid-cols-6 gap-4 max-lg:grid-cols-3 max-sm:grid-cols-2">
              {c.steps.map((s, n) => (
                <li key={s} className="border-t-2 border-gold pt-4">
                  <div className="font-serif text-3xl text-gold">{n + 1}</div>
                  <div className="mt-1 text-sm font-semibold uppercase tracking-[0.1em] text-ink">{s}</div>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section className="bg-parchment-2 px-16 py-20 text-center max-md:px-6">
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
