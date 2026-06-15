import { useState, useEffect } from "react";
import logo from "@/assets/logo.webp";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import Seo from "@/components/Seo";

const ResetPassword = () => {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    // Recovery flow: Supabase parses the URL fragment and emits PASSWORD_RECOVERY.
    // It may also have already established a session by the time we mount.
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY" || event === "SIGNED_IN") {
        setReady(true);
      }
    });

    // Fallback: if a session is already present, allow updating password.
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setReady(true);
    });

    // If neither event nor session arrives within a short window, show error.
    const timer = setTimeout(() => {
      setReady((r) => {
        if (!r) setError("This password reset link is invalid or has expired. Please request a new one.");
        return r;
      });
    }, 4000);

    return () => {
      subscription.unsubscribe();
      clearTimeout(timer);
    };
  }, []);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password || loading) return;
    if (password.length < 6) {
      toast({ title: "Password too short", description: "Use at least 6 characters.", variant: "destructive" });
      return;
    }
    if (password !== confirm) {
      toast({ title: "Passwords don't match", description: "Please confirm your new password.", variant: "destructive" });
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    if (!error) {
      await supabase.auth.signOut();
    }
    setLoading(false);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      navigate("/login", { state: { passwordReset: true }, replace: true });
    }
  };

  const inputClass =
    "w-full pl-4 pr-12 py-3 rounded-sm bg-voyage-white/10 border border-voyage-white/20 text-voyage-white placeholder:text-voyage-white/40 text-[0.85rem] focus:outline-none focus:border-gold transition-colors";

  return (
    <div className="min-h-screen flex items-center justify-center bg-ink px-6">
      <Seo title="Reset Password — Fjord & Waves Travel" description="Reset your Fjord & Waves Travel account password." path="/reset-password" noindex />
      <div className="w-full max-w-sm">
        <div className="text-center mb-10">
          <img src={logo} alt="Fjord & Waves Travel" width={400} height={224} className="h-16 w-auto mx-auto mb-3 brightness-0 invert" />
          <p className="text-[0.78rem] text-voyage-white/40 mt-2">Set your new password</p>
        </div>

        {error ? (
          <div className="flex flex-col gap-4">
            <p className="text-[0.85rem] text-red-300 text-center">{error}</p>
            <button
              onClick={() => navigate("/login")}
              className="px-6 py-3 rounded-sm bg-gold text-ink font-semibold text-[0.78rem] tracking-[0.1em] uppercase hover:bg-gold-2 transition-colors"
            >
              Back to sign in
            </button>
          </div>
        ) : !ready ? (
          <p className="text-voyage-white/50 text-sm text-center">Verifying your reset link...</p>
        ) : (
          <form onSubmit={handleReset} className="flex flex-col gap-4">
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="New password (min 6 characters)"
                className={inputClass}
              />
              <button
                type="button"
                onClick={() => setShowPassword((s) => !s)}
                aria-label={showPassword ? "Hide password" : "Show password"}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-voyage-white/50 hover:text-gold transition-colors p-1"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                required
                minLength={6}
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                placeholder="Confirm new password"
                className={inputClass}
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-3 rounded-sm bg-gold text-ink font-semibold text-[0.78rem] tracking-[0.1em] uppercase hover:bg-gold-2 transition-colors disabled:opacity-60"
            >
              {loading ? "Updating..." : "Update Password"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default ResetPassword;
