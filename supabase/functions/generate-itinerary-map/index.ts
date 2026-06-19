// Generates a print-ready static route map (Mapbox Static Images API) for an
// itinerary's stops, uploads it to Storage, and returns the public URL.
import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { z } from "npm:zod@3.23.8";

const MAPBOX_TOKEN = Deno.env.get("MAPBOX_ACCESS_TOKEN");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const StopSchema = z.object({
  day: z.number().int().nonnegative().optional(),
  order: z.number().int().nonnegative().optional(),
  title: z.string().min(1),
  location: z.string().optional(),
  lat: z.number().optional(),
  lng: z.number().optional(),
});

const BodySchema = z.object({
  stops: z.array(StopSchema).min(1).max(60),
  context: z.string().optional(),       // e.g. "Norway" — geocoding bias
  itineraryId: z.string().optional(),   // used in storage path
  style: z.string().optional(),         // mapbox style id, defaults to light-v11
});

type Coord = { lat: number; lng: number };

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE, {
  auth: { persistSession: false },
});

async function geocode(query: string): Promise<Coord | null> {
  // Check cache first
  const { data: cached } = await supabase
    .from("geocode_cache")
    .select("lat,lng")
    .eq("query", query)
    .maybeSingle();
  if (cached) return { lat: cached.lat, lng: cached.lng };

  const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?limit=1&access_token=${MAPBOX_TOKEN}`;
  const res = await fetch(url);
  if (!res.ok) return null;
  const json = await res.json();
  const f = json?.features?.[0];
  if (!f?.center) return null;
  const [lng, lat] = f.center;
  await supabase.from("geocode_cache").upsert({ query, lat, lng });
  return { lat, lng };
}

function buildStaticUrl(
  points: { coord: Coord; n: number }[],
  style: string,
): string {
  // Brand colours: gold (B8975A) for start/end, teal (3D6B74) for middle stops
  const GOLD = "b8975a";
  const TEAL = "3d6b74";
  const lastIdx = points.length - 1;
  const pins = points
    .map((p, i) => {
      const color = i === 0 || i === lastIdx ? GOLD : TEAL;
      return `pin-l-${p.n}+${color}(${p.coord.lng.toFixed(5)},${p.coord.lat.toFixed(5)})`;
    })
    .join(",");

  // Route line as GeoJSON LineString overlay (teal, 3px)
  const lineGeo = {
    type: "Feature",
    properties: { stroke: "#3D6B74", "stroke-width": 3, "stroke-opacity": 0.9 },
    geometry: {
      type: "LineString",
      coordinates: points.map((p) => [p.coord.lng, p.coord.lat]),
    },
  };
  const line = points.length > 1
    ? `geojson(${encodeURIComponent(JSON.stringify(lineGeo))})`
    : "";

  const overlays = [line, pins].filter(Boolean).join(",");

  // auto bounding + 1280x1280 @2x for print-ready (2560px raster)
  return `https://api.mapbox.com/styles/v1/${style}/static/${overlays}/auto/1280x1280@2x?access_token=${MAPBOX_TOKEN}&padding=60`;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    if (!MAPBOX_TOKEN) {
      return new Response(JSON.stringify({ error: "MAPBOX_ACCESS_TOKEN not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const parsed = BodySchema.safeParse(await req.json());
    if (!parsed.success) {
      return new Response(JSON.stringify({ error: parsed.error.flatten() }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const { stops, context, itineraryId, style } = parsed.data;
    const styleId = style || "mapbox/light-v11";

    // Resolve coordinates
    const resolved: { coord: Coord; n: number; title: string; location?: string; day?: number }[] = [];
    let n = 1;
    for (const s of stops) {
      let coord: Coord | null = null;
      if (typeof s.lat === "number" && typeof s.lng === "number") {
        coord = { lat: s.lat, lng: s.lng };
      } else {
        const baseQuery = s.location || s.title;
        const query = context && !baseQuery.toLowerCase().includes(context.toLowerCase())
          ? `${baseQuery}, ${context}`
          : baseQuery;
        coord = await geocode(query);
      }
      if (coord) {
        resolved.push({ coord, n, title: s.title, location: s.location, day: s.day });
        n++;
      }
    }

    if (resolved.length === 0) {
      return new Response(JSON.stringify({ error: "No stops could be geocoded" }), {
        status: 422,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const mapUrl = buildStaticUrl(resolved, styleId);
    const imgRes = await fetch(mapUrl);
    if (!imgRes.ok) {
      const text = await imgRes.text();
      return new Response(JSON.stringify({ error: "Mapbox render failed", detail: text }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const bytes = new Uint8Array(await imgRes.arrayBuffer());

    const folder = itineraryId || "adhoc";
    const path = `maps/${folder}/${Date.now()}.png`;
    const { error: upErr } = await supabase.storage
      .from("itinerary-images")
      .upload(path, bytes, { contentType: "image/png", upsert: true });
    if (upErr) throw upErr;
    const { data: pub } = supabase.storage.from("itinerary-images").getPublicUrl(path);

    return new Response(
      JSON.stringify({
        url: pub.publicUrl,
        stops: resolved.map((r) => ({ n: r.n, title: r.title, location: r.location, day: r.day })),
        skipped: stops.length - resolved.length,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    console.error("generate-itinerary-map error", e);
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
