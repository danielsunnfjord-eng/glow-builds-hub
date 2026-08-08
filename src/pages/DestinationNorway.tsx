import { useNavigate } from "react-router-dom";
import { MapPin, Calendar, Compass, Sparkles } from "lucide-react";
import Navbar from "@/components/voyage/Navbar";
import Footer from "@/components/voyage/Footer";
import ScrollReveal from "@/components/voyage/ScrollReveal";
import Seo from "@/components/Seo";

const itinerary = [
  { day: "Day 1", title: "Arrival in Oslo", text: "Settle into a design hotel near Aker Brygge. Evening walk along the harbour and dinner at a New Nordic restaurant." },
  { day: "Day 2", title: "Oslo highlights", text: "The Vigeland sculpture park, the new Munch Museum and the Opera House rooftop. Late afternoon train to Myrdal." },
  { day: "Day 3", title: "Flåm & Nærøyfjord", text: "Ride the Flåm Railway down to the fjord, then a quiet electric cruise through UNESCO-listed Nærøyfjord to Gudvangen." },
  { day: "Day 4", title: "Bergen", text: "Stroll Bryggen's wooden wharf, ride the Fløibanen funicular, and eat your way through the fish market." },
  { day: "Day 5", title: "Fly to Lofoten", text: "Bergen → Bodø → Leknes. Check into a restored fisherman's rorbu in Reine with fjord and peak views." },
  { day: "Day 6", title: "Lofoten by sea & land", text: "Morning RIB safari among sea eagles, afternoon hike to Reinebringen, sunset sauna by the water." },
  { day: "Day 7", title: "Return", text: "Slow drive through Henningsvær, the world's most scenic football pitch, then fly home from Leknes via Oslo." },
];

const regions = [
  { name: "The Fjords", text: "Sognefjord, Nærøyfjord and Geirangerfjord — Norway's signature landscape. Best paired with the Flåm Railway and a quiet electric fjord cruise." },
  { name: "Lofoten Islands", text: "Granite peaks rising straight out of the Arctic Sea. Fishing villages, white-sand beaches, midnight sun in summer and Northern Lights in winter." },
  { name: "Bergen", text: "Gateway to the fjords. Colourful wooden Hanseatic wharf, lively fish market, a young food scene and seven hills to wander." },
  { name: "Oslo", text: "Compact, walkable Nordic capital. World-class museums (Munch, Vigeland, the Fram), waterfront architecture, and easy access to forest and fjord." },
];

const seasons = [
  { period: "May – June", title: "Long days, fewer crowds", text: "Waterfalls at full power, everything green, 18+ hours of daylight. The sweet spot for a first trip." },
  { period: "July – August", title: "High summer", text: "Midnight sun in the north, warmest weather, all roads and ferries open. Book early — this is peak season." },
  { period: "September", title: "Autumn colours", text: "Calm, golden landscapes and shoulder-season prices. Great for hiking and photography." },
  { period: "February – March", title: "Northern Lights", text: "Best window for aurora in Lofoten and Tromsø. Pair with husky sledding, snowshoeing or a coastal voyage." },
];

const jsonLd = [
  {
    "@context": "https://schema.org",
    "@type": "TouristTrip",
    name: "7-Day Norway Itinerary — Oslo, Fjords, Bergen & Lofoten",
    description: "A bespoke 7-day Norway itinerary covering Oslo, the Sognefjord region, Bergen and the Lofoten Islands, planned by Fjord & Waves Travel.",
    touristType: ["Independent travellers", "Couples", "Photography enthusiasts"],
    itinerary: {
      "@type": "ItemList",
      numberOfItems: itinerary.length,
      itemListElement: itinerary.map((d, i) => ({
        "@type": "ListItem",
        position: i + 1,
        name: `${d.day}: ${d.title}`,
        description: d.text,
      })),
    },

    provider: {
      "@type": "TravelAgency",
      name: "Fjord & Waves Travel",
      url: "https://fjordwavestravel.com",
    },
  },
  {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: "https://fjordwavestravel.com/" },
      { "@type": "ListItem", position: 2, name: "Destinations", item: "https://fjordwavestravel.com/destinations/norway" },
      { "@type": "ListItem", position: 3, name: "Norway", item: "https://fjordwavestravel.com/destinations/norway" },
    ],
  },
];

const DestinationNorway = () => {
  const navigate = useNavigate();

  return (
    <div>
      <Seo
        title="7-Day Norway Itinerary — Oslo, Fjords, Bergen & Lofoten"
        description="A bespoke 7-day Norway trip plan covering Oslo, the fjords, Bergen and Lofoten. Designed by Daniel Lira Figueiredo, Fora Travel advisor (IATA accredited)."
        path="/destinations/norway"
        jsonLd={jsonLd}
      />
      <Navbar />
      <main>
        {/* Hero */}
        <section className="pt-44 pb-20 px-16 bg-ink relative overflow-hidden max-lg:px-10 max-md:px-6 max-md:pt-36 max-md:pb-14">
          <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse 60% 70% at 80% 30%, rgba(169,198,193,0.10) 0%, transparent 60%), radial-gradient(ellipse 40% 50% at 10% 80%, rgba(76,111,117,0.18) 0%, transparent 55%), linear-gradient(170deg, #0d1722 0%, #1e2d3d 45%, #14202c 100%)" }} />
          <div className="relative z-10 max-w-4xl">
            <div className="inline-flex items-center gap-2.5 text-[0.68rem] font-semibold tracking-[0.2em] uppercase text-gold-2 mb-6">
              <div className="w-[30px] h-px bg-gold" />
              Destination · Norway
            </div>
            <h1 className="font-serif text-[clamp(2.2rem,4.6vw,4rem)] font-bold leading-[1.05] text-voyage-white mb-6 tracking-tight">
              Your <em className="italic font-normal text-gold-2">Norway</em> itinerary,<br />designed around you.
            </h1>
            <p className="text-lg text-voyage-white/70 leading-relaxed max-w-2xl font-light">
              A bespoke 7-day Norway trip plan — Oslo, the fjords, Bergen and Lofoten — built by a Fora Travel advisor who has lived and travelled here for years. Hotels, trains, fjord cruises and quiet hidden corners, all handled.
            </p>
            <div className="flex gap-3 mt-8 flex-wrap">
              <button onClick={() => navigate("/plan-my-trip")} className="px-8 py-4 bg-gold text-ink font-semibold text-[0.78rem] tracking-[0.1em] uppercase rounded-xs hover:bg-gold-2 hover:-translate-y-0.5 hover:shadow-[0_10px_30px_rgba(169,198,193,0.25)] transition-all">
                Plan my trip
              </button>
              <a href="#itinerary" className="px-8 py-4 border border-voyage-white/25 text-voyage-white/85 font-semibold text-[0.78rem] tracking-[0.1em] uppercase rounded-xs hover:bg-voyage-white/5 transition-colors">
                See the 7-day itinerary
              </a>
            </div>
          </div>
        </section>

        {/* 7-day itinerary */}
        <section id="itinerary" className="py-20 px-16 bg-parchment max-md:px-6 max-md:py-14">
          <div className="max-w-4xl mx-auto">
            <ScrollReveal>
              <div className="inline-flex items-center gap-2.5 text-[0.68rem] font-semibold tracking-[0.2em] uppercase text-voyage-muted mb-3">
                <Calendar size={14} className="text-gold" /> A sample week
              </div>
              <h2 className="font-serif text-3xl md:text-4xl text-ink mb-3">7-Day Norway Itinerary</h2>
              <p className="text-voyage-muted mb-12 max-w-2xl font-light">
                A starting point, not a fixed package. Every day is rebuilt around your interests, pace and budget when we plan your trip.
              </p>
            </ScrollReveal>
            <ol className="space-y-5">
              {itinerary.map((d) => (
                <ScrollReveal key={d.day}>
                  <li className="flex gap-6 p-6 rounded-xs bg-parchment-2 border border-gold/20">
                    <div className="shrink-0 w-20 text-[0.7rem] tracking-[0.15em] uppercase font-semibold text-gold-2 pt-1">{d.day}</div>
                    <div>
                      <h3 className="font-serif text-xl text-ink mb-1.5">{d.title}</h3>
                      <p className="text-sm text-voyage-muted leading-relaxed">{d.text}</p>
                    </div>
                  </li>
                </ScrollReveal>
              ))}
            </ol>
          </div>
        </section>

        {/* Regions */}
        <section className="py-20 px-16 bg-parchment-2 max-md:px-6 max-md:py-14">
          <div className="max-w-5xl mx-auto">
            <ScrollReveal>
              <div className="inline-flex items-center gap-2.5 text-[0.68rem] font-semibold tracking-[0.2em] uppercase text-voyage-muted mb-3">
                <MapPin size={14} className="text-gold" /> Where to go
              </div>
              <h2 className="font-serif text-3xl md:text-4xl text-ink mb-3">Regions worth your time</h2>
              <p className="text-voyage-muted mb-12 max-w-2xl font-light">The four Norwegian regions most travellers come for — and how they combine.</p>
            </ScrollReveal>
            <div className="grid grid-cols-2 gap-6 max-md:grid-cols-1">
              {regions.map((r) => (
                <ScrollReveal key={r.name}>
                  <div className="p-7 rounded-xs bg-parchment border border-gold/20 h-full">
                    <h3 className="font-serif text-2xl text-ink mb-3">{r.name}</h3>
                    <p className="text-sm text-voyage-muted leading-relaxed font-light">{r.text}</p>
                  </div>
                </ScrollReveal>
              ))}
            </div>
          </div>
        </section>

        {/* Best time to visit */}
        <section className="py-20 px-16 bg-parchment max-md:px-6 max-md:py-14">
          <div className="max-w-5xl mx-auto">
            <ScrollReveal>
              <div className="inline-flex items-center gap-2.5 text-[0.68rem] font-semibold tracking-[0.2em] uppercase text-voyage-muted mb-3">
                <Compass size={14} className="text-gold" /> When to go
              </div>
              <h2 className="font-serif text-3xl md:text-4xl text-ink mb-3">Best time to visit Norway</h2>
              <p className="text-voyage-muted mb-12 max-w-2xl font-light">Norway is a year-round destination — the experience changes completely with the season.</p>
            </ScrollReveal>
            <div className="grid grid-cols-2 gap-6 max-md:grid-cols-1">
              {seasons.map((s) => (
                <ScrollReveal key={s.period}>
                  <div className="p-7 rounded-xs bg-parchment-2 border border-gold/20 h-full">
                    <p className="text-[0.7rem] tracking-[0.15em] uppercase font-semibold text-gold-2 mb-2">{s.period}</p>
                    <h3 className="font-serif text-xl text-ink mb-2">{s.title}</h3>
                    <p className="text-sm text-voyage-muted leading-relaxed font-light">{s.text}</p>
                  </div>
                </ScrollReveal>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-20 px-16 bg-ink text-center relative overflow-hidden max-md:px-6 max-md:py-14">
          <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse 50% 60% at 50% 50%, rgba(76,111,117,0.20) 0%, transparent 60%), linear-gradient(170deg, #0d1722 0%, #1e2d3d 50%, #14202c 100%)" }} />
          <div className="relative z-10">
            <ScrollReveal>
              <Sparkles className="text-gold mx-auto mb-5" size={28} />
              <h2 className="font-serif text-3xl md:text-4xl text-voyage-white mb-4">Ready to plan your Norway trip?</h2>
              <p className="text-voyage-white/65 mb-8 max-w-lg mx-auto text-sm leading-relaxed font-light">
                Share your dates, group size and what excites you. I'll come back with a tailored proposal — flights, hotels, fjord cruises, the lot.
              </p>
              <button onClick={() => navigate("/plan-my-trip")} className="px-8 py-4 bg-gold text-ink font-semibold text-[0.78rem] tracking-[0.1em] uppercase rounded-xs hover:bg-gold-2 hover:-translate-y-0.5 hover:shadow-[0_10px_30px_rgba(169,198,193,0.25)] transition-all">
                Plan my trip
              </button>
            </ScrollReveal>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default DestinationNorway;
