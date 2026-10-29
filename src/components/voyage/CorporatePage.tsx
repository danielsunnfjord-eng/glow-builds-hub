import Navbar from "./Navbar";
import Footer from "./Footer";
import { Button } from "@/components/ui/button";
import { currentLocale, localePath } from "@/lib/locale";
import { GROUP_INTAKE_URL } from "@/lib/travelNavigation";
import { CORPORATE_PROGRAMS } from "@/lib/corporatePrograms";
import { TwoColTable } from "./GroupBlocks";
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";
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
  conciergeTitle?: string; concierge?: string[];
  programNote?: string; tableHead?: [string, string];
  faqTitle?: string; faq?: { question: string; answer: string }[];
  safety?: string; privateLink?: string;
}

const EN: Copy = {
  h1: "Corporate trips and delegations in Rio and Norway's fjords",
  sub: "One partner, two destinations, three languages. Planned and hosted by local experts, from the first call to the final invoice.",
  proposal: "Request a proposal",
  offersTitle: "Four ways we can help",
  offers: [
    { name: "Team experiences", text: "Kayaking, SUP, mountain hikes and surf, with local food and a facilitator if you want one." },
    { name: "Incentive trips", text: "Experiences for teams and top performers in Rio and the fjords." },
    { name: "Meetings and retreats", text: "Off-site workshops in scenic locations, for small and mid-size groups." },
    { name: "Delegations and visits", text: "Visits and meetings in Norway or Brazil. Tell us what you need and we will see what is possible." },
  ],
  whyTitle: "Why us",
  why: [
    "A trilingual advisor (Portuguese, Norwegian and English). Local hosts in both countries. IATA accredited. One contact for the whole project.",
  ],
  howTitle: "", steps: [], beforeTitle: "",
  before: "In the message field, please include your company and your role, the type of event (team building, incentive, meeting or delegation), number of participants, destination, preferred dates and budget range. Invoicing details can follow once we agree the scope.",
  conciergeTitle: "How I work as your concierge",
  concierge: [
    "One personal contact from the first brief to the final invoice",
    "A concrete proposal with program, framework and clear terms",
    "Local hosts in Rio and in Sogn og Fjordane",
    "All the logistics: travel, accommodation, transport and activities",
    "A 24/7 contact line during the trip",
    "A report and follow-up after the event",
  ],
  programNote: "A starting point, adapted to your group. Hotels and timing are confirmed in the proposal.",
  tableHead: ["Day", "Program"],
  faqTitle: "FAQ",
  faq: [
    { question: "Which languages can you work in?", answer: "Portuguese, Norwegian and English." },
    { question: "Can you combine Rio and the fjords?", answer: "Yes, it is our specialty." },
  ],
  safety: "Safety",
  privateLink: "Booking a trip for yourself? See private trips",
};

// Norwegian is the primary version; English and Norwegian copy supplied by the owner.
const NO: Copy = {
  h1: "Bedriftsreiser og delegasjoner i Rio og fjordene",
  sub: "Én partner, to reisemål, tre språk. Planlagt og gjennomført av lokale eksperter, fra første samtale til siste faktura.",
  proposal: "Be om forslag",
  offersTitle: "Fire måter vi kan hjelpe på",
  offers: [
    { name: "Teamopplevelser", text: "Kajakk, SUP, fjellturer og surf, med lokal mat og en fasilitator hvis du vil ha det." },
    { name: "Incentivreiser", text: "Opplevelser for team og toppsellere i Rio og fjordene." },
    { name: "Møter og retreats", text: "Arbeidsmøter utenfor kontoret i vakre omgivelser, for små og mellomstore grupper." },
    { name: "Delegasjoner og besøk", text: "Besøk og møter i Norge eller Brasil. Fortell oss hva dere ønsker, så ser vi hva som er mulig." },
  ],
  whyTitle: "Hvorfor oss",
  why: [
    "Trespråklig rådgiver (portugisisk, norsk og engelsk). Lokale verter i begge land. IATA-akkreditert. Én kontaktperson for hele prosjektet.",
  ],
  howTitle: "", steps: [], beforeTitle: "",
  before: "Skriv gjerne i meldingsfeltet: bedrift og din rolle, type arrangement (teambuilding, incentiv, møte eller delegasjon), antall deltakere, destinasjon, ønsket tidspunkt og budsjettramme. Faktureringsinformasjon kan komme når omfanget er avklart.",
  conciergeTitle: "Slik er jeg concierge for bedriften",
  concierge: [
    "Én personlig kontakt fra første brief til siste faktura",
    "Et konkret forslag med program, rammer og tydelige betingelser",
    "Lokale verter i Rio og i Sogn og Fjordane",
    "Hele logistikken: reise, overnatting, transport og aktiviteter",
    "Døgnåpen kontaktlinje under reisen",
    "Rapport og oppfølging etter arrangementet",
  ],
  programNote: "Et utgangspunkt, tilpasset gruppen. Hoteller og tider bekreftes i forslaget.",
  tableHead: ["Dag", "Program"],
  faqTitle: "Vanlige spørsmål",
  faq: [
    { question: "Hvilke språk kan dere jobbe på?", answer: "Portugisisk, norsk og engelsk." },
    { question: "Kan dere kombinere Rio og fjordene?", answer: "Ja, det er vår spesialitet." },
  ],
  safety: "Trygghet",
  privateLink: "Booking a trip for yourself? See private trips",
};

// DRAFT – pending review: Portuguese translated from the English text; the owner reviews before publishing.
const PT: Copy = {
  h1: "Viagens corporativas e experiências de equipe no Rio e nos fiordes da Noruega",
  sub: "Um parceiro, dois destinos, três idiomas. Planejado e conduzido por quem é local, do primeiro contato à fatura final.",
  proposal: "Solicite uma proposta",
  offersTitle: "O que organizamos",
  offers: [
    { name: "Team building", text: "Caiaque, trilhas e sessões de surf, com comida local e um facilitador, se desejar." },
    { name: "Viagens de incentivo", text: "Experiências únicas para equipes e destaques de desempenho no Rio e nos fiordes." },
    { name: "Reuniões e retiros", text: "Workshops fora do escritório em locais cênicos, para grupos pequenos e médios." },
    { name: "Delegações e visitas técnicas", text: "Visitas e reuniões na Noruega ou no Brasil, organizadas com contatos locais." },
  ],
  whyTitle: "Por que trabalhar conosco",
  why: [
    "Consultor trilíngue (português, norueguês, inglês).",
    "Anfitriões locais no Rio e em Sogn og Fjordane.",
    "Credenciado pela IATA.",
    "Suporte 24/7 durante a viagem.",
    "Um único ponto de contato para todo o projeto.",
  ],
  howTitle: "Como funciona",
  steps: ["Briefing", "Proposta", "Acordo e sinal", "Planejamento", "Evento", "Relatório final"],
  beforeTitle: "Antes de preencher o formulário",
  before: "No campo de mensagem, inclua sua empresa, seu cargo, o tipo de evento (team building, incentivo, reunião ou delegação), número de participantes, destino, datas e faixa de orçamento. Os dados de faturamento podem vir depois que definirmos o escopo.",
};
const COPY = { en: EN, no: NO, pt: PT };

// HIDDEN SECTION PLACEHOLDERS (render nothing until the owner supplies text):
// - "Contracts, insurance and invoicing" / "Kontrakt, forsikring og fakturering".
// - "References" / "Referanser": only real company references when supplied.
// - "How fast do I get a proposal?" / "Hvor raskt får jeg et forslag?"
// - "How large groups do you take?" / "Hvor store grupper tar dere?"
// - "Can you handle invoicing and internal approvals?" / "Kan dere håndtere fakturering og interne godkjenninger?"

function Cta({ label }: { label: string }) {
  return <Button asChild className={`h-auto ${btnGold}`}><a href={GROUP_INTAKE_URL} {...ext}>{label}</a></Button>;
}

export default function CorporatePage() {
  const locale = currentLocale();
  const c = COPY[locale];
  const programs = locale === "pt" ? [] : CORPORATE_PROGRAMS[locale];
  const h2 = "mb-10 font-serif text-[clamp(1.8rem,3vw,2.6rem)] font-bold text-ink";
  const section = "px-16 py-20 max-md:px-6 max-md:py-14";

  return (
    <div className="flex min-h-screen flex-col bg-parchment">
      <Navbar />
      <main className="flex-1">
        <section className="relative flex min-h-[75vh] items-end overflow-hidden bg-ink px-16 pb-20 pt-48 max-md:px-6 max-md:pb-14">
          <img src={(locale === "pt" ? fjord : museu).url} alt="" aria-hidden fetchPriority="high" className="absolute inset-0 h-full w-full object-cover" />
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

        {c.concierge && <section className={`bg-parchment-2 ${section}`}>
          <div className="mx-auto max-w-6xl">
            <h2 className={h2}>{c.conciergeTitle}</h2>
            <ul className="grid gap-6 md:grid-cols-2">
              {c.concierge.map((item) => <li key={item} className="border-l-2 border-gold pl-4 leading-relaxed text-ink-2">{item}</li>)}
            </ul>
          </div>
        </section>}

        <section className={`${locale === "pt" ? "bg-parchment-2" : ""} ${section}`}>
          <div className="mx-auto grid max-w-6xl grid-cols-[1fr_1fr] items-center gap-12 max-lg:grid-cols-1">
            <div>
              <h2 className={h2}>{c.whyTitle}</h2>
              <ul className="space-y-4">
                {c.why.map((w) => (
                  <li key={w} className="border-l-2 border-gold pl-4 text-lg text-ink-2">{w}</li>
                ))}
              </ul>
            </div>
            <img src={(locale === "pt" ? museu : fjord).url} alt={locale === "pt" ? "Museu do Amanhã, Rio de Janeiro" : locale === "no" ? "Solnedgang over fjordene fra Sukkertoppen i Ålesund" : "Sunset over the fjords from Sukkertoppen in Ålesund"} loading="lazy" className="max-h-[520px] w-full rounded-lg object-cover" />
          </div>
        </section>

        {programs.length > 0 && c.tableHead && <section className={`bg-parchment-2 ${section}`}>
          <div className="mx-auto max-w-4xl space-y-16">
            {programs.map((program) => <div key={program.title}>
              <h2 className={h2}>{program.title}</h2>
              <p className="mb-6 leading-relaxed text-ink-2">{c.programNote}</p>
              <TwoColTable head={c.tableHead ?? ["Day", "Program"]} rows={program.days.map((day, index) => [String(index + 1), day])} narrow />
            </div>)}
            <div className="text-center"><Cta label={c.proposal} /></div>
          </div>
        </section>}

        {c.faq && <section className={section}>
          <div className="mx-auto max-w-4xl">
            <h2 className={h2}>{c.faqTitle}</h2>
            <Accordion type="single" collapsible>
              {c.faq.map((item, index) => <AccordionItem key={item.question} value={String(index)} className="border-parchment-3">
                <AccordionTrigger className="gap-4 text-left leading-relaxed text-ink">{item.question}</AccordionTrigger>
                <AccordionContent className="leading-relaxed text-ink-2">{item.answer}</AccordionContent>
              </AccordionItem>)}
            </Accordion>
            <a href={localePath("/safety", locale)} className="mt-8 inline-block text-sm text-ink underline underline-offset-4">{c.safety}</a>
          </div>
        </section>}

        {c.steps.length > 0 && <section className={section}>
          <div className="mx-auto max-w-6xl">
            <h2 className={h2}>{c.howTitle}</h2>
            <ol className="grid grid-cols-6 gap-4 max-lg:grid-cols-3 max-sm:grid-cols-2">
              {c.steps.map((s, n) => (
                <li key={s} className="border-t-2 border-gold pt-4">
                  <div className="font-serif text-3xl text-gold">{n + 1}</div>
                  <div className="mt-1 text-sm font-semibold uppercase tracking-[0.1em] text-ink [overflow-wrap:anywhere]">{s}</div>
                </li>
              ))}
            </ol>
          </div>
        </section>}

        <section className="bg-parchment-2 px-16 py-20 text-center max-md:px-6">
          <div className="mx-auto max-w-2xl">
            {c.beforeTitle && <h2 className="mb-4 font-serif text-2xl font-bold text-ink">{c.beforeTitle}</h2>}
            <p className="mb-8 leading-relaxed text-ink-2">{c.before}</p>
            <Cta label={c.proposal} />
            {c.privateLink && <p className="mt-8 text-sm"><a href={localePath("/private-travel", locale)} className="text-ink-2 underline underline-offset-4">{c.privateLink}</a></p>}
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
