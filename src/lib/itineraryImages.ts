// Generates contextual fallback image URLs for itinerary items when no
// advisor-attached image_url is present. Uses Unsplash Source (no API key).
import type { ItineraryItem } from "./itineraryParser";

const TYPE_KEYWORDS: Record<NonNullable<ItineraryItem["type"]>, string> = {
  activity: "travel,landmark",
  meal: "restaurant,food",
  transport: "airport,travel",
  stay: "hotel,room",
  note: "travel",
};

// Stable seed so the same item keeps the same image across renders.
function hash(str: string): number {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (h << 5) - h + str.charCodeAt(i);
  return Math.abs(h);
}

export function getItemImageUrl(
  item: ItineraryItem,
  contextLocation?: string
): string {
  if (item.image_url) return item.image_url;
  const parts: string[] = [];
  if (item.location) parts.push(item.location);
  else if (item.title) parts.push(item.title.split(" ").slice(0, 3).join(" "));
  if (contextLocation && !parts.join(" ").toLowerCase().includes(contextLocation.toLowerCase())) {
    parts.push(contextLocation);
  }
  parts.push(TYPE_KEYWORDS[item.type || "activity"]);
  const query = parts.join(",").replace(/\s+/g, "-");
  const sig = hash(`${item.title}-${item.location || ""}`);
  // Unsplash Source — free, no API key, deterministic via sig
  return `https://source.unsplash.com/800x500/?${encodeURIComponent(query)}&sig=${sig}`;
}

export function getDayHeroImage(
  items: ItineraryItem[],
  dayLocation?: string,
  destination?: string
): string | undefined {
  const withImg = items.find((i) => i.image_url);
  if (withImg?.image_url) return withImg.image_url;
  const loc = dayLocation || destination;
  if (!loc) return undefined;
  const sig = hash(`${loc}-day`);
  return `https://source.unsplash.com/1200x600/?${encodeURIComponent(loc + ",travel,landscape")}&sig=${sig}`;
}
