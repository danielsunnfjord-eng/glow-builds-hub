import { useState } from "react";
import Navbar from "./Navbar";
import Footer from "./Footer";
import LocalPartnerRio from "./LocalPartnerRio";
import Reviews from "./Reviews";
import GroupReferences from "./GroupReferences";
import { ProposalCta, TwoColTable, NumberedSteps } from "./GroupBlocks";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { currentLocale, localePath } from "@/lib/locale";
import { isGroupPageAvailable } from "@/lib/travelNavigation";
import { RIO_TESTIMONIAL_AUTHORS, RIO_REVIEWS_LABEL } from "./home/homeCopy";
import cristo from "@/assets/home/cristo_redentor.jpg.asset.json";

interface Copy {
  h1: string; intro: string; proposal: string; heroAlt: string;
  conciergeTitle: string; concierge: string[];
  tracksTitle: string; tracks: { name: string; text: string }[];
  programTitle: string; programNote: string; dayHead: string; programHead: string; days: string[];
  howTitle: string; steps: string[];
  includedTitle: string; included: string;
  priceTitle: string; price: string;
  faqTitle: string; faq: { q: string; a: string; safetyLink?: boolean }[];
  aboutTitle: string; about: string;
  before: string; refsLabel: string; safetyLinkLabel: string;
}

// Owner-supplied Norwegian text (primary version).
const NO: Copy = {
  h1: "Studietur til Rio for folkehøgskoler",
  intro: "Jeg har vært folkehøgskolelærer og har planlagt og gjennomført studieturer til Brasil, Spania, Portugal og Sri Lanka. Sammen med Rio Sport & Tour, en lokal partner med over 20 års erfaring, bygger jeg et opplegg rundt linjens faglige mål, og tar meg av resten.",
  proposal: "Be om forslag",
  heroAlt: "Gruppe ved Kristusstatuen i Rio de Janeiro",
  conciergeTitle: "Slik er jeg concierge for din linje",
  concierge: [
    "Én kontaktperson som kjenner folkehøgskolen innenfra, fra første samtale til du er hjemme igjen",
    "Program bygget rundt linjens mål, ikke en ferdig pakke",
    "Lokale verter i Rio: Rio Sport & Tour planlegger og gjennomfører alt på bakken",
    "Dokumentasjon til rektor og foresatte: informasjon om forsikring, beredskap og turregler følger med tilbudet",
    "Døgnåpen kontaktlinje under turen. Det er alltid noen tilgjengelig hvis noe skjer. Vi hjelper med å tilpasse opplegget underveis når det er mulig, og med språk og kulturelle utfordringer",
    "Evaluering etter turen og forslag til neste års reise",
  ],
  tracksTitle: "Velg din linje",
  tracks: [
    { name: "Idrett og multisport", text: "Treningsøkter med brasilianske klubber, kamper mot lokale lag, beachvolleyball, footvolley, beach tennis og sandfotball på Copacabana, Flamengo og Ipanema, capoeira, crossfit og fjellturer." },
    { name: "Surf og friluftsliv", text: "Surfkurs med erfarne instruktører, fjell- og skogsturer med lokale guider, snorkling og dykking rundt Arraial do Cabo og Ilha Grande." },
    { name: "Solidaritet og kultur", text: "Møter med lokale favela-prosjekter og frivillige organisasjoner, kulturvandringer og historiske byvandringer, matkurs, samba og afro-brasiliansk kultur, og refleksjonsopplegg før, under og etter reisen." },
    { name: "Kreative fag", text: "Musikkworkshops og studioøkter med lokale artister, street art-turer, besøk hos mote- og designmiljøer og dansetimer i samba og afro-brasiliansk rytmikk." },
  ],
  programTitle: "Eksempelprogram: surf, friluftsliv og idrett (11 dager)",
  programNote: "Programmet er et utgangspunkt og tilpasses linjens mål, nivå og datoer.",
  dayHead: "Dag", programHead: "Program",
  days: [
    "Avreise fra Norge", "Ankomst Rio, transfer, sikkerhetsgjennomgang", "Byorientering og introduksjon til brasiliansk rytme",
    "Surfkurs del 1 og beachvolleyball", "Dagstur til fjell og natur", "Surfkurs del 2, trening med lokal klubb, refleksjon",
    "Faglig dag: kamp, klubbesøk eller sosialt prosjekt", "Arraial do Cabo eller Ilha Grande", "Retur til Rio, kulturdag, avslutningsmiddag",
    "Fritid med rammer og felles evaluering", "Hjemreise",
  ],
  howTitle: "Slik fungerer det",
  steps: [
    "Samtale (20 minutter, uforpliktende): mål, linje, antall og tidspunkt",
    "Forslag med program og pris per elev ved ulike gruppestørrelser",
    "Avtale med klare vilkår",
    "Forberedelser: informasjon til foresatte, reiseregler, dokumenter",
    "Turen med lokale verter og døgnåpen kontaktlinje",
    "Evaluering og forslag til neste år",
  ],
  includedTitle: "Dette er inkludert",
  included: "Gruppefly (forutsetter minst 10 reisende), hotell, transport og transfer, aktiviteter, undervisning og treningsopplegg, lokale guider og døgnåpen støtte.",
  priceTitle: "Pris",
  price: "Vi gir et konkret tilbud etter samtalen, med pris per elev for ulike gruppestørrelser. Fortell oss budsjettrammen, så tilpasser vi opplegget.",
  faqTitle: "Vanlige spørsmål",
  faq: [
    { q: "Hva koster det?", a: "Vi lager et konkret tilbud etter samtalen. Se avsnittet om pris." },
    { q: "Hvor mange elever trenger dere?", a: "Vi har gjennomført turer for grupper på 15 til 70 deltakere (elever og lærere). Gruppefly forutsetter minst 10 reisende." },
    { q: "Når bør vi begynne å planlegge?", a: "Vi anbefaler å starte planleggingen cirka seks måneder før avreise. Turene våre har vart fra 10 dager opp til 4 uker." },
    // HIDDEN FAQ (awaiting owner's terms): "Hvordan fungerer betaling og avbestilling?"
    { q: "Hvordan sikrer dere elevene?", a: "Se siden Trygghet.", safetyLink: true },
    { q: "Kan reisen kombineres med flere reisemål?", a: "Ja, gruppebilletter kan settes opp for flere destinasjoner." },
  ],
  aboutTitle: "Om oss",
  about: "Daniel Lira Figueiredo, tidligere folkehøgskolelærer, har planlagt og gjennomført studieturer til Brasil, Spania, Portugal og Sri Lanka. Rio Sport & Tour har i over 20 år levert opplegg for norske folkehøgskoler, amerikanske colleges, idrettslag og kulturgrupper. Vi har reist med linjer innen beachvolleyball, volleyball, dans, beach sports og sport adventure. Turene har hatt fra 15 til 70 deltakere (elever og lærere) og har vart fra 10 dager til 4 uker.",
  // HIDDEN until the owner confirms the schools may be named: "blant annet fra Sunnfjord folkehøgskole og Sogndal folkehøgskole"
  before: "Skriv gjerne i meldingsfeltet: skolens navn, linje, antall elever og lærere, ønsket tidspunkt, destinasjon (Rio, fjordene eller begge) og budsjettramme. Da kan jeg sende et konkret forslag raskt.",
  refsLabel: "Referanser fra grupper og skoler",
  safetyLinkLabel: "Les om trygghet",
};

// Owner-supplied English text.
const EN: Copy = {
  h1: "Study trips to Rio for folk high schools",
  intro: "I am a former folk high school teacher and have planned and led study trips to Brazil, Spain, Portugal and Sri Lanka. Together with Rio Sport & Tour, a local partner with over 20 years of experience, I build the trip around your line's goals and take care of the rest.",
  proposal: "Request a proposal",
  heroAlt: "Group at Christ the Redeemer, Rio de Janeiro",
  conciergeTitle: "How I work as your concierge",
  concierge: [
    "One contact person who knows the folk high school from the inside, from the first call until you are home",
    "A program built around your line's goals, not a ready-made package",
    "Local hosts in Rio: Rio Sport & Tour plans and runs everything on the ground",
    "Documents for the principal and parents: insurance, emergency plan and trip rules come with the proposal",
    "A 24/7 contact line during the trip. There is always someone available if something happens. We help adapt the program on the way when possible, and with language and cultural challenges",
    "Evaluation after the trip and a suggestion for next year",
  ],
  tracksTitle: "Choose your line",
  tracks: [
    { name: "Sports and multisport", text: "Training with Brazilian clubs, matches against local teams, beach volleyball, footvolley, beach tennis and beach soccer at Copacabana, Flamengo and Ipanema, capoeira, CrossFit and mountain hikes." },
    { name: "Surf and outdoor", text: "Surf lessons, mountain and forest walks with local guides, snorkeling and diving around Arraial do Cabo and Ilha Grande." },
    { name: "Solidarity and culture", text: "Meetings with local favela projects and NGOs, cultural and historical walks, cooking, samba and Afro-Brazilian culture, and reflection sessions before, during and after the trip." },
    { name: "Creative subjects", text: "Music workshops and studio sessions with local artists, street art tours, fashion and design visits, samba and Afro-Brazilian dance classes." },
  ],
  programTitle: "Sample program: surf, outdoor and sport (11 days)",
  programNote: "The program is a starting point and is adapted to your line's goals, level and dates.",
  dayHead: "Day", programHead: "Program",
  days: [
    "Departure from Norway", "Arrival in Rio, transfer, safety briefing", "City orientation and an introduction to Brazilian rhythm",
    "Surf lesson 1 and beach volleyball", "Mountain and nature day trip", "Surf lesson 2, training with a local club, reflection",
    "Subject day: match, club visit or social project", "Arraial do Cabo or Ilha Grande", "Return to Rio, culture day, farewell dinner",
    "Free time within rules and group evaluation", "Travel home",
  ],
  howTitle: "How it works",
  steps: [
    "A 20-minute call, no obligation: goals, line, numbers and dates",
    "A proposal with program and price per student for different group sizes",
    "Agreement with clear terms",
    "Preparation: parent information, trip rules, documents",
    "The trip, with local hosts and a 24/7 contact line",
    "Evaluation and a suggestion for next year",
  ],
  includedTitle: "What is included",
  included: "Group flights (minimum 10 travelers), hotels, transport and transfers, activities, teaching and training, local guides and 24/7 support.",
  priceTitle: "Price",
  price: "We give a concrete proposal after the call, with a price per student for different group sizes. Tell us your budget and we adapt the program.",
  faqTitle: "FAQ",
  faq: [
    { q: "What does it cost?", a: "We make a concrete proposal after the call. See the price section." },
    { q: "How many students do you need?", a: "We have run trips for 15 to 70 participants (students and teachers). Group flights require at least 10 travelers." },
    { q: "When should we start planning?", a: "We recommend starting about six months before departure. Our trips have lasted from 10 days up to 4 weeks." },
    // HIDDEN FAQ (awaiting owner's terms): "How do payment and cancellation work?"
    { q: "How do you keep students safe?", a: "See the Safety page.", safetyLink: true },
    { q: "Can the trip combine several destinations?", a: "Yes, group tickets can be arranged for several destinations." },
  ],
  aboutTitle: "About us",
  about: "Daniel Lira Figueiredo is a former folk high school teacher who has planned and led study trips to Brazil, Spain, Portugal and Sri Lanka. Rio Sport & Tour has delivered programs for Norwegian folk high schools, American colleges, sports clubs and cultural groups for over 20 years. We have traveled with lines in beach volleyball, volleyball, dance, beach sports and sport adventure. Our trips have had 15 to 70 participants (students and teachers) and have lasted from 10 days to 4 weeks.",
  // HIDDEN until the owner confirms the schools may be named: "among others from Sunnfjord and Sogndal folk high schools"
  before: "In the message field, please include your school, line, number of students and teachers, preferred dates, destination (Rio, the fjords or both) and budget range.",
  refsLabel: "Group and school references",
  safetyLinkLabel: "Read about safety",
};

// PORTUGUESE PLACEHOLDER: no Portuguese text supplied yet; /pt-br shows the English version.
const COPY = { no: NO, en: EN, pt: EN };

export default function FolkHighSchoolPage() {
  const locale = currentLocale();
  const c = COPY[locale];
  const [tab, setTab] = useState(0);
  const safetyLive = isGroupPageAvailable("safety", import.meta.env.PROD);
  const h2 = "mb-8 font-serif text-[clamp(1.8rem,3vw,2.6rem)] font-bold text-ink";
  const section = "px-16 py-20 max-md:px-6 max-md:py-14";
  const safetyHref = localePath("/safety", locale);

  return (
    <div className="flex min-h-screen flex-col bg-parchment">
      <Navbar />
      <main className="flex-1">
        <section className="relative flex min-h-[80vh] items-end overflow-hidden bg-ink px-16 pb-20 pt-48 max-md:px-6 max-md:pb-14">
          <img src={cristo.url} alt={c.heroAlt} fetchPriority="high" className="absolute inset-0 h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/60 to-ink/20" />
          <div className="relative max-w-3xl">
            <h1 className="font-serif text-[clamp(2.2rem,5vw,4.2rem)] font-bold leading-[1.05] text-parchment">{c.h1}</h1>
            <p className="mt-6 max-w-2xl text-lg leading-relaxed text-parchment/85">{c.intro}</p>
            <div className="mt-10"><ProposalCta label={c.proposal} /></div>
          </div>
        </section>

        <section className={section}>
          <div className="mx-auto max-w-5xl">
            <h2 className={h2}>{c.conciergeTitle}</h2>
            <ul className="grid gap-x-10 gap-y-5 md:grid-cols-2">
              {c.concierge.map((p) => (
                <li key={p} className="border-l-2 border-gold pl-4 leading-relaxed text-ink-2">{p}</li>
              ))}
            </ul>
          </div>
        </section>

        <section className={`bg-parchment-2 ${section}`}>
          <div className="mx-auto max-w-5xl">
            <h2 className={h2}>{c.tracksTitle}</h2>
            <div role="tablist" className="flex flex-wrap gap-2 border-b border-parchment-3">
              {c.tracks.map((t, n) => (
                <button key={t.name} role="tab" aria-selected={tab === n} onClick={() => setTab(n)}
                  className={`-mb-px border-b-2 px-4 py-3 text-[0.75rem] font-semibold uppercase tracking-[0.12em] transition ${tab === n ? "border-gold text-ink" : "border-transparent text-voyage-muted hover:text-ink"}`}>
                  {t.name}
                </button>
              ))}
            </div>
            <p role="tabpanel" className="mt-8 max-w-3xl text-lg leading-relaxed text-ink-2">{c.tracks[tab].text}</p>
          </div>
        </section>

        <section className={section}>
          <div className="mx-auto max-w-4xl">
            <h2 className={h2}>{c.programTitle}</h2>
            <p className="mb-6 text-sm italic text-voyage-muted">{c.programNote}</p>
            <TwoColTable head={[c.dayHead, c.programHead]} rows={c.days.map((d, n) => [String(n + 1), d])} narrow />
            <div className="mt-10"><ProposalCta label={c.proposal} /></div>
          </div>
        </section>

        <section className={`bg-parchment-2 ${section}`}>
          <div className="mx-auto max-w-6xl">
            <h2 className={h2}>{c.howTitle}</h2>
            <NumberedSteps steps={c.steps} />
          </div>
        </section>

        <section className={section}>
          <div className="mx-auto grid max-w-5xl gap-12 md:grid-cols-2">
            <div>
              <h2 className={h2}>{c.includedTitle}</h2>
              <p className="text-lg leading-relaxed text-ink-2">{c.included}</p>
              {/* Owner note: details are confirmed in each proposal. */}
            </div>
            <div id="pris">
              <h2 className={h2}>{c.priceTitle}</h2>
              <p className="text-lg leading-relaxed text-ink-2">{c.price}</p>
            </div>
          </div>
        </section>

        <section className={`bg-parchment-2 ${section}`}>
          <div className="mx-auto max-w-3xl">
            <h2 className={h2}>{c.faqTitle}</h2>
            <Accordion type="single" collapsible className="border-t border-parchment-3">
              {c.faq.map((f) => (
                <AccordionItem key={f.q} value={f.q} className="border-parchment-3">
                  <AccordionTrigger className="text-left font-serif text-xl text-ink">{f.q}</AccordionTrigger>
                  <AccordionContent className="text-base leading-relaxed text-ink-2">
                    {f.safetyLink && safetyLive
                      ? <a href={safetyHref} className="text-gold underline">{f.a}</a>
                      : f.a}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
            {safetyLive && (
              <a href={safetyHref} className="mt-6 inline-block text-[0.72rem] font-semibold uppercase tracking-[0.16em] text-gold hover:underline">{c.safetyLinkLabel} →</a>
            )}
          </div>
        </section>

        <section className={section}>
          <div className="mx-auto max-w-3xl">
            <h2 className={h2}>{c.aboutTitle}</h2>
            <p className="text-lg leading-relaxed text-ink-2">{c.about}</p>
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
