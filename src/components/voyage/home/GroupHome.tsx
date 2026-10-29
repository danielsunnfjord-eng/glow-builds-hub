import { Button } from "@/components/ui/button";
import LocalPartnerRio from "@/components/voyage/LocalPartnerRio";
import { useEffect, useState } from "react";
import { currentLocale, localePath } from "@/lib/locale";
import { CALENDLY_URL, GROUP_INTAKE_URL, isGroupPageAvailable } from "@/lib/travelNavigation";
import { WHATSAPP_URL } from "@/lib/whatsapp";
import { HOME_COPY } from "./homeCopy";
import sup from "@/assets/home/sunrise_sup_copacabana.jpg.asset.json";
import stegastein from "@/assets/stegastein.jpg.asset.json";
import skala from "@/assets/skala-nordfjord.jpg.asset.json";
import bryggen from "@/assets/bryggen-bergen.jpg.asset.json";
import oslo from "@/assets/norway-0383.jpg.asset.json";
import arpoador from "@/assets/home/pedra_do_arpoador.jpg.asset.json";
import cristo from "@/assets/home/cristo_redentor.jpg.asset.json";
import flamengo from "@/assets/home/praia_do_flamengo.jpg.asset.json";
import museu from "@/assets/home/museu_do_amanha.jpg.asset.json";

const HERO_IMAGES = [sup.url, stegastein.url, arpoador.url, skala.url, flamengo.url, bryggen.url, cristo.url, oslo.url];
const CARD_IMAGES = [stegastein.url, cristo.url, museu.url, arpoador.url];
const ext = { target: "_blank", rel: "noopener noreferrer" } as const;

const btnGold = "inline-flex items-center justify-center rounded-sm bg-gold px-7 py-3.5 text-[0.72rem] font-semibold uppercase tracking-[0.16em] text-ink transition hover:bg-gold-2";
const btnOutline = "inline-flex items-center justify-center rounded-sm border border-parchment/70 px-7 py-3.5 text-[0.72rem] font-semibold uppercase tracking-[0.16em] text-parchment transition hover:bg-parchment/10";

function useCopy() {
  return HOME_COPY[currentLocale()];
}

export function GroupHero() {
  const c = useCopy();
  const [i, setI] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setI((n) => (n + 1) % HERO_IMAGES.length), 6000);
    return () => clearInterval(id);
  }, []);
  return (
    <section className="relative flex min-h-[92vh] items-end overflow-hidden bg-ink px-16 pb-24 pt-48 max-md:px-6 max-md:pb-16">
      {/* VIDEO PLACEHOLDER: a short surf/fjord video can replace these photos when supplied. */}
      {HERO_IMAGES.map((src, n) => (
        <img
          key={src}
          src={src}
          alt=""
          aria-hidden
          fetchPriority={n === 0 ? "high" : "low"}
          loading={n === 0 ? "eager" : "lazy"}
          className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-[2000ms] ${n === i ? "opacity-100" : "opacity-0"}`}
        />
      ))}
      <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/60 to-ink/20" />
      <div className="relative max-w-3xl">
        <h1 className="font-serif text-[clamp(2.4rem,5.5vw,4.6rem)] font-bold leading-[1.02] tracking-tight text-parchment">{c.headline}</h1>
        <p className="mt-6 max-w-xl text-lg leading-relaxed text-parchment/85">{c.subheadline}</p>
        <div className="mt-10 flex flex-wrap gap-4">
          <Button asChild className={`${btnGold} h-auto whitespace-normal`}><a href={localePath("/start", currentLocale())}>{c.start}</a></Button>
          <Button asChild variant="outline" className={`${btnOutline} h-auto bg-transparent whitespace-normal`}><a href={CALENDLY_URL} {...ext}>{c.call}</a></Button>
        </div>
        <a href={WHATSAPP_URL} {...ext} className="mt-5 inline-block text-sm text-parchment/80 underline-offset-4 hover:underline">{c.whatsapp}</a>
      </div>
    </section>
  );
}

export function EntryCards() {
  const c = useCopy();
  const locale = currentLocale();
  return (
    <section className="bg-parchment px-16 py-24 max-md:px-6 max-md:py-16">
      <div className="mx-auto max-w-6xl">
        <div className="mb-10 text-[0.65rem] font-semibold uppercase tracking-[0.22em] text-gold">{c.cardsEyebrow}</div>
        <div className="grid grid-cols-4 gap-6 max-lg:grid-cols-2 max-sm:grid-cols-1">
          {c.cards.map((card, n) => {
            const href = localePath(card.path, locale);
            return (
              <a key={card.title} href={href} className="group flex h-full flex-col overflow-hidden rounded-lg border border-parchment-3 bg-voyage-white transition hover:shadow-elegant">
                <div className="aspect-[4/3] overflow-hidden">
                  <img src={CARD_IMAGES[n]} alt={card.title} loading="lazy" className="h-full w-full object-cover transition duration-700 group-hover:scale-105" />
                </div>
                <div className="flex flex-1 flex-col p-6">
                  <h2 className="font-serif text-2xl font-bold text-ink">{card.title}</h2>
                  <p className="mt-3 text-sm leading-relaxed text-ink-2">{card.text}</p>
                  <span className="mt-auto flex items-center gap-2 pt-6 text-sm font-semibold text-gold">{c.explore} <span aria-hidden className="transition group-hover:translate-x-1">→</span></span>
                </div>
              </a>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export function ConciergeSection() {
  const c = useCopy();
  return (
    <section className="bg-parchment-2 px-16 py-16 max-md:px-6">
      <div className="mx-auto max-w-6xl">
        <h2 className="font-serif text-3xl font-bold text-ink">{c.conciergeTitle}</h2>
        <ul className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {c.conciergePoints.map((point) => <li key={point} className="border-l-2 border-gold pl-5 text-sm leading-relaxed text-ink-2">{point}</li>)}
        </ul>
      </div>
    </section>
  );
}

export function ProofStrip() {
  const c = useCopy();
  return (
    <section className="bg-ink px-16 py-10 max-md:px-6">
      <ul className="mx-auto grid max-w-6xl grid-cols-4 gap-6 text-center max-md:grid-cols-2">
        {c.proof.map((p) => (
          <li key={p} className="text-[0.78rem] font-medium uppercase tracking-[0.12em] text-parchment/90">{p}</li>
        ))}
      </ul>
    </section>
  );
}

export function HowItWorks() {
  const c = useCopy();
  return (
    <section className="bg-parchment-2 px-16 py-20 max-md:px-6 max-md:py-14">
      <div className="mx-auto max-w-6xl">
        <h2 className="mb-10 font-serif text-[clamp(2rem,3.5vw,3rem)] font-bold text-ink">{c.howTitle}</h2>
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
  );
}

export function SafetyStrip() {
  const c = useCopy();
  const live = isGroupPageAvailable("safety", import.meta.env.PROD);
  return (
    <section className="bg-parchment px-16 py-12 max-md:px-6">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 border-l-2 border-gold pl-6">
        <p className="font-serif text-xl text-ink">{c.safety}</p>
        {live && (
          <a href={localePath("/safety", currentLocale())} className="text-[0.72rem] font-semibold uppercase tracking-[0.16em] text-gold hover:underline">{c.safetyLink} →</a>
        )}
      </div>
    </section>
  );
}

export function LocalPartnerBlock() {
  return <LocalPartnerRio />;
}

export function FinalCta() {
  const c = useCopy();
  const locale = currentLocale();
  return (
    <section className="bg-ink px-16 py-24 text-center max-md:px-6 max-md:py-16">
      <h2 className="mx-auto max-w-3xl font-serif text-[clamp(2rem,3.5vw,3rem)] font-bold leading-tight text-parchment">{c.finalTitle}</h2>
      <div className="mt-10 flex flex-wrap justify-center gap-4">
        <a href={GROUP_INTAKE_URL} {...ext} className={btnGold}>{c.proposal}</a>
        <a href={CALENDLY_URL} {...ext} className={btnOutline}>{c.finalCall}</a>
      </div>
      <a href={localePath("/private-travel", locale)} className="mt-12 inline-block text-sm text-parchment/75 underline underline-offset-4 hover:text-parchment">
        {c.privateLink}
      </a>
    </section>
  );
}
