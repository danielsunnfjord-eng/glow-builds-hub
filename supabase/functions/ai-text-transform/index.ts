import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const CONTEXT = `You are an editorial assistant for Fjord & Waves Travel, a premium Scandinavian travel advisory.
The text you receive is part of a travel itinerary that will be sent to clients as a polished PDF document.

CRITICAL OUTPUT RULES:
- Return ONLY the transformed text. No explanations, no preamble, no "Here is..." prefix.
- Do NOT use markdown syntax (no ##, no **, no *, no -, no backticks, no code blocks).
- Write clean, plain prose. Use line breaks to separate paragraphs.
- Preserve any existing structure (day headings, sections) but express them as plain text.
- The tone must be warm, elegant, and premium — worthy of a luxury travel experience.
- Keep the same language as the input text unless translating.`;

const ACTIONS: Record<string, string> = {
  rewrite: `${CONTEXT}

Rewrite the text to improve clarity, flow, and readability while keeping the same meaning and all key details. Make sentences smoother and more natural.`,

  improve: `${CONTEXT}

Elevate the text to premium quality. Enhance the language to be more vivid, engaging, and evocative. Add sensory details where appropriate. Make it feel like a luxury travel magazine. Preserve all factual information.`,

  shorten: `${CONTEXT}

Condense the text significantly while retaining all essential information (names, times, places, recommendations). Remove redundancy and filler. Every sentence should earn its place.`,

  elaborate: `${CONTEXT}

Expand the text with richer descriptions, practical details, and atmosphere. Add context about locations, tips for travellers, and sensory language that brings the experience to life. Keep it informative and inspiring.`,

  format: `${CONTEXT}

Restructure the text for optimal readability in a PDF document:
- Ensure clear section breaks between days/topics
- Use short paragraphs (2-3 sentences max)
- Group related information logically
- Add line breaks between sections for visual breathing room
- Make sure times, places, and recommendations are easy to scan
Do NOT add markdown symbols. Just reorganize the plain text.`,

  professional: `${CONTEXT}

Transform the text into the voice of a world-class travel concierge. Use sophisticated, confident language. Every sentence should convey expertise and exclusivity. The reader should feel they are in exceptional hands. Maintain all practical details while elevating the tone to ultra-premium.`,

  translate_en: `${CONTEXT}

Translate the text to English. Maintain the premium travel advisory tone, formatting structure, and all details. The translation should read naturally, not like a translation.`,

  translate_no: `${CONTEXT}

Translate the text to Norwegian (Bokmål). Maintain the premium travel advisory tone, formatting structure, and all details. Use natural, elegant Norwegian.`,

  translate_pt: `${CONTEXT}

Translate the text to Brazilian Portuguese. Maintain the premium travel advisory tone, formatting structure, and all details. Use natural, refined Portuguese.`,
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
      systemPrompt = `${CONTEXT}\n\nUser instruction: ${customPrompt}`;
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
    let result = data.choices?.[0]?.message?.content || "";

    // Strip any markdown artifacts the model might still produce
    result = result
      .replace(/^```[\s\S]*?```$/gm, "")
      .replace(/^#+\s*/gm, "")
      .replace(/\*\*([^*]+)\*\*/g, "$1")
      .replace(/\*([^*]+)\*/g, "$1")
      .replace(/^[-*]\s+/gm, "• ")
      .replace(/\\([#*_~`>|\-\[\](){}+.!])/g, "$1")
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
