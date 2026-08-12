import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type MouseEvent,
  type ReactNode,
} from "react";
import { useTranslation } from "react-i18next";
import { X } from "lucide-react";

const INTAKE_URL = "https://secure.foratravel.com/intake/uRYFCpSsUZ";

interface IntakeContextValue {
  open: () => void;
}

const IntakeContext = createContext<IntakeContextValue | null>(null);

/**
 * English-only intake behaviour: on the EN site the intake CTAs open the Fora
 * intake form in a modal iframe instead of navigating. PT/NO keep the existing
 * internal form pages untouched.
 */
export function useIntakeCta() {
  const ctx = useContext(IntakeContext);
  const { i18n } = useTranslation();
  const isEnglish = i18n.language === "en";

  const onIntakeClick = useCallback(
    (e: MouseEvent) => {
      if (!isEnglish || !ctx) return;
      e.preventDefault();
      e.stopPropagation();
      ctx.open();
    },
    [isEnglish, ctx],
  );

  return { isEnglish, open: ctx?.open ?? (() => {}), onIntakeClick };
}

export function IntakeFormProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  const value = useMemo(() => ({ open: () => setOpen(true) }), []);

  return (
    <IntakeContext.Provider value={value}>
      {children}
      {open && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Trip planning form"
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-3 md:p-6"
        >
          <div className="relative flex h-full max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-xl bg-white shadow-2xl">
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close form"
              className="absolute right-3 top-3 z-10 inline-flex h-9 w-9 items-center justify-center rounded-full bg-ink/80 text-white transition-colors hover:bg-ink"
            >
              <X className="h-5 w-5" />
            </button>
            <iframe
              src={INTAKE_URL}
              title="Fjord & Waves Travel intake form"
              loading="lazy"
              allow="clipboard-write"
              className="w-full flex-1 border-0"
            />
            <p className="border-t border-ink/10 bg-parchment px-5 py-3 text-center text-[0.82rem] leading-relaxed text-voyage-muted">
              Thank you for your submission. Once you&rsquo;ve completed the form, you can close this
              window to continue browsing.
            </p>
          </div>
        </div>
      )}
    </IntakeContext.Provider>
  );
}
