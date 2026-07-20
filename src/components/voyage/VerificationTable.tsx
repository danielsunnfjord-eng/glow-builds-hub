import { useMemo, useState } from "react";

// Isolated, additive feature: extracts named places from an itinerary
// markdown string and renders a Verification Table. Purely client-side —
// no backend calls, no changes to the itinerary generation pipeline.

export interface VerificationRow {
  name: string;
  category: string;
  link: string;
  confidence: "Verify" | "Stable";
  notes: string;
}

// ---------------------------------------------------------------------------
// Extraction
// ---------------------------------------------------------------------------
//
// The AI writer bolds far more than proper nouns (labels like "Dining
// suggestion:", full sentences like "Safe travels...", totals like "1800-3300
// NOK"). We therefore treat bold spans as CANDIDATES only, and accept them
// only if they look like a genuine named entity we could search on Google
// Maps.

// Words we should never accept on their own — section labels, time-of-day,
// generic day headings, and category labels the writer bolds.
const REJECT_EXACT = new Set(
  [
    // Section / label bolds
    "dining suggestion", "dining tip", "dining", "insider tip", "local insider tip",
    "local tip", "insider recommendation", "insider recommendations",
    "transport", "transport guidance", "transportation",
    "reservation", "reservation guidance", "reservations",
    "optional", "optional alternatives", "alternative", "alternatives",
    "notes", "note", "tips", "tip", "highlights", "highlight",
    "practical tips", "practical information", "practicalities",
    "packing", "packing list", "what to pack", "gear", "essentials",
    "budget", "estimated budget", "cost", "costs", "total", "totals",
    "summary", "overview", "conclusion", "introduction",
    // Time-of-day and day labels
    "morning", "afternoon", "evening", "night", "midday", "noon", "dawn", "dusk",
    "early morning", "late morning", "mid-morning", "midmorning",
    "early afternoon", "late afternoon", "mid-afternoon", "midafternoon",
    "early evening", "late evening",
    "arrival", "departure", "return", "check-in", "check in", "checkout", "check-out",
    "breakfast", "lunch", "dinner", "brunch", "supper", "snack",
    // Section polish the writer sometimes bolds
    "safe travels", "farewell", "welcome", "final thoughts",
  ].map((s) => s.toLowerCase()),
);

// Any occurrence of these tokens inside a candidate disqualifies it — these
// are almost always sentence fragments, totals, or generic gear lines.
const REJECT_TOKEN_RE = /\b(approximately|approx\.?|around|roughly|about|total|totals|per person|per day|per night|nok|eur|usd|brl|kroner|euros?|dollars?|reais?|budget|cost|price|prices|waterproof|jacket|jackets|trousers|pants|socks|shoes|boots|sunscreen|sunblock|layers?|clothing|underwear|hat|gloves|scarf|umbrella|memories|weatherproof|glorious|magical|unforgettable|remember|goodbye|hello|imagine|welcome)\b/i;

// Currency / number / range patterns — always a budget line, never a place.
const HAS_MONEY_RE = /\d[\d,\s.–-]*\s?(?:NOK|EUR|USD|BRL|kr|€|\$|R\$)/i;
const HAS_TIME_RANGE_RE = /\d{1,2}[:.]\d{2}/;

// Category rules keyed off tokens that must appear in the NAME itself (not
// just nearby context). The order matters — earlier rules win.
const NAME_CATEGORY_RULES: Array<{ re: RegExp; label: string }> = [
  { re: /\b(Museum|Museet|Kunsthall|Gallery|Galleri|Senter|Center|Centre)\b/, label: "Museum" },
  { re: /\b(Park|Parken|Gardens?|Hage|Skulpturpark)\b/, label: "Park" },
  { re: /\b(Fjord|Fjorden|Foss|Falls?|Glacier|Breen|Bre|Peak|Mountain|Fjell|Valley|Dalen|Lake|Vann|Vannet|Beach|Stranda|Island|Øy|Øya|Viewpoint|Utsikt)\b/, label: "Landmark" },
  { re: /\b(Church|Cathedral|Kirke|Kirken|Stavkirke|Stave Church|Domkirke|Chapel|Kapell)\b/, label: "Landmark" },
  { re: /\b(Opera House|Palace|Slott|Slottet|Fortress|Festning|Tower|Tårn)\b/, label: "Landmark" },
  { re: /\b(Hotel|Hotell|Lodge|Inn|Resort|Hostel|Guesthouse|Pensjonat|Rorbu|Rorbuer)\b/, label: "Hotel" },
  { re: /\b(Restaurant|Restauranten|Bistro|Brasserie|Osteria|Trattoria|Kitchen|Kro|Kroa|Pub|Bar|Bakery|Bakeri|Bakeriet|Bageri)\b/, label: "Restaurant" },
  { re: /\b(Cafe|Café|Kafé|Kaffebar|Kaffeforretning|Coffee|Coffee Roasters?|Roastery|Tea House)\b/, label: "Café" },
  { re: /\b(Flytoget|Bergensbanen|Flåmsbana|Hurtigruten|Widerøe|Ruter|Vy|SJ|Railway|Line|Ferry|Ferje|Express)\b/, label: "Transport" },
  { re: /\b(Tours?|Adventures?|Expeditions?|Safari|Safaris|Cruises?|Charters?|Guiding)\b/, label: "Tour" },
];

// Norwegian / European neighbourhood names commonly recommended in
// itineraries. Extend as needed.
const NEIGHBOURHOODS = new Set(
  [
    "Grünerløkka", "Grunerlokka", "Frogner", "Majorstuen", "Sagene",
    "St. Hanshaugen", "Sankt Hanshaugen", "Sørenga", "Sorenga",
    "Aker Brygge", "Tjuvholmen", "Bjørvika", "Bjorvika", "Vulkan",
    "Vippa", "Grønland", "Gronland", "Kvadraturen", "Bygdøy", "Bygdoy",
    "Bryggen", "Nordnes", "Sandviken",
  ].map((s) => s.toLowerCase()),
);

// A minimal allow-list for well-known single-token names that would otherwise
// be filtered out by the "must contain a category token" heuristic below.
const NAME_HINT_TOKENS = new Set(
  [
    "Mathallen", "Vulkan", "Vippa", "Bygdøy", "Bygdoy", "Bryggen",
    "Flytoget", "Bergensbanen", "Flåmsbana", "Flamsbana", "Hurtigruten",
  ].map((s) => s.toLowerCase()),
);

function normaliseName(raw: string): string {
  return raw
    .replace(/[*_`]+/g, "")
    .replace(/\s+/g, " ")
    .replace(/^[\s\-–—:;,.()"'`]+|[\s\-–—:;,.()"'`]+$/g, "")
    .trim();
}

function isTitleCase(name: string): boolean {
  const words = name.split(/\s+/).filter(Boolean);
  if (words.length === 0) return false;
  const connectorRe = /^(?:of|the|and|de|da|do|dos|das|på|i|for|&|og|av|en|un|una|le|la|les|du|des)$/i;
  let capitalised = 0;
  let significant = 0;
  for (const w of words) {
    if (connectorRe.test(w)) continue;
    significant += 1;
    // Accept "'s"/"—"/"&" tokens; look at the first alphabetic char.
    const firstAlpha = w.match(/[A-Za-zÀ-ÖØ-öø-ÿ]/);
    if (!firstAlpha) continue;
    if (firstAlpha[0] === firstAlpha[0].toUpperCase()) capitalised += 1;
  }
  if (significant === 0) return false;
  // Require all significant words to be capitalised — proper-noun test.
  return capitalised === significant;
}

function looksLikeSentence(name: string): boolean {
  // Sentence-terminating punctuation or an internal comma/semicolon almost
  // always means the writer bolded a sentence or a list.
  if (/[.!?;,]/.test(name)) return true;
  // Verbs / connectors that only appear in sentences.
  if (/\b(is|are|was|were|will|would|should|could|can|may|might|has|have|had|the|a|an)\s+[a-z]/i.test(name)) {
    // Allow "the" as part of a real name ("The Thief") — only reject when
    // followed by a lowercase word (sentence fragment).
    return true;
  }
  return false;
}

function candidateHasCategory(name: string): string | null {
  for (const { re, label } of NAME_CATEGORY_RULES) {
    if (re.test(name)) return label;
  }
  if (NEIGHBOURHOODS.has(name.toLowerCase())) return "Neighbourhood";
  if (NAME_HINT_TOKENS.has(name.toLowerCase())) {
    // Category-less well-known names — infer transport vs neighbourhood vs
    // market from the token itself.
    const k = name.toLowerCase();
    if (["flytoget", "bergensbanen", "flåmsbana", "flamsbana", "hurtigruten"].includes(k)) return "Transport";
    if (["mathallen", "vippa"].includes(k)) return "Market / Food Hall";
    return "Neighbourhood";
  }
  return null;
}

function refineCategoryFromContext(name: string, context: string): string | null {
  // Only used when the name itself doesn't give us the category. We accept
  // the entity only if the immediately surrounding sentence tells us WHAT it
  // is with a clear noun ("the X restaurant", "at X, a bakery", "X is a
  // museum"). Anything vaguer than that is rejected — we don't want to guess.
  const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const patterns: Array<{ re: RegExp; label: string }> = [
    { re: new RegExp(`${escaped}[^.]{0,80}?\\b(restaurant|bistro|brasserie|kitchen|kro|pub|bar|eatery|osteria|trattoria)\\b`, "i"), label: "Restaurant" },
    { re: new RegExp(`${escaped}[^.]{0,80}?\\b(caf[eé]|kaf[eé]|coffee|roastery|tea house|bakery|bakeri)\\b`, "i"), label: "Café" },
    { re: new RegExp(`${escaped}[^.]{0,80}?\\b(museum|gallery|kunsthall|exhibition)\\b`, "i"), label: "Museum" },
    { re: new RegExp(`${escaped}[^.]{0,80}?\\b(hotel|hotell|lodge|inn|resort|hostel|guesthouse|rorbu)\\b`, "i"), label: "Hotel" },
    { re: new RegExp(`${escaped}[^.]{0,80}?\\b(park|gardens?|skulpturpark)\\b`, "i"), label: "Park" },
    { re: new RegExp(`${escaped}[^.]{0,80}?\\b(neighbourhood|neighborhood|district|quarter|area)\\b`, "i"), label: "Neighbourhood" },
    { re: new RegExp(`${escaped}[^.]{0,80}?\\b(ferry|train|railway|line|express|shuttle|tram|bus)\\b`, "i"), label: "Transport" },
    { re: new RegExp(`${escaped}[^.]{0,80}?\\b(tour|guided walk|walking tour|boat trip|cruise|safari)\\b`, "i"), label: "Tour" },
    { re: new RegExp(`${escaped}[^.]{0,80}?\\b(church|cathedral|kirke|stavkirke|chapel|palace|fortress|tower)\\b`, "i"), label: "Landmark" },
    // Reverse ordering: "the X restaurant", "a Y bakery"
    { re: new RegExp(`\\b(the|a|an)\\s+${escaped}\\s+(restaurant|caf[eé]|bakery|museum|hotel|park|bar)\\b`, "i"), label: "" },
  ];
  for (const { re, label } of patterns) {
    const m = context.match(re);
    if (m) return label || m[m.length - 1] || null;
  }
  return null;
}

const VERIFY_HINTS = /\b(Michelin|\d{1,2}[:.]\d{2}\s?(?:am|pm|h)?\b|\d+\s?(?:EUR|€|NOK|kr|USD|\$|BRL|R\$)|open(?:s|ed)?\b|clos(?:ed|es|ing)\b|hours?\b|seasonal|advance booking|reservation|book(?:s|ed|ing)?\s+(?:ahead|in advance|early)|award|starred|per person|entry fee|ticket)/i;

function buildLink(name: string, destination: string): string {
  const q = encodeURIComponent(`${name} ${destination}`.trim());
  return `https://www.google.com/maps/search/?api=1&query=${q}`;
}

function extractContext(markdown: string, index: number, radius = 240): string {
  const start = Math.max(0, index - radius);
  const end = Math.min(markdown.length, index + radius);
  return markdown.slice(start, end).replace(/\s+/g, " ").trim();
}

export function extractVerificationRows(
  markdown: string,
  destination: string,
): VerificationRow[] {
  if (!markdown) return [];

  const rows = new Map<string, VerificationRow>();

  const boldRe = /(\*\*|__)(.+?)\1/g;
  let m: RegExpExecArray | null;
  while ((m = boldRe.exec(markdown)) !== null) {
    const raw = normaliseName(m[2]);
    if (!raw) continue;

    // --- Reject filters --------------------------------------------------
    if (REJECT_EXACT.has(raw.toLowerCase())) continue;
    // Bolded label followed by colon in the original span ("Dining suggestion:")
    if (/[:：]\s*$/.test(m[2].trim())) continue;
    if (raw.length < 3 || raw.length > 60) continue;
    const wordCount = raw.split(/\s+/).filter(Boolean).length;
    if (wordCount < 1 || wordCount > 6) continue;
    if (looksLikeSentence(raw)) continue;
    if (HAS_MONEY_RE.test(raw) || HAS_TIME_RANGE_RE.test(raw)) continue;
    if (REJECT_TOKEN_RE.test(raw)) continue;
    if (!isTitleCase(raw)) continue;
    // Reject anything starting with a lowercase article/preposition once
    // stripped — extra safety on top of Title Case.
    if (/^(?:a|an|the|some|any|this|that|these|those)\s/i.test(raw) && wordCount <= 2) continue;
    // Day headings occasionally bolded ("Day 1", "Day 2 — ...")
    if (/^day\s+\d+/i.test(raw)) continue;

    // --- Category resolution --------------------------------------------
    const ctx = extractContext(markdown, m.index);
    let category = candidateHasCategory(raw);
    if (!category) {
      const fromCtx = refineCategoryFromContext(raw, ctx);
      if (fromCtx) category = fromCtx;
    }
    // If we STILL can't tell what it is, it's not a real entity for our
    // purposes — drop it. This is what prevents "Departure" / stray Title
    // Case fragments slipping through.
    if (!category) continue;

    const key = raw.toLowerCase();
    if (rows.has(key)) continue;

    const hasHint = VERIFY_HINTS.test(ctx);
    let notes = "";
    if (hasHint) {
      const hintMatch = ctx.match(VERIFY_HINTS);
      notes = hintMatch ? `Mentions: ${hintMatch[0]}` : "";
    }
    rows.set(key, {
      name: raw,
      category: category.charAt(0).toUpperCase() + category.slice(1),
      link: buildLink(raw, destination),
      confidence: hasHint ? "Verify" : "Stable",
      notes,
    });
  }

  return Array.from(rows.values()).sort((a, b) => a.name.localeCompare(b.name));
}

// ---------------------------------------------------------------------------
// UI (unchanged layout, columns, CSV export)
// ---------------------------------------------------------------------------

interface Props {
  content: string;
  destination: string;
}

const VerificationTable = ({ content, destination }: Props) => {
  const [open, setOpen] = useState(false);
  const rows = useMemo(
    () => extractVerificationRows(content || "", destination || ""),
    [content, destination],
  );

  const verifyCount = rows.filter((r) => r.confidence === "Verify").length;

  const copyCsv = async () => {
    const header = "Name,Category,Link,Confidence,Notes";
    const esc = (s: string) => `"${(s || "").replace(/"/g, '""')}"`;
    const body = rows
      .map((r) => [r.name, r.category, r.link, r.confidence, r.notes].map(esc).join(","))
      .join("\n");
    try {
      await navigator.clipboard.writeText(`${header}\n${body}`);
    } catch {
      /* noop */
    }
  };

  return (
    <details
      open={open}
      onToggle={(e) => setOpen((e.target as HTMLDetailsElement).open)}
      className="rounded border border-parchment-3 bg-parchment/40"
    >
      <summary className="cursor-pointer select-none px-3 py-2 text-[0.85rem] font-medium text-ink flex items-center justify-between gap-3">
        <span className="flex items-center gap-2">
          🔍 Verification Table
          <span className="text-[0.72rem] font-normal text-voyage-muted">
            {rows.length} place{rows.length === 1 ? "" : "s"}
            {verifyCount > 0 ? ` · ${verifyCount} to verify` : ""}
          </span>
        </span>
        <span className="text-[0.72rem] text-voyage-muted">{open ? "Hide" : "Show"}</span>
      </summary>

      <div className="px-3 pb-3">
        {rows.length === 0 ? (
          <p className="text-[0.8rem] text-voyage-muted py-2">
            No named places detected yet. Generate or edit the itinerary — the table extracts
            <strong> bolded</strong> place names automatically.
          </p>
        ) : (
          <>
            <div className="flex justify-end mb-2">
              <button
                type="button"
                onClick={copyCsv}
                className="text-[0.72rem] px-2 py-1 rounded border border-parchment-3 hover:bg-parchment"
              >
                Copy as CSV
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-[0.8rem] border-collapse">
                <thead>
                  <tr className="text-left text-voyage-muted border-b border-parchment-3">
                    <th className="py-1.5 pr-3 font-medium">Name</th>
                    <th className="py-1.5 pr-3 font-medium">Category</th>
                    <th className="py-1.5 pr-3 font-medium">Link</th>
                    <th className="py-1.5 pr-3 font-medium">Confidence</th>
                    <th className="py-1.5 font-medium">Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => (
                    <tr key={r.name} className="border-b border-parchment-3/50 align-top">
                      <td className="py-1.5 pr-3 font-medium text-ink">{r.name}</td>
                      <td className="py-1.5 pr-3 text-ink-2">{r.category}</td>
                      <td className="py-1.5 pr-3">
                        <a
                          href={r.link}
                          target="_blank"
                          rel="noreferrer noopener"
                          className="text-ocean-600 underline hover:text-ocean-700"
                        >
                          Open ↗
                        </a>
                      </td>
                      <td className="py-1.5 pr-3">
                        <span
                          className={
                            r.confidence === "Verify"
                              ? "inline-block px-1.5 py-0.5 rounded bg-amber-100 text-amber-900 text-[0.7rem]"
                              : "inline-block px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-900 text-[0.7rem]"
                          }
                        >
                          {r.confidence}
                        </span>
                      </td>
                      <td className="py-1.5 text-ink-2">{r.notes || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="mt-2 text-[0.7rem] text-voyage-muted">
              Links open a Google Maps search using the place name + destination. Rows flagged
              <span className="mx-1 px-1 rounded bg-amber-100 text-amber-900">Verify</span>
              mention hours, prices, seasonal dates, awards or Michelin — double-check before publishing.
            </p>
          </>
        )}
      </div>
    </details>
  );
};

export default VerificationTable;
