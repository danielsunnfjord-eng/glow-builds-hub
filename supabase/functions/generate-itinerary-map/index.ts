// Generates a print-ready static route map for an itinerary.
// Pipeline: itineraryText → Claude (stops + legs with coords) → Mapbox Static
// (terrain + numbered pins) → server-side SVG overlay (true dashed ferry legs
// + white-box place labels) → composited PNG.
// NO geocoding — coordinates come exclusively from Claude.
import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { z } from "npm:zod@3.23.8";
import { initWasm, Resvg } from "https://esm.sh/@resvg/resvg-wasm@2.6.2";
import { encodeBase64 } from "https://deno.land/std@0.224.0/encoding/base64.ts";

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

// ---------- Resvg + font init (cached per isolate) ----------
let resvgReady: Promise<void> | null = null;
let fontBuffer: Uint8Array | null = null;
async function ensureResvg() {
  if (!resvgReady) {
    resvgReady = (async () => {
      const wasm = await fetch(
        "https://esm.sh/@resvg/resvg-wasm@2.6.2/index_bg.wasm",
      ).then((r) => r.arrayBuffer());
      await initWasm(wasm);
      // Montserrat 600 — matches brand sans-serif
      const fontRes = await fetch(
        "https://fonts.gstatic.com/s/montserrat/v26/JTURjIg1_i6t8kCHKm45_dJE3gnD-w.ttf",
      );
      fontBuffer = new Uint8Array(await fontRes.arrayBuffer());
    })();
  }
  await resvgReady;
}

// ---------- Claude ----------
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
  if (data?.stop_reason === "max_tokens") console.warn("Claude response truncated");
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

// ---------- Web Mercator + bbox fitting ----------
const mercY = (lat: number) => Math.log(Math.tan(Math.PI / 4 + (lat * Math.PI) / 360));
const invMercY = (y: number) => ((Math.atan(Math.exp(y)) - Math.PI / 4) * 360) / Math.PI;

type BBox = { minLat: number; maxLat: number; minLng: number; maxLng: number };

// Compute padded bbox, then expand the shorter axis so its mercator aspect
// ratio matches the target image aspect ratio (1:1 for our square output).
// After this, Mapbox's bbox-positioned render and our SVG projection agree.
function fitBbox(stops: Stop[], aspect: number, marginPct = 0.18): BBox {
  let minLat = Math.min(...stops.map((s) => s.lat));
  let maxLat = Math.max(...stops.map((s) => s.lat));
  let minLng = Math.min(...stops.map((s) => s.lng));
  let maxLng = Math.max(...stops.map((s) => s.lng));

  // Pad
  const latPad = Math.max((maxLat - minLat) * marginPct, 0.05);
  const lngPad = Math.max((maxLng - minLng) * marginPct, 0.08);
  minLat -= latPad; maxLat += latPad;
  minLng -= lngPad; maxLng += lngPad;

  // Aspect-fit in mercator: width = lng span (degrees), height = mercator span
  // converted back to degree-equivalent so the ratio is meaningful.
  const mercDegSpan = ((mercY(maxLat) - mercY(minLat)) * 180) / Math.PI;
  const lngSpan = maxLng - minLng;
  const currentAR = lngSpan / mercDegSpan; // width/height
  if (currentAR < aspect) {
    // too tall — expand longitude
    const newLngSpan = mercDegSpan * aspect;
    const extra = (newLngSpan - lngSpan) / 2;
    minLng -= extra; maxLng += extra;
  } else if (currentAR > aspect) {
    // too wide — expand latitude (in mercator)
    const newMercDegSpan = lngSpan / aspect;
    const extraDeg = (newMercDegSpan - mercDegSpan) / 2;
    const extraMerc = (extraDeg * Math.PI) / 180;
    minLat = invMercY(mercY(minLat) - extraMerc);
    maxLat = invMercY(mercY(maxLat) + extraMerc);
  }

  // Clamp lat to valid mercator range
  minLat = Math.max(minLat, -85); maxLat = Math.min(maxLat, 85);
  return { minLat, maxLat, minLng, maxLng };
}

function project(lat: number, lng: number, bbox: BBox, W: number, H: number) {
  const minMY = mercY(bbox.minLat), maxMY = mercY(bbox.maxLat);
  return {
    x: ((lng - bbox.minLng) / (bbox.maxLng - bbox.minLng)) * W,
    y: ((maxMY - mercY(lat)) / (maxMY - minMY)) * H,
  };
}

// ---------- Mapbox base map (terrain + numbered pins, no lines) ----------
function buildBaseMapUrl(stops: Stop[], bbox: BBox, style: string): string {
  const GOLD = "b8975a", TEAL = "3d6b74";
  const pins = stops.map((s) => {
    let label: string | number = s.day;
    let color = TEAL;
    if (s.type === "start" || s.type === "end") color = GOLD;
    if (s.type === "activity") label = "triangle"; // supported maki icon for activity stops
    return `pin-l-${label}+${color}(${s.lng.toFixed(5)},${s.lat.toFixed(5)})`;
  }).join(",");
  const bboxStr = `[${bbox.minLng.toFixed(5)},${bbox.minLat.toFixed(5)},${bbox.maxLng.toFixed(5)},${bbox.maxLat.toFixed(5)}]`;
  return `https://api.mapbox.com/styles/v1/${style}/static/${pins}/${bboxStr}/1280x1280@2x?access_token=${MAPBOX_TOKEN}`;
}

// ---------- SVG overlay (lines + label boxes) ----------
function escapeXml(s: string) {
  return s.replace(/[<>&'"]/g, (c) => (
    { "<": "&lt;", ">": "&gt;", "&": "&amp;", "'": "&apos;", '"': "&quot;" }[c]!
  ));
}

function buildOverlaySvg(opts: {
  baseB64: string;
  stops: Stop[];
  legs: Leg[];
  bbox: BBox;
  W: number;
  H: number;
}): string {
  const { baseB64, stops, legs, bbox, W, H } = opts;
  const coordOf = new Map<string, { x: number; y: number }>();
  stops.forEach((s) => coordOf.set(s.name.trim().toLowerCase(), project(s.lat, s.lng, bbox, W, H)));

  const ROUTE_COLOR = "#1F4D8F"; // deep blue, matches reference image
  const FERRY_DASH = "28 18";

  const lines = legs.map((leg) => {
    const a = coordOf.get(leg.from.trim().toLowerCase());
    const b = coordOf.get(leg.to.trim().toLowerCase());
    if (!a || !b) return "";
    const isFerry = leg.mode === "ferry" || leg.mode === "foot";
    const dash = isFerry ? ` stroke-dasharray="${FERRY_DASH}"` : "";
    return `<line x1="${a.x.toFixed(1)}" y1="${a.y.toFixed(1)}" x2="${b.x.toFixed(1)}" y2="${b.y.toFixed(1)}" stroke="${ROUTE_COLOR}" stroke-width="9" stroke-linecap="round" stroke-opacity="0.92"${dash}/>`;
  }).join("");

  const fontSize = 30;
  const padX = 16, padY = 9;
  // Place label above-right of pin to avoid covering it.
  const labels = stops.map((s) => {
    const p = coordOf.get(s.name.trim().toLowerCase())!;
    const text = s.name;
    const textW = Math.max(60, text.length * fontSize * 0.58);
    const boxW = textW + padX * 2;
    const boxH = fontSize + padY * 2;
    // Decide side: if pin is in right half, put label to the left.
    const onRight = p.x > W * 0.6;
    const bx = onRight ? p.x - boxW - 28 : p.x + 28;
    const by = p.y - boxH - 18;
    const tx = bx + padX;
    const ty = by + padY + fontSize - 7;
    return `
      <g>
        <rect x="${bx.toFixed(1)}" y="${by.toFixed(1)}" width="${boxW.toFixed(1)}" height="${boxH}" rx="6" ry="6"
              fill="white" stroke="#1F4D8F" stroke-width="2" opacity="0.96"/>
        <text x="${tx.toFixed(1)}" y="${ty.toFixed(1)}" font-family="Montserrat, sans-serif"
              font-size="${fontSize}" font-weight="700" fill="#1F4D8F">${escapeXml(text)}</text>
      </g>
    `;
  }).join("");

  return `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
    <image xlink:href="data:image/png;base64,${baseB64}" x="0" y="0" width="${W}" height="${H}"/>
    ${lines}
    ${labels}
  </svg>`;
}

async function composite(opts: {
  baseBytes: Uint8Array;
  stops: Stop[];
  legs: Leg[];
  bbox: BBox;
}): Promise<Uint8Array> {
  await ensureResvg();
  const W = 2560, H = 2560;
  const baseB64 = encodeBase64(opts.baseBytes);
  const svg = buildOverlaySvg({ baseB64, stops: opts.stops, legs: opts.legs, bbox: opts.bbox, W, H });
  const resvg = new Resvg(svg, {
    font: {
      fontBuffers: fontBuffer ? [fontBuffer] : [],
      defaultFontFamily: "Montserrat",
      loadSystemFonts: false,
    },
    fitTo: { mode: "width", value: W },
  });
  const rendered = resvg.render();
  return rendered.asPng();
}

// ---------- Handler ----------
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

    const stops: Stop[] = [];
    let dropped = 0;
    for (const s of rawStops) {
      if (validStop(s)) stops.push(s as Stop);
      else dropped++;
    }
    if (stops.length === 0) {
      return new Response(
        JSON.stringify({ error: "No valid stops (coordinates failed Norway bounds check)" }),
        { status: 422, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }
    const validNames = new Set(stops.map((s) => s.name.trim().toLowerCase()));
    const legs: Leg[] = rawLegs.filter(
      (l) =>
        l && typeof l.from === "string" && typeof l.to === "string" &&
        validNames.has(l.from.trim().toLowerCase()) &&
        validNames.has(l.to.trim().toLowerCase()),
    );

    // Square 1:1 output. fitBbox aspect = W/H = 1.
    const bbox = fitBbox(stops, 1);
    const mapUrl = buildBaseMapUrl(stops, bbox, styleId);
    const imgRes = await fetch(mapUrl);
    if (!imgRes.ok) {
      const text = await imgRes.text();
      return new Response(JSON.stringify({ error: "Mapbox render failed", detail: text }), {
        status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const baseBytes = new Uint8Array(await imgRes.arrayBuffer());

    let finalBytes: Uint8Array;
    try {
      finalBytes = await composite({ baseBytes, stops, legs, bbox });
    } catch (compErr) {
      console.error("Compositing failed, returning base map", compErr);
      finalBytes = baseBytes; // graceful fallback
    }

    const folder = itineraryId || "adhoc";
    const path = `maps/${folder}/${Date.now()}.png`;
    const { error: upErr } = await supabase.storage
      .from("itinerary-images")
      .upload(path, finalBytes, { contentType: "image/png", upsert: true });
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
