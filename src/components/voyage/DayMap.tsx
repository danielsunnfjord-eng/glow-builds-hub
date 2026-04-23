// Mini map for a single itinerary day. Geocodes item locations via Nominatim
// (OpenStreetMap), caches results in localStorage, and renders pins with popups.
import { useEffect, useMemo, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { ItineraryItem } from "@/lib/itineraryParser";

// Custom gold pin (avoids broken default-icon URLs in bundlers)
const pinIcon = L.divIcon({
  className: "fjw-pin",
  html: `<div style="
    width:26px;height:26px;border-radius:50% 50% 50% 0;
    background:hsl(38 55% 52%);transform:rotate(-45deg);
    border:2px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,0.3);
    display:flex;align-items:center;justify-content:center;">
    <div style="width:8px;height:8px;border-radius:50%;background:#fff;transform:rotate(45deg);"></div>
  </div>`,
  iconSize: [26, 26],
  iconAnchor: [13, 26],
  popupAnchor: [0, -24],
});

interface GeoPoint {
  lat: number;
  lng: number;
  label: string;
  index: number;
  item: ItineraryItem;
}

const CACHE_KEY = "fjw_geocode_cache_v1";

function loadCache(): Record<string, { lat: number; lng: number } | null> {
  try {
    return JSON.parse(localStorage.getItem(CACHE_KEY) || "{}");
  } catch {
    return {};
  }
}
function saveCache(cache: Record<string, { lat: number; lng: number } | null>) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
  } catch {}
}

async function geocode(query: string): Promise<{ lat: number; lng: number } | null> {
  const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(query)}`;
  try {
    const res = await fetch(url, { headers: { Accept: "application/json" } });
    if (!res.ok) return null;
    const json = await res.json();
    if (!Array.isArray(json) || json.length === 0) return null;
    return { lat: parseFloat(json[0].lat), lng: parseFloat(json[0].lon) };
  } catch {
    return null;
  }
}

function FitBounds({ points }: { points: GeoPoint[] }) {
  const map = useMap();
  useEffect(() => {
    if (points.length === 0) return;
    if (points.length === 1) {
      map.setView([points[0].lat, points[0].lng], 13);
      return;
    }
    const bounds = L.latLngBounds(points.map((p) => [p.lat, p.lng]));
    map.fitBounds(bounds, { padding: [30, 30], maxZoom: 14 });
  }, [points, map]);
  return null;
}

interface DayMapProps {
  items: ItineraryItem[];
  /** Falls back as a search hint when item.location is missing context */
  contextLocation?: string;
}

const DayMap = ({ items, contextLocation }: DayMapProps) => {
  const [points, setPoints] = useState<GeoPoint[]>([]);
  const [loading, setLoading] = useState(true);

  // Items that have a location (or coordinates) to plot
  const candidates = useMemo(
    () =>
      items
        .map((item, index) => ({ item, index }))
        .filter(({ item }) => item.location || (item.lat && item.lng)),
    [items]
  );

  useEffect(() => {
    let cancelled = false;
    if (candidates.length === 0) {
      setPoints([]);
      setLoading(false);
      return;
    }
    setLoading(true);

    (async () => {
      const cache = loadCache();
      const resolved: GeoPoint[] = [];
      for (const { item, index } of candidates) {
        if (cancelled) return;
        if (typeof item.lat === "number" && typeof item.lng === "number") {
          resolved.push({ lat: item.lat, lng: item.lng, label: item.location || item.title, index, item });
          continue;
        }
        const query = contextLocation && !item.location?.toLowerCase().includes(contextLocation.toLowerCase())
          ? `${item.location}, ${contextLocation}`
          : item.location!;
        if (query in cache) {
          const c = cache[query];
          if (c) resolved.push({ lat: c.lat, lng: c.lng, label: item.location!, index, item });
          continue;
        }
        const geo = await geocode(query);
        cache[query] = geo;
        saveCache(cache);
        if (geo) resolved.push({ lat: geo.lat, lng: geo.lng, label: item.location!, index, item });
        // Be polite to Nominatim (1 req/sec)
        await new Promise((r) => setTimeout(r, 1100));
      }
      if (!cancelled) {
        setPoints(resolved);
        setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [candidates, contextLocation]);

  if (candidates.length === 0) return null;

  const center: [number, number] = points.length > 0 ? [points[0].lat, points[0].lng] : [0, 0];

  return (
    <div className="bg-voyage-white border border-parchment-3 rounded-lg overflow-hidden mb-5 relative">
      <div className="px-4 py-2.5 border-b border-parchment-3 flex items-center justify-between">
        <span className="text-[0.65rem] tracking-[0.2em] uppercase text-voyage-muted font-semibold">
          Map · {points.length}/{candidates.length} pins
        </span>
        {loading && <span className="text-[0.65rem] text-voyage-muted italic">Locating…</span>}
      </div>
      <div className="h-56 sm:h-64 w-full relative">
        {points.length > 0 ? (
          <MapContainer
            center={center}
            zoom={12}
            scrollWheelZoom={false}
            style={{ height: "100%", width: "100%" }}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <FitBounds points={points} />
            {points.map((p) => (
              <Marker key={p.index} position={[p.lat, p.lng]} icon={pinIcon}>
                <Popup>
                  <div className="font-semibold text-sm">{p.item.title}</div>
                  {p.item.time && <div className="text-xs opacity-70">{p.item.time}</div>}
                  <div className="text-xs mt-1">📍 {p.label}</div>
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(p.label)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs underline mt-1 inline-block"
                  >
                    Open in Google Maps
                  </a>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        ) : (
          <div className="h-full flex items-center justify-center text-xs text-voyage-muted italic">
            {loading ? "Loading map…" : "No locations could be mapped"}
          </div>
        )}
      </div>
    </div>
  );
};

export default DayMap;
