// Extracts geographic stops (cities, towns, fjords, mountains) from an itinerary
// markdown for the static route-map generator.
//
// Strategy:
//   1. Try to find a "Trip Overview" section and parse "Day N - Loc - Loc" lines.
//   2. Otherwise fall back to scanning every Day heading in the document.
//   3. Split each day title on dashes / arrows / "and" connectors and strip
//      activity words ("Railway", "Hike", "Viewpoint" …) so we keep only the
//      place name.

export interface MapStop {
  day: number;
  order: number;
  title: string;        // place name shown in legend
  location: string;     // same as title — used for geocoding
}

const OVERVIEW_HEADING =
  /^#{1,4}\s*(trip\s*overview|overview|itinerary\s*overview|visão\s*geral|visao\s*geral|reiseoversikt|oversikt)\b/i;

const DAY_LINE =
  /^#{0,4}\s*(?:day|dia|dag)\s*(\d+)\s*[:\-–—]?\s*(.*)$/i;

// Words that signal activity / mode-of-transport rather than a place.
// Used to scrub fragments after splitting a day title.
const ACTIVITY_WORDS = new RegExp(
  String.raw`\b(` +
    [
      "railway", "train", "rail", "metro", "subway",
      "hike", "hiking", "trek", "trekking", "walk", "walking",
      "viewpoint", "view\\s*point", "lookout", "overlook",
      "tour", "cruise", "boat", "ferry", "kayak(?:ing)?", "rafting", "safari",
      "museum", "gallery", "cathedral", "church",
      "visit(?:ing)?", "explore", "exploring", "discover", "experience",
      "excursion", "trip", "stop(?:s)?", "stop\\s*at",
      "drive", "driving", "flight", "transfer", "departure", "arrival", "airport",
      "optional", "free\\s*day", "rest\\s*day",
      "return\\s*to", "back\\s*to", "depart(?:ure)?\\s*from",
      "morning", "afternoon", "evening", "night",
      "breakfast", "lunch", "dinner",
      "glacier\\s*hike", "guided",
    ].join("|") +
    String.raw`)\b`,
  "gi",
);

// Connectors used inside a day title between locations.
const SPLIT_RE = /\s*(?:→|->|—|–|\/|&| and | to | via )\s*|\s+-\s+|^-\s+|\s+-$/i;

function cleanFragment(raw: string): string {
  let x = raw
    .replace(/\(.*?\)/g, " ")                 // drop parentheticals
    .replace(ACTIVITY_WORDS, " ")
    .replace(/[*_`]/g, " ")
    .replace(/\s{2,}/g, " ")
    .trim();
  // Trim stray punctuation
  x = x.replace(/^[-–—,:;.&\s]+|[-–—,:;.&\s]+$/g, "").trim();
  // Reject if empty, too short, or starts with a lowercase word (likely not a proper noun)
  if (!x) return "";
  if (x.length < 2) return "";
  const first = x.split(/\s+/)[0];
  if (first && first[0] !== first[0].toUpperCase()) return "";
  return x;
}

function splitDayTitle(title: string): string[] {
  // Normalise dashes around words to use a uniform delimiter
  const parts = title.split(SPLIT_RE).filter(Boolean);
  // Each part can still contain a trailing activity descriptor — clean it.
  const cleaned = parts.map(cleanFragment).filter(Boolean);
  // De-dupe while preserving order
  const seen = new Set<string>();
  return cleaned.filter((p) => {
    const k = p.toLowerCase();
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
}

function extractFromLines(lines: string[]): MapStop[] {
  const stops: MapStop[] = [];
  let order = 0;
  for (const raw of lines) {
    const line = raw.trim();
    if (!line) continue;
    const m = line.match(DAY_LINE);
    if (!m) continue;
    const dayNum = parseInt(m[1], 10);
    const rest = (m[2] || "").trim();
    if (!rest) continue;
    const places = splitDayTitle(rest);
    for (const p of places) {
      stops.push({ day: dayNum, order: order++, title: p, location: p });
    }
  }
  return stops;
}

/**
 * Parse the itinerary markdown and return ordered map stops.
 *
 * Prefers a "Trip Overview" section if present, otherwise scans every day
 * heading in the document.
 */
export function extractMapStops(markdown: string): MapStop[] {
  if (!markdown) return [];
  const lines = markdown.split("\n");

  // 1. Look for a Trip Overview section: from its heading until the next heading
  //    of equal-or-higher level.
  let overviewLines: string[] | null = null;
  for (let i = 0; i < lines.length; i++) {
    const ln = lines[i].trim();
    const headerMatch = ln.match(/^(#{1,4})\s+(.*)$/);
    if (!headerMatch) continue;
    if (!OVERVIEW_HEADING.test(ln)) continue;
    const level = headerMatch[1].length;
    const collected: string[] = [];
    for (let j = i + 1; j < lines.length; j++) {
      const hm = lines[j].trim().match(/^(#{1,4})\s+/);
      if (hm && hm[1].length <= level) break;
      collected.push(lines[j]);
    }
    overviewLines = collected;
    break;
  }

  if (overviewLines && overviewLines.length) {
    const stops = extractFromLines(overviewLines);
    if (stops.length) return stops;
  }

  // 2. Fallback: scan all day headings throughout the document.
  return extractFromLines(lines);
}
