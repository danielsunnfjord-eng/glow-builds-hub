import { useState } from "react";
import ScrollReveal from "./ScrollReveal";
import { toast } from "sonner";

const perks = [
  { icon: "🏨", title: "Hotels you won't find on Google", desc: "We access exclusive rates and perks — room upgrades, breakfast, early check-in — not available when booking direct." },
  { icon: "📉", title: "We watch your prices for you", desc: "If a hotel rate drops after you book, we catch it and rebook you at the lower price. Automatically." },
  { icon: "🗺️", title: "Experiences that make the trip", desc: "We source the private tours, local dinners and off-the-beaten-path adventures that make your trip unforgettable." },
  { icon: "📞", title: "A real person, always reachable", desc: "Before, during and after your trip. If anything changes or goes wrong, we handle it — not a call centre." },
];

const travelStyles = ["Luxury", "Adventure", "Cultural", "Relaxation", "Foodie", "Off the beaten path", "Honeymoon", "Family-friendly"];

const CuratedSection = () => {
  const [selectedStyles, setSelectedStyles] = useState<string[]>([]);

  const toggleStyle = (style: string) => {
    setSelectedStyles((prev) =>
      prev.includes(style) ? prev.filter((s) => s !== style) : [...prev, style]
    );
  };

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
            <div className="flex flex-col gap-3.5">
              <div className="grid grid-cols-2 gap-3.5 max-md:grid-cols-1">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[0.6rem] font-semibold tracking-[0.12em] uppercase text-voyage-muted">Name</label>
                  <input className="px-4 py-3 bg-voyage-white border-[1.5px] border-parchment-3 rounded-lg font-sans text-[0.85rem] text-ink outline-none focus:border-gold transition-colors placeholder:text-parchment-3" placeholder="Your name" />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[0.6rem] font-semibold tracking-[0.12em] uppercase text-voyage-muted">Email</label>
                  <input type="email" className="px-4 py-3 bg-voyage-white border-[1.5px] border-parchment-3 rounded-lg font-sans text-[0.85rem] text-ink outline-none focus:border-gold transition-colors placeholder:text-parchment-3" placeholder="your@email.com" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3.5 max-md:grid-cols-1">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[0.6rem] font-semibold tracking-[0.12em] uppercase text-voyage-muted">Destination</label>
                  <input className="px-4 py-3 bg-voyage-white border-[1.5px] border-parchment-3 rounded-lg font-sans text-[0.85rem] text-ink outline-none focus:border-gold transition-colors placeholder:text-parchment-3" placeholder="Where to? Or describe a vibe" />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[0.6rem] font-semibold tracking-[0.12em] uppercase text-voyage-muted">When</label>
                  <input className="px-4 py-3 bg-voyage-white border-[1.5px] border-parchment-3 rounded-lg font-sans text-[0.85rem] text-ink outline-none focus:border-gold transition-colors placeholder:text-parchment-3" placeholder="Dates or month, flexible?" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3.5 max-md:grid-cols-1">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[0.6rem] font-semibold tracking-[0.12em] uppercase text-voyage-muted">Travellers</label>
                  <select className="px-4 py-3 bg-voyage-white border-[1.5px] border-parchment-3 rounded-lg font-sans text-[0.85rem] text-ink outline-none focus:border-gold transition-colors appearance-none">
                    <option>Just me</option><option>Couple</option><option>Family with kids</option><option>Group of friends</option><option>Other</option>
                  </select>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[0.6rem] font-semibold tracking-[0.12em] uppercase text-voyage-muted">Budget (approx.)</label>
                  <select className="px-4 py-3 bg-voyage-white border-[1.5px] border-parchment-3 rounded-lg font-sans text-[0.85rem] text-ink outline-none focus:border-gold transition-colors appearance-none">
                    <option>Under £2,000</option><option>£2,000 – £5,000</option><option>£5,000 – £10,000</option><option>£10,000+</option><option>Flexible</option>
                  </select>
                </div>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[0.6rem] font-semibold tracking-[0.12em] uppercase text-voyage-muted">Travel style</label>
                <div className="flex gap-1.5 flex-wrap">
                  {travelStyles.map((s) => (
                    <button
                      key={s}
                      onClick={() => toggleStyle(s)}
                      className={`px-3.5 py-1.5 rounded-full border text-[0.7rem] font-medium transition-all ${
                        selectedStyles.includes(s)
                          ? "border-gold text-gold bg-gold/[0.08]"
                          : "border-parchment-3 text-voyage-muted hover:border-gold hover:text-gold hover:bg-gold/[0.08]"
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[0.6rem] font-semibold tracking-[0.12em] uppercase text-voyage-muted">Tell us more</label>
                <textarea className="px-4 py-3 bg-voyage-white border-[1.5px] border-parchment-3 rounded-lg font-sans text-[0.85rem] text-ink outline-none focus:border-gold transition-colors placeholder:text-parchment-3 h-[100px] resize-y" placeholder="Dream destinations, must-haves, special occasions, anything at all..." />
              </div>
              <button
                onClick={() => toast.success("✦ Enquiry sent! We'll reply within 24 hours.")}
                className="py-4 bg-gold text-ink font-bold text-[0.75rem] tracking-[0.12em] uppercase rounded-lg hover:bg-gold-2 hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(184,135,42,0.25)] transition-all"
              >
                Send my enquiry — we'll reply within 24 hrs
              </button>
            </div>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
};

export default CuratedSection;
