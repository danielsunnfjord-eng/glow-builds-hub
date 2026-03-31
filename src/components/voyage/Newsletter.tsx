import { useState } from "react";
import { Send, Loader2 } from "lucide-react";
import ScrollReveal from "./ScrollReveal";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const Newsletter = () => {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || loading) return;

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('subscribe-newsletter', {
        body: { email },
      });

      if (error) throw error;

      setSubmitted(true);
      toast({
        title: "You're in!",
        description: "Thanks for subscribing — travel inspiration is on its way.",
      });
      setEmail("");
    } catch (err) {
      console.error('Subscription error:', err);
      toast({
        title: "Something went wrong",
        description: "Please try again later.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="py-28 px-16 bg-ink max-md:px-6 max-md:py-16">
      <div className="max-w-2xl mx-auto text-center">
        <ScrollReveal>
          <div className="text-[0.65rem] font-semibold tracking-[0.22em] uppercase text-gold mb-3">
            Stay inspired
          </div>
        </ScrollReveal>
        <ScrollReveal>
          <h2 className="font-serif text-[clamp(2rem,3.5vw,3rem)] font-bold leading-[1.05] tracking-tight mb-4 text-voyage-white">
            Travel tips & hidden gems,<br />
            <em className="italic font-normal">straight to your inbox</em>
          </h2>
        </ScrollReveal>
        <ScrollReveal>
          <p className="text-voyage-white/60 text-[0.9rem] leading-relaxed mb-10 max-w-lg mx-auto">
            Sign up for occasional updates on curated destinations, insider travel advice, and exclusive offers from Fjord & Waves Tours.
          </p>
        </ScrollReveal>
        <ScrollReveal>
          {submitted ? (
            <div className="text-gold font-serif text-lg">
              ✓ You're subscribed — welcome aboard!
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex gap-3 max-w-md mx-auto max-sm:flex-col">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Your email address"
                className="flex-1 px-5 py-3 rounded-sm bg-voyage-white/10 border border-voyage-white/20 text-voyage-white placeholder:text-voyage-white/40 text-[0.85rem] focus:outline-none focus:border-gold transition-colors"
              />
              <button
                type="submit"
                disabled={loading}
                className="flex items-center justify-center gap-2 px-6 py-3 rounded-sm bg-gold text-ink font-semibold text-[0.8rem] tracking-[0.08em] uppercase hover:bg-gold/90 transition-colors disabled:opacity-60"
              >
                {loading ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                {loading ? "Subscribing..." : "Subscribe"}
              </button>
            </form>
          )}
          <p className="text-voyage-white/30 text-[0.7rem] mt-4">
            No spam, ever. Unsubscribe anytime.
          </p>
        </ScrollReveal>
      </div>
    </section>
  );
};

export default Newsletter;
