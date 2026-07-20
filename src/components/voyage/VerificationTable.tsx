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

const SUBSECTION_STOPWORDS = new Set([
  "morning",
  "afternoon",
  "evening",
  "dining",
  "dining suggestion",
  "dining tip",
  "insider tip",
  "local insider tip",
  "transport",
  "transport guidance",
  "reservation",
  "reservation guidance",
  "optional",
  "optional alternatives",
  "note",
  "notes",
  "tip",
  "day",
]);

const CATEGORY_RULES: Array<{ re: RegExp; label: string }> = [
  { re: /\b(restaurant|bistro|brasserie|trattoria|osteria|caf[ée]|coffee|bakery|bar|pub|eatery|kitchen|kro|gastropub)\b/i, label: "Restaurant" },
  { re: /\b(hotel|lodge|inn|resort|guesthouse|hytte|pensjonat|boutique stay|farm stay)\b/i, label: "Hotel" },
  { re: /\b(museum|gallery|kunsthall|exhibition|arkiv)\b/i, label: "Museum" },
  { re: /\b(church|cathedral|stave church|kirke|chapel|monastery)\b/i, label: "Landmark" },
  { re: /\b(fjord|glacier|mountain|peak|trail|hike|hiking|national park|waterfall|foss|valley|island|beach|viewpoint)\b/i, label: "Nature" },
  { re: /\b(ferry|train|railway|station|airport|road|route|pass|tunnel)\b/i, label: "Transport" },
  { re: /\b(market|shop|boutique|store|distillery|brewery|winery|farm)\b/i, label: "Shop / Producer" },
];

const VERIFY_HINTS = /\b(Michelin|\d{1,2}[:.]\d{2}\s?(?:am|pm|h)?\b|\d+\s?(?:EUR|€|NOK|kr|USD|\$|BRL|R\$)|open(?:s|ed)?\b|clos(?:ed|es|ing)\b|hours?\b|seasonal|season\b|advance booking|reservation|book(?:s|ed|ing)?\s+(?:ahead|in advance|early)|award|star(?:red)?\b|price|ticket|per person|entry fee)/i;

function stripEmphasisMarkers(s: string): string {
  return s.replace(/\*+/g, "").replace(/_+/g, "").trim();
}

function isLikelyName(candidate: string): boolean {
  const c = candidate.trim();
  if (c.length < 3 || c.length > 80) return false;
  if (SUBSECTION_STOPWORDS.has(c.toLowerCase())) return false;
  if (/^day\s+\d+/i.test(c)) return false;
  // Require it to contain at least one capitalized letter
  if (!/[A-ZÆØÅÉÍÓÚÀÂÊÔÃÕÇ]/.test(c)) return false;
  // Skip if it's just a common section word with trailing punctuation
  const stripped = c.replace(/[:;,.—–-]+$/g, "").toLowerCase();
  if (SUBSECTION_STOPWORDS.has(stripped)) return false;
  return true;
}

function categorise(name: string, context: string): string {
  const hay = `${name} ${context}`;
  for (const { re, label } of CATEGORY_RULES) {
    if (re.test(hay)) return label;
  }
  return "Attraction";
}

function buildLink(name: string, destination: string): string {
  const q = encodeURIComponent(`${name} ${destination}`.trim());
  return `https://www.google.com/maps/search/?api=1&query=${q}`;
}

function extractContext(markdown: string, index: number, radius = 220): string {
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

  // Match **bold** or __bold__ spans as the primary signal for named entities.
  const boldRe = /(\*\*|__)(.+?)\1/g;
  let m: RegExpExecArray | null;
  while ((m = boldRe.exec(markdown)) !== null) {
    const raw = stripEmphasisMarkers(m[2]);
    if (!isLikelyName(raw)) continue;
    // Ignore bold spans that are actually labels like "Dining:" / "Transport:"
    if (/[:：]\s*$/.test(m[2])) continue;
    const key = raw.toLowerCase();
    if (rows.has(key)) continue;

    const ctx = extractContext(markdown, m.index);
    const category = categorise(raw, ctx);
    const hasHint = VERIFY_HINTS.test(ctx);
    let notes = "";
    if (hasHint) {
      const hintMatch = ctx.match(VERIFY_HINTS);
      notes = hintMatch ? `Mentions: ${hintMatch[0]}` : "";
    }
    rows.set(key, {
      name: raw,
      category,
      link: buildLink(raw, destination),
      confidence: hasHint ? "Verify" : "Stable",
      notes,
    });
  }

  return Array.from(rows.values()).sort((a, b) => a.name.localeCompare(b.name));
}

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
