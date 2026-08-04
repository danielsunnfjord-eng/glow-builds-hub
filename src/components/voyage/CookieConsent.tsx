import { useEffect, useState } from "react";
import { currentLocale, localePath } from "@/lib/locale";

const STORAGE_KEY = "fw_cookie_consent_v1";

type Prefs = {
  essential: true;
  analytics: boolean;
  marketing: boolean;
  decidedAt: string;
};

const loadPrefs = (): Prefs | null => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Prefs) : null;
  } catch {
    return null;
  }
};

const savePrefs = (p: Prefs) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(p));
  window.dispatchEvent(new CustomEvent("cookie-consent-change", { detail: p }));
};

const CookieConsent = () => {
  const [open, setOpen] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [analytics, setAnalytics] = useState(false);
  const [marketing, setMarketing] = useState(false);

  useEffect(() => {
    const existing = loadPrefs();
    if (!existing) setOpen(true);
    else {
      setAnalytics(existing.analytics);
      setMarketing(existing.marketing);
    }
    const openHandler = () => {
      const cur = loadPrefs();
      if (cur) {
        setAnalytics(cur.analytics);
        setMarketing(cur.marketing);
      }
      setShowSettings(true);
      setOpen(true);
    };
    window.addEventListener("open-cookie-settings", openHandler);
    return () => window.removeEventListener("open-cookie-settings", openHandler);
  }, []);

  const accept = (a: boolean, m: boolean) => {
    savePrefs({ essential: true, analytics: a, marketing: m, decidedAt: new Date().toISOString() });
    setOpen(false);
    setShowSettings(false);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-[100] p-4 md:p-6 pointer-events-none">
      <div className="pointer-events-auto max-w-3xl mx-auto bg-ink text-voyage-white rounded-sm shadow-[0_10px_40px_rgba(0,0,0,0.3)] border border-gold/20 overflow-hidden">
        {!showSettings ? (
          <div className="p-6 md:p-7 flex flex-col md:flex-row md:items-center gap-5">
            <div className="flex-1">
              <p className="text-[0.65rem] font-semibold tracking-[0.2em] uppercase text-gold-2 mb-2">Cookies</p>
              <p className="text-sm text-voyage-white/75 leading-relaxed">
                I use essential cookies to make this site work and, with your consent, optional
                cookies to understand how it's used. Read more in the{" "}
                <a href={localePath("/privacy", currentLocale())} className="text-gold hover:underline">Privacy Policy</a>.
              </p>
            </div>
            <div className="flex flex-wrap gap-2 shrink-0">
              <button
                onClick={() => setShowSettings(true)}
                className="px-4 py-2.5 text-[0.7rem] tracking-[0.12em] uppercase font-medium border border-voyage-white/20 text-voyage-white/80 hover:bg-voyage-white/5 rounded-sm transition-colors"
              >
                Manage
              </button>
              <button
                onClick={() => accept(false, false)}
                className="px-4 py-2.5 text-[0.7rem] tracking-[0.12em] uppercase font-medium border border-voyage-white/20 text-voyage-white/80 hover:bg-voyage-white/5 rounded-sm transition-colors"
              >
                Reject optional
              </button>
              <button
                onClick={() => accept(true, true)}
                className="px-4 py-2.5 text-[0.7rem] tracking-[0.12em] uppercase font-semibold bg-gold text-ink hover:bg-gold-2 rounded-sm transition-colors"
              >
                Accept all
              </button>
            </div>
          </div>
        ) : (
          <div className="p-6 md:p-7">
            <p className="text-[0.65rem] font-semibold tracking-[0.2em] uppercase text-gold-2 mb-2">Cookie preferences</p>
            <h3 className="font-serif text-xl text-voyage-white mb-4">Manage your cookies</h3>

            <div className="space-y-3 mb-6">
              <label className="flex items-start gap-3 p-4 rounded-sm border border-voyage-white/10 bg-voyage-white/[0.02]">
                <input type="checkbox" checked readOnly className="mt-1 accent-gold" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-voyage-white">Essential</p>
                  <p className="text-xs text-voyage-white/55 mt-1">
                    Required for the site to function: language preference, secure sessions and
                    form submissions. Always on.
                  </p>
                </div>
              </label>

              <label className="flex items-start gap-3 p-4 rounded-sm border border-voyage-white/10 bg-voyage-white/[0.02] cursor-pointer">
                <input
                  type="checkbox"
                  checked={analytics}
                  onChange={(e) => setAnalytics(e.target.checked)}
                  className="mt-1 accent-gold"
                />
                <div className="flex-1">
                  <p className="text-sm font-medium text-voyage-white">Analytics</p>
                  <p className="text-xs text-voyage-white/55 mt-1">
                    Aggregate, anonymous usage data to help me improve the site.
                  </p>
                </div>
              </label>

              <label className="flex items-start gap-3 p-4 rounded-sm border border-voyage-white/10 bg-voyage-white/[0.02] cursor-pointer">
                <input
                  type="checkbox"
                  checked={marketing}
                  onChange={(e) => setMarketing(e.target.checked)}
                  className="mt-1 accent-gold"
                />
                <div className="flex-1">
                  <p className="text-sm font-medium text-voyage-white">Marketing</p>
                  <p className="text-xs text-voyage-white/55 mt-1">
                    Used to measure newsletter and campaign performance. None active without
                    your consent.
                  </p>
                </div>
              </label>
            </div>

            <div className="flex flex-wrap gap-2 justify-end">
              <button
                onClick={() => accept(false, false)}
                className="px-4 py-2.5 text-[0.7rem] tracking-[0.12em] uppercase font-medium border border-voyage-white/20 text-voyage-white/80 hover:bg-voyage-white/5 rounded-sm transition-colors"
              >
                Reject optional
              </button>
              <button
                onClick={() => accept(analytics, marketing)}
                className="px-4 py-2.5 text-[0.7rem] tracking-[0.12em] uppercase font-semibold bg-gold text-ink hover:bg-gold-2 rounded-sm transition-colors"
              >
                Save preferences
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export const openCookieSettings = () => {
  window.dispatchEvent(new Event("open-cookie-settings"));
};

export default CookieConsent;
