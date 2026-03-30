import ScrollReveal from "./ScrollReveal";

const perks = [
  { icon: "🏨", title: "Hotel perks you can't book yourself", desc: "I access exclusive rates and perks — room upgrades, breakfast, early check-in — not available when booking direct." },
  { icon: "🗺️", title: "Experiences that make the trip", desc: "I source the private tours, local dinners and off-the-beaten-path adventures that make your trip unforgettable." },
  { icon: "📞", title: "A real person, always reachable", desc: "Before, during and after your trip. If anything changes or goes wrong, I handle it — not a call centre." },
];

const CuratedSection = () => {
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
        <p className="text-[0.92rem] text-voyage-white/50 max-w-[480px] leading-relaxed">No two trips I plan are the same. I take the time to understand exactly what you want — then make it happen.</p>
      </ScrollReveal>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 mt-16 items-start">
        <ScrollReveal>
          <div className="border border-voyage-white/[0.06] rounded-lg bg-voyage-white/[0.03] p-6">
            <h3 className="font-serif text-[1.15rem] font-bold text-voyage-white mb-3">What does your travel advisor do?</h3>
            <p className="text-[0.82rem] text-voyage-white/50 leading-relaxed mb-3">
              I work with you to understand your vacation needs and handle all the travel arrangements — from booking a hotel for a long weekend to planning a honeymoon.
            </p>
            <p className="text-[0.82rem] text-voyage-white/50 leading-relaxed">
              I take the time to learn your preferences and narrow down your destination and accommodation options to find the best fit. As a Fora Travel advisor, IATA accredited, my job is to make sure your next trip is precisely tailored to your taste, vacation style and budget.
            </p>
          </div>
        </ScrollReveal>

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
      </div>
    </section>
  );
};

export default CuratedSection;