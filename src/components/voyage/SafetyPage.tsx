import Navbar from "./Navbar";
import Footer from "./Footer";
import { currentLocale } from "@/lib/locale";
import { GROUP_INTAKE_URL } from "@/lib/travelNavigation";
import flamengo from "@/assets/home/praia_do_flamengo.jpg.asset.json";

// Safety pages: calm, factual layout. Only owner-supplied facts are rendered.
const ext = { target: "_blank", rel: "noopener noreferrer" } as const;
const btnGold = "inline-flex items-center justify-center rounded-sm bg-gold px-7 py-3.5 text-[0.72rem] font-semibold uppercase tracking-[0.16em] text-ink transition hover:bg-gold-2";

interface Copy {
  h1: string; proposal: string;
  sections: { title: string; text: string }[];
}

const EN: Copy = {
  h1: "Safety and how we work",
  proposal: "Request a proposal",
  sections: [
    { title: "Responsibility and organization", text: "Fjord & Waves Travel is the contracting party for the trip." },
    { title: "Adults and supervision", text: "The supervision ratio is set for each trip and stated in the proposal and contract." },
    { title: "Accommodation", text: "We use hotels in areas our local partners consider safe. Addresses are shared with the school in advance." },
    { title: "Rules for the trip", text: "Shared rules for moving around the city, alcohol, evening times and storing valuables are provided in writing before departure." },
    { title: "Beach and water", text: "Surfing and swimming happen with an instructor, and only in conditions the instructor considers safe." },
    { title: "Insurance", text: "Insurance details are provided in the proposal and contract." },
    { title: "Emergency", text: "A 24/7 phone line (number provided in your contract) and a written emergency plan for injury, illness, theft, missing persons and delays." },
    { title: "Communication", text: "A daily status message to the contact teacher, and an update channel for parents if the school wants one." },
  ],
};

// Norwegian H1 supplied by the owner; sections translated from the English facts.
const NO: Copy = {
  h1: "Trygghet og hvordan vi jobber",
  proposal: "Be om forslag",
  sections: [
    { title: "Ansvar og organisasjon", text: "Fjord & Waves Travel er kontraktspart for reisen." },
    { title: "Voksne og tilsyn", text: "Tilsynsordningen settes for hver reise og står i tilbudet og kontrakten." },
    { title: "Overnatting", text: "Vi bruker hoteller i områder de lokale partnerne våre regner som trygge. Adressene deles med skolen på forhånd." },
    { title: "Regler for reisen", text: "Felles regler for ferdsel i byen, alkohol, kveldstider og oppbevaring av verdisaker deles skriftlig før avreise." },
    { title: "Strand og vann", text: "Surfing og bading skjer med instruktør, og bare i forhold instruktøren vurderer som trygge." },
    { title: "Forsikring", text: "Forsikringsdetaljer kommer i tilbudet og kontrakten." },
    { title: "Nød og beredskap", text: "Døgnåpen telefonlinje (nummeret står i kontrakten) og en skriftlig beredskapsplan for skade, sykdom, tyveri, savnede og forsinkelser." },
    { title: "Kommunikasjon", text: "Daglig statusmelding til kontaktlæreren, og en oppdateringskanal for foreldre hvis skolen ønsker det." },
  ],
};

// CONTENT PLACEHOLDER: Portuguese not supplied — /pt-br/safety shows the English text for now.
const COPY = { en: EN, no: NO, pt: EN };

// HIDDEN SECTION PLACEHOLDERS (render nothing until the owner supplies text):
// - "Health": vaccines and travel advice from FHI.
// - "Young people under 18 and special needs": policy text.

function Cta({ label }: { label: string }) {
  return <a href={GROUP_INTAKE_URL} {...ext} className={btnGold}>{label}</a>;
}

export default function SafetyPage() {
  const c = COPY[currentLocale()];

  return (
    <div className="flex min-h-screen flex-col bg-parchment">
      <Navbar />
      <main className="flex-1">
        <section className="relative flex min-h-[60vh] items-end overflow-hidden bg-ink px-16 pb-16 pt-48 max-md:px-6 max-md:pb-12">
          <img src={flamengo.url} alt="" aria-hidden fetchPriority="high" className="absolute inset-0 h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/60 to-ink/20" />
          <div className="relative max-w-3xl">
            <h1 className="font-serif text-[clamp(2.1rem,4.6vw,3.8rem)] font-bold leading-[1.08] text-parchment">{c.h1}</h1>
          </div>
        </section>

        <section className="px-16 py-20 max-md:px-6 max-md:py-14">
          <div className="mx-auto max-w-4xl">
            <dl>
              {c.sections.map((s) => (
                <div key={s.title} className="border-t border-parchment-3 py-8 max-md:py-6">
                  <dt className="mb-3 font-serif text-xl font-bold text-ink">{s.title}</dt>
                  <dd className="max-w-3xl text-lg leading-relaxed text-ink-2">{s.text}</dd>
                </div>
              ))}
            </dl>
            <div className="mt-14 border-t border-parchment-3 pt-14 text-center max-md:pt-10">
              <Cta label={c.proposal} />
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
