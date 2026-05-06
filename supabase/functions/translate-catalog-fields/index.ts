import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const LANG_NAMES: Record<string, string> = {
  en: "English",
  pt: "Brazilian Portuguese (pt-BR)",
  no: "Norwegian Bokmål",
};

const FIELDS = ["title", "summary", "description", "what_you_get"] as const;

const SYSTEM = `You are a senior travel copywriter and translator for Fjord & Waves Travel — a premium concierge advisory.

You receive 4 source fields (title, summary, description, what_you_get) in ONE language and must return them translated to the requested target languages.

Voice: warm, refined, evocative but never floral. Premium concierge tone, first-person plural ("we arrange…", "you'll discover…"). No clichés. No emojis.

Rules:
- Translate naturally — never literally. Adapt idioms.
- Keep proper nouns (place names, hotel names) in their original spelling.
- Preserve structure: 'what_you_get' uses one bullet per line with NO leading dash/bullet (UI adds them). Keep the same number of bullets.
- Preserve paragraph breaks in 'description'.
- Do not invent facts. If a field is empty, leave it empty.`;

const TOOL = (targets: string[]) => ({
  type: "function",
  function: {
    name: "return_translations",
    description: "Return translated versions of the 4 fields for each target language.",
    parameters: {
      type: "object",
      properties: Object.fromEntries(
        targets.flatMap((lang) =>
          FIELDS.map((f) => [`${f}_${lang}`, { type: "string" }]),
        ),
      ),
      required: targets.flatMap((lang) => FIELDS.map((f) => `${f}_${lang}`)),
      additionalProperties: false,
    },
  },
});

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY missing");

    const body = await req.json();
    const source: string = (body.source || "").toString();
    const targets: string[] = Array.isArray(body.targets) ? body.targets : [];
    const fields = body.fields || {};

    if (!LANG_NAMES[source]) {
      return new Response(JSON.stringify({ error: "Invalid source language" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const validTargets = targets.filter((t) => LANG_NAMES[t] && t !== source);
    if (!validTargets.length) {
      return new Response(JSON.stringify({ error: "No valid target languages" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const sourceText = FIELDS.map((f) => `### ${f.toUpperCase()} (${LANG_NAMES[source]})\n${(fields[f] || "").toString().trim() || "(empty)"}`).join("\n\n");

    const userMessage =
      `Source language: ${LANG_NAMES[source]}\n` +
      `Target languages: ${validTargets.map((t) => LANG_NAMES[t]).join(", ")}\n\n` +
      `Source fields:\n\n${sourceText}\n\n` +
      `Now call the tool returning all 4 fields for each target language. Use the field naming convention {field}_{lang_code}, e.g. title_en, summary_pt, description_no, what_you_get_pt.`;

    const aiResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-pro",
        messages: [
          { role: "system", content: SYSTEM },
          { role: "user", content: userMessage },
        ],
        tools: [TOOL(validTargets)],
        tool_choice: { type: "function", function: { name: "return_translations" } },
      }),
    });

    if (!aiResp.ok) {
      const t = await aiResp.text();
      const status = aiResp.status === 429 || aiResp.status === 402 ? aiResp.status : 500;
      const msg = aiResp.status === 429 ? "Rate limit reached, please try again shortly." :
                  aiResp.status === 402 ? "AI credits exhausted." :
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

    return new Response(JSON.stringify({ translations: args, targets: validTargets }), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("translate-catalog-fields error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
