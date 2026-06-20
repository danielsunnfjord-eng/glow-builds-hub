// Generate dynamic sub-page content for a published catalogue itinerary.
// Reads itinerary content + hotels, asks Claude for 4 specific experience
// highlights and a "what you get" checklist tailored to this guide, parses the
// day-by-day overview locally from the markdown TOC, and writes everything
// back to the catalog_itineraries row. Designed to be invoked at publish time.
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { createClient } from "npm:@supabase/supabase-js@2";

const SYSTEM = `You are a senior luxury travel editor writing concise sales copy for a published travel guide's product page.

Given the full markdown of a catalogue itinerary (and optional hotel list), return ONLY valid JSON in this exact shape — no prose, no markdown fences:
{
  "highlights": [
    { "title": "Short specific experience name (max ~6 words)", "text": "One sentence (max ~18 words) describing it." }
  ],
  "checklist": [ "Short item line (max ~10 words)" ]
}

Rules:
- "highlights": EXACTLY 4 items. Each must reference a real, specific experience or place named in the itinerary — e.g. "Flåm Railway ascent", "Blue ice glacier hike", "Nærøyfjord fjord cruise", "Cider Makers Dinner at Balestrand". Never generic ("Local insider access", "Unhurried mornings", "Signature moments").
- "checklist": 5 to 8 items reflecting THIS guide's actual contents. Use real numbers when known (e.g. "8-day day-by-day plan", "4 hand-picked hotels", "Editable budget table", "Route map included", "Available in EN / PT / NO"). Always end with "Instant premium PDF download".
- Output must be valid JSON, parseable directly.`;

const DAY_HEADING = /^(?:day|dia|dag)\s*(\d+)\s*[—\-:]?\s*(.*)$/i;

function parseDayOverview(md: string): Array<{ day_number: number; title: string }> {
  if (!md) return [];
  const parts = md.split(/^##\s+/m);
  parts.shift();
  const days: Array<{ day_number: number; title: string }> = [];
  for (const raw of parts) {
    const nlIdx = raw.indexOf("\n");
    const heading = (nlIdx === -1 ? raw : raw.slice(0, nlIdx)).trim();
    const dm = heading.match(DAY_HEADING);
    if (dm) days.push({ day_number: parseInt(dm[1], 10), title: (dm[2] || "").trim() });
  }
  return days.sort((a, b) => a.day_number - b.day_number);
}

async function callClaude(apiKey: string, system: string, user: string) {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-5",
      max_tokens: 1500,
      system,
      messages: [{ role: "user", content: user }],
    }),
  });
  if (!res.ok) throw new Error(`Claude API error: ${await res.text()}`);
  const data = await res.json();
  return (data?.content?.[0]?.text || "").trim();
}

function extractJson(text: string): any {
  // Strip code fences if any
  const cleaned = text.replace(/^```(?:json)?/i, "").replace(/```$/, "").trim();
  try { return JSON.parse(cleaned); } catch { /* fall through */ }
  // Find first { ... } block
  const m = cleaned.match(/\{[\s\S]*\}/);
  if (m) return JSON.parse(m[0]);
  throw new Error("Failed to parse JSON from Claude response");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const { itinerary_id, map_url } = await req.json();
    if (!itinerary_id) {
      return new Response(JSON.stringify({ error: "itinerary_id required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { data: row, error: rowErr } = await supabase
      .from("catalog_itineraries")
      .select("id, title_en, destination, duration, itinerary_content_en, itinerary_content_pt, itinerary_content_no, hotels, body_pdf_url, subpage_map_url")
      .eq("id", itinerary_id)
      .maybeSingle();
    if (rowErr) throw rowErr;
    if (!row) throw new Error("Itinerary not found");

    const content = row.itinerary_content_en || "";
    const dayOverview = parseDayOverview(content);

    const hotels = Array.isArray(row.hotels) ? row.hotels : [];
    const hotelLines = hotels.map((h: any) => `- ${h?.name || ""} (${h?.location || ""})`).filter((l: string) => l.length > 5).join("\n");

    const langs: string[] = ["EN"];
    if (row.itinerary_content_pt) langs.push("PT");
    if (row.itinerary_content_no) langs.push("NO");

    const facts = [
      `Title: ${row.title_en}`,
      row.destination && `Destination: ${row.destination}`,
      row.duration && `Duration: ${row.duration}`,
      `Days detected in TOC: ${dayOverview.length}`,
      `Hotels listed: ${hotels.length}`,
      `Languages available: ${langs.join(" / ")}`,
      (map_url || row.subpage_map_url) && `Route map: included`,
      row.body_pdf_url && `Body PDF uploaded: yes`,
    ].filter(Boolean).join("\n");

    const userMsg = `# Facts\n${facts}\n\n# Hotels\n${hotelLines || "(none)"}\n\n# Itinerary markdown\n${content.slice(0, 18000)}`;

    const apiKey = Deno.env.get("ANTHROPIC_API_KEY");
    if (!apiKey) throw new Error("Missing ANTHROPIC_API_KEY");

    const raw = await callClaude(apiKey, SYSTEM, userMsg);
    const parsed = extractJson(raw);

    const highlights = Array.isArray(parsed?.highlights)
      ? parsed.highlights.slice(0, 4).map((h: any) => ({
          title: String(h?.title || "").slice(0, 80),
          text: String(h?.text || "").slice(0, 220),
        }))
      : [];
    const checklist = Array.isArray(parsed?.checklist)
      ? parsed.checklist.map((c: any) => String(c).slice(0, 120)).filter(Boolean).slice(0, 10)
      : [];

    const update: Record<string, unknown> = {
      subpage_highlights: highlights,
      subpage_checklist: checklist,
      subpage_day_overview: dayOverview,
    };
    if (map_url) update.subpage_map_url = map_url;

    const { error: upErr } = await supabase
      .from("catalog_itineraries")
      .update(update)
      .eq("id", itinerary_id);
    if (upErr) throw upErr;

    return new Response(JSON.stringify({ ok: true, ...update }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-subpage-content error", e);
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
