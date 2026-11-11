import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "@/lib/router-compat";
import { currentLocale } from "@/lib/locale";
import { CRUISE_COPY } from "@/lib/cruises";

export default function CruiseBand() {
  const c = CRUISE_COPY[currentLocale()];
  return (
    <section className="border-y border-border bg-parchment px-6 py-8 md:px-16">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-5">
        <div className="text-ink">
          <h2 className="font-serif text-2xl font-semibold">{c.title}</h2>
          <p className="mt-1 text-sm leading-relaxed text-voyage-muted">{c.subtitle}</p>
        </div>
        <Button asChild variant="outline" className="h-auto whitespace-normal rounded-sm border-sage/40 bg-transparent px-5 py-3 text-ink">
          <Link to="/cruises">{c.learn}<ArrowRight className="size-4" aria-hidden /></Link>
        </Button>
      </div>
    </section>
  );
}