import { useState, useEffect } from "react";
import logo from "@/assets/logo.webp";
import { useNavigate, useLocation } from "@/lib/router-compat";
import { Eye, EyeOff } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "react-i18next";
import LanguageSelector from "@/components/voyage/LanguageSelector";
import Seo from "@/components/Seo";

type View = "login" | "signup" | "forgot";

const Login = () => {
  const [view, setView] = useState<View>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const { t } = useTranslation();

  useEffect(() => {
    const state = location.state as { passwordReset?: boolean } | null;
    if (state?.passwordReset) {
      setNotice(t("login.passwordUpdated", "Password updated successfully. Please sign in."));
      // Clear state so it doesn't persist on refresh
      window.history.replaceState({}, document.title);
    }
  }, [location.state, t]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || loading) return;
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        console.error("[Login] signInWithPassword error:", error, JSON.stringify(error));
        const status = (error as { status?: number }).status;
        const description =
          error.message?.trim() ||
          (status && status >= 500
            ? "The backend is temporarily unreachable. Please try again in a moment."
            : "Unable to sign in. Please check your email and password.");
        toast({ title: "Login failed", description, variant: "destructive" });
      } else {
        navigate("/admin");
      }
    } catch (err) {
      console.error("[Login] unexpected error:", err);
      toast({
        title: "Login failed",
        description: err instanceof Error && err.message ? err.message : "Network error — please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || loading) return;
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: `${window.location.origin}/admin` },
    });
    setLoading(false);
    if (error) {
      toast({ title: "Signup failed", description: error.message, variant: "destructive" });
    } else {
      toast({ title: t("login.checkEmail"), description: t("login.checkEmailDesc") });
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
      toast({ title: t("login.emailSent"), description: t("login.emailSentDesc") });
      setView("login");
    }
  };

  const passwordInputClass =
    "w-full pl-4 pr-12 py-3 rounded-xs bg-voyage-white/10 border border-voyage-white/20 text-voyage-white placeholder:text-voyage-white/40 text-[0.85rem] focus:outline-hidden focus:border-gold transition-colors";
  const inputClass =
    "px-4 py-3 rounded-xs bg-voyage-white/10 border border-voyage-white/20 text-voyage-white placeholder:text-voyage-white/40 text-[0.85rem] focus:outline-hidden focus:border-gold transition-colors";
  const btnClass =
    "px-6 py-3 rounded-xs bg-gold text-ink font-semibold text-[0.78rem] tracking-[0.1em] uppercase hover:bg-gold-2 transition-colors disabled:opacity-60";

  const renderPasswordField = (
    value: string,
    onChange: (v: string) => void,
    placeholder: string,
    minLength?: number,
  ) => (
    <div className="relative">
      <input
        type={showPassword ? "text" : "password"}
        required
        minLength={minLength}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={passwordInputClass}
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
  );

  return (
    <div className="min-h-screen flex items-center justify-center bg-ink px-6">
      <Seo title="Advisor Login — Fjord & Waves Travel" description="Sign in to the Fjord & Waves Travel advisor dashboard." path="/login" noindex />
      <div className="absolute top-5 right-6">
        <LanguageSelector variant="dark" />
      </div>
      <div className="w-full max-w-sm">
        <div className="text-center mb-10">
          <img src={logo} alt="Fjord & Waves Travel" width={400} height={224} className="h-16 w-auto mx-auto mb-3 brightness-0 invert" />
          <p className="text-[0.78rem] text-voyage-white/40 mt-2">
            {view === "login" && t("login.signIn")}
            {view === "signup" && t("login.createAccount")}
            {view === "forgot" && t("login.resetPassword")}
          </p>
        </div>

        {notice && view === "login" && (
          <div className="mb-6 px-4 py-3 rounded-xs bg-gold/10 border border-gold/30 text-gold text-[0.8rem] text-center">
            {notice}
          </div>
        )}

        {view === "login" && (
          <form onSubmit={handleLogin} className="flex flex-col gap-4">
            <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder={t("login.email")} className={inputClass} />
            {renderPasswordField(password, setPassword, t("login.password"))}
            <button type="submit" disabled={loading} className={btnClass}>
              {loading ? t("login.signingIn") : t("login.signInBtn")}
            </button>
            <div className="flex justify-between mt-2">
              <button type="button" onClick={() => { setNotice(null); setView("signup"); }} className="text-[0.75rem] text-voyage-white/40 hover:text-gold transition-colors">{t("login.createLink")}</button>
              <button type="button" onClick={() => { setNotice(null); setView("forgot"); }} className="text-[0.75rem] text-voyage-white/40 hover:text-gold transition-colors">{t("login.forgotLink")}</button>
            </div>
          </form>
        )}

        {view === "signup" && (
          <form onSubmit={handleSignup} className="flex flex-col gap-4">
            <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder={t("login.email")} className={inputClass} />
            {renderPasswordField(password, setPassword, t("login.passwordMin"), 6)}
            <button type="submit" disabled={loading} className={btnClass}>
              {loading ? t("login.creating") : t("login.createBtn")}
            </button>
            <button type="button" onClick={() => setView("login")} className="text-[0.75rem] text-voyage-white/40 hover:text-gold transition-colors mt-2">{t("login.backToSignIn")}</button>
          </form>
        )}

        {view === "forgot" && (
          <form onSubmit={handleForgotPassword} className="flex flex-col gap-4">
            <p className="text-[0.78rem] text-voyage-white/50 leading-relaxed">
              {t("login.forgotHelp", "Enter the email address linked to your account and we'll send you a link to reset your password.")}
            </p>
            <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder={t("login.email")} className={inputClass} />
            <button type="submit" disabled={loading} className={btnClass}>
              {loading ? t("login.sending") : t("login.sendReset")}
            </button>
            <button type="button" onClick={() => setView("login")} className="text-[0.75rem] text-voyage-white/40 hover:text-gold transition-colors mt-2">{t("login.backToSignIn")}</button>
          </form>
        )}

        <button onClick={() => navigate("/")} className="mt-6 w-full text-center text-[0.75rem] text-voyage-white/30 hover:text-voyage-white/60 transition-colors">{t("login.backToSite")}</button>
      </div>
    </div>
  );
};

export default Login;
