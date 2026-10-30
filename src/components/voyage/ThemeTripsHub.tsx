import { ArrowRight } from "lucide-react";
import Navbar from "./Navbar";
import Footer from "./Footer";
import { NumberedSteps } from "./GroupBlocks";
import { currentLocale, localePath } from "@/lib/locale";
import { THEME_COPY, THEME_TRIPS } from "@/lib/themeTrips";
import { CALENDLY_URL, GROUP_INTAKE_URL, navigationCopy } from "@/lib/travelNavigation";
import { HOME_COPY } from "./home/homeCopy";
import surf from "@/assets/home/pedra_do_arpoador.jpg.asset.json";
import fjord from "@/assets/home/sunset_sukkertooppen.jpg.asset.json";
import beach from "@/assets/home/praia_do_flamengo.jpg.asset.json";

const ext = { target: "_blank", rel: "noopener noreferrer" } as const;
const CARD_IMAGES = [surf.url, fjord.url, beach.url];

/** Status tag shown on every trip card and trip page. */
export function StatusTag({ label }: { label: string }) {
  return (
    <span className="inline-flex w-fit items-center rounded-full border border-gold/40 bg-gold/10 px-3 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.18em] text-gold">
      {label}
    </span>
  );
}

export default function ThemeTripsHub() {
  const locale = currentLocale();
  const c = THEME_COPY[locale];
  return (
    <>
      <Navbar />
      <main className="min-h-[75vh] bg-parchment px-16 pb-24 pt-56 max-md:px-6 max-md:pt-32">
        <div className="mx-auto max-w-6xl">
          <h1 className="max-w-4xl font-serif text-4xl font-bold leading-tight text-ink md:text-5xl">{c.hubTitle}</h1>
          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-ink-2">{c.hubIntro}</p>

          <section className="mt-14">
            <h2 className="font-serif text-3xl font-bold text-ink">{c.howTitle}</h2>
            <div className="mt-8">
              <NumberedSteps steps={c.howSteps} />
            </div>
          </section>

          <div className="mt-16 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {THEME_TRIPS.map((trip, n) => {
              const t = trip.copy[locale];
              return (
                <a
                  key={trip.slug}
                  href={localePath(`/trips/${trip.slug}`, locale)}
                  className="group flex h-full flex-col overflow-hidden rounded-lg border border-parchment-3 bg-voyage-white text-ink transition hover:shadow-elegant focus-visible:outline focus-visible:outline-ring"
                >
                  <img src={CARD_IMAGES[n]} alt={t.title} className="aspect-[2/1] w-full object-cover" loading="lazy" />
                  <div className="flex flex-1 flex-col p-7">
                    <StatusTag label={c.statusTag} />
                    <h2 className="mt-4 font-serif text-2xl font-bold leading-snug">{t.title}</h2>
                    <p className="mt-2 text-sm text-ink-2">
                      {t.duration} · {t.destination}
                    </p>
                    <p className="mt-4 text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-voyage-muted">{c.periodsLabel}</p>
                    <ul className="mt-2 space-y-1 text-sm leading-relaxed text-ink-2">
                      {t.periods.map((period) => (
                        <li key={period}>{period}</li>
                      ))}
                    </ul>
                    <span className="mt-auto flex items-center gap-2 pt-6 text-sm font-semibold text-gold">
                      {HOME_COPY[locale].explore}
                      <ArrowRight aria-hidden size={18} />
                    </span>
                  </div>
                </a>
              );
            })}
          </div>

          <div className="mt-12 flex flex-col gap-4 text-sm text-ink-2">
            <a href={GROUP_INTAKE_URL} {...ext} className="font-semibold text-gold underline-offset-4 hover:underline">
              {c.ownGroup}
            </a>
            <a href={CALENDLY_URL} {...ext} className="font-semibold text-gold underline-offset-4 hover:underline">
              {c.ownTheme}
            </a>
          </div>
          {/* Kept for shared navigation copy: proposal label */}
          <span className="hidden">{navigationCopy[locale].proposal}</span>
        </div>
      </main>
      <Footer />
    </>
  );
}
