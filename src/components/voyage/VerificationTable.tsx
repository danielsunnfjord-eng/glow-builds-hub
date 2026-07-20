import { useMemo, useState } from "react";

// Isolated, additive feature: extracts genuine named entities from itinerary
// markdown and renders a Verification Table. Purely client-side, no backend
// calls, no changes to itinerary generation, rendering, or storage.
//
// Extraction strategy:
//   1. Find every Proper-Noun sequence (up to 6 tokens) in the prose.
//   2. Strip leading imperative verbs / prepositions / adjectives so
//      sentence-initial capitalisation ("Book Kontrast" → "Kontrast") and
//      descriptor prefixes ("Michelin-starred Kontrast" → "Kontrast") don't
//      pollute the result.
//   3. Reject sentence fragments, budget lines, times, packing terms,
//      generic labels ("Departure", "Late Afternoon", "Optional
//      alternatives"), and nationality/language adjectives.
//   4. Accept a candidate only if we can name what it is — either from a
//      keyword inside the name itself (Museum, Park, Restaurant, Hotel,
//      Church, Fjord, Cafe, Bakery, Tour, Ferry, etc.), from an explicit
//      allow-list of well-known named entities (Flytoget, Grünerløkka, Tim
//      Wendelboe…), or from an adjacent noun in the SAME sentence within 60
//      characters of the name.
//   5. Otherwise the candidate is dropped — we don't guess a category.

export interface VerificationRow {
  name: string;
  category: string;
  link: string;
  confidence: "Verify" | "Stable";
  notes: string;
}

// ---------------------------------------------------------------------------
// Reject sets
// ---------------------------------------------------------------------------

const REJECT_EXACT = new Set(
  [
    // Section / label bolds
    "dining", "dining suggestion", "dining tip", "insider tip", "local insider tip",
    "transport", "transport guidance", "reservation", "reservation guidance", "reservations",
    "optional", "optional alternatives", "optional alternative",
    "notes", "note", "tips", "tip", "highlights", "highlight", "practical tips",
    "budget", "total", "overview", "summary", "introduction", "conclusion",
    // Time-of-day / day labels
    "morning", "afternoon", "evening", "night", "midday", "noon", "dawn", "dusk",
    "early morning", "late morning", "mid-morning",
    "early afternoon", "late afternoon", "mid-afternoon",
    "early evening", "late evening",
    "arrival", "departure", "return", "check-in", "checkout", "check-out",
    "breakfast", "lunch", "dinner", "brunch", "snack", "supper",
    "safe travels", "welcome", "farewell", "goodbye", "hello", "imagine",
    // Cardinal / seasonal / weekday
    "north", "south", "east", "west", "northern", "southern", "eastern", "western",
    "summer", "winter", "spring", "autumn", "fall",
    "january", "february", "march", "april", "may", "june", "july", "august",
    "september", "october", "november", "december",
    "monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday",
    "today", "tomorrow", "yesterday", "tonight",
    "day", "days", "week", "weeks", "weekend",
  ].map((s) => s.toLowerCase()),
);

const ADJECTIVES = new Set(
  [
    "nordic", "norwegian", "scandinavian", "european", "american", "brazilian", "italian",
    "french", "spanish", "german", "japanese", "chinese", "portuguese", "greek", "thai",
    "vietnamese", "korean", "indian", "pakistani", "mexican", "british", "english", "irish",
    "scottish", "danish", "swedish", "finnish", "russian", "polish", "ukrainian", "arabic",
    "kurdish", "syrian", "israeli", "palestinian", "egyptian", "moroccan", "ethiopian",
    "argentine", "chilean", "peruvian", "colombian", "venezuelan", "cuban", "filipino",
    "indonesian", "turkish", "lebanese", "iranian", "canadian", "australian", "austrian",
    "swiss", "belgian", "dutch", "hungarian", "czech", "romanian", "bulgarian", "serbian",
    "croatian", "icelandic", "mediterranean", "parisian", "scandi", "asian", "african",
    "oriental", "latin", "hispanic", "celtic", "balkan", "alpine", "tropical", "arctic",
    "antarctic", "cosmopolitan", "local", "regional", "international", "global", "urban",
    "rural", "modern", "contemporary", "traditional", "classic", "vintage", "authentic",
    "gourmet", "premium", "luxury", "boutique", "designer", "seasonal",
  ].map((s) => s.toLowerCase()),
);

// Leading tokens we strip off multi-word candidates.
const LEADING_NOISE = new Set(
  [
    "book", "buy", "skip", "swap", "download", "stop", "head", "walk", "take", "catch",
    "order", "grab", "visit", "see", "check", "note", "try", "start", "end", "begin",
    "finish", "continue", "return", "go", "come", "stay", "leave", "depart", "arrive",
    "board", "climb", "descend", "cross", "follow", "pass", "reach", "find", "choose",
    "pick", "select", "reserve", "confirm", "cancel", "pay", "tip", "ask", "request",
    "enjoy", "savour", "savor", "sample", "taste", "sip", "drink", "eat", "dine", "sleep",
    "rest", "relax", "explore", "discover", "wander", "stroll", "hike", "bike", "cycle",
    "drive", "ride", "fly", "sail", "swim", "dive", "surf", "fish", "shop", "browse",
    "photograph", "learn", "listen", "watch", "observe", "meet", "greet", "celebrate",
    "toast", "raise", "tour", "expect", "plan", "prepare", "pack", "dress", "wear",
    "bring", "carry", "use", "install", "open", "close", "turn", "press", "tap", "swipe",
    "if", "when", "while", "since", "after", "before", "during", "instead",
    "alternatively", "optionally", "perhaps", "maybe", "sometimes", "usually", "often",
    "always", "never", "insider", "peak", "from", "around", "between", "among", "across",
    "against", "along", "beside", "below", "beneath", "above", "over", "under", "near",
    "far", "past", "through", "throughout", "towards", "toward", "onto", "upon", "within",
    "without", "also", "then", "next", "later", "finally", "first", "second", "third",
    "fourth", "fifth", "one", "two", "three", "four", "five", "six", "seven", "eight",
    "nine", "ten", "recommend", "recommended", "recommends", "recommendation",
    "recommendations", "booking", "bookings", "reservations", "reservation", "transport",
    "transportation", "dining", "food", "drinks", "cuisine", "local",
  ].map((s) => s.toLowerCase()),
);

// Descriptor-only phrases we drop entirely (Michelin-starred, Renzo Piano-designed).
const DESCRIPTOR_ONLY_RE = /^(?:.+-starred|.+-designed|.+-inspired|.+-owned|.+-run|.+-based|.+-style)$/i;

const REJECT_TOKEN_RE = /\b(?:approximately|approx|around|roughly|total|budget|cost|price|nok|eur|usd|brl|kroner|euros?|dollars?|reais?|per person|per day|per night|waterproof|jacket|trousers|pants|socks|shoes|boots|sunscreen|sunblock|layers?|clothing|memories|weatherproof|glorious|unforgettable)\b/i;
const HAS_MONEY_RE = /\d[\d,\s.–-]*\s?(?:NOK|EUR|USD|BRL|kr|€|\$|R\$)/i;
const HAS_TIME_RE = /\d{1,2}[:.]\d{2}/;
const CONNECTOR_RE = /^(?:of|the|and|de|da|do|dos|das|på|i|for|og|av|du|des|le|la|les|von|van|zu|&|-|—|–)$/i;

// ---------------------------------------------------------------------------
// Category resolution
// ---------------------------------------------------------------------------

const NAME_RULES: Array<{ re: RegExp; label: string }> = [
  { re: /\bOpera House\b/i, label: "Landmark" },
  { re: /\bPeace (?:Center|Centre)\b/i, label: "Museum" },
  { re: /\b(?:Museum|Museet|Kunsthall|Gallery|Galleri)\b/i, label: "Museum" },
  { re: /\b(?:Park|Parken|Gardens?|Skulpturpark)\b/i, label: "Park" },
  { re: /\b(?:Beach|Stranda|Island|Viewpoint|Utsikt|Fjord|Fjorden|Foss|Falls?|Glacier|Peak|Mountain|Fjell|Valley|Dalen|Lake|Waterfall)\b/i, label: "Landmark" },
  { re: /\b(?:Church|Cathedral|Kirke|Stavkirke|Stave Church|Domkirke|Chapel|Kapell)\b/i, label: "Landmark" },
  { re: /\b(?:Palace|Slott|Slottet|Fortress|Festning|Tower|Castle)\b/i, label: "Landmark" },
  { re: /\b(?:Hotel|Hotell|Lodge|Inn|Resort|Hostel|Guesthouse|Rorbu|Rorbuer)\b/i, label: "Hotel" },
  { re: /\b(?:Restaurant|Restauranten|Bistro|Brasserie|Osteria|Trattoria|Bakery|Bakeri|Bakeriet)\b/i, label: "Restaurant" },
  { re: /\b(?:Cafe|Café|Kafé|Kaffebar|Coffee Roasters?|Roastery|Tea House)\b/i, label: "Café" },
  { re: /\b(?:Tours?|Adventures?|Expeditions?|Safari|Safaris)\b/i, label: "Tour" },
];

// Allow-list of well-known named entities that don't self-identify. Extend
// per destination as needed. Values are the category to assign.
const ALLOW = new Map<string, string>(
  Object.entries({
    // Oslo neighbourhoods
    "grünerløkka": "Neighbourhood", frogner: "Neighbourhood", majorstuen: "Neighbourhood",
    sagene: "Neighbourhood", "sørenga": "Neighbourhood", "aker brygge": "Neighbourhood",
    tjuvholmen: "Neighbourhood", "bjørvika": "Neighbourhood", vulkan: "Neighbourhood",
    "grønland": "Neighbourhood", kvadraturen: "Neighbourhood", "bygdøy": "Neighbourhood",
    "st. hanshaugen": "Neighbourhood", "tøyen": "Neighbourhood",
    // Bergen
    bryggen: "Neighbourhood", nordnes: "Neighbourhood", sandviken: "Neighbourhood",
    // Markets / food halls
    mathallen: "Market / Food Hall", vippa: "Market / Food Hall",
    "mathallen oslo": "Market / Food Hall",
    // Oslofjord islands
    "hovedøya": "Landmark", gressholmen: "Landmark", "lindøya": "Landmark",
    "langøyene": "Landmark", huk: "Landmark",
    // Transport brands / stations
    flytoget: "Transport", bergensbanen: "Transport", "flåmsbana": "Transport",
    hurtigruten: "Transport", "widerøe": "Transport", vy: "Transport", ruter: "Transport",
    "oslo s": "Transport", gardermoen: "Transport", jernbanetorget: "Transport",
    nationaltheatret: "Transport",
    // Well-known specific venues
    "lekter'n": "Restaurant", "bølgen & moi": "Restaurant", dok: "Restaurant",
    "tjuvholmen sentralen": "Bar", "sentralen": "Bar",
    smalhans: "Restaurant", kontrast: "Restaurant", brutus: "Restaurant",
    vaaghals: "Restaurant", hitchhiker: "Restaurant",
    territoriet: "Bar", "kuba bar": "Bar",
    "godt brød": "Café", "tim wendelboe": "Café",
    // Well-known Oslo attractions
    vigeland: "Park", monolith: "Landmark", akershus: "Landmark", salt: "Landmark",
    damstredet: "Neighbourhood", telthusbakken: "Neighbourhood",
    akerselva: "Landmark", oslofjord: "Landmark", ekeberg: "Park",
  }),
);

const CTX_ANCHORS: Array<{ re: RegExp; label: string }> = [
  { re: /\b(?:restaurant|bistro|brasserie|kitchen|eatery|osteria|trattoria|seafood spot|dining room|steakhouse)\b/i, label: "Restaurant" },
  { re: /\b(?:caf[eé]|coffee\s+(?:shop|bar|roaster|roastery)|roastery|bakery|bakeri|tea house)\b/i, label: "Café" },
  { re: /\b(?:cocktail bar|wine bar|natural wine bar|beer bar|pub)\b/i, label: "Bar" },
  { re: /\b(?:museum|gallery|kunsthall|exhibition)\b/i, label: "Museum" },
  { re: /\b(?:hotel|hotell|lodge|inn|resort|hostel|guesthouse|rorbu)\b/i, label: "Hotel" },
  { re: /\b(?:park|gardens?|skulpturpark)\b/i, label: "Park" },
  { re: /\b(?:neighbourhood|neighborhood|district|quarter)\b/i, label: "Neighbourhood" },
  { re: /\b(?:ferry|ferje|airport express|airport train|railway|shuttle|tram line|bus route|airport|station)\b/i, label: "Transport" },
  { re: /\b(?:guided (?:tour|walk)|walking tour|boat trip|cruise|safari)\b/i, label: "Tour" },
  { re: /\b(?:island|beach|viewpoint|fjord|glacier|waterfall|peak|trail|harbour promenade)\b/i, label: "Landmark" },
  { re: /\b(?:church|cathedral|kirke|stavkirke|chapel|palace|fortress|tower)\b/i, label: "Landmark" },
];

const VERIFY_HINTS = /\b(?:Michelin|\d{1,2}[:.]\d{2}\s?(?:am|pm|h)?\b|\d+\s?(?:EUR|€|NOK|kr|USD|\$|BRL|R\$)|open(?:s|ed)?\b|clos(?:ed|es|ing)\b|hours?\b|seasonal|advance booking|reservation|book(?:s|ed|ing)?\s+(?:ahead|in advance|early)|award|starred|per person|entry fee|ticket)/i;

// ---------------------------------------------------------------------------
// Candidate regex (Unicode-aware)
// ---------------------------------------------------------------------------

const CAP = String.raw`[\p{Lu}][\p{L}\p{N}'ʼ''\-]{1,}`;
const ACR = String.raw`[\p{Lu}]{2,5}`;
const CONN = String.raw`(?:of|the|and|de|da|do|dos|das|på|i|for|og|av|du|des|le|la|les|von|van|zu|&)`;
const TOK = `(?:${CAP}|${ACR})`;
const CANDIDATE = new RegExp(
  `\\b${TOK}(?:\\s+(?:${CONN})\\s+${TOK}|\\s+${TOK}){0,5}\\b`,
  "gu",
);

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function stripStructural(md: string): string {
  // NFC-normalise so accented characters (é, ø, å…) that arrive as
  // decomposed code points (e + combining acute) are treated as single
  // letters by the Unicode-aware candidate regex.
  const normalised = typeof md.normalize === "function" ? md.normalize("NFC") : md;
  return normalised
    .replace(/^\s{0,3}#{1,6}[^\n]*$/gm, "")
    .replace(/^\s{0,3}[-*_]{3,}\s*$/gm, "")
    .replace(/\*+/g, "");
}

function normaliseCandidate(raw: string): string {
  let s = raw.trim();
  // Split at em/en dash — keep the first proper-noun segment.
  s = s.split(/\s+[—–]\s+/)[0];
  // Trim trailing possessive 's.
  s = s.replace(/[''ʼ']s\b/g, "");
  // Trim edge punctuation / stray connectors.
  s = s.replace(/^[\s\-–—:;,.()"'`&]+|[\s\-–—:;,.()"'`&]+$/g, "").trim();
  return s;
}

function stripEdgeNoise(name: string): string {
  const parts = name.split(/\s+/);
  while (parts.length > 1) {
    const first = parts[0].toLowerCase();
    if (
      LEADING_NOISE.has(first) ||
      ADJECTIVES.has(first) ||
      CONNECTOR_RE.test(parts[0])
    ) {
      parts.shift();
    } else {
      break;
    }
  }
  while (parts.length > 1) {
    const last = parts[parts.length - 1];
    if (CONNECTOR_RE.test(last) || ADJECTIVES.has(last.toLowerCase())) {
      parts.pop();
    } else {
      break;
    }
  }
  return parts.join(" ").trim();
}

// If the candidate is "A and B" / "A for B" and each side is itself a
// plausible Proper Noun, yield both halves instead of the merged phrase.
function splitCompound(name: string): string[] {
  const parts = name.split(/\s+(?:and|for)\s+/i);
  if (parts.length < 2) return [name];
  const each = parts.map((p) => p.trim()).filter(Boolean);
  const looksProper = (s: string) =>
    /^[\p{Lu}]/u.test(s) && s.split(/\s+/).filter(Boolean).length <= 4;
  if (each.every(looksProper) && each.every((p) => p.length >= 3)) return each;
  return [name];
}

function isAllowlisted(name: string): string | null {
  return ALLOW.get(name.toLowerCase()) || null;
}

function ruleCategory(name: string): string | null {
  for (const { re, label } of NAME_RULES) {
    if (re.test(name)) return label;
  }
  return null;
}

// Context-derived category — only accept when the anchor sits within 60
// characters of the name on the same side of a sentence terminator.
function nearbyContextCategory(md: string, name: string, index: number): string | null {
  const nameLen = name.length;
  const before = md.slice(Math.max(0, index - 60), index);
  const after = md.slice(index + nameLen, Math.min(md.length, index + nameLen + 80));
  const trimBefore = before.split(/[.!?]/).pop() ?? before;
  const trimAfter = after.split(/[.!?]/)[0] ?? after;
  for (const { re, label } of CTX_ANCHORS) {
    if (re.test(trimBefore) || re.test(trimAfter)) return label;
  }
  return null;
}

function isSentenceStart(md: string, index: number): boolean {
  let i = index - 1;
  while (i >= 0 && /\s/.test(md[i])) i--;
  if (i < 0) return true;
  return /[.!?\n]/.test(md[i]);
}

function buildLink(name: string, destination: string): string {
  const q = encodeURIComponent(`${name} ${destination}`.trim());
  return `https://www.google.com/maps/search/?api=1&query=${q}`;
}

// ---------------------------------------------------------------------------
// Public extractor
// ---------------------------------------------------------------------------

export function extractVerificationRows(
  markdown: string,
  destination: string,
): VerificationRow[] {
  if (!markdown) return [];
  const cleaned = stripStructural(markdown);
  const rows = new Map<string, VerificationRow>();

  const seen = new Set<string>();
  const consider = (name: string, index: number) => {
    if (!name) return;
    if (seen.has(name.toLowerCase())) return;
    seen.add(name.toLowerCase());

    const words = name.split(/\s+/).filter(Boolean);
    if (words.length < 1 || words.length > 6) return;
    if (name.length < 3 || name.length > 60) return;
    if (REJECT_EXACT.has(name.toLowerCase())) return;
    if (words.length === 1 && ADJECTIVES.has(name.toLowerCase())) return;
    if (REJECT_TOKEN_RE.test(name)) return;
    if (HAS_MONEY_RE.test(name) || HAS_TIME_RE.test(name)) return;
    if (/^day\s+\d+/i.test(name)) return;
    if (DESCRIPTOR_ONLY_RE.test(name)) return;

    // Single-word sentence-initial capitalisations are almost never names.
    if (words.length === 1 && isSentenceStart(cleaned, index) && !isAllowlisted(name)) return;

    let category = isAllowlisted(name) || ruleCategory(name);
    if (!category && words.length === 1) return; // single-word must self-identify
    if (!category) category = nearbyContextCategory(cleaned, name, index);
    if (!category) return;

    const contextWide = cleaned
      .slice(Math.max(0, index - 260), Math.min(cleaned.length, index + 260))
      .replace(/\s+/g, " ")
      .trim();
    const hint = VERIFY_HINTS.test(contextWide);
    let notes = "";
    if (hint) {
      const hm = contextWide.match(VERIFY_HINTS);
      notes = hm ? `Mentions: ${hm[0]}` : "";
    }

    rows.set(name.toLowerCase(), {
      name,
      category,
      link: buildLink(name, destination),
      confidence: hint ? "Verify" : "Stable",
      notes,
    });
  };

  let m: RegExpExecArray | null;
  CANDIDATE.lastIndex = 0;
  while ((m = CANDIDATE.exec(cleaned)) !== null) {
    const raw = normaliseCandidate(m[0]);
    if (!raw) continue;
    const trimmed = stripEdgeNoise(raw);
    if (!trimmed) continue;

    // Track the position of the trimmed name inside the original match so
    // sentence-start detection and context windows land on the right spot.
    const localOffset = m[0].indexOf(trimmed);
    const baseIndex = localOffset >= 0 ? m.index + localOffset : m.index;

    for (const piece of splitCompound(trimmed)) {
      // Best-effort index for the split piece.
      const idx = cleaned.indexOf(piece, Math.max(0, baseIndex - 5));
      consider(piece, idx >= 0 ? idx : baseIndex);
    }
  }

  return Array.from(rows.values()).sort((a, b) => a.name.localeCompare(b.name));
}

// ---------------------------------------------------------------------------
// UI (layout, columns, CSV export unchanged)
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
            proper-noun place names from the prose automatically.
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
              Rows flagged
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
