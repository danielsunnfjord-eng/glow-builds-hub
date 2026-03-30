import ScrollReveal from "./ScrollReveal";

const scrollToId = (id: string) => {
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
};

const TwoWays = () => {
  return (
    <section className="py-28 px-16 bg-voyage-white max-md:px-6 max-md:py-16" id="two-ways">
      <ScrollReveal>
        <div className="text-[0.65rem] font-semibold tracking-[0.22em] uppercase text-gold mb-3">How we work</div>
      </ScrollReveal>
      <ScrollReveal>
        <h2 className="font-serif text-[clamp(2rem,3.5vw,3rem)] font-bold leading-[1.05] tracking-tight mb-4">
          Two ways to<br /><em className="italic font-normal">travel with us</em>
        </h2>
      </ScrollReveal>
      <ScrollReveal>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-px mt-16 bg-parchment-3">
          {/* Self-book card */}
          <div className="bg-voyage-white p-14 max-md:p-8 relative overflow-hidden group hover:-translate-y-1 transition-transform">
            <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-sage scale-x-0 origin-left group-hover:scale-x-100 transition-transform duration-400" />
            <div className="font-serif text-[5rem] font-bold text-parchment-2 leading-none mb-6">01</div>
            <span className="inline-block px-3 py-1.5 rounded-full text-[0.62rem] font-semibold tracking-[0.12em] uppercase mb-4 bg-sage/10 text-sage border border-sage/30">Self-Book</span>
            <h3 className="font-serif text-[1.7rem] font-bold tracking-tight mb-3">Book it yourself</h3>
            <p className="text-[0.88rem] text-voyage-muted leading-relaxed mb-6">Search hundreds of airlines, hotels, and experiences in one place. Find the best price, click, and you're booked — instantly.</p>
            <div className="flex flex-col gap-2.5 mb-8">
              {["Real-time prices from top providers", "Flights, hotels, activities & car hire", "Instant confirmation, no middleman", "No booking fees from us"].map((f) => (
                <div key={f} className="flex items-center gap-3 text-[0.82rem] text-ink-2">
                  <div className="w-4 h-4 rounded-full bg-sage/15 text-sage flex items-center justify-center text-[0.6rem] shrink-0">✓</div>
                  {f}
                </div>
              ))}
            </div>
            <button onClick={() => scrollToId("self-book")} className="inline-flex items-center gap-2 text-[0.75rem] font-semibold tracking-[0.1em] uppercase text-sage hover:gap-3 transition-all">
              Start searching →
            </button>
          </div>

          {/* Curated card */}
          <div className="bg-voyage-white p-14 max-md:p-8 relative overflow-hidden group hover:-translate-y-1 transition-transform">
            <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-gold scale-x-0 origin-left group-hover:scale-x-100 transition-transform duration-400" />
            <div className="font-serif text-[5rem] font-bold text-parchment-2 leading-none mb-6">02</div>
            <span className="inline-block px-3 py-1.5 rounded-full text-[0.62rem] font-semibold tracking-[0.12em] uppercase mb-4 bg-gold/10 text-gold border border-gold/30">Curated by Us</span>
            <h3 className="font-serif text-[1.7rem] font-bold tracking-tight mb-3">Let us design it</h3>
            <p className="text-[0.88rem] text-voyage-muted leading-relaxed mb-6">Tell us where you dream of going. We research, plan and book everything — from hidden-gem hotels to private local experiences.</p>
            <div className="flex flex-col gap-2.5 mb-8">
              {["Personally crafted itinerary", "Exclusive hotel perks & upgrades", "Price drop protection on your booking", "Real human support throughout your trip"].map((f) => (
                <div key={f} className="flex items-center gap-3 text-[0.82rem] text-ink-2">
                  <div className="w-4 h-4 rounded-full bg-gold/15 text-gold flex items-center justify-center text-[0.6rem] shrink-0">✓</div>
                  {f}
                </div>
              ))}
            </div>
            <button onClick={() => scrollToId("enquiry")} className="inline-flex items-center gap-2 text-[0.75rem] font-semibold tracking-[0.1em] uppercase text-gold hover:gap-3 transition-all">
              Request a quote →
            </button>
          </div>
        </div>
      </ScrollReveal>
    </section>
  );
};

export default TwoWays;
