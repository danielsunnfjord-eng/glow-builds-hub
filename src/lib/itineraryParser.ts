// Parses markdown itineraries into structured day-by-day data for the customer app.
// Heuristic: looks for headings like "Day 1", "Dia 1", "Dag 1" — case-insensitive.

export interface ItineraryItem {
  time?: string;
  title: string;
  description?: string;
  location?: string;
  lat?: number;
  lng?: number;
  image_url?: string;
  type?: "activity" | "meal" | "transport" | "stay" | "note";
}

export interface ItineraryDay {
  day: number;
  date?: string;
  title: string;
  location?: string;
  summary?: string;
  items: ItineraryItem[];
}

const DAY_REGEX = /^#{1,3}\s*(?:day|dia|dag)\s*(\d+)\s*[:\-–—]?\s*(.*)$/i;
const TIME_REGEX = /^(?:(\d{1,2}[:.h]\d{0,2}(?:\s?[ap]m)?)|(morning|afternoon|evening|night|manhã|tarde|noite|morgon|ettermiddag|kveld))\s*[:\-–—]\s*(.+)$/i;
// Image: ![alt](url) optionally followed by *caption*
const IMAGE_REGEX = /!\[[^\]]*\]\(([^)]+)\)/;

const stripMd = (s: string) =>
  s
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/\*([^*]+)\*/g, "$1")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .trim();

const detectType = (text: string): ItineraryItem["type"] => {
  const t = text.toLowerCase();
  if (/(breakfast|lunch|dinner|brunch|café|restaurant|jantar|almoço|frukost|middag|lunsj)/.test(t)) return "meal";
  if (/(flight|transfer|drive|train|bus|airport|voo|tåg|fly|tog|buss)/.test(t)) return "transport";
  if (/(hotel|check-in|stay|accommodation|hospedagem|overnatting)/.test(t)) return "stay";
  return "activity";
};

export function parseItineraryMarkdown(markdown: string): ItineraryDay[] {
  if (!markdown) return [];
  const lines = markdown.split("\n");
  const days: ItineraryDay[] = [];
  let current: ItineraryDay | null = null;
  let pendingImage: string | undefined;

  const pushItem = (item: ItineraryItem) => {
    if (!current) {
      current = { day: 1, title: "Day 1", items: [] };
      days.push(current);
    }
    if (pendingImage && !item.image_url) {
      item.image_url = pendingImage;
      pendingImage = undefined;
    }
    current.items.push(item);
  };

  for (let raw of lines) {
    const line = raw.trim();
    if (!line) continue;

    const dayMatch = line.match(DAY_REGEX);
    if (dayMatch) {
      const dayNum = parseInt(dayMatch[1], 10);
      const titleRest = stripMd(dayMatch[2] || "");
      current = {
        day: dayNum,
        title: titleRest || `Day ${dayNum}`,
        location: titleRest.includes("—") ? titleRest.split("—")[1]?.trim() : titleRest.includes("-") ? titleRest.split("-").slice(1).join("-").trim() : undefined,
        items: [],
      };
      days.push(current);
      pendingImage = undefined;
      continue;
    }

    const imgMatch = line.match(IMAGE_REGEX);
    if (imgMatch) {
      pendingImage = imgMatch[1];
      continue;
    }

    // Bullet list items
    const bulletMatch = line.match(/^[-*•]\s+(.+)$/);
    const text = bulletMatch ? bulletMatch[1] : line.startsWith("#") ? "" : line;
    if (!text) continue;

    const cleaned = stripMd(text);
    if (!cleaned) continue;

    const timeMatch = cleaned.match(TIME_REGEX);
    if (timeMatch) {
      const time = (timeMatch[1] || timeMatch[2]).trim();
      const desc = timeMatch[3].trim();
      // Split title vs description on " - " or " — "
      const parts = desc.split(/\s+[—–-]\s+/);
      const title = parts[0];
      const description = parts.slice(1).join(" — ") || undefined;
      pushItem({ time, title, description, type: detectType(desc) });
    } else if (bulletMatch) {
      const parts = cleaned.split(/\s+[—–-]\s+/);
      pushItem({
        title: parts[0],
        description: parts.slice(1).join(" — ") || undefined,
        type: detectType(cleaned),
      });
    } else if (current) {
      // Append as summary text on current day
      current.summary = current.summary ? `${current.summary} ${cleaned}` : cleaned;
    }
  }

  // Renumber sequentially in case of gaps
  return days.map((d, i) => ({ ...d, day: d.day || i + 1 }));
}

export function extractCoverImage(markdown: string): string | undefined {
  const m = markdown.match(IMAGE_REGEX);
  return m?.[1];
}
