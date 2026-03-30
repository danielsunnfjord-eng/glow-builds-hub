import { useCallback } from "react";
import ScrollReveal from "./ScrollReveal";

const PlanMyTrip = () => {
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
    <section className="py-28 px-16 bg-parchment max-md:px-6 max-md:py-16" id="enquiry">
      <div className="max-w-3xl mx-auto">
        <ScrollReveal>
          <h2 className="font-serif text-[clamp(2rem,3.5vw,3rem)] font-bold leading-[1.05] tracking-tight mb-2 text-ink text-center">
            Plan my trip
          </h2>
        </ScrollReveal>
        <ScrollReveal>
          <p className="text-[0.92rem] text-voyage-muted leading-relaxed mb-10 text-center">
            Tell us what you're dreaming of. We'll be in touch within 24 hours.
          </p>
        </ScrollReveal>
        <ScrollReveal>
          <div ref={formCallback} className="w-full min-h-[400px]" />
        </ScrollReveal>
      </div>
    </section>
  );
};

export default PlanMyTrip;
