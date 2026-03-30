import ScrollReveal from "./ScrollReveal";

const experiences = [
  { icon: "✈️", title: "Flights", desc: "Economy to first class. One-way, return, multi-city. We find the route that works." },
  { icon: "🏨", title: "Accommodation", desc: "Boutique hotels, villas, safari lodges, city apartments. Matched to your style." },
  { icon: "🎭", title: "Activities", desc: "Private tours, cooking classes, local guides, sunset cruises. The experiences that make a trip." },
  { icon: "🚗", title: "Transfers", desc: "Airport pickups, private drivers, car hire. Seamlessly built into your itinerary." },
  { icon: "🛳️", title: "Cruises", desc: "River cruises, ocean voyages, luxury yachts. We find the sailing that suits you." },
  { icon: "🛡️", title: "Travel Insurance", desc: "Comprehensive coverage tailored to your trip — so you travel with complete peace of mind." },
  { icon: "🍷", title: "Dining", desc: "Restaurant reservations, private chef experiences, wine tours, food markets." },
  { icon: "🌿", title: "Wellness", desc: "Spa retreats, yoga getaways, detox escapes. Rest and restore wherever you are." },
];

const ExperiencesStrip = () => (
  <section className="py-28 px-16 bg-voyage-white max-md:px-6 max-md:py-16" id="experiences">
    <ScrollReveal>
      <div className="text-[0.65rem] font-semibold tracking-[0.22em] uppercase text-gold mb-3">What we can arrange</div>
    </ScrollReveal>
    <ScrollReveal>
      <h2 className="font-serif text-[clamp(2rem,3.5vw,3rem)] font-bold leading-[1.05] tracking-tight mb-4">
        Everything from<br /><em className="italic font-normal">flights to experiences</em>
      </h2>
    </ScrollReveal>
    <ScrollReveal>
      <div className="grid grid-cols-4 max-md:grid-cols-1 gap-px bg-parchment-3 mt-16 rounded-lg overflow-hidden">
        {experiences.map((e) => (
          <div key={e.title} className="bg-voyage-white p-8 max-md:p-6 hover:bg-parchment hover:-translate-y-1 hover:shadow-[var(--shadow-elegant)] transition-all cursor-default relative z-0 hover:z-10">
            <span className="text-[2rem] mb-4 block">{e.icon}</span>
            <h4 className="font-serif text-base font-bold mb-1.5">{e.title}</h4>
            <p className="text-[0.78rem] text-voyage-muted leading-relaxed">{e.desc}</p>
          </div>
        ))}
      </div>
    </ScrollReveal>
  </section>
);

export default ExperiencesStrip;
