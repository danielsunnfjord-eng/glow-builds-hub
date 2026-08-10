import { useEffect } from "react";
import { useLocation } from "@/lib/router-compat";
import Navbar from "@/components/voyage/Navbar";
import Footer from "@/components/voyage/Footer";

const Legal = () => {
  const { hash } = useLocation();

  useEffect(() => {
    if (hash) {
      setTimeout(() => {
        document.getElementById(hash.slice(1))?.scrollIntoView({ behavior: "smooth" });
      }, 100);
    } else {
      window.scrollTo(0, 0);
    }
  }, [hash]);

  return (
    <div className="bg-parchment min-h-screen">
      <Navbar />
      <main className="pt-32 pb-20 px-6 md:px-16 max-w-3xl mx-auto">
        <header className="mb-12">
          <p className="text-[0.68rem] font-semibold tracking-[0.2em] uppercase text-gold mb-4">Legal</p>
          <h1 className="font-serif text-4xl md:text-5xl text-ink mb-4">Privacy Policy & Terms</h1>
          <p className="text-sm text-voyage-muted">Last updated: 5 May 2026</p>
        </header>

        <nav className="mb-12 flex gap-6 text-sm border-b border-gold/15 pb-4">
          <a href="#privacy" className="text-ink hover:text-gold transition-colors">Privacy Policy</a>
          <a href="#terms" className="text-ink hover:text-gold transition-colors">Terms of Service</a>
        </nav>

        <section id="privacy" className="mb-16 space-y-6 text-[0.95rem] leading-relaxed text-voyage-muted">
          <h2 className="font-serif text-2xl md:text-3xl text-ink">Privacy Policy</h2>

          <p>
            Fjord & Waves Travel ("we", "us", "our"; Org.nr: 928804860, Norway) respects your
            privacy. This policy explains what personal data we collect when you use
            fjordwavestravel.com or engage us as a travel advisor, why we collect it, and your
            rights under the EU GDPR and Norwegian Personal Data Act.
          </p>

          <h3 className="font-serif text-xl text-ink mt-8">1. Data we collect</h3>
          <ul className="list-disc pl-6 space-y-2">
            <li><strong>Enquiry information:</strong> name, email, phone, destinations, travel dates, group size, budget, preferences and any free-text notes you submit through "Plan My Trip".</li>
            <li><strong>Booking information:</strong> traveller names, dates of birth, passport details, dietary or accessibility needs, and emergency contacts when required to make reservations.</li>
            <li><strong>Newsletter:</strong> email address and language preference.</li>
            <li><strong>Account data:</strong> for advisor logins, email and authentication credentials.</li>
            <li><strong>Technical data:</strong> IP address, browser, device, and basic analytics needed to operate the site.</li>
          </ul>

          <h3 className="font-serif text-xl text-ink mt-8">2. Why we use it</h3>
          <ul className="list-disc pl-6 space-y-2">
            <li>To respond to your enquiry and craft a personalised itinerary.</li>
            <li>To make reservations with hotels, suppliers and Fora Travel partners on your behalf.</li>
            <li>To send the newsletter you opted into (you can unsubscribe at any time).</li>
            <li>To meet legal, accounting and tax obligations.</li>
          </ul>

          <h3 className="font-serif text-xl text-ink mt-8">3. Legal basis</h3>
          <p>
            We process your data on the basis of (a) the contract or pre-contractual steps you
            request when planning a trip, (b) your consent for newsletter communications, and
            (c) our legitimate interest in operating and securing the site.
          </p>

          <h3 className="font-serif text-xl text-ink mt-8">4. Sharing</h3>
          <p>
            We share data only with parties needed to deliver your trip or operate the service:
            Fora Travel (booking platform), hotels and tour operators you book through us,
            Mailchimp (newsletter), and Supabase / Lovable Cloud (hosting and database). We never
            sell your personal data.
          </p>

          <h3 className="font-serif text-xl text-ink mt-8">5. Retention</h3>
          <p>
            Enquiry and booking data is kept for as long as needed to provide the service and to
            meet Norwegian accounting requirements (typically 5 years). Newsletter data is kept
            until you unsubscribe.
          </p>

          <h3 className="font-serif text-xl text-ink mt-8">6. Your rights</h3>
          <p>
            Under GDPR you may request access, correction, deletion, restriction, portability,
            or object to processing. Email{" "}
            <a href="mailto:daniel.lirafigueiredo@fora.travel" className="text-gold hover:underline">
              daniel.lirafigueiredo@fora.travel
            </a>{" "}
            and we will respond within 30 days. You may also lodge a complaint with the Norwegian
            Data Protection Authority (Datatilsynet).
          </p>

          <h3 className="font-serif text-xl text-ink mt-8">7. Cookies</h3>
          <p>
            We use only essential cookies and local storage required to remember your language
            preference and keep authenticated sessions active. We do not use advertising or
            cross-site tracking cookies.
          </p>

          <h3 className="font-serif text-xl text-ink mt-8">8. Security</h3>
          <p>
            Data is stored on encrypted infrastructure with row-level access controls. Access to
            client information is restricted to the advisor.
          </p>
        </section>

        <section id="terms" className="space-y-6 text-[0.95rem] leading-relaxed text-voyage-muted">
          <h2 className="font-serif text-2xl md:text-3xl text-ink">Terms of Service</h2>

          <p>
            By submitting an enquiry or engaging Fjord & Waves Travel, you agree to these terms.
          </p>

          <h3 className="font-serif text-xl text-ink mt-8">1. Our role</h3>
          <p>
            Fjord & Waves Travel acts as an independent travel advisor, working through Fora
            Travel (IATA accredited). We arrange and recommend travel services supplied by
            third parties (airlines, hotels, tour operators, transfer companies). Those suppliers
            are responsible for the actual delivery of the services they provide.
          </p>

          <h3 className="font-serif text-xl text-ink mt-8">2. Fees</h3>
          <p>
            Pricing is presented before any work begins. A fixed planning fee applies based on
            group size and trip length, plus a 7% service fee on bookings made through us. Fees
            are quoted in EUR, NOK or BRL depending on your location. Planning fees are payable
            on engagement and are non-refundable once itinerary work has started.
          </p>

          <h3 className="font-serif text-xl text-ink mt-8">3. Bookings & payments</h3>
          <p>
            Bookings are confirmed only once payment has been received and the supplier has
            issued a confirmation. Each supplier's own cancellation, change and refund policy
            applies — we will share these with you before you book.
          </p>

          <h3 className="font-serif text-xl text-ink mt-8">4. Travel insurance & documents</h3>
          <p>
            You are responsible for ensuring you have valid passports, visas, vaccinations and
            adequate travel insurance for your trip. We strongly recommend comprehensive travel
            insurance covering medical, cancellation and baggage.
          </p>

          <h3 className="font-serif text-xl text-ink mt-8">5. Itineraries & content</h3>
          <p>
            Itineraries, recommendations and written content we produce for you are for your
            personal use only. Please do not redistribute or republish them without permission.
          </p>

          <h3 className="font-serif text-xl text-ink mt-8">6. Liability</h3>
          <p>
            To the extent permitted by law, our liability is limited to the planning fees you
            paid us. We are not liable for losses caused by third-party suppliers, force majeure,
            or events outside our reasonable control.
          </p>

          <h3 className="font-serif text-xl text-ink mt-8">7. Governing law</h3>
          <p>
            These terms are governed by the laws of Norway. Any dispute will be handled by the
            competent Norwegian courts.
          </p>

          <h3 className="font-serif text-xl text-ink mt-8">8. Contact</h3>
          <p>
            Daniel Lira Figueiredo · Fjord & Waves Travel · Org.nr 928804860 ·{" "}
            <a href="mailto:daniel.lirafigueiredo@fora.travel" className="text-gold hover:underline">
              daniel.lirafigueiredo@fora.travel
            </a>
          </p>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default Legal;
