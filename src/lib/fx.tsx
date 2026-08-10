import { useCallback, useEffect, useMemo, useState } from "react";
import { ChevronDown } from "lucide-react";

/**
 * Shared FX + display-currency logic.
 * NOK is the single source of truth for every price on the site; everything
 * else is converted with one live rate set, cached 24h and shared across the
 * homepage pricing cards and the itinerary shop subpages.
 */

export type Code = "NOK" | "BRL" | "EUR" | "USD";

export const CURRENCIES: { code: Code; flag: string; locale: string }[] = [
  { code: "NOK", flag: "🇳🇴", locale: "nb-NO" },
  { code: "BRL", flag: "🇧🇷", locale: "pt-BR" },
  { code: "EUR", flag: "🇪🇺", locale: "de-DE" },
  { code: "USD", flag: "🇺🇸", locale: "en-US" },
];

const CACHE_KEY = "fw_fx_nok_rates";
const PREF_KEY = "fw_display_currency";
const PREF_EVENT = "fw-display-currency-change";
const TTL_MS = 24 * 60 * 60 * 1000;

export type Rates = Record<string, number>;

const readCache = (): Rates | null => {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { at: number; rates: Rates };
    if (!parsed?.rates || Date.now() - parsed.at > TTL_MS) return null;
    return parsed.rates;
  } catch {
    return null;
  }
};

/** Live FX rates with NOK as base. `failed` = never guess, fall back to NOK. */
export function useNokRates() {
  const [rates, setRates] = useState<Rates | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const cached = readCache();
    if (cached) {
      setRates(cached);
      return;
    }
    let alive = true;

    const fromFrankfurter = async (): Promise<Rates> => {
      const r = await fetch("https://api.frankfurter.dev/v1/latest?base=NOK&symbols=BRL,EUR,USD");
      if (!r.ok) throw new Error("fx");
      const data = (await r.json()) as { rates?: Rates };
      if (!data?.rates?.["USD"]) throw new Error("fx");
      return data.rates;
    };

    const fromErApi = async (): Promise<Rates> => {
      const r = await fetch("https://open.er-api.com/v6/latest/NOK");
      if (!r.ok) throw new Error("fx");
      const data = (await r.json()) as { rates?: Rates };
      if (!data?.rates?.["USD"]) throw new Error("fx");
      return { BRL: data.rates["BRL"]!, EUR: data.rates["EUR"]!, USD: data.rates["USD"]! };
    };

    (async () => {
      try {
        let fetched: Rates;
        try {
          fetched = await fromFrankfurter();
        } catch {
          fetched = await fromErApi();
        }
        if (!alive) return;
        const next: Rates = { NOK: 1, ...fetched };
        setRates(next);
        try {
          window.localStorage.setItem(CACHE_KEY, JSON.stringify({ at: Date.now(), rates: next }));
        } catch {
          /* ignore */
        }
      } catch {
        if (alive) setFailed(true);
      }
    })();

    return () => {
      alive = false;
    };
  }, []);

  return { rates: rates ?? { NOK: 1 }, ready: rates !== null, failed };
}

const readPref = (): Code => {
  if (typeof window === "undefined") return "NOK";
  try {
    const v = window.localStorage.getItem(PREF_KEY);
    return v === "BRL" || v === "EUR" || v === "USD" || v === "NOK" ? v : "NOK";
  } catch {
    return "NOK";
  }
};

/** Display currency shared across the whole site for this visitor. */
export function useDisplayCurrency() {
  const [currency, setCurrencyState] = useState<Code>("NOK");

  useEffect(() => {
    setCurrencyState(readPref());
    const sync = () => setCurrencyState(readPref());
    window.addEventListener(PREF_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(PREF_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  const setCurrency = useCallback((next: Code) => {
    setCurrencyState(next);
    try {
      window.localStorage.setItem(PREF_KEY, next);
      window.dispatchEvent(new Event(PREF_EVENT));
    } catch {
      /* ignore */
    }
  }, []);

  return { currency, setCurrency };
}

/** Decimal precision we both display and charge in. */
export const precisionFor = (code: Code) => (code === "NOK" ? 0 : 2);

/** Amount actually charged, in major units, matching what is displayed. */
export function convertFromNok(nok: number, code: Code, rate: number): number {
  const p = precisionFor(code);
  const factor = Math.pow(10, p);
  return Math.round(nok * rate * factor) / factor;
}

export function formatCurrency(amount: number, code: Code): string {
  const meta = CURRENCIES.find((c) => c.code === code)!;
  return new Intl.NumberFormat(meta.locale, {
    style: "currency",
    currency: code,
    maximumFractionDigits: precisionFor(code),
    minimumFractionDigits: precisionFor(code) === 0 ? 0 : 2,
  }).format(amount);
}

export function formatFromNok(nok: number, code: Code, rate: number): string {
  return formatCurrency(convertFromNok(nok, code, rate), code);
}

/** Smallest currency unit (øre / cents) for Stripe. */
export function toMinorUnits(amount: number, code: Code): number {
  return Math.round(amount * 100);
}

/**
 * One place that resolves "what currency are we actually showing", given the
 * live rates. Falls back to NOK whenever FX is unavailable.
 */
export function useActiveCurrency() {
  const { rates, failed } = useNokRates();
  const { currency, setCurrency } = useDisplayCurrency();
  const active: Code = !failed && (currency === "NOK" || rates[currency]) ? currency : "NOK";
  const rate = active === "NOK" ? 1 : Number(rates[active] ?? 1);
  const available = useMemo(
    () => CURRENCIES.filter((c) => c.code === "NOK" || (!failed && rates[c.code])),
    [rates, failed],
  );
  return { active, rate, rates, failed, setCurrency, available, showPicker: !failed };
}

interface PickerProps {
  value: Code;
  onChange: (c: Code) => void;
  available: { code: Code; flag: string }[];
  label?: string;
  className?: string;
}

export function CurrencyPicker({ value, onChange, available, label, className = "" }: PickerProps) {
  return (
    <div className={`relative inline-flex items-center ${className}`}>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as Code)}
        aria-label={label ?? "Currency"}
        className="appearance-none bg-parchment border border-ink/15 rounded-xs pl-3 pr-8 py-1.5 text-[0.75rem] font-semibold tracking-[0.08em] text-ink cursor-pointer hover:border-ink/35 transition-colors"
      >
        {available.map((c) => (
          <option key={c.code} value={c.code}>
            {c.flag} {c.code}
          </option>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute right-2 h-3.5 w-3.5 text-voyage-muted" />
    </div>
  );
}
