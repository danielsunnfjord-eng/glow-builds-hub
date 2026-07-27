import { useCallback, useEffect, useState } from "react";

export type SiteLang = "en" | "pt" | "no";
export type DisplayCurrency = "USD" | "EUR" | "BRL" | "NOK";
export type EnCurrencyPref = "USD" | "EUR";

const STORAGE_KEY = "fw_currency_pref";

export interface PriceRow {
  price_eur?: number | null;
  price_usd?: number | null;
  price_brl?: number | null;
  price_nok?: number | null;
}

/** Pick which currency to display given site language + (EN) visitor preference. */
export function currencyForLang(lang: string, enPref: EnCurrencyPref): DisplayCurrency {
  const l = (lang || "en").substring(0, 2).toLowerCase();
  if (l === "pt") return "BRL";
  if (l === "no") return "NOK";
  return enPref;
}

/** Look up the numeric price for a currency, falling back to price_eur. */
export function amountFor(row: PriceRow | null | undefined, cur: DisplayCurrency): number {
  if (!row) return 0;
  const map: Record<DisplayCurrency, number | null | undefined> = {
    USD: row.price_usd,
    EUR: row.price_eur,
    BRL: row.price_brl,
    NOK: row.price_nok,
  };
  const val = Number(map[cur] ?? 0);
  return Number.isFinite(val) ? val : 0;
}

/** Format a numeric amount into a short display string, e.g. "$120", "R$620", "kr 1200". */
export function formatAmount(amount: number, cur: DisplayCurrency): string {
  const rounded = Math.round(amount);
  switch (cur) {
    case "USD":
      return `$${rounded}`;
    case "EUR":
      return `€${rounded}`;
    case "BRL":
      return `R$${rounded}`;
    case "NOK":
      return `kr ${rounded}`;
  }
}

/** Convenience: pick currency and format the row in one call. */
export function formatPrice(
  row: PriceRow | null | undefined,
  lang: string,
  enPref: EnCurrencyPref,
): string {
  const cur = currencyForLang(lang, enPref);
  return formatAmount(amountFor(row, cur), cur);
}

const readStored = (): EnCurrencyPref => {
  if (typeof window === "undefined") return "USD";
  try {
    const v = window.localStorage.getItem(STORAGE_KEY);
    return v === "EUR" ? "EUR" : "USD";
  } catch {
    return "USD";
  }
};

/**
 * Preferred currency for English visitors, persisted to localStorage.
 * For pt/no this preference is unused (BRL / NOK are forced).
 */
export function usePreferredCurrency() {
  const [enPref, setEnPrefState] = useState<EnCurrencyPref>(() => readStored());

  useEffect(() => {
    if (typeof window === "undefined") return;
    const onStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) setEnPrefState(readStored());
    };
    const onCustom = () => setEnPrefState(readStored());
    window.addEventListener("storage", onStorage);
    window.addEventListener("fw-currency-change", onCustom as EventListener);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("fw-currency-change", onCustom as EventListener);
    };
  }, []);

  const setEnPref = useCallback((next: EnCurrencyPref) => {
    setEnPrefState(next);
    try {
      window.localStorage.setItem(STORAGE_KEY, next);
      window.dispatchEvent(new Event("fw-currency-change"));
    } catch {
      /* ignore */
    }
  }, []);

  return { enPref, setEnPref };
}

interface CurrencyToggleProps {
  variant?: "light" | "dark";
  className?: string;
}

/**
 * Small USD / EUR toggle, shown only for English visitors.
 * Renders nothing when the site language is not English.
 */
export function CurrencyToggle({ variant = "light", className = "" }: CurrencyToggleProps) {
  const { enPref, setEnPref } = usePreferredCurrency();
  const options: EnCurrencyPref[] = ["USD", "EUR"];
  const labelFor = (c: EnCurrencyPref) => (c === "USD" ? "$ USD" : "€ EUR");

  return (
    <div className={`inline-flex items-center gap-1 ${className}`}>
      {options.map((c) => {
        const active = enPref === c;
        return (
          <button
            key={c}
            type="button"
            onClick={() => setEnPref(c)}
            aria-pressed={active}
            title={c}
            className={`px-2 py-1 rounded text-[0.65rem] font-semibold tracking-[0.1em] uppercase transition-all ${
              active
                ? variant === "dark"
                  ? "bg-voyage-white/20 ring-1 ring-voyage-white/30 text-voyage-white"
                  : "bg-ink/10 ring-1 ring-ink/20 text-ink"
                : variant === "dark"
                  ? "text-voyage-white/60 hover:text-voyage-white"
                  : "text-voyage-muted hover:text-ink opacity-70 hover:opacity-100"
            }`}
          >
            {labelFor(c)}
          </button>
        );
      })}
    </div>
  );
}
