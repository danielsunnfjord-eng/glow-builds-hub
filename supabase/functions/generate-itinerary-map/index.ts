// Generates a print-ready static route map for an itinerary.
// Pipeline: itineraryText → Claude (stops + legs with coords) → Mapbox Static.
// NO geocoding — coordinates come exclusively from Claude.
import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { z } from "npm:zod@3.23.8";

const MAPBOX_TOKEN = Deno.env.get("MAPBOX_ACCESS_TOKEN");
const ANTHROPIC_KEY = Deno.env.get("ANTHROPIC_API_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

// Norway bounding box for validation
const LAT_MIN = 57.5, LAT_MAX = 71.5;
const LNG_MIN = 4.0, LNG_MAX = 31.5;

const BodySchema = z.object({
  itineraryText: z.string().min(20),
  itineraryId: z.string().optional(),
  style: z.string().optional(),
});

type Coord = { lat: number; lng: number };
type Stop = {
  day: number;
  name: string;
  lat: number;
  lng: number;
  type: "start" | "stop" | "overnight" | "activity" | "end";
};
type Leg = {
  from: string;
  to: string;
  mode: "car" | "train" | "ferry" | "foot";
};

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE, {
  auth: { persistSession: false },
});

const CLAUDE_PROMPT = `You are a travel itinerary parser. Extract all locations and travel legs from the itinerary below.

Return ONLY a JSON object — no markdown, no explanation, no backticks. Exactly this structure:

{
  "stops": [
    { "day": 1, "name": "Place Name", "lat": 60.3913, "lng": 5.3221, "type": "start|stop|overnight|activity|end" }
  ],
  "legs": [
    { "from": "Place A", "to": "Place B", "mode": "car|train|ferry|foot" }
  ]
}

Rules:
- Use your own knowledge for coordinates — do NOT guess or make them up
- Only include real, named places
- type = "start" for first stop, "end" for last, "overnight" if they sleep there, "activity" for day trips, "stop" for passing through
- mode = transport between each consecutive pair of stops, inferred from context
- If the same place appears as both start and end, include it twice
- Coordinates must be precise — small Norwegian villages matter

ITINERARY:
`;

function extractJson(text: string): any {
  let t = text.trim();
  t = t.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "");
  const start = t.indexOf("{");
  const end = t.lastIndexOf("}");
  if (start === -1 || end === -1) throw new Error("No JSON object found in Claude response");
  let body = t.slice(start, end + 1);
  body = body.replace(/,(\s*[}\]])/g, "$1");
  body = body.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, "");
  return JSON.parse(body);
}

async function callClaude(itineraryText: string): Promise<{ stops: Stop[]; legs: Leg[] }> {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": ANTHROPIC_KEY!,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-5",
      max_tokens: 4096,
      messages: [{ role: "user", content: CLAUDE_PROMPT + itineraryText }],
    }),
  });
  if (!res.ok) throw new Error(`Claude API error: ${await res.text()}`);
  const data = await res.json();
  if (data?.stop_reason === "max_tokens") {
    console.warn("Claude response truncated (max_tokens)");
  }
  const text = (data?.content?.[0]?.text || "").trim();
  const parsed = extractJson(text);
  return {
    stops: Array.isArray(parsed?.stops) ? parsed.stops : [],
    legs: Array.isArray(parsed?.legs) ? parsed.legs : [],
  };
}

function validStop(s: any): s is Stop {
  return (
    s &&
    typeof s.name === "string" &&
    typeof s.lat === "number" &&
    typeof s.lng === "number" &&
    s.lat >= LAT_MIN && s.lat <= LAT_MAX &&
    s.lng >= LNG_MIN && s.lng <= LNG_MAX
  );
}

// Build a Mapbox Static Images URL with per-leg path overlays + numbered pins.
function buildStaticUrl(opts: {
  stops: Stop[];
  legs: Leg[];
  style: string;
}): string {
  const { stops, legs, style } = opts;
  const GOLD = "b8975a";
  const TEAL = "3d6b74";
  const FERRY = "5b9aa3"; // lighter teal for ferry legs

  // Coord lookup by stop name (case-insensitive, last wins so end-loop resolves)
  const byName = new Map<string, Stop>();
  stops.forEach((s) => byName.set(s.name.trim().toLowerCase(), s));

  // Path overlays per leg. Static API doesn't support real dashes — encode
  // ferry/foot legs as a lighter colour + lower opacity so they read as
  // distinct from the solid car/train route.
  const overlays: string[] = [];
  for (const leg of legs) {
    const a = byName.get(leg.from?.trim().toLowerCase() || "");
    const b = byName.get(leg.to?.trim().toLowerCase() || "");
    if (!a || !b) continue;
    const isWater = leg.mode === "ferry" || leg.mode === "foot";
    const color = isWater ? FERRY : TEAL;
    const opacity = isWater ? 0.75 : 1;
    const width = isWater ? 3 : 4;
    const geo = {
      type: "Feature",
      properties: {
        stroke: `#${color}`,
        "stroke-width": width,
        "stroke-opacity": opacity,
      },
      geometry: {
        type: "LineString",
        coordinates: [
          [a.lng, a.lat],
          [b.lng, b.lat],
        ],
      },
    };
    overlays.push(`geojson(${encodeURIComponent(JSON.stringify(geo))})`);
  }

  // Numbered pins. Day number as the label. Activity stops get the hiking icon.
  // Endpoints (start/end) gold, others teal.
  stops.forEach((s) => {
    let label: string | number = s.day;
    let color = TEAL;
    if (s.type === "start" || s.type === "end") color = GOLD;
    if (s.type === "activity") label = "hiking"; // maki icon
    overlays.push(`pin-l-${label}+${color}(${s.lng.toFixed(5)},${s.lat.toFixed(5)})`);
  });

  // Tight bounding box around all stops with margin, fed to Mapbox via "auto".
  // padding gives visual breathing room around the outermost pins.
  const overlayStr = overlays.join(",");
  return `https://api.mapbox.com/styles/v1/${style}/static/${overlayStr}/auto/1280x1280@2x?access_token=${MAPBOX_TOKEN}&padding=80`;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    if (!MAPBOX_TOKEN) {
      return new Response(JSON.stringify({ error: "MAPBOX_ACCESS_TOKEN not configured" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (!ANTHROPIC_KEY) {
      return new Response(JSON.stringify({ error: "ANTHROPIC_API_KEY not configured" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const parsed = BodySchema.safeParse(await req.json());
    if (!parsed.success) {
      return new Response(JSON.stringify({ error: parsed.error.flatten() }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const { itineraryText, itineraryId, style } = parsed.data;
    const styleId = style || "mapbox/outdoors-v12";

    const { stops: rawStops, legs: rawLegs } = await callClaude(itineraryText);

    // Validate coordinates against Norway bounds; drop anything outside.
    const stops: Stop[] = [];
    let dropped = 0;
    for (const s of rawStops) {
      if (validStop(s)) stops.push(s as Stop);
      else dropped++;
    }
    if (stops.length === 0) {
      return new Response(
        JSON.stringify({ error: "No valid stops returned (coordinates failed Norway bounds check)" }),
        { status: 422, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Keep only legs whose both endpoints survived validation.
    const validNames = new Set(stops.map((s) => s.name.trim().toLowerCase()));
    const legs: Leg[] = rawLegs.filter(
      (l) =>
        l && typeof l.from === "string" && typeof l.to === "string" &&
        validNames.has(l.from.trim().toLowerCase()) &&
        validNames.has(l.to.trim().toLowerCase()),
    );

    const mapUrl = buildStaticUrl({ stops, legs, style: styleId });
    const imgRes = await fetch(mapUrl);
    if (!imgRes.ok) {
      const text = await imgRes.text();
      return new Response(JSON.stringify({ error: "Mapbox render failed", detail: text }), {
        status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" },
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
        stops: stops.map((s) => ({ day: s.day, name: s.name, type: s.type })),
        legs: legs.map((l) => ({ from: l.from, to: l.to, mode: l.mode })),
        dropped,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    console.error("generate-itinerary-map error", e);
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
