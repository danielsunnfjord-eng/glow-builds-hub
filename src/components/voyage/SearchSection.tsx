import { useState, useEffect, useRef, useCallback } from "react";
import ScrollReveal from "./ScrollReveal";
import { toast } from "sonner";

const TRAVELPAYOUTS_MARKER = "714834";

const tabs = [
  { id: "fl", label: "✈ Flights" },
  { id: "ho", label: "🏨 Hotels" },
  { id: "ac", label: "🎭 Activities" },
  { id: "ca", label: "🚗 Car Hire" },
];

const VIATOR_AFFILIATE = "https://www.viator.com/search?pid=P00058688&uid=U00778967&mcid=58086&currency=USD";

const SearchSection = () => {
  const [activeTab, setActiveTab] = useState("fl");
  const [activityDest, setActivityDest] = useState("");

  // Use callback ref to inject the Travelpayouts script widget when the div mounts
  const tpWidgetCallback = useCallback((node: HTMLDivElement | null) => {
    if (!node || node.querySelector('script')) return;
    const script = document.createElement('script');
    script.src = `https://tpembd.com/content?currency=usd&trs=513164&shmarker=${TRAVELPAYOUTS_MARKER}&show_hotels=true&powered_by=true&locale=en&searchUrl=www.aviasales.com%2Fsearch&primary_override=%2332a8dd&color_button=%2332a8dd&color_icons=%2332a8dd&dark=%23262626&light=%23FFFFFF&secondary=%23FFFFFF&special=%23C4C4C4&color_focused=%2332a8dd&border_radius=0&plain=false&promo_id=7879&campaign_id=100`;
    script.charset = 'utf-8';
    script.async = true;
    node.appendChild(script);
  }, []);

  const goSearch = (provider: string) => {
    toast.info(`🔗 This connects to: ${provider}. Replace with your affiliate tracking URL.`);
  };

  const inputClass = "px-4 py-3.5 bg-voyage-white border-[1.5px] border-parchment-3 rounded-lg font-sans text-[0.88rem] text-ink outline-none focus:border-gold transition-colors w-full placeholder:text-parchment-3";
  const selectClass = inputClass + " appearance-none";
  const labelClass = "text-[0.62rem] font-semibold tracking-[0.12em] uppercase text-voyage-muted";

  return (
    <section className="py-28 px-16 bg-parchment-2 border-t border-b border-parchment-3 max-md:px-6 max-md:py-16" id="self-book">
      <ScrollReveal>
        <div className="text-[0.65rem] font-semibold tracking-[0.22em] uppercase text-gold mb-3">Self-book · Instant · No extra fees</div>
      </ScrollReveal>
      <ScrollReveal>
        <h2 className="font-serif text-[clamp(2rem,3.5vw,3rem)] font-bold leading-[1.05] tracking-tight mb-4">
          Search & book<br /><em className="italic font-normal">in minutes</em>
        </h2>
      </ScrollReveal>
      <ScrollReveal>
        <p className="text-[0.92rem] text-voyage-muted max-w-[480px] leading-relaxed">Compare prices across hundreds of providers. Book directly — we never add markup to your booking.</p>
      </ScrollReveal>

      <ScrollReveal className="mt-12">
        <div className="flex gap-0 border-b border-parchment-3 mb-10">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-6 py-3.5 text-[0.72rem] font-semibold tracking-[0.1em] uppercase border-b-2 -mb-px transition-all flex items-center gap-1.5 ${
                activeTab === tab.id
                  ? "text-ink border-gold"
                  : "text-voyage-muted border-transparent hover:text-ink-2"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === "fl" && (
          <div className="min-h-[400px]">
            <div ref={tpWidgetCallback} className="w-full" />
          </div>
        )}
        {activeTab === "ho" && (
          <div className="grid grid-cols-[1fr_1fr_1fr_auto] gap-4 items-end max-md:grid-cols-2">
            <div className="flex flex-col gap-1.5"><label className={labelClass}>Destination</label><input className={inputClass} placeholder="City, area or hotel" /></div>
            <div className="flex flex-col gap-1.5"><label className={labelClass}>Check-in — Check-out</label><input className={inputClass} placeholder="Select dates" /></div>
            <div className="flex flex-col gap-1.5"><label className={labelClass}>Guests</label><select className={selectClass}><option>1 guest</option><option>2 guests</option><option>3–4 guests</option><option>5+ guests</option></select></div>
            <button onClick={() => goSearch("Booking.com hotel search")} className="px-7 py-3.5 bg-ink text-voyage-white text-[0.72rem] font-semibold tracking-[0.1em] uppercase rounded-lg hover:bg-gold hover:text-ink hover:-translate-y-0.5 transition-all whitespace-nowrap">Search →</button>
          </div>
        )}
        {activeTab === "ac" && (
          <div className="grid grid-cols-[1fr_1fr_1fr_auto] gap-4 items-end max-md:grid-cols-2">
            <div className="flex flex-col gap-1.5"><label className={labelClass}>Destination</label><input className={inputClass} placeholder="City or region" /></div>
            <div className="flex flex-col gap-1.5"><label className={labelClass}>Category</label><select className={selectClass}><option>All experiences</option><option>Tours & Sightseeing</option><option>Food & Drink</option><option>Adventure</option><option>Culture & Art</option><option>Wellness</option></select></div>
            <div className="flex flex-col gap-1.5"><label className={labelClass}>Date</label><input className={inputClass} placeholder="Any date" /></div>
            <button onClick={() => goSearch("Viator activities search")} className="px-7 py-3.5 bg-ink text-voyage-white text-[0.72rem] font-semibold tracking-[0.1em] uppercase rounded-lg hover:bg-gold hover:text-ink hover:-translate-y-0.5 transition-all whitespace-nowrap">Search →</button>
          </div>
        )}
        {activeTab === "ca" && (
          <div className="grid grid-cols-[1fr_1fr_1fr_auto] gap-4 items-end max-md:grid-cols-2">
            <div className="flex flex-col gap-1.5"><label className={labelClass}>Pick-up location</label><input className={inputClass} placeholder="City or airport" /></div>
            <div className="flex flex-col gap-1.5"><label className={labelClass}>Pick-up — Drop-off</label><input className={inputClass} placeholder="Select dates" /></div>
            <div className="flex flex-col gap-1.5"><label className={labelClass}>Driver age</label><select className={selectClass}><option>25–65</option><option>Under 25</option><option>Over 65</option></select></div>
            <button onClick={() => goSearch("Rentalcars search")} className="px-7 py-3.5 bg-ink text-voyage-white text-[0.72rem] font-semibold tracking-[0.1em] uppercase rounded-lg hover:bg-gold hover:text-ink hover:-translate-y-0.5 transition-all whitespace-nowrap">Search →</button>
          </div>
        )}

        <p className="mt-5 text-[0.78rem] text-voyage-muted flex items-center gap-2">
          <span className="text-gold">✦</span>
          Prices shown are direct from providers — identical to booking with them. We simply help you find the best deal.
        </p>
      </ScrollReveal>
    </section>
  );
};

export default SearchSection;
