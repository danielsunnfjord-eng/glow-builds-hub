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
          <div className="relative w-full max-w-lg overflow-hidden rounded-xl bg-parchment p-8 pt-12 shadow-2xl md:p-10 md:pt-14">
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close form"
              className="absolute right-3 top-3 z-10 inline-flex h-9 w-9 items-center justify-center rounded-full bg-ink/80 text-white transition-colors hover:bg-ink"
            >
              <X className="h-5 w-5" />
            </button>
            <div className="flex flex-col items-center text-center">
              <p className="font-body text-base leading-relaxed text-ink md:text-lg">
                To fill out your intake form, please open it in a new tab.
              </p>
              <a
                href={INTAKE_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-6 inline-flex items-center justify-center rounded-md bg-ink px-8 py-3.5 font-sans text-sm font-semibold uppercase tracking-[0.12em] text-white transition-colors hover:bg-ink/90"
              >
                Open Intake Form
              </a>
              <p className="mt-5 text-[0.82rem] leading-relaxed text-voyage-muted">
                Once you&rsquo;ve submitted the form, you can close this window and continue browsing.
              </p>
            </div>
          </div>
        </div>
      )}
    </IntakeContext.Provider>
  );
}
