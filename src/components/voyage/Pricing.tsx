import { useEffect, useMemo, useState } from "react";
import { Link } from "@/lib/router-compat";
import { useTranslation } from "react-i18next";
import { Check, ChevronDown } from "lucide-react";
import ScrollReveal from "./ScrollReveal";

const CALENDLY_URL = "https://calendly.com/daniel-lirafigueiredo-fora/reiseplanlegging";

type Code = "NOK" | "BRL" | "EUR" | "USD";

const CURRENCIES: { code: Code; flag: string; locale: string }[] = [
  { code: "NOK", flag: "🇳🇴", locale: "nb-NO" },
  { code: "BRL", flag: "🇧🇷", locale: "pt-BR" },
  { code: "EUR", flag: "🇪🇺", locale: "de-DE" },
  { code: "USD", flag: "🇺🇸", locale: "en-US" },
];

const CACHE_KEY = "fw_fx_nok_rates";
const TTL_MS = 24 * 60 * 60 * 1000;

type Rates = Record<string, number>;

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

/** Live FX rates with NOK as base. Returns null while loading, {} on failure. */
function useNokRates() {
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

interface CardData {
  key: "card1" | "card2" | "card3";
  nok: number;
  features: number;
  href: string;
  external?: boolean;
  highlight?: boolean;
}

const CARDS: CardData[] = [
  { key: "card1", nok: 385, features: 4, href: "/catalogue" },
  { key: "card2", nok: 3000, features: 3, href: CALENDLY_URL, external: true },
  { key: "card3", nok: 6000, features: 5, href: "/start-your-journey", highlight: true },
];

const Pricing = () => {
  const { t } = useTranslation();
  const { rates, failed } = useNokRates();
  const [currency, setCurrency] = useState<Code>("NOK");

  const showPicker = !failed;
  const active = currency === "NOK" || rates[currency] ? currency : "NOK";
  const meta = CURRENCIES.find((c) => c.code === active)!;
  const rate = active === "NOK" ? 1 : Number(rates[active] ?? 1);

  const format = useMemo(
    () => (nok: number) =>
      new Intl.NumberFormat(meta.locale, {
        style: "currency",
        currency: active,
        maximumFractionDigits: active === "NOK" ? 0 : 2,
      }).format(nok * rate),
    [meta.locale, active, rate],
  );

  const rateNote =
    active === "NOK" ? null : `1 NOK = ${rate.toFixed(4)} ${active}`;

  const CurrencyPicker = () => (
    <div className="relative inline-flex items-center">
      <select
        value={active}
        onChange={(e) => setCurrency(e.target.value as Code)}
        aria-label={t("pricing.currencyLabel")}
        className="appearance-none bg-parchment border border-ink/15 rounded-xs pl-3 pr-8 py-1.5 text-[0.75rem] font-semibold tracking-[0.08em] text-ink cursor-pointer hover:border-ink/35 transition-colors"
      >
        {CURRENCIES.filter((c) => c.code === "NOK" || rates[c.code]).map((c) => (
          <option key={c.code} value={c.code}>
            {c.flag} {c.code}
          </option>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute right-2 h-3.5 w-3.5 text-voyage-muted" />
    </div>
  );

  return (
    <section id="pricing" className="bg-parchment py-24 px-6 md:px-16">
      <div className="max-w-[1200px] mx-auto">
        <ScrollReveal>
          <div className="text-center max-w-2xl mx-auto mb-14">
            <div className="text-[0.65rem] font-semibold tracking-[0.22em] uppercase text-gold mb-4 flex items-center justify-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-gold" />
              {t("pricing.eyebrow")}
            </div>
            <h2 className="font-serif text-[clamp(1.9rem,3.6vw,2.75rem)] font-bold leading-[1.1] tracking-tight text-ink mb-4">
              {t("pricing.heading")}
            </h2>
            <p className="text-[0.95rem] text-voyage-muted leading-relaxed">
              {t("pricing.subtext")}
            </p>
          </div>
        </ScrollReveal>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
          {CARDS.map((card) => {
            const base = `pricing.${card.key}`;
            const features = Array.from({ length: card.features }, (_, i) =>
              t(`${base}.features.${i}`),
            );
            const btnClass = card.highlight
              ? "bg-gold text-ink hover:bg-gold-2"
              : "bg-ink text-voyage-white hover:bg-ink/85";

            return (
              <ScrollReveal key={card.key}>
                <div
                  className={`h-full flex flex-col rounded-lg p-8 ${
                    card.highlight
                      ? "bg-[#f0e3cf]/60 border-2 border-gold/60 shadow-[0_18px_40px_-24px_rgba(26,26,46,0.35)]"
                      : "bg-parchment-2 border border-ink/[0.06]"
                  }`}
                >
                  {card.highlight && (
                    <span className="self-start mb-4 inline-flex items-center rounded-full bg-gold px-3 py-1 text-[0.6rem] font-bold tracking-[0.18em] uppercase text-ink">
                      {t("pricing.card3.badge")}
                    </span>
                  )}
                  <div className="text-[0.65rem] font-semibold tracking-[0.2em] uppercase text-gold mb-3 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-gold" />
                    {t(`${base}.label`)}
                  </div>
                  <h3 className="font-serif text-[1.5rem] font-bold text-ink mb-2">
                    {t(`${base}.title`)}
                  </h3>
                  <p className="text-[0.9rem] text-voyage-muted leading-relaxed mb-5">
                    {t(`${base}.description`)}
                  </p>
                  {card.highlight && (
                    <p className="text-[0.72rem] tracking-[0.06em] uppercase text-ink/70 mb-4">
                      {t("pricing.card3.fee_note")}
                    </p>
                  )}

                  <div className="mb-1 flex items-end justify-between gap-3 flex-wrap">
                    <div className="min-w-0">
                      <div className="text-[0.6rem] font-semibold tracking-[0.2em] uppercase text-voyage-muted mb-1">
                        {t(`${base}.price_label`)}
                      </div>
                      <div className="font-serif text-[2rem] font-bold text-ink leading-none">
                        {format(card.nok)}
                      </div>
                    </div>
                    {showPicker && <CurrencyPicker />}
                  </div>
                  {rateNote && (
                    <p className="text-[0.68rem] text-voyage-muted mb-6">{rateNote}</p>
                  )}
                  {!rateNote && <div className="mb-6" />}

                  <ul className="space-y-2.5 mb-8 flex-1">
                    {features.map((f) => (
                      <li key={f} className="flex items-start gap-2 text-[0.86rem] text-ink/85">
                        <Check className="h-4 w-4 mt-0.5 shrink-0 text-gold" strokeWidth={3} />
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>

                  {card.external ? (
                    <a
                      href={card.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`inline-flex items-center justify-center px-6 py-3 font-semibold text-[0.75rem] tracking-[0.1em] uppercase rounded-xs transition-colors no-underline ${btnClass}`}
                    >
                      {t(`${base}.button`)}
                    </a>
                  ) : (
                    <Link
                      to={card.href}
                      className={`inline-flex items-center justify-center px-6 py-3 font-semibold text-[0.75rem] tracking-[0.1em] uppercase rounded-xs transition-colors no-underline ${btnClass}`}
                    >
                      {t(`${base}.button`)}
                    </Link>
                  )}
                </div>
              </ScrollReveal>
            );
          })}
        </div>

        <ScrollReveal>
          <div className="mt-10 grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 bg-[#f0e3cf]/60 border border-gold/25 rounded-lg p-8 md:p-10">
            <div>
              <h3 className="font-serif text-[1.4rem] font-bold text-ink mb-3">
                {t("pricing.explainer.heading")}
              </h3>
              <p className="text-[0.92rem] text-voyage-muted leading-relaxed">
                {t("pricing.explainer.body")}
              </p>
            </div>
            <div>
              <div className="text-[0.65rem] font-semibold tracking-[0.2em] uppercase text-gold mb-4 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-gold" />
                {t("pricing.explainer.good_news_label")}
              </div>
              <ul className="space-y-2.5">
                {[0, 1, 2, 3].map((i) => (
                  <li key={i} className="flex items-start gap-2 text-[0.88rem] text-ink/85">
                    <Check className="h-4 w-4 mt-0.5 shrink-0 text-gold" strokeWidth={3} />
                    <span>{t(`pricing.explainer.good_news.${i}`)}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
};

export default Pricing;
