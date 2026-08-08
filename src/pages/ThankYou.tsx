import { useEffect } from "react";
import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import Navbar from "@/components/voyage/Navbar";
import Footer from "@/components/voyage/Footer";
import Seo from "@/components/Seo";

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
  }
}

const ThankYou = () => {
  useEffect(() => {
    // Google Ads conversion event — replace SEND_TO with your Ads conversion ID/label
    // e.g. 'AW-XXXXXXXXX/AbCdEfGhIjK'
    try {
      window.dataLayer = window.dataLayer || [];
      const gtag = window.gtag || ((...args: unknown[]) => (window.dataLayer = window.dataLayer || []).push(args));
      gtag("event", "conversion", {
        send_to: "AW-CONVERSION_ID/CONVERSION_LABEL",
        event_category: "lead",
        event_label: "trip_request_submitted",
      });
      gtag("event", "generate_lead", {
        event_category: "lead",
        event_label: "trip_request_submitted",
      });
    } catch {
      // no-op
    }
  }, []);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Seo
        title="Thank You | Fjord & Waves Travel"
        description="We have received your travel request and will be in touch shortly."
        path="/thank-you"
        noindex
      />
      <Helmet>
        {/* Google Ads conversion fallback for users without JS-tracking enabled */}
      </Helmet>
      <Navbar />
      <main className="flex-1 flex items-center justify-center px-6 py-28">
        <div className="max-w-xl text-center">
          <div className="inline-flex items-center gap-2.5 text-[0.68rem] font-semibold tracking-[0.2em] uppercase text-gold mb-6">
            <div className="w-[30px] h-px bg-gold" />
            Confirmed
            <div className="w-[30px] h-px bg-gold" />
          </div>
          <h1 className="font-serif text-[clamp(2rem,4vw,3.2rem)] font-bold leading-tight tracking-tight text-foreground mb-5">
            Thank You for Your <em className="italic font-normal text-gold">Inquiry</em>
          </h1>
          <p className="text-[1rem] text-muted-foreground leading-relaxed mb-10">
            We have received your travel request and will review your preferences carefully.
            We will contact you shortly with the next steps.
          </p>
          <Link
            to="/"
            className="inline-flex items-center gap-2 px-8 py-4 bg-gold text-ink font-semibold text-[0.78rem] tracking-[0.1em] uppercase rounded-xs hover:bg-gold-2 hover:-translate-y-0.5 hover:shadow-[0_10px_30px_rgba(184,135,42,0.3)] transition-all"
          >
            Return to Homepage
          </Link>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default ThankYou;
