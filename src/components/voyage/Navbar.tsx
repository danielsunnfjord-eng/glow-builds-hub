const scrollToId = (id: string) => {
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
};

const Navbar = () => {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 flex justify-between items-center px-16 py-5 bg-parchment/90 backdrop-blur-lg border-b border-gold/15 transition-all max-md:px-6 max-md:py-4">
      <a
        href="/"
        className="font-serif text-xl font-bold text-ink cursor-pointer tracking-tight no-underline"
      >
        Fjord <span className="text-gold italic">&</span> Waves Tours
      </a>
      <div className="hidden md:flex gap-10 items-center">
        <a href="/about" className="text-[0.78rem] font-medium tracking-[0.1em] uppercase text-voyage-muted hover:text-ink transition-colors no-underline">
          About
        </a>
        <button onClick={() => scrollToId("curated")} className="text-[0.78rem] font-medium tracking-[0.1em] uppercase text-voyage-muted hover:text-ink transition-colors">
          How It Works
        </button>
        <button onClick={() => scrollToId("experiences")} className="text-[0.78rem] font-medium tracking-[0.1em] uppercase text-voyage-muted hover:text-ink transition-colors">
          What We Arrange
        </button>
        <button
          onClick={() => scrollToId("enquiry")}
          className="px-5 py-2.5 rounded-sm bg-ink text-voyage-white text-[0.72rem] font-medium tracking-[0.12em] uppercase hover:bg-gold hover:text-ink transition-colors"
        >
          Plan My Trip
        </button>
      </div>
    </nav>
  );
};

export default Navbar;