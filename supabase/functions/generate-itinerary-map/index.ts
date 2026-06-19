// Generates a print-ready static route map (Mapbox Static Images API) for an
// itinerary. Uses Claude to extract stops + legs from the raw itinerary text,
// then renders a numbered route with brand colours and uploads to Storage.
import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { z } from "npm:zod@3.23.8";

const MAPBOX_TOKEN = Deno.env.get("MAPBOX_ACCESS_TOKEN");
const ANTHROPIC_KEY = Deno.env.get("ANTHROPIC_API_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

// Legacy stop schema (still supported for callers passing explicit stops)
const StopSchema = z.object({
  day: z.number().int().nonnegative().optional(),
  order: z.number().int().nonnegative().optional(),
  title: z.string().min(1),
  location: z.string().optional(),
  lat: z.number().optional(),
  lng: z.number().optional(),
});

const BodySchema = z.object({
  itineraryText: z.string().min(20).optional(),
  stops: z.array(StopSchema).min(1).max(60).optional(),
  context: z.string().optional(),
  itineraryId: z.string().optional(),
  style: z.string().optional(),
});

type Coord = { lat: number; lng: number };

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
  // Strip markdown fences
  t = t.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "");
  // Find outermost JSON object
  const start = t.indexOf("{");
  const end = t.lastIndexOf("}");
  if (start === -1 || end === -1) throw new Error("No JSON object found in Claude response");
  let body = t.slice(start, end + 1);
  // Remove trailing commas
  body = body.replace(/,(\s*[}\]])/g, "$1");
  // Strip control chars
  body = body.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, "");
  return JSON.parse(body);
}

async function callClaude(itineraryText: string) {
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
  if (!res.ok) {
    const t = await res.text();
    throw new Error(`Claude API error: ${t}`);
  }
  const data = await res.json();
  const text = (data?.content?.[0]?.text || "").trim();
  const stopReason = data?.stop_reason;
  if (stopReason === "max_tokens") {
    console.warn("Claude response was truncated (max_tokens)");
  }
  return extractJson(text);
}

function buildStaticUrl(
  points: { coord: Coord; n: number; type?: string }[],
  style: string,
): string {
  const GOLD = "b8975a";
  const TEAL = "3d6b74";
  const lastIdx = points.length - 1;
  const pins = points
    .map((p, i) => {
      const isEndpoint = i === 0 || i === lastIdx || p.type === "start" || p.type === "end";
      const color = isEndpoint ? GOLD : TEAL;
      return `pin-l-${p.n}+${color}(${p.coord.lng.toFixed(5)},${p.coord.lat.toFixed(5)})`;
    })
    .join(",");

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
  return `https://api.mapbox.com/styles/v1/${style}/static/${overlays}/auto/1280x1280@2x?access_token=${MAPBOX_TOKEN}&padding=60`;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    if (!MAPBOX_TOKEN) {
      return new Response(JSON.stringify({ error: "MAPBOX_ACCESS_TOKEN not configured" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const parsed = BodySchema.safeParse(await req.json());
    if (!parsed.success) {
      return new Response(JSON.stringify({ error: parsed.error.flatten() }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const { itineraryText, stops: legacyStops, itineraryId, style } = parsed.data;
    const styleId = style || "mapbox/outdoors-v12";

    type ResolvedStop = { coord: Coord; n: number; title: string; day?: number; type?: string };
    const resolved: ResolvedStop[] = [];

    if (itineraryText) {
      if (!ANTHROPIC_KEY) {
        return new Response(JSON.stringify({ error: "ANTHROPIC_API_KEY not configured" }), {
          status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const parsedClaude = await callClaude(itineraryText);
      const claudeStops = Array.isArray(parsedClaude?.stops) ? parsedClaude.stops : [];
      let n = 1;
      for (const s of claudeStops) {
        if (typeof s?.lat === "number" && typeof s?.lng === "number" && s?.name) {
          resolved.push({
            coord: { lat: s.lat, lng: s.lng },
            n,
            title: String(s.name),
            day: typeof s.day === "number" ? s.day : undefined,
            type: typeof s.type === "string" ? s.type : undefined,
          });
          n++;
        }
      }
    } else if (legacyStops) {
      let n = 1;
      for (const s of legacyStops) {
        if (typeof s.lat === "number" && typeof s.lng === "number") {
          resolved.push({ coord: { lat: s.lat, lng: s.lng }, n, title: s.title, day: s.day });
          n++;
        }
      }
    } else {
      return new Response(JSON.stringify({ error: "Provide itineraryText or stops" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (resolved.length === 0) {
      return new Response(JSON.stringify({ error: "No stops could be resolved" }), {
        status: 422, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const mapUrl = buildStaticUrl(resolved, styleId);
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
        stops: resolved.map((r) => ({ n: r.n, title: r.title, day: r.day, type: r.type })),
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
