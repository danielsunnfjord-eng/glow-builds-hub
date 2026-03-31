import { useState } from "react";
import ScrollReveal from "./ScrollReveal";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const itineraries = [
  {
    title: "Rio Flow Experience — Surf. Move. Live.",
    location: "Rio de Janeiro, Brazil",
    duration: "10 Days",
    image: "https://media.fora.travel/foratravelportal/image/upload/c_limit,w_1600/f_auto/q_auto/v1/64947bea-5a0e-49a2-a2c4-63b4562dabb4?_a=BAVAZGID0",
    url: "https://trips.foratravel.com/i/0mksXRyeML",
  },
  {
    title: "Fjord & Waves — Norway Surf & Fjord Experience",
    location: "Nordfjord, Norway",
    duration: "6 Days",
    image: "https://media.fora.travel/foratravelportal/image/upload/c_limit,w_1600/f_auto/q_auto/v1/736dbd04-9878-47d8-92b7-ca0f931a2e3e?_a=BAVAZGID0",
    url: "https://trips.foratravel.com/i/Ui0sRK66Lf",
  },
];

const ItineraryExamples = () => {
  const [selectedTrip, setSelectedTrip] = useState<typeof itineraries[0] | null>(null);

  return (
    <>
      <section className="py-28 px-16 bg-parchment max-md:px-6 max-md:py-16" id="itineraries">
        <ScrollReveal>
          <div className="text-[0.65rem] font-semibold tracking-[0.22em] uppercase text-gold mb-3">
            Inspiration
          </div>
        </ScrollReveal>
        <ScrollReveal>
          <h2 className="font-serif text-[clamp(2rem,3.5vw,3rem)] font-bold leading-[1.05] tracking-tight mb-4 text-ink">
            Sample itineraries
          </h2>
        </ScrollReveal>
        <ScrollReveal>
          <p className="text-[0.92rem] text-voyage-muted max-w-[520px] leading-relaxed mb-14">
            Every trip is custom — but here's a taste of what I've crafted for past travellers.
          </p>
        </ScrollReveal>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl">
          {itineraries.map((trip) => (
            <ScrollReveal key={trip.url}>
              <button
                onClick={() => setSelectedTrip(trip)}
                className="group block w-full rounded-lg overflow-hidden border border-ink/[0.06] bg-voyage-white shadow-sm hover:shadow-lg transition-shadow text-left cursor-pointer"
              >
                <div className="aspect-[16/10] overflow-hidden">
                  <img
                    src={trip.image}
                    alt={trip.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    loading="lazy"
                  />
                </div>
                <div className="p-6">
                  <h3 className="font-serif text-[1.1rem] font-bold text-ink mb-1.5 group-hover:text-gold transition-colors">
                    {trip.title}
                  </h3>
                  <p className="text-[0.8rem] text-voyage-muted">
                    {trip.location} · {trip.duration}
                  </p>
                </div>
              </button>
            </ScrollReveal>
          ))}
        </div>
      </section>

      <Dialog open={!!selectedTrip} onOpenChange={(open) => !open && setSelectedTrip(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden p-0">
          <DialogHeader className="p-4 pb-0">
            <DialogTitle className="font-serif text-xl">
              {selectedTrip?.title}
            </DialogTitle>
          </DialogHeader>
          <iframe
            src={selectedTrip?.url}
            className="w-full border-none"
            style={{ height: 'calc(90vh - 80px)' }}
            title={selectedTrip?.title}
          />
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ItineraryExamples;