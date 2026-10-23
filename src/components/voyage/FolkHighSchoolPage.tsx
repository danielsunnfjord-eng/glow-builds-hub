import { useState } from "react";
import Navbar from "./Navbar";
import Footer from "./Footer";
import LocalPartnerRio from "./LocalPartnerRio";
import Reviews from "./Reviews";
import { currentLocale, localePath } from "@/lib/locale";
import { GROUP_INTAKE_URL, isGroupPageAvailable } from "@/lib/travelNavigation";
import { HOME_COPY, RIO_TESTIMONIAL_AUTHORS, RIO_REVIEWS_LABEL } from "./home/homeCopy";
import GroupReferences from "./GroupReferences";
import sup from "@/assets/home/sunrise_sup_copacabana.jpg.asset.json";
import flamengo from "@/assets/home/praia_do_flamengo.jpg.asset.json";
import fjord from "@/assets/skala-nordfjord.jpg.asset.json";

const ext = { target: "_blank", rel: "noopener noreferrer" } as const;
const btnGold = "inline-flex items-center justify-center rounded-sm bg-gold px-7 py-3.5 text-[0.72rem] font-semibold uppercase tracking-[0.16em] text-ink transition hover:bg-gold-2";

interface Copy {
  h1: string; intro: string; proposal: string;
  tracksTitle: string; tracks: { name: string; text: string }[];
  programTitle: string; dayLabel: string; days: string[]; programNote: string;
  includedTitle: string; included: string;
  howTitle: string;
  safetyTitle: string; safety: string; safetyLink: string;
  fjordsTitle: string; fjords: string;
  beforeTitle: string; before: string;
  faqTitle: string; faq: string[];
}

// Norwegian is the primary version (owner-supplied text).
const NO: Copy = {
  h1: "Studietur til Rio for folkehøgskoler",
  intro: "Jeg er tidligere folkehøgskolelærer og har planlagt og gjennomført studieturer til Brasil, Spania, Portugal og Sri Lanka. Sammen med Rio Sport & Tour, en lokal partner med over 20 års erfaring, setter jeg opp et trygt og faglig sterkt opplegg for din linje.",
  proposal: "Be om forslag",
  tracksTitle: "Velg din linje",
  tracks: [
    { name: "Idrett og multisport", text: "Treningsøkter med brasilianske klubber, kamper mot lokale lag, beachvolleyball, footvolley og beach soccer på Copacabana, Flamengo og Ipanema, capoeira, crossfit og fjellturer." },
    { name: "Surf og friluftsliv", text: "Surfkurs med erfarne instruktører, fjell- og skogsturer med lokale guider, snorkling og dykking rundt Arraial do Cabo og Ilha Grande." },
    { name: "Solidaritet og kultur", text: "Møter med lokale favela-prosjekter og frivillige organisasjoner, kulturvandringer og historiske byvandringer, matkurs, samba og afro-brasiliansk kultur, og refleksjonsopplegg før, under og etter reisen." },
    { name: "Kreative fag", text: "Musikkworkshops og studioøkter med lokale artister, street art-turer, besøk hos mote- og designmiljøer, og dansetimer i samba og afro-brasiliansk rytmikk." },
  ],
  programTitle: "Eksempelprogram: surf, friluftsliv og idrett (11 dager)",
  dayLabel: "Dag",
  days: [
    "Avreise", "Ankomst Rio, transfer, sikkerhetsgjennomgang", "Byorientering og introduksjon til brasiliansk rytme",
    "Surfkurs del 1 og beachvolleyball", "Dagstur til fjell og natur", "Surfkurs del 2, trening med lokal klubb, refleksjon",
    "Faglig dag: kamp, klubbesøk eller sosialt prosjekt", "Arraial do Cabo eller Ilha Grande", "Retur, kulturdag, avslutningsmiddag",
    "Fritid med rammer og evaluering", "Hjemreise",
  ],
  programNote: "Programmet tilpasses linjens faglige mål, nivå og datoer.",
  includedTitle: "Dette er inkludert",
  included: "Gruppefly (forutsetter minst 10 reisende), hotell i trygge områder, transport og transfer, aktiviteter, kurs og treningsopplegg, lokale guider og 24/7 support.",
  howTitle: "Slik jobber vi",
  safetyTitle: "Trygghet",
  safety: "Trygghet kommer først. Les hvordan vi forbereder, følger opp og håndterer uforutsette hendelser.",
  safetyLink: "Les om trygghet",
  fjordsTitle: "Fra fjordene til Rio, og tilbake",
  fjords: "Vi har base i Sogn og Fjordane og i Rio. Vi kan også ta imot brasilianske grupper i fjordene, med surf på Stad, kajakk og møte med lokale skoler.",
  beforeTitle: "Før du sender inn skjemaet",
  before: "Skriv gjerne i meldingsfeltet: skolens navn, linje, antall elever og lærere, ønsket tidspunkt, destinasjon (Rio, fjordene eller begge) og budsjettramme. Da kan jeg sende et konkret forslag raskt.",
  faqTitle: "FAQ",
  faq: ["Hva koster det?", "Hvor mange elever trenger dere?", "Hva er inkludert?", "Hvordan fungerer betaling og avbestilling?", "Hvordan sikrer dere elevene?"],
};

// DRAFT – pending review: shorter English version translated from the Norwegian text.
const EN: Copy = {
  h1: "Study trips to Rio for folk high schools",
  intro: "I'm a former folk high school teacher and have planned and led study trips to Brazil, Spain, Portugal and Sri Lanka. Together with Rio Sport & Tour, a local partner with over 20 years of experience, I build a safe and academically strong program for your course.",
  proposal: "Request a proposal",
  tracksTitle: "Choose your course",
  tracks: [
    { name: "Sports and multisport", text: "Training with Brazilian clubs, matches against local teams, beach volleyball, footvolley and beach soccer, capoeira, crossfit and mountain hikes." },
    { name: "Surf and outdoor life", text: "Surf lessons with experienced instructors, mountain and forest hikes with local guides, snorkelling and diving around Arraial do Cabo and Ilha Grande." },
    { name: "Solidarity and culture", text: "Meetings with local favela projects and NGOs, cultural and historical walks, cooking classes, samba and Afro-Brazilian culture, with reflection before, during and after the trip." },
    { name: "Creative subjects", text: "Music workshops and studio sessions with local artists, street art tours, fashion and design visits, and samba and Afro-Brazilian dance classes." },
  ],
  programTitle: "Sample program: surf, outdoor life and sports (11 days)",
  dayLabel: "Day",
  days: [
    "Departure", "Arrival in Rio, transfer, safety briefing", "City orientation and introduction to Brazilian rhythm",
    "Surf lesson part 1 and beach volleyball", "Day trip to the mountains and nature", "Surf lesson part 2, training with a local club, reflection",
    "Course day: match, club visit or social project", "Arraial do Cabo or Ilha Grande", "Return, culture day, farewell dinner",
    "Structured free time and evaluation", "Journey home",
  ],
  programNote: "The program is adapted to your course's goals, level and dates.",
  includedTitle: "What's included",
  included: "Group flights (minimum 10 travellers), hotels in safe areas, transport and transfers, activities, lessons and training, local guides and 24/7 support.",
  howTitle: "How it works",
  safetyTitle: "Safety",
  safety: "Safety comes first. Read how we prepare, supervise and respond.",
  safetyLink: "Read about safety",
  fjordsTitle: "From the fjords to Rio, and back",
  fjords: "We are based in Sogn og Fjordane and in Rio. We can also host Brazilian groups in the fjords, with surfing at Stad, kayaking and visits to local schools.",
  beforeTitle: "Before you send the form",
  before: "In the message field, include: school name, course, number of students and teachers, preferred dates, destination (Rio, the fjords or both) and budget. Then I can send a concrete proposal quickly.",
  faqTitle: "FAQ",
  faq: ["What does it cost?", "How many students do you need?", "What's included?", "How do payment and cancellation work?", "How do you keep students safe?"],
};

// DRAFT – pending review: Portuguese translated from the English text; the owner reviews before publishing.
const PT: Copy = {
  h1: "Viagens de estudo ao Rio para folk high schools",
  intro: "Sou ex-professor de folk high school e já planejei e conduzi viagens de estudo ao Brasil, Espanha, Portugal e Sri Lanka. Junto com a Rio Sport & Tour, parceira local com mais de 20 anos de experiência, monto um programa seguro e academicamente sólido para o seu curso.",
  proposal: "Solicite uma proposta",
  tracksTitle: "Escolha o seu curso",
  tracks: [
    { name: "Esporte e multiesporte", text: "Treinos com clubes brasileiros, jogos contra times locais, vôlei de praia, futevôlei e futebol de areia, capoeira, crossfit e trilhas nas montanhas." },
    { name: "Surf e atividades ao ar livre", text: "Aulas de surf com instrutores experientes, trilhas em montanhas e florestas com guias locais, snorkel e mergulho em Arraial do Cabo e Ilha Grande." },
    { name: "Solidariedade e cultura", text: "Encontros com projetos sociais em favelas e ONGs, passeios culturais e históricos, aulas de culinária, samba e cultura afro-brasileira, com reflexão antes, durante e depois da viagem." },
    { name: "Cursos criativos", text: "Oficinas de música e sessões de estúdio com artistas locais, tours de street art, visitas a ateliês de moda e design, e aulas de samba e dança afro-brasileira." },
  ],
  programTitle: "Programa de exemplo: surf, atividades ao ar livre e esporte (11 dias)",
  dayLabel: "Dia",
  days: [
    "Partida", "Chegada ao Rio, transfer, orientação de segurança", "Orientação pela cidade e introdução ao ritmo brasileiro",
    "Aula de surf parte 1 e vôlei de praia", "Passeio de um dia às montanhas e à natureza", "Aula de surf parte 2, treino com clube local, reflexão",
    "Dia do curso: jogo, visita a clube ou projeto social", "Arraial do Cabo ou Ilha Grande", "Retorno, dia cultural, jantar de despedida",
    "Tempo livre com estrutura e avaliação", "Volta para casa",
  ],
  programNote: "O programa é adaptado aos objetivos, ao nível e às datas do seu curso.",
  includedTitle: "O que está incluído",
  included: "Voos em grupo (mínimo de 10 viajantes), hotéis em áreas seguras, transporte e transfers, atividades, aulas e treinos, guias locais e suporte 24/7.",
  howTitle: "Como funciona",
  safetyTitle: "Segurança",
  safety: "A segurança vem em primeiro lugar. Veja como preparamos, acompanhamos e agimos.",
  safetyLink: "Leia sobre segurança",
  fjordsTitle: "Dos fiordes ao Rio, e de volta",
  fjords: "Temos base em Sogn og Fjordane e no Rio. Também recebemos grupos brasileiros nos fiordes, com surf em Stad, caiaque e visitas a escolas locais.",
  beforeTitle: "Antes de enviar o formulário",
  before: "No campo de mensagem, inclua: nome da escola, curso, número de alunos e professores, datas preferidas, destino (Rio, fiordes ou ambos) e orçamento. Assim posso enviar uma proposta concreta rapidamente.",
  faqTitle: "Perguntas frequentes",
  faq: ["Quanto custa?", "Quantos alunos são necessários?", "O que está incluído?", "Como funcionam o pagamento e o cancelamento?", "Como vocês garantem a segurança dos alunos?"],
};
const COPY = { no: NO, en: EN, pt: PT };

// PRICE PLACEHOLDER (hidden): "Pris: fra kr X per elev ved 25 elever." — show once the owner supplies the number.
// FAQ ANSWER PLACEHOLDERS (owner will supply): cost, minimum students, inclusions, payment/cancellation, student safety.

function Cta({ label }: { label: string }) {
  return <a href={GROUP_INTAKE_URL} {...ext} className={btnGold}>{label}</a>;
}

export default function FolkHighSchoolPage() {
  const locale = currentLocale();
  const c = COPY[locale];
  const steps = HOME_COPY[locale].steps;
  const [tab, setTab] = useState(0);
  const safetyLive = isGroupPageAvailable("safety", import.meta.env.PROD);
  const h2 = "mb-8 font-serif text-[clamp(1.8rem,3vw,2.6rem)] font-bold text-ink";
  const section = "px-16 py-20 max-md:px-6 max-md:py-14";

  return (
    <div className="flex min-h-screen flex-col bg-parchment">
      <Navbar />
      <main className="flex-1">
        <section className="relative flex min-h-[80vh] items-end overflow-hidden bg-ink px-16 pb-20 pt-48 max-md:px-6 max-md:pb-14">
          <img src={sup.url} alt="" aria-hidden fetchPriority="high" className="absolute inset-0 h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/60 to-ink/20" />
          <div className="relative max-w-3xl">
            <h1 className="font-serif text-[clamp(2.2rem,5vw,4.2rem)] font-bold leading-[1.05] text-parchment">{c.h1}</h1>
            <p className="mt-6 max-w-2xl text-lg leading-relaxed text-parchment/85">{c.intro}</p>
            <div className="mt-10"><Cta label={c.proposal} /></div>
          </div>
        </section>

        <section className={section}>
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

        <section className={`bg-parchment-2 ${section}`}>
          <div className="mx-auto grid max-w-6xl grid-cols-[1.4fr_1fr] gap-12 max-lg:grid-cols-1">
            <div>
              <h2 className={h2}>{c.programTitle}</h2>
              <table className="w-full text-left text-[0.95rem]">
                <tbody>
                  {c.days.map((d, n) => (
                    <tr key={n} className="border-b border-parchment-3">
                      <th scope="row" className="w-24 py-3 pr-4 font-serif text-lg font-semibold text-gold">{c.dayLabel} {n + 1}</th>
                      <td className="py-3 text-ink-2">{d}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <p className="mt-6 text-sm italic text-voyage-muted">{c.programNote}</p>
              <div className="mt-8"><Cta label={c.proposal} /></div>
            </div>
            <img src={flamengo.url} alt="Praia do Flamengo" loading="lazy" className="h-full max-h-[640px] w-full rounded-lg object-cover max-lg:max-h-80" />
          </div>
        </section>

        <section className={section}>
          <div className="mx-auto max-w-5xl">
            <h2 className={h2}>{c.includedTitle}</h2>
            <p className="max-w-3xl text-lg leading-relaxed text-ink-2">{c.included}</p>
          </div>
        </section>

        <section className={`bg-parchment-2 ${section}`}>
          <div className="mx-auto max-w-6xl">
            <h2 className={h2}>{c.howTitle}</h2>
            <ol className="grid grid-cols-6 gap-4 max-lg:grid-cols-3 max-sm:grid-cols-2">
              {steps.map((s, n) => (
                <li key={s} className="border-t-2 border-gold pt-4">
                  <div className="font-serif text-3xl text-gold">{n + 1}</div>
                  <div className="mt-1 text-sm font-semibold uppercase tracking-[0.1em] text-ink">{s}</div>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section className="px-16 py-14 max-md:px-6">
          <div className="mx-auto max-w-5xl border-l-2 border-gold pl-6">
            <h2 className="mb-3 font-serif text-2xl font-bold text-ink">{c.safetyTitle}</h2>
            <p className="text-ink-2">{c.safety}</p>
            {safetyLive && (
              <a href={localePath("/safety", locale)} className="mt-4 inline-block text-[0.72rem] font-semibold uppercase tracking-[0.16em] text-gold hover:underline">{c.safetyLink} →</a>
            )}
          </div>
        </section>

        <section className="relative overflow-hidden bg-ink px-16 py-24 max-md:px-6 max-md:py-16">
          <img src={fjord.url} alt="" aria-hidden loading="lazy" className="absolute inset-0 h-full w-full object-cover opacity-40" />
          <div className="relative mx-auto max-w-3xl text-center">
            <h2 className="mb-5 font-serif text-[clamp(1.8rem,3vw,2.6rem)] font-bold text-parchment">{c.fjordsTitle}</h2>
            <p className="text-lg leading-relaxed text-parchment/90">{c.fjords}</p>
          </div>
        </section>

        <LocalPartnerRio />
        <Reviews include={RIO_TESTIMONIAL_AUTHORS} label={RIO_REVIEWS_LABEL[currentLocale()]} />
        <GroupReferences label={currentLocale() === "no" ? "Referanser fra grupper og skoler" : currentLocale() === "pt" ? "Referências de grupos e escolas" : "Group and school references"} />

        <section className={section}>
          <div className="mx-auto max-w-3xl">
            <h2 className={h2}>{c.faqTitle}</h2>
            <div className="divide-y divide-parchment-3 border-y border-parchment-3">
              {c.faq.map((q) => (
                <h3 key={q} className="py-4 font-serif text-xl text-ink">{q}</h3>
              ))}
            </div>
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
