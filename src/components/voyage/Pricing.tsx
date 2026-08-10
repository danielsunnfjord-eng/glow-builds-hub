import { useMemo } from "react";
import { Link } from "@/lib/router-compat";
import { useTranslation } from "react-i18next";
import { Check } from "lucide-react";
import ScrollReveal from "./ScrollReveal";
import {
  CurrencyPicker,
  formatFromNok,
  useActiveCurrency,
  type Code,
} from "@/lib/fx";

const CALENDLY_URL = "https://calendly.com/daniel-lirafigueiredo-fora/reiseplanlegging";

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
  { key: "card2", nok: 3000, features: 6, href: CALENDLY_URL, external: true },
  { key: "card3", nok: 6000, features: 4, href: "/start-your-journey", highlight: true },
];

const TABLE_ROWS: number[] = [3000, 3650, 4350, 5650];

const Pricing = () => {
  const { t } = useTranslation();
  const { active, rate, setCurrency, available, showPicker } = useActiveCurrency();

  const format = useMemo(
    () => (nok: number) => formatFromNok(nok, active, rate),
    [active, rate],
  );

  const rateNote = active === "NOK" ? null : `1 NOK = ${rate.toFixed(4)} ${active}`;

  const CurrencySelect = () => (
    <CurrencyPicker
      value={active}
      onChange={(c: Code) => setCurrency(c)}
      available={available}
      label={t("pricing.currencyLabel")}
    />
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

                  <>
                    <div className="mb-1 flex items-end justify-between gap-3 flex-wrap">
                      <div className="min-w-0">
                        {card.key !== "card3" && (
                          <div className="text-[0.6rem] font-semibold tracking-[0.2em] uppercase text-voyage-muted mb-1">
                            {t(`${base}.price_label`)}
                          </div>
                        )}
                        <div className="font-serif text-[2rem] font-bold text-ink leading-none">
                          {format(card.nok)}
                        </div>
                      </div>
                      {showPicker && <CurrencySelect />}
                    </div>
                    {rateNote && (
                      <p className="text-[0.68rem] text-voyage-muted mb-6">{rateNote}</p>
                    )}
                    {!rateNote && <div className="mb-6" />}
                  </>

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
          <div className="mt-14">
            <div className="text-[0.65rem] font-semibold tracking-[0.2em] uppercase text-gold mb-3 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-gold" />
              {t("pricing.table.eyebrow")}
            </div>
            <h3 className="font-serif text-[clamp(1.4rem,2.6vw,1.9rem)] font-bold text-ink mb-6 tracking-tight">
              {t("pricing.table.heading")}
            </h3>

            {/* Desktop table */}
            <div className="hidden md:block overflow-hidden rounded-lg border border-ink/[0.08]">
              <table className="w-full border-collapse text-left">
                <thead>
                  <tr className="bg-ink text-voyage-white">
                    <th className="px-6 py-4 text-[0.62rem] font-semibold tracking-[0.2em] uppercase">
                      {t("pricing.table.groupSize")}
                    </th>
                    <th className="px-6 py-4 text-[0.62rem] font-semibold tracking-[0.2em] uppercase">
                      {t("pricing.table.duration")}
                    </th>
                    <th className="px-6 py-4 text-[0.62rem] font-semibold tracking-[0.2em] uppercase text-gold-2">
                      <div className="flex items-center gap-3 flex-wrap">
                        <span>{t("pricing.table.price")}</span>
                        {showPicker && <CurrencySelect />}
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {TABLE_ROWS.map((nok, i) => (
                    <tr
                      key={i}
                      className={i % 2 === 0 ? "bg-parchment-2" : "bg-[#f0e3cf]/40"}
                    >
                      <td className="px-6 py-4 text-[0.92rem] text-ink/85 border-t border-ink/[0.06]">
                        {t(`pricing.table.rows.${i}.group`)}
                      </td>
                      <td className="px-6 py-4 text-[0.92rem] text-ink/85 border-t border-ink/[0.06]">
                        {t(`pricing.table.rows.${i}.duration`)}
                      </td>
                      <td className="px-6 py-4 font-serif text-[1.15rem] font-bold text-gold border-t border-ink/[0.06] whitespace-nowrap">
                        {format(nok)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile stacked cards */}
            <div className="md:hidden space-y-4">
              {showPicker && (
                <div className="flex items-center justify-between gap-3 rounded-lg bg-ink px-4 py-3">
                  <span className="text-[0.62rem] font-semibold tracking-[0.2em] uppercase text-voyage-white">
                    {t("pricing.table.price")}
                  </span>
                  <CurrencySelect />
                </div>
              )}
              {TABLE_ROWS.map((nok, i) => (
                <div
                  key={i}
                  className="rounded-lg border border-ink/[0.08] bg-parchment-2 p-5"
                >
                  <div className="text-[0.58rem] font-semibold tracking-[0.2em] uppercase text-voyage-muted">
                    {t("pricing.table.groupSize")}
                  </div>
                  <div className="text-[0.95rem] text-ink/85 mb-3">
                    {t(`pricing.table.rows.${i}.group`)}
                  </div>
                  <div className="text-[0.58rem] font-semibold tracking-[0.2em] uppercase text-voyage-muted">
                    {t("pricing.table.duration")}
                  </div>
                  <div className="text-[0.95rem] text-ink/85 mb-3">
                    {t(`pricing.table.rows.${i}.duration`)}
                  </div>
                  <div className="text-[0.58rem] font-semibold tracking-[0.2em] uppercase text-voyage-muted">
                    {t("pricing.table.price")}
                  </div>
                  <div className="font-serif text-[1.35rem] font-bold text-gold leading-none mt-1">
                    {format(nok)}
                  </div>
                </div>
              ))}
            </div>

            {rateNote && (
              <p className="mt-3 text-[0.68rem] text-voyage-muted">{rateNote}</p>
            )}
          </div>
        </ScrollReveal>



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
