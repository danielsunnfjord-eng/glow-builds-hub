import ScrollReveal from "./ScrollReveal";

const testimonials = [
  { text: "We described a loose idea — 'Japan but not the obvious bits' — and got back the most extraordinary two-week itinerary. Every detail was perfect.", author: "Sarah & Tom W.", dest: "Japan, 3 weeks" },
  { text: "I book my own flights but always use the curated service for hotels. The upgrade at our anniversary hotel was completely unexpected and magical.", author: "Claire M.", dest: "Amalfi Coast, Italy" },
  { text: "When our connecting flight was cancelled they had us rebooked and in a hotel within the hour. I've never had that kind of support from any travel site.", author: "James R.", dest: "South Africa safari" },
];

const Testimonials = () => (
  <section className="py-28 px-16 bg-parchment-2 max-md:px-6 max-md:py-16">
    <ScrollReveal>
      <div className="text-[0.65rem] font-semibold tracking-[0.22em] uppercase text-gold mb-3">What clients say</div>
    </ScrollReveal>
    <ScrollReveal>
      <h2 className="font-serif text-[clamp(2rem,3.5vw,3rem)] font-bold leading-[1.05] tracking-tight mb-4">
        Trips people<br /><em className="italic font-normal">still talk about</em>
      </h2>
    </ScrollReveal>
    <ScrollReveal>
      <div className="grid grid-cols-3 max-md:grid-cols-1 gap-6 mt-16">
        {testimonials.map((t) => (
          <div key={t.author} className="p-8 bg-voyage-white rounded-lg border border-parchment-3">
            <div className="text-gold text-[0.8rem] tracking-wider mb-4">★★★★★</div>
            <p className="text-[0.85rem] text-ink-2 leading-relaxed italic mb-5">"{t.text}"</p>
            <div className="text-[0.72rem] font-semibold tracking-[0.08em] uppercase text-voyage-muted">{t.author}</div>
            <div className="text-[0.7rem] text-gold mt-1">{t.dest}</div>
          </div>
        ))}
      </div>
    </ScrollReveal>
  </section>
);

export default Testimonials;
