import Navbar from "./Navbar";
import Footer from "./Footer";
import { Button } from "@/components/ui/button";
import { currentLocale } from "@/lib/locale";
import { CRUISE_COPY } from "@/lib/cruises";
import { PRIVATE_INTAKE_URL } from "@/lib/travelNavigation";
import cruisePhoto from "@/assets/cruises/cruise-fjord.jpg.asset.json";

function CruiseRequest({ label }: { label: string }) {
  return <Button asChild className="h-auto min-h-12 whitespace-normal rounded-sm px-6 py-3 text-center"><a href={PRIVATE_INTAKE_URL} target="_blank" rel="noopener noreferrer">{label}</a></Button>;
}

export default function CruisesPage() {
  const c = CRUISE_COPY[currentLocale()];
  return (
    <div>
      <Navbar />
      <main>
        <figure>
          <section className="relative flex min-h-[620px] items-start bg-parchment px-6 pb-12 pt-32 md:min-h-[720px] md:px-16 md:pt-52">
            <img src={cruisePhoto.url} alt={c.alt} fetchPriority="high" className="absolute inset-0 h-full w-full object-cover object-center" />
            <div className="absolute inset-0 bg-parchment/30" />
            <div className="relative mx-auto w-full max-w-6xl text-ink">
              <h1 className="font-serif text-5xl font-bold leading-tight md:text-6xl">{c.title}</h1>
              <p className="mt-3 max-w-lg text-lg font-medium leading-relaxed">{c.subtitle}</p>
              <div className="mt-6"><CruiseRequest label={c.request} /></div>
            </div>
          </section>
          <figcaption className="bg-parchment px-6 py-3 text-xs text-voyage-muted md:px-16">{c.credit}</figcaption>
        </figure>
        <section className="bg-parchment px-6 py-12 md:px-16 md:py-16">
          <div className="mx-auto max-w-3xl text-ink">
            <p className="leading-relaxed">{c.intro}</p>
            <ul className="my-7 list-disc space-y-3 pl-5 marker:text-sage">{c.perks.map(perk => <li key={perk}>{perk}</li>)}</ul>
            <p className="mb-7 leading-relaxed">{c.body}</p>
            <CruiseRequest label={c.request} />
          </div>
        </section>
        <section className="bg-parchment-2 px-6 py-12 md:px-16 md:py-16">
          <div className="mx-auto max-w-6xl">
            <h2 className="font-serif text-3xl font-bold text-ink">{c.how}</h2>
            <ol className="mt-8 grid gap-8 md:grid-cols-3">{c.steps.map((step, index) => <li key={step} className="border-t border-sage/40 pt-4"><span className="font-serif text-3xl text-sage">{index + 1}</span><p className="mt-2 text-sm leading-relaxed text-ink">{step}</p></li>)}</ol>
            <p className="mt-10 text-xs leading-relaxed text-voyage-muted">{c.fine}</p>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}