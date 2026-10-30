import { useState } from "react";
import { ArrowLeft } from "lucide-react";
import Navbar from "./Navbar";
import Footer from "./Footer";
import LocalPartnerRio from "./LocalPartnerRio";
import { StatusTag } from "./ThemeTripsHub";
import { TwoColTable } from "./GroupBlocks";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { supabase } from "@/integrations/supabase/client";
import { currentLocale, localePath } from "@/lib/locale";
import { THEME_COPY, type ThemeTrip } from "@/lib/themeTrips";
import { GROUP_INTAKE_URL } from "@/lib/travelNavigation";
import daniel from "@/assets/daniel-profile.webp";
import pablo from "@/assets/home/pablo_rst.jpg.asset.json";

const ext = { target: "_blank", rel: "noopener noreferrer" } as const;
const LEADER_PHOTOS: Record<string, string> = {
  "Daniel Lira Figueiredo": daniel,
  "Pablo Cabral Salles": pablo.url,
};

/** Side card: status tag, period dropdown and the interest form (saved to interest_signups). */
function InterestCard({ trip }: { trip: ThemeTrip }) {
  const locale = currentLocale();
  const c = THEME_COPY[locale];
  const t = trip.copy[locale];
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [period, setPeriod] = useState(t.periods[0]);
  const [message, setMessage] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "done" | "error">("idle");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setState("sending");
    const { error } = await supabase.from("interest_signups" as never).insert({
      trip: trip.slug,
      period,
      name: name.trim(),
      email: email.trim(),
      message: message.trim() || null,
      locale,
    } as never);
    setState(error ? "error" : "done");
  }

  const inputCls =
    "w-full rounded-sm border border-parchment-3 bg-voyage-white px-3 py-2.5 text-sm text-ink focus:border-gold focus:outline-none";
  return (
    <aside className="h-fit rounded-lg border border-parchment-3 bg-voyage-white p-7 lg:sticky lg:top-28">
      <StatusTag label={c.statusTag} />
      <h2 className="mt-4 font-serif text-2xl font-bold text-ink">{c.registerTitle}</h2>
      {state === "done" ? (
        <p className="mt-4 leading-relaxed text-ink-2">{c.registerDone}</p>
      ) : (
        <form onSubmit={submit} className="mt-5 space-y-4">
          <div>
            <label htmlFor="interest-name" className="mb-1 block text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-voyage-muted">
              {c.registerName}
            </label>
            <input id="interest-name" required value={name} onChange={(e) => setName(e.target.value)} className={inputCls} />
          </div>
          <div>
            <label htmlFor="interest-email" className="mb-1 block text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-voyage-muted">
              {c.registerEmail}
            </label>
            <input id="interest-email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className={inputCls} />
          </div>
          <div>
            <label htmlFor="interest-period" className="mb-1 block text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-voyage-muted">
              {c.registerPeriod}
            </label>
            <select id="interest-period" value={period} onChange={(e) => setPeriod(e.target.value)} className={inputCls}>
              {t.periods.map((p) => (
                <option key={p} value={p}>
                  {p} – {c.statusTag}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="interest-message" className="mb-1 block text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-voyage-muted">
              {c.registerMessage}
            </label>
            <textarea id="interest-message" rows={3} value={message} onChange={(e) => setMessage(e.target.value)} className={inputCls} />
          </div>
          {state === "error" && <p className="text-sm text-red-700">{c.registerError}</p>}
          <button
            type="submit"
            disabled={state === "sending"}
            className="w-full rounded-sm bg-gold px-7 py-3.5 text-[0.72rem] font-semibold uppercase tracking-[0.16em] text-ink transition hover:bg-gold-2 disabled:opacity-60"
          >
            {c.registerSubmit}
          </button>
        </form>
      )}
      <p className="mt-4 text-sm text-ink-2">{c.tentativeNote}</p>
      <a href={GROUP_INTAKE_URL} {...ext} className="mt-4 block text-sm font-semibold text-gold underline-offset-4 hover:underline">
        {c.groupLink}
      </a>
    </aside>
  );
}

export default function ThemeTripPage({ trip }: { trip: ThemeTrip }) {
  const locale = currentLocale();
  const c = THEME_COPY[locale];
  const t = trip.copy[locale];
  const standardBlocks = [
    { title: c.adaptedTitle, text: c.adapted },
    { title: c.minimumTitle, text: c.minimum },
    { title: c.languagesTitle, text: c.languages },
  ];
  return (
    <>
      <Navbar />
      <main className="min-h-[75vh] bg-parchment px-16 pb-24 pt-56 max-md:px-6 max-md:pt-32">
        <div className="mx-auto max-w-6xl">
          <a href={localePath("/trips", locale)} className="flex w-fit items-center gap-2 text-sm font-semibold text-gold underline-offset-4 hover:underline">
            <ArrowLeft aria-hidden size={16} />
            {c.backToTrips}
          </a>
          <div className="mt-8 grid gap-10 lg:grid-cols-[1fr_360px]">
            <div>
              <StatusTag label={c.statusTag} />
              <h1 className="mt-4 max-w-3xl font-serif text-4xl font-bold leading-tight text-ink md:text-5xl">{t.title}</h1>
              <p className="mt-4 max-w-2xl text-lg leading-relaxed text-ink-2">{t.subtitle}</p>
              <p className="mt-2 text-sm font-semibold uppercase tracking-[0.14em] text-voyage-muted">
                {t.duration} · {t.destination}
              </p>
              <p className="mt-6 max-w-2xl leading-relaxed text-ink-2">{t.overview}</p>

              <section className="mt-12">
                <h2 className="font-serif text-3xl font-bold text-ink">{c.programTitle}</h2>
                <div className="mt-6">
                  <TwoColTable head={t.programHead} rows={t.program} narrow />
                </div>
              </section>

              <section className="mt-12">
                <h2 className="font-serif text-2xl font-bold text-ink">{t.stayTitle}</h2>
                <p className="mt-3 max-w-2xl leading-relaxed text-ink-2">{t.stay}</p>
              </section>

              {t.activities && (
                <section className="mt-12">
                  <h2 className="font-serif text-2xl font-bold text-ink">{t.activitiesTitle}</h2>
                  <p className="mt-3 max-w-2xl leading-relaxed text-ink-2">{t.activities}</p>
                </section>
              )}

              {t.extraSections?.map((section) => (
                <section key={section.title} className="mt-12">
                  <h2 className="font-serif text-2xl font-bold text-ink">{section.title}</h2>
                  <p className="mt-3 max-w-2xl leading-relaxed text-ink-2">{section.text}</p>
                </section>
              ))}

              <section className="mt-12">
                <h2 className="font-serif text-2xl font-bold text-ink">{t.leadersTitle}</h2>
                <ul className="mt-6 grid gap-6 sm:grid-cols-2">
                  {t.leaders.map((leader) => {
                    const photo = LEADER_PHOTOS[leader.name];
                    return (
                      <li key={leader.name} className="flex items-center gap-4">
                        {photo && <img src={photo} alt={leader.name} loading="lazy" className="h-20 w-20 rounded-full border border-gold/30 object-cover" />}
                        <div>
                          <div className="font-serif text-lg font-semibold text-ink">{leader.name}</div>
                          <div className="text-sm leading-relaxed text-ink-2">{leader.role}</div>
                        </div>
                      </li>
                    );
                  })}
                </ul>
                {t.leadersNote && <p className="mt-4 max-w-2xl text-sm leading-relaxed text-ink-2">{t.leadersNote}</p>}
              </section>

              <section className="mt-12">
                <h2 className="font-serif text-2xl font-bold text-ink">{c.arrangeTitle}</h2>
                <p className="mt-3 max-w-2xl leading-relaxed text-ink-2">{c.arrange}</p>
              </section>

              <section className="mt-12 grid gap-6 md:grid-cols-3">
                {standardBlocks.map((block) => (
                  <div key={block.title} className="border-t-2 border-gold pt-4">
                    <h2 className="font-serif text-xl font-bold text-ink">{block.title}</h2>
                    <p className="mt-2 text-sm leading-relaxed text-ink-2">{block.text}</p>
                  </div>
                ))}
              </section>

              <section className="mt-12">
                <h2 className="font-serif text-2xl font-bold text-ink">{t.beforeTitle}</h2>
                <p className="mt-3 max-w-2xl leading-relaxed text-ink-2">{t.before}</p>
              </section>

              <section className="mt-12">
                <h2 className="font-serif text-2xl font-bold text-ink">{t.faqTitle}</h2>
                <Accordion type="single" collapsible className="mt-4 max-w-2xl">
                  {t.faq.map((item, n) => (
                    <AccordionItem key={n} value={`faq-${n}`}>
                      <AccordionTrigger className="text-left font-serif text-lg text-ink">{item.q}</AccordionTrigger>
                      <AccordionContent className="leading-relaxed text-ink-2">{item.a}</AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </section>
            </div>

            <InterestCard trip={trip} />
          </div>
        </div>
      </main>
      {t.showRioPartner && <LocalPartnerRio />}
      <Footer />
    </>
  );
}
