import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const ACTIONS: Record<string, string> = {
  rewrite: "Rewrite the following text to improve clarity and flow while keeping the same meaning. Return ONLY the rewritten text, no explanations.",
  improve: "Improve the following text to make it more engaging, professional, and polished. Enhance the language quality while preserving the core message. Return ONLY the improved text.",
  shorten: "Shorten the following text significantly while keeping the key information. Be concise. Return ONLY the shortened text.",
  elaborate: "Elaborate on the following text by adding more detail, context, and richness. Make it more comprehensive and descriptive. Return ONLY the elaborated text.",
  format: "Improve the formatting of the following text. Use proper headings (##), bold (**) for highlights, bullet points where appropriate, and clean structure. Return ONLY the formatted text.",
  professional: "Rewrite the following text in a highly professional, premium travel advisory tone. Use elegant, evocative language. Return ONLY the rewritten text.",
  translate_en: "Translate the following text to English. Maintain the same tone and formatting. Return ONLY the translated text.",
  translate_no: "Translate the following text to Norwegian (Bokmål). Maintain the same tone and formatting. Return ONLY the translated text.",
  translate_pt: "Translate the following text to Portuguese (Brazil). Maintain the same tone and formatting. Return ONLY the translated text.",
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

    const systemPrompt = customPrompt || ACTIONS[action];
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
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt + "\n\nIMPORTANT: Do NOT use backslash escapes. Do NOT wrap your response in code blocks or quotes. Return clean, ready-to-use text only." },
          { role: "user", content: text },
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please add funds." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      throw new Error("AI gateway error");
    }

    const data = await response.json();
    const result = data.choices?.[0]?.message?.content || "";

    return new Response(JSON.stringify({ result }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("ai-text-transform error:", e);
    return new Response(JSON.stringify({ error: e.message || "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
