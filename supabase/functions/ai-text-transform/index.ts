import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const CONTEXT = `You are an editorial assistant for Fjord & Waves Travel, a premium Scandinavian travel advisory.
The text you receive is part of a travel itinerary written in Markdown and will be sent to clients as a polished PDF document.

CRITICAL OUTPUT RULES:
- Return ONLY the transformed text. No explanations, no preamble, no "Here is..." prefix, no code fences.
- PRESERVE the input's markdown structure EXACTLY:
  * Keep every heading (#, ##, ###, ####) at the same level and in the same position.
  * Keep **bold**, *italic*, ~~strike~~, \`inline code\`, and [links](url) marks intact when they wrap content you keep.
  * Keep bullet lists (-, *) and numbered lists (1.) with the same item count where possible.
  * Keep blockquotes (>), horizontal rules (---), tables, and images (![]()) untouched in position.
  * Keep blank lines between paragraphs — never collapse paragraphs into one block.
- Only rewrite the prose *inside* those structures. Do not invent new headings, do not flatten headings into prose, do not strip emphasis.
- The tone must be warm, elegant, and premium — worthy of a luxury travel experience.
- Keep the same language as the input text unless explicitly translating.`;

const ACTIONS: Record<string, string> = {
  rewrite: `${CONTEXT}

Rewrite the prose inside the existing markdown structure to improve clarity, flow, and readability while keeping the same meaning and all key details. Sentences smoother and more natural. Headings, lists and emphasis stay exactly as given.`,

  improve: `${CONTEXT}

Elevate the prose to premium quality inside the existing markdown structure. More vivid, engaging, evocative language; add sensory details where appropriate. Preserve all factual information and all headings/lists/emphasis exactly.`,

  shorten: `${CONTEXT}

Condense the prose significantly while retaining all essential information (names, times, places, recommendations) AND the full markdown structure (headings, lists, emphasis, paragraph breaks). Remove redundancy and filler.`,

  elaborate: `${CONTEXT}

Expand the prose with richer descriptions, practical details, and atmosphere — but keep every heading, list item, and paragraph boundary from the input. Add context, tips, sensory language; do not invent new sections.`,

  format: `${CONTEXT}

Restructure the prose for optimal readability while keeping all markdown markers:
- Split overly long paragraphs into short ones (2-3 sentences) with a blank line between.
- Keep existing headings; only promote a line to a heading if it is clearly a section title in the input.
- Keep bullet/numbered lists where they exist; do not invent new ones.
- Make sure times, places, and recommendations are easy to scan.`,

  professional: `${CONTEXT}

Transform the prose into the voice of a world-class travel concierge — sophisticated, confident, exclusive. Maintain every practical detail and the full markdown structure (headings, lists, emphasis, paragraph breaks) exactly.`,

  translate_en: `${CONTEXT}

Translate the text to English. Preserve the markdown structure EXACTLY — every heading, list, emphasis mark, blockquote, image, link and blank-line paragraph break must remain in the same position. Read naturally, not like a translation.`,

  translate_no: `${CONTEXT}

Translate the text to Norwegian (Bokmål). Preserve the markdown structure EXACTLY — every heading, list, emphasis mark, blockquote, image, link and blank-line paragraph break must remain in the same position. Use natural, elegant Norwegian.`,

  translate_pt: `${CONTEXT}

Translate the text to Brazilian Portuguese. Preserve the markdown structure EXACTLY — every heading, list, emphasis mark, blockquote, image, link and blank-line paragraph break must remain in the same position. Use natural, refined Portuguese.`,
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { text, action, customPrompt } = await req.json();

    if (!text || typeof text !== "string") {
      return new Response(JSON.stringify({ error: "Missing 'text' field" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let systemPrompt: string;
    if (customPrompt) {
      systemPrompt = `${CONTEXT}\n\nUser instruction: ${customPrompt}\n\nApply this instruction while preserving the markdown structure exactly.`;
    } else {
      systemPrompt = ACTIONS[action];
    }

    if (!systemPrompt) {
      return new Response(JSON.stringify({ error: "Invalid action" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: text },
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please add funds." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      throw new Error("AI gateway error");
    }

    const data = await response.json();
    let result: string = data.choices?.[0]?.message?.content || "";

    // Only strip surrounding ``` code fences (model sometimes wraps output).
    // Do NOT strip markdown markers — preserving structure is the whole point.
    result = result
      .replace(/^\s*```(?:markdown|md)?\s*\n?/i, "")
      .replace(/\n?```\s*$/i, "")
      .trim();

    return new Response(JSON.stringify({ result }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("ai-text-transform error:", e);
    return new Response(JSON.stringify({ error: e.message || "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
