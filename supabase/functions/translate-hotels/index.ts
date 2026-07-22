// Translate hotel recommendation content to the itinerary's target language.
// Input:  { language: "en"|"pt"|"no", hotels: [{ id?, name, location, description, perks[], photos: [{caption, credit, url}] }] }
// Output: { hotels: [ ...same shape, translated in place ] }
// Uses Lovable AI Gateway (google/gemini-2.5-pro) with tool calling for structured output.
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

const LANG_NAMES: Record<string, string> = {
  en: "English",
  pt: "Brazilian Portuguese (pt-BR)",
  no: "Norwegian Bokmål",
};

const SYSTEM = `You are a senior travel copywriter and translator for Fjord & Waves Travel — a premium concierge advisory.

Translate the provided hotel recommendation fields into the requested target language.

Voice: warm, refined, evocative but never floral. Premium concierge tone.

Rules:
- Translate naturally — never literally.
- Keep proper nouns (hotel names, place names, brand names) in their original spelling. In particular, "name" should almost always remain unchanged.
- Translate "location", "description", "perks" bullets, and photo "caption" fully to the target language.
- Keep the same number of perks and photos, in the same order.
- Do NOT translate "credit" (photographer/source attribution) — keep it as-is.
- If a field is empty, return it empty.
- If the source text is already in the target language, return it unchanged.`;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const apiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!apiKey) throw new Error("LOVABLE_API_KEY missing");

    const { language, hotels } = await req.json();
    const target = typeof language === "string" ? language : "";
    if (!LANG_NAMES[target]) {
      return new Response(JSON.stringify({ error: "Invalid target language" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (!Array.isArray(hotels) || hotels.length === 0) {
      return new Response(JSON.stringify({ hotels: [] }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Compact payload: strip URLs/ids/visible from AI input, keep only translatable fields + a stable index.
    const compact = hotels.map((h: any, i: number) => ({
      i,
      name: (h?.name || "").toString(),
      location: (h?.location || "").toString(),
      description: (h?.description || "").toString(),
      perks: Array.isArray(h?.perks) ? h.perks.map((p: any) => (p || "").toString()) : [],
      captions: Array.isArray(h?.photos)
        ? h.photos.map((p: any) => (typeof p === "string" ? "" : (p?.caption || "").toString()))
        : [],
    }));

    const tool = {
      type: "function",
      function: {
        name: "return_translated_hotels",
        description: "Return the hotels array translated to the target language.",
        parameters: {
          type: "object",
          properties: {
            hotels: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  i: { type: "number" },
                  name: { type: "string" },
                  location: { type: "string" },
                  description: { type: "string" },
                  perks: { type: "array", items: { type: "string" } },
                  captions: { type: "array", items: { type: "string" } },
                },
                required: ["i", "name", "location", "description", "perks", "captions"],
                additionalProperties: false,
              },
            },
          },
          required: ["hotels"],
          additionalProperties: false,
        },
      },
    };

    const userMessage =
      `Target language: ${LANG_NAMES[target]}\n\n` +
      `Hotels (JSON):\n${JSON.stringify(compact)}\n\n` +
      `Call return_translated_hotels with the same array — same length, same "i" indices, same perks/captions counts — with all human-facing text translated to ${LANG_NAMES[target]}. Keep hotel proper names untouched.`;

    const aiResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-pro",
        messages: [
          { role: "system", content: SYSTEM },
          { role: "user", content: userMessage },
        ],
        tools: [tool],
        tool_choice: { type: "function", function: { name: "return_translated_hotels" } },
      }),
    });

    if (!aiResp.ok) {
      const t = await aiResp.text();
      const status = aiResp.status === 429 || aiResp.status === 402 ? aiResp.status : 500;
      const msg = aiResp.status === 429 ? "Rate limit reached, please try again shortly."
        : aiResp.status === 402 ? "AI credits exhausted."
        : `AI gateway error: ${t.slice(0, 300)}`;
      return new Response(JSON.stringify({ error: msg }), {
        status, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await aiResp.json();
    const call = data.choices?.[0]?.message?.tool_calls?.[0];
    if (!call) {
      return new Response(JSON.stringify({ error: "AI did not return structured output" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const args = JSON.parse(call.function.arguments);
    const translated: any[] = Array.isArray(args?.hotels) ? args.hotels : [];
    const byIndex = new Map<number, any>(translated.map((t: any) => [Number(t.i), t]));

    const merged = hotels.map((h: any, i: number) => {
      const t = byIndex.get(i);
      if (!t) return h;
      const photos = Array.isArray(h?.photos)
        ? h.photos.map((p: any, pi: number) => {
            if (typeof p === "string") return p;
            const cap = Array.isArray(t.captions) ? t.captions[pi] : undefined;
            return { ...p, caption: typeof cap === "string" ? cap : (p?.caption || "") };
          })
        : h?.photos;
      return {
        ...h,
        name: typeof t.name === "string" && t.name.trim() ? t.name : h.name,
        location: typeof t.location === "string" ? t.location : h.location,
        description: typeof t.description === "string" ? t.description : h.description,
        perks: Array.isArray(t.perks) && Array.isArray(h.perks) && t.perks.length === h.perks.length
          ? t.perks
          : h.perks,
        photos,
      };
    });

    return new Response(JSON.stringify({ hotels: merged }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
