const scrollToId = (id: string) => {
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
};

const Hero = () => {
  return (
    <section className="min-h-screen flex flex-col justify-end px-16 pb-24 relative overflow-hidden bg-ink max-md:px-6 max-md:pb-20">
      <div
        className="absolute inset-0"
        style={{
          background: `
            radial-gradient(ellipse 60% 70% at 80% 30%, rgba(184,135,42,0.12) 0%, transparent 60%),
            radial-gradient(ellipse 40% 50% at 10% 80%, rgba(107,124,94,0.1) 0%, transparent 50%),
            linear-gradient(170deg, #0a0906 0%, #1a1510 40%, #13110e 100%)
          `,
        }}
      />
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: "radial-gradient(circle, rgba(184,135,42,0.15) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
          maskImage: "radial-gradient(ellipse 70% 70% at 80% 20%, black 0%, transparent 70%)",
          WebkitMaskImage: "radial-gradient(ellipse 70% 70% at 80% 20%, black 0%, transparent 70%)",
        }}
      />

      <div className="relative z-10 max-w-[700px]">
        <div className="inline-flex items-center gap-2.5 text-[0.68rem] font-semibold tracking-[0.2em] uppercase text-gold-2 mb-8 animate-fade-up">
          <div className="w-[30px] h-px bg-gold" />
          Independent Travel Agency
        </div>
        <h1 className="font-serif text-[clamp(3.2rem,7vw,6rem)] font-bold leading-[0.95] text-voyage-white mb-8 tracking-tight animate-fade-up-1">
          Where do you
          <em className="block italic font-normal text-gold-2">want to go?</em>
        </h1>
        <p className="text-base font-light text-voyage-white/60 max-w-[460px] leading-relaxed mb-12 animate-fade-up-2">
          Tell us your dream destination and we'll craft a journey tailored entirely to you — from flights and hotels to hidden-gem experiences.
        </p>
        <div className="flex gap-4 flex-wrap animate-fade-up-3">
          <button
            onClick={() => scrollToId("enquiry")}
            className="inline-flex items-center gap-2 px-8 py-4 bg-gold text-ink font-semibold text-[0.78rem] tracking-[0.1em] uppercase rounded-sm hover:bg-gold-2 hover:-translate-y-0.5 hover:shadow-[0_10px_30px_rgba(184,135,42,0.3)] transition-all"
          >
            Plan My Trip
          </button>
          <button
            onClick={() => scrollToId("curated")}
            className="inline-flex items-center gap-2 px-8 py-4 bg-transparent border border-voyage-white/25 text-voyage-white/80 font-medium text-[0.78rem] tracking-[0.1em] uppercase rounded-sm hover:border-gold hover:text-gold hover:-translate-y-0.5 transition-all"
          >
            How It Works
          </button>
        </div>
      </div>

      <div className="absolute bottom-12 right-16 flex flex-col items-center gap-2 text-voyage-white/30 text-[0.62rem] tracking-[0.2em] uppercase animate-fade-up-4 max-md:hidden">
        <div className="w-px h-[50px] bg-gradient-to-b from-gold/50 to-transparent animate-pulse-bar" />
        Scroll
      </div>
    </section>
  );
};

export default Hero;
