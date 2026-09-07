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
 * Intake behaviour (all languages): intake CTAs open the Fora intake form in a
 * modal instead of navigating to the internal questionnaire.
 */
export function useIntakeCta() {
  const ctx = useContext(IntakeContext);
  const isEnglish = true;

  const onIntakeClick = useCallback(
    (e: MouseEvent) => {
      if (!ctx) return;
      e.preventDefault();
      e.stopPropagation();
      ctx.open();
    },
    [isEnglish, ctx],
  );

  return { isEnglish, open: ctx?.open ?? (() => {}), onIntakeClick };
}

const COPY = {
  en: {
    intro: "To fill out your intake form, please open it in a new tab.",
    cta: "Open intake form",
    after: "Once you’ve submitted the form, you can close this window and continue browsing.",
    close: "Close",
  },
  pt: {
    intro: "Para preencher o formulário, abra-o em uma nova aba.",
    cta: "Abrir formulário",
    after: "Depois de enviar o formulário, você pode fechar esta janela e continuar navegando.",
    close: "Fechar",
  },
  no: {
    intro: "For å fylle ut skjemaet, åpne det i en ny fane.",
    cta: "Åpne skjemaet",
    after: "Når du har sendt inn skjemaet, kan du lukke dette vinduet og fortsette å utforske.",
    close: "Lukk",
  },
} as const;

export function IntakeFormProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const { i18n } = useTranslation();
  const lang = (i18n.language?.slice(0, 2) ?? "en") as keyof typeof COPY;
  const copy = COPY[lang] ?? COPY.en;

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
              aria-label={copy.close}
              className="absolute right-3 top-3 z-10 inline-flex h-9 w-9 items-center justify-center rounded-full bg-ink/80 text-white transition-colors hover:bg-ink"
            >
              <X className="h-5 w-5" />
            </button>
            <div className="flex flex-col items-center text-center">
              <p className="font-body text-base leading-relaxed text-ink md:text-lg">
                {copy.intro}
              </p>
              <a
                href={INTAKE_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-6 inline-flex items-center justify-center rounded-md bg-ink px-8 py-3.5 font-sans text-sm font-semibold uppercase tracking-[0.12em] text-white transition-colors hover:bg-ink/90"
              >
                {copy.cta}
              </a>
              <p className="mt-5 text-[0.82rem] leading-relaxed text-voyage-muted">
                {copy.after}
              </p>
            </div>
          </div>
        </div>
      )}
    </IntakeContext.Provider>
  );
}
