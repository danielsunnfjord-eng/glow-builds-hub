import { useNavigate } from "react-router-dom";

const scrollToId = (id: string) => {
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
};

const Footer = () => {
  const navigate = useNavigate();

  return (
    <>
      <footer className="bg-ink text-voyage-white p-16 grid grid-cols-[1.5fr_1fr_1fr] gap-16 max-md:grid-cols-1 max-md:p-8">
        <div>
          <span className="font-serif text-xl font-bold text-voyage-white block mb-3">
            Fjord <span className="text-gold italic">&</span> Waves Tours
          </span>
          <p className="text-[0.78rem] text-voyage-white/40 leading-relaxed">
            Independent travel advisor. Member of Fora Travel. IATA accredited. I help people travel better — wherever that takes them.
          </p>
        </div>
        <div>
          <h5 className="text-[0.65rem] font-semibold tracking-[0.2em] uppercase text-voyage-white/30 mb-5">Explore</h5>
          <button onClick={() => scrollToId("curated")} className="block text-[0.82rem] text-voyage-white/50 hover:text-voyage-white transition-colors mb-2.5">How it works</button>
          <button onClick={() => scrollToId("experiences")} className="block text-[0.82rem] text-voyage-white/50 hover:text-voyage-white transition-colors mb-2.5">What we arrange</button>
          <button onClick={() => scrollToId("enquiry")} className="block text-[0.82rem] text-voyage-white/50 hover:text-voyage-white transition-colors mb-2.5">Request a quote</button>
        </div>
        <div>
          <h5 className="text-[0.65rem] font-semibold tracking-[0.2em] uppercase text-voyage-white/30 mb-5">Get in touch</h5>
          <button onClick={() => scrollToId("enquiry")} className="block text-[0.82rem] text-voyage-white/50 hover:text-voyage-white transition-colors mb-2.5">Plan my trip</button>
        </div>
      </footer>
      <div className="bg-ink-2 px-16 py-5 flex justify-between items-center border-t border-voyage-white/[0.06] max-md:px-6 max-md:flex-col max-md:gap-2">
        <p className="text-[0.72rem] text-voyage-white/25">© 2026 Fjord & Waves Tours. All rights reserved.</p>
        <button onClick={() => navigate("/admin")} className="text-[0.68rem] text-voyage-white/20 hover:text-voyage-white/50 transition-colors">Admin ·</button>
      </div>
    </>
  );
};

export default Footer;