import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

type View = "login" | "signup" | "forgot";

const Login = () => {
  const [view, setView] = useState<View>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || loading) return;
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      toast({ title: "Login failed", description: error.message, variant: "destructive" });
    } else {
      navigate("/admin");
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || loading) return;
    setLoading(true);
    const { error } = await supabase.auth.signUp({ email, password });
    setLoading(false);
    if (error) {
      toast({ title: "Signup failed", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Check your email", description: "A confirmation link has been sent to your inbox." });
      setView("login");
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || loading) return;
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setLoading(false);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Email sent", description: "Check your inbox for a password reset link." });
      setView("login");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-ink px-6">
      <div className="w-full max-w-sm">
        <div className="text-center mb-10">
          <h1 className="font-serif text-2xl font-bold text-voyage-white">
            Fjord <span className="text-gold italic">&</span> Waves Tours
          </h1>
          <p className="text-[0.78rem] text-voyage-white/40 mt-2">
            {view === "login" && "Sign in to the admin dashboard"}
            {view === "signup" && "Create your admin account"}
            {view === "forgot" && "Reset your password"}
          </p>
        </div>

        {view === "login" && (
          <form onSubmit={handleLogin} className="flex flex-col gap-4">
            <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email"
              className="px-4 py-3 rounded-sm bg-voyage-white/10 border border-voyage-white/20 text-voyage-white placeholder:text-voyage-white/40 text-[0.85rem] focus:outline-none focus:border-gold transition-colors" />
            <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password"
              className="px-4 py-3 rounded-sm bg-voyage-white/10 border border-voyage-white/20 text-voyage-white placeholder:text-voyage-white/40 text-[0.85rem] focus:outline-none focus:border-gold transition-colors" />
            <button type="submit" disabled={loading}
              className="px-6 py-3 rounded-sm bg-gold text-ink font-semibold text-[0.78rem] tracking-[0.1em] uppercase hover:bg-gold-2 transition-colors disabled:opacity-60">
              {loading ? "Signing in..." : "Sign In"}
            </button>
            <div className="flex justify-between mt-2">
              <button type="button" onClick={() => setView("signup")} className="text-[0.75rem] text-voyage-white/40 hover:text-gold transition-colors">
                Create account
              </button>
              <button type="button" onClick={() => setView("forgot")} className="text-[0.75rem] text-voyage-white/40 hover:text-gold transition-colors">
                Forgot password?
              </button>
            </div>
          </form>
        )}

        {view === "signup" && (
          <form onSubmit={handleSignup} className="flex flex-col gap-4">
            <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email"
              className="px-4 py-3 rounded-sm bg-voyage-white/10 border border-voyage-white/20 text-voyage-white placeholder:text-voyage-white/40 text-[0.85rem] focus:outline-none focus:border-gold transition-colors" />
            <input type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password (min 6 characters)"
              className="px-4 py-3 rounded-sm bg-voyage-white/10 border border-voyage-white/20 text-voyage-white placeholder:text-voyage-white/40 text-[0.85rem] focus:outline-none focus:border-gold transition-colors" />
            <button type="submit" disabled={loading}
              className="px-6 py-3 rounded-sm bg-gold text-ink font-semibold text-[0.78rem] tracking-[0.1em] uppercase hover:bg-gold-2 transition-colors disabled:opacity-60">
              {loading ? "Creating account..." : "Create Account"}
            </button>
            <button type="button" onClick={() => setView("login")} className="text-[0.75rem] text-voyage-white/40 hover:text-gold transition-colors mt-2">
              ← Back to sign in
            </button>
          </form>
        )}

        {view === "forgot" && (
          <form onSubmit={handleForgotPassword} className="flex flex-col gap-4">
            <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email"
              className="px-4 py-3 rounded-sm bg-voyage-white/10 border border-voyage-white/20 text-voyage-white placeholder:text-voyage-white/40 text-[0.85rem] focus:outline-none focus:border-gold transition-colors" />
            <button type="submit" disabled={loading}
              className="px-6 py-3 rounded-sm bg-gold text-ink font-semibold text-[0.78rem] tracking-[0.1em] uppercase hover:bg-gold-2 transition-colors disabled:opacity-60">
              {loading ? "Sending..." : "Send Reset Link"}
            </button>
            <button type="button" onClick={() => setView("login")} className="text-[0.75rem] text-voyage-white/40 hover:text-gold transition-colors mt-2">
              ← Back to sign in
            </button>
          </form>
        )}

        <button onClick={() => navigate("/")}
          className="mt-6 w-full text-center text-[0.75rem] text-voyage-white/30 hover:text-voyage-white/60 transition-colors">
          ← Back to site
        </button>
      </div>
    </div>
  );
};

export default Login;
