import ScrollReveal from "./ScrollReveal";

const pricingData = [
  { group: "1–2 people", duration: "Up to 7 days", price: "€225" },
  { group: "1–2 people", duration: "8–14 days", price: "€275" },
  { group: "3–5 people", duration: "Any duration", price: "€225" },
  { group: "6+ people", duration: "Any duration", price: "€425" },
];

const Pricing = () => {
  return (
    <section className="py-28 px-16 bg-background max-md:px-6 max-md:py-16" id="pricing">
      <div className="max-w-3xl mx-auto">
        <ScrollReveal>
          <div className="text-[0.65rem] font-semibold tracking-[0.22em] uppercase text-muted-foreground mb-3 text-center">
            Pricing
          </div>
        </ScrollReveal>
        <ScrollReveal>
          <h2 className="font-serif text-[clamp(2rem,3.5vw,3rem)] font-bold leading-[1.05] tracking-tight mb-4 text-foreground text-center">
            Your trip, <em className="italic font-normal text-muted-foreground">planned with care</em>
          </h2>
        </ScrollReveal>
        <ScrollReveal>
          <p className="text-[0.92rem] text-muted-foreground max-w-[560px] mx-auto leading-relaxed text-center mb-12">
            In a one-to-one call, we listen first. Then we design a clear, day-by-day plan that fits you. We make sure the journey flows, makes sense, and comes with the right tips, tools, and local insight to travel well. Our pricing depends on group size and trip length.
          </p>
        </ScrollReveal>

        <ScrollReveal>
          <div className="overflow-hidden rounded-lg border border-border">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-secondary">
                  <th className="text-left py-3.5 px-5 font-semibold text-foreground text-[0.82rem]">Group Size</th>
                  <th className="text-left py-3.5 px-5 font-semibold text-foreground text-[0.82rem]">Duration</th>
                  <th className="text-right py-3.5 px-5 font-semibold text-foreground text-[0.82rem]">Price</th>
                </tr>
              </thead>
              <tbody>
                {pricingData.map((row, i) => (
                  <tr
                    key={i}
                    className="border-t border-border hover:bg-secondary/50 transition-colors"
                  >
                    <td className="py-3.5 px-5 text-foreground text-[0.85rem]">{row.group}</td>
                    <td className="py-3.5 px-5 text-muted-foreground text-[0.85rem]">{row.duration}</td>
                    <td className="py-3.5 px-5 text-right font-semibold text-foreground text-[0.85rem]">{row.price}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </ScrollReveal>

        <ScrollReveal>
          <p className="text-[0.8rem] text-muted-foreground mt-5 text-center leading-relaxed">
            The price includes the consultation and delivery of the itinerary.<br />
            We do not make bookings for you in this service, but we can do it by request and for an additional fee.
          </p>
        </ScrollReveal>
      </div>
    </section>
  );
};

export default Pricing;
