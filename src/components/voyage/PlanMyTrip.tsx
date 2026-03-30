import { useCallback, useState } from "react";
import ScrollReveal from "./ScrollReveal";
import planTripImg from "@/assets/plan-trip-card.jpg";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

const PlanMyTrip = () => {
  const [open, setOpen] = useState(false);

  const formCallback = useCallback((node: HTMLDivElement | null) => {
    if (!node || node.querySelector('iframe')) return;

    const iframe = document.createElement('iframe');
    iframe.style.border = 'none';
    iframe.style.width = '100%';
    iframe.style.minHeight = '1200px';
    iframe.id = 'client-intake-form-fh1ldh';
    iframe.src = 'https://opnform.com/forms/client-intake-form-fh1ldh';
    node.appendChild(iframe);

    const script = document.createElement('script');
    script.src = 'https://opnform.com/widgets/iframe.min.js';
    script.onload = () => {
      if (typeof (window as any).initEmbed === 'function') {
        (window as any).initEmbed('client-intake-form-fh1ldh', { autoResize: true });
      }
    };
    node.appendChild(script);
  }, []);

  return (
    <>
      <section className="py-28 px-16 bg-background max-md:px-6 max-md:py-16" id="enquiry">
        <div className="max-w-2xl mx-auto">
          <ScrollReveal>
            <h2 className="font-serif text-[clamp(2rem,3.5vw,3rem)] font-bold leading-[1.05] tracking-tight mb-2 text-foreground text-center">
              Plan my trip
            </h2>
          </ScrollReveal>
          <ScrollReveal>
            <p className="text-[0.92rem] text-muted-foreground leading-relaxed mb-10 text-center">
              Tell us what you're dreaming of. We'll be in touch within 24 hours.
            </p>
          </ScrollReveal>
          <ScrollReveal>
            <button
              onClick={() => setOpen(true)}
              className="group block w-full overflow-hidden rounded-xl border border-border shadow-md hover:shadow-xl transition-all duration-300 bg-card cursor-pointer text-left"
            >
              <div className="relative aspect-[16/9] overflow-hidden">
                <img
                  src={planTripImg}
                  alt="Plan your curated trip"
                  loading="lazy"
                  width={1024}
                  height={640}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                <div className="absolute bottom-4 left-5 right-5">
                  <span className="font-serif text-lg font-bold text-white">
                    Start planning your journey →
                  </span>
                </div>
              </div>
              <div className="p-5">
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Click to fill out our quick intake form and a travel advisor will craft a personalised itinerary just for you.
                </p>
              </div>
            </button>
          </ScrollReveal>
        </div>
      </section>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-serif text-xl">Plan my trip</DialogTitle>
            <DialogDescription>
              Fill out the form below and we'll be in touch within 24 hours.
            </DialogDescription>
          </DialogHeader>
          <div ref={formCallback} className="w-full min-h-[400px]" />
        </DialogContent>
      </Dialog>
    </>
  );
};

export default PlanMyTrip;
