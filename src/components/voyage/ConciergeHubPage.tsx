import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import Navbar from "./Navbar";
import Footer from "./Footer";
import { currentLocale, localePath } from "@/lib/locale";
import { CONCIERGE_COPY, GROUP_ENTRIES, START_CHOICES } from "@/lib/conciergeCopy";
import { CALENDLY_URL, GROUP_INTAKE_URL, navigationCopy } from "@/lib/travelNavigation";
import { WHATSAPP_URL } from "@/lib/whatsapp";
import { HOME_COPY } from "./home/homeCopy";
import cristo from "@/assets/home/cristo_redentor.jpg.asset.json";
import surf from "@/assets/home/pedra_do_arpoador.jpg.asset.json";

const ext = { target: "_blank", rel: "noopener noreferrer" } as const;
export default function ConciergeHubPage({ page }: { page: "groups" | "start" | "trips" }) {
  const locale = currentLocale();
  const c = CONCIERGE_COPY[locale];
  const choices = page === "groups" ? GROUP_ENTRIES.map((entry) => ({ ...entry, external: false })) : page === "start" ? START_CHOICES : [];
  return (
    <>
      <Navbar />
      <main className="min-h-[75vh] bg-parchment px-16 pb-24 pt-56 max-md:px-6 max-md:pt-32">
        <div className="mx-auto max-w-6xl">
          <h1 className="max-w-4xl font-serif text-4xl font-bold leading-tight text-ink md:text-5xl">{c[page]}</h1>
          {page !== "start" && <p className="mt-6 max-w-2xl text-lg leading-relaxed text-ink-2">{page === "groups" ? c.intro : c.themeIntro}</p>}
          <div className={`mt-12 grid gap-6 ${page === "start" ? "lg:grid-cols-3" : "md:grid-cols-2"}`}>
            {choices.map((choice, n) => (
              <a key={choice.key} href={choice.external ? choice.href : localePath(choice.href, locale)} {...(choice.external ? ext : {})} className="group flex h-full flex-col overflow-hidden rounded-lg border border-parchment-3 bg-voyage-white text-ink transition hover:shadow-elegant focus-visible:outline focus-visible:outline-ring">
                {page === "groups" && <img src={n === 0 ? cristo.url : surf.url} alt={c[choice.key]} className="aspect-[2/1] w-full object-cover" loading="lazy" />}
                <div className="flex flex-1 flex-col p-8">
                  <h2 className="font-serif text-2xl font-bold leading-snug">{c[choice.key]}</h2>
                  <span className="mt-auto flex items-center gap-2 pt-8 text-sm font-semibold text-gold">{HOME_COPY[locale].explore}<ArrowRight aria-hidden size={18} /></span>
                </div>
              </a>
            ))}
          </div>
          {page === "groups" && <Button asChild className="mt-10 h-auto whitespace-normal rounded-sm bg-gold px-7 py-4 text-ink hover:bg-gold-2"><a href={GROUP_INTAKE_URL} {...ext}>{navigationCopy[locale].proposal}</a></Button>}
          {page === "start" && <div className="mt-10 flex flex-wrap gap-6 text-sm text-ink-2">
            <Button asChild variant="link" className="h-auto whitespace-normal p-0"><a href={CALENDLY_URL} {...ext}>{HOME_COPY[locale].call}</a></Button>
            <Button asChild variant="link" className="h-auto whitespace-normal p-0"><a href={WHATSAPP_URL} {...ext}>{HOME_COPY[locale].whatsapp}</a></Button>
          </div>}
          {page === "trips" && <img src={surf.url} alt={c.trips} className="mt-4 aspect-[2/1] max-h-[420px] w-full object-cover" />}
          {/* CONTENT PLACEHOLDER: themed departure dates, programs and interest-registration destination await owner-supplied details. */}
        </div>
      </main>
      <Footer />
    </>
  );
}