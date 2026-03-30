import { useCallback } from "react";
import ScrollReveal from "./ScrollReveal";
import { toast } from "sonner";

const perks = [
  { icon: "🏨", title: "Hotel perks you can't book yourself", desc: "We access exclusive rates and perks — room upgrades, breakfast, early check-in — not available when booking direct." },
  { icon: "📉", title: "We watch your prices for you", desc: "If a hotel rate drops after you book, we catch it and rebook you at the lower price. Automatically." },
  { icon: "🗺️", title: "Experiences that make the trip", desc: "We source the private tours, local dinners and off-the-beaten-path adventures that make your trip unforgettable." },
  { icon: "📞", title: "A real person, always reachable", desc: "Before, during and after your trip. If anything changes or goes wrong, we handle it — not a call centre." },
];

const travelStyles = ["Luxury", "Adventure", "Cultural", "Relaxation", "Foodie", "Off the beaten path", "Honeymoon", "Family-friendly"];

const CuratedSection = () => {
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
    <section className="py-28 px-16 bg-ink text-voyage-white max-md:px-6 max-md:py-16" id="curated">
      <ScrollReveal>
        <div className="text-[0.65rem] font-semibold tracking-[0.22em] uppercase text-gold mb-3">Curated · Tailored · Personal</div>
      </ScrollReveal>
      <ScrollReveal>
        <h2 className="font-serif text-[clamp(2rem,3.5vw,3rem)] font-bold leading-[1.05] tracking-tight mb-4 text-voyage-white">
          A journey built<br /><em className="italic font-normal text-gold-2">entirely for you</em>
        </h2>
      </ScrollReveal>
      <ScrollReveal>
        <p className="text-[0.92rem] text-voyage-white/50 max-w-[480px] leading-relaxed">No two trips we plan are the same. We take the time to understand exactly what you want — then make it happen.</p>
      </ScrollReveal>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.2fr] gap-20 mt-16 items-start">
        <ScrollReveal>
          <div className="flex flex-col gap-5">
            {perks.map((p) => (
              <div key={p.title} className="flex gap-4 items-start p-5 border border-voyage-white/[0.06] rounded-lg bg-voyage-white/[0.03] hover:border-gold/30 transition-colors">
                <span className="text-[1.4rem] shrink-0 mt-0.5">{p.icon}</span>
                <div>
                  <h4 className="text-[0.85rem] font-semibold text-voyage-white mb-1">{p.title}</h4>
                  <p className="text-[0.78rem] text-voyage-white/45 leading-relaxed">{p.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </ScrollReveal>

        <ScrollReveal>
          <div className="bg-parchment rounded-lg p-10 text-ink" id="enquiry">
            <h3 className="font-serif text-[1.4rem] font-bold mb-1.5">Plan my trip</h3>
            <p className="text-[0.82rem] text-voyage-muted mb-7 leading-relaxed">Tell us what you're dreaming of. We'll be in touch within 24 hours.</p>
            <div ref={formCallback} className="w-full min-h-[400px]" />
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
};

export default CuratedSection;
