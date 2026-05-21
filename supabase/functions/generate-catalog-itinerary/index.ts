import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const SYSTEM = `You are a senior travel copywriter for Fjord & Waves Travel — a premium concierge travel advisory by Daniel Lira Figueiredo (Fora Travel/IATA).

Voice: warm, refined, evocative but never floral. Premium concierge tone, first-person plural ("we arrange…", "you'll discover…"). No clichés ("nestled", "gem", "must-see"). No emojis in content fields.

You generate marketing content for a downloadable PDF itinerary sold in our catalog shop. Customers buy the PDF and plan independently — so summaries should sell the experience, not the planning service.

You will receive:
- A free-text brief from the advisor (MAY BE in ANY language — English, Portuguese, Norwegian, Spanish, French, etc.)
- Optional reference URLs (already fetched as text, may be in any language)
- Optional uploaded document text (PDF/DOCX extracted, may be in any language)
- Optional images (visual context)

Auto-detect the input language(s). Regardless of the input language, you MUST produce ONE itinerary record with ALL three output languages (EN, pt-BR, NO) fully filled. Translate naturally — do not translate literally. Keep proper nouns. Do not echo back the source language only — always provide all three.

"What you get" must be a bullet list (one item per line, no leading dashes/bullets — the UI adds them) describing what's inside the PDF (e.g. "Day-by-day plan with timings", "Curated restaurant picks with reservation tips", "Boutique hotel shortlist", "Offline maps & transport guide").

Slug: lowercase, hyphenated, ASCII, derived from the English title.
Price (EUR): integer; if not specified, choose 39–149 based on length/depth.
Sort_order: 0.`;

const TOOL = {
  type: "function",
  function: {
    name: "create_catalog_itinerary",
    description: "Return one fully-filled catalog itinerary in 3 languages.",
    parameters: {
      type: "object",
      properties: {
        slug: { type: "string" },
        price_eur: { type: "number" },
        destination: { type: "string", description: "Primary destination/region in English" },
        duration: { type: "string", description: "e.g. '7 days', '10 nights'" },
        group_size_label: { type: "string", description: "e.g. 'Couples', '2–4 travellers'" },
        estimated_trip_budget: { type: "string", description: "e.g. '€2,500/person'" },
        title_en: { type: "string" }, title_pt: { type: "string" }, title_no: { type: "string" },
        summary_en: { type: "string" }, summary_pt: { type: "string" }, summary_no: { type: "string" },
        description_en: { type: "string" }, description_pt: { type: "string" }, description_no: { type: "string" },
        what_you_get_en: { type: "string", description: "One bullet per line, no leading dash" },
        what_you_get_pt: { type: "string" },
        what_you_get_no: { type: "string" },
        image_prompt: {
          type: "string",
          description: "A vivid English prompt (cinematic, editorial travel photography style, no text in image) suitable for generating a hero image of this itinerary.",
        },
      },
      required: [
        "slug","price_eur","destination","duration","group_size_label","estimated_trip_budget",
        "title_en","title_pt","title_no",
        "summary_en","summary_pt","summary_no",
        "description_en","description_pt","description_no",
        "what_you_get_en","what_you_get_pt","what_you_get_no",
        "image_prompt",
      ],
      additionalProperties: false,
    },
  },
};

async function fetchUrlText(url: string): Promise<string> {
  try {
    const r = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0 FjordWavesBot" } });
    if (!r.ok) return "";
    const html = await r.text();
    // crude strip
    return html
      .replace(/<script[\s\S]*?<\/script>/gi, "")
      .replace(/<style[\s\S]*?<\/style>/gi, "")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 8000);
  } catch {
    return "";
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY missing");

    const body = await req.json();
    const brief: string = (body.brief || "").toString().slice(0, 4000);
    const urls: string[] = Array.isArray(body.urls) ? body.urls.slice(0, 5) : [];
    const documentsText: string = (body.documents_text || "").toString().slice(0, 12000);
    const images: string[] = Array.isArray(body.images) ? body.images.slice(0, 4) : []; // urls or data: URLs

    if (!brief && !urls.length && !documentsText && !images.length) {
      return new Response(JSON.stringify({ error: "Provide at least a brief, URL, document or image." }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch URLs in parallel
    const urlTexts = await Promise.all(urls.map(async (u) => `# Source: ${u}\n${await fetchUrlText(u)}`));

    const userContent: any[] = [
      {
        type: "text",
        text:
          `ADVISOR BRIEF:\n${brief || "(none)"}\n\n` +
          (documentsText ? `UPLOADED DOCUMENT EXCERPT:\n${documentsText}\n\n` : "") +
          (urlTexts.length ? `REFERENCE URL CONTENT:\n${urlTexts.join("\n\n").slice(0, 16000)}\n\n` : "") +
          `Now produce the catalog itinerary by calling the tool. Fill ALL three languages. Be specific to the destination and brief — no generic content.`,
      },
      ...images.map((url) => ({ type: "image_url", image_url: { url } })),
    ];

    const aiResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: SYSTEM },
          { role: "user", content: userContent },
        ],
        tools: [TOOL],
        tool_choice: { type: "function", function: { name: "create_catalog_itinerary" } },
      }),
    });

    if (!aiResp.ok) {
      const t = await aiResp.text();
      const status = aiResp.status === 429 || aiResp.status === 402 ? aiResp.status : 500;
      const msg = aiResp.status === 429 ? "Rate limit reached, please try again shortly." :
                  aiResp.status === 402 ? "AI credits exhausted. Add credits in Settings → Workspace → Usage." :
                  `AI gateway error: ${t.slice(0, 300)}`;
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

    return new Response(JSON.stringify({ itinerary: args }), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-catalog-itinerary error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
