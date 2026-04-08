import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `You are the Advisor Assistant for Fjord & Waves Travel — a premium Scandinavian travel advisory.

Your role is to help create stunning, detailed travel itineraries for clients. You are an expert in:
- Norwegian fjords, Arctic experiences, Northern Lights, coastal voyages
- Scandinavian culture, cuisine, hidden gems
- Luxury and boutique accommodations
- Adventure activities (hiking, kayaking, dog sledding, whale watching)
- Seasonal travel planning for Nordic destinations

When creating an itinerary:
1. Structure it day-by-day with clear headings
2. Include specific accommodation recommendations
3. Add restaurant/dining suggestions
4. Include activity details with timing
5. Add practical tips (weather, packing, transport)
6. Use elegant, evocative language that excites the traveler
7. Format with markdown: use ## for day headings, **bold** for highlights, bullet points for details

When the user provides client details (destination, group size, duration), use them to personalise the itinerary. Always be warm, professional, and inspiring.

If asked to refine or adjust, make targeted changes while preserving the overall structure.`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, projectContext, language } = await req.json();

    if (!messages || !Array.isArray(messages)) {
      return new Response(
        JSON.stringify({ error: "messages array is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(
        JSON.stringify({ error: "AI is not configured. LOVABLE_API_KEY missing." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Build system prompt with project context if provided
    let systemContent = SYSTEM_PROMPT;

    if (language && language !== "English") {
      systemContent += `\n\nIMPORTANT: You MUST respond entirely in ${language}. All headings, descriptions, tips, and recommendations must be written in ${language}.`;
    }

    if (projectContext) {
      systemContent += `\n\nCurrent client project context:
- Client: ${projectContext.clientName || "Not specified"}
- Client email: ${projectContext.clientEmail || "Not specified"}
- Departure city: ${projectContext.departure || "Not specified"}
- Destination: ${projectContext.destination || "Not specified"}
- Group size: ${projectContext.groupSize || "Not specified"}
- Trip duration: ${projectContext.tripDuration || "Not specified"}
- Start date: ${projectContext.startDate || "Not specified"}
- End date: ${projectContext.endDate || "Not specified"}
- Estimated budget: ${projectContext.estimatedBudget || "Not specified"}
- Price/fee: ${projectContext.price || "Not specified"}
- Notes: ${projectContext.notes || "None"}
Use ALL these details to personalise the itinerary. Consider the departure city for flight suggestions, the budget for accommodation tier, the dates for seasonal activities and weather tips, and the group size for activity recommendations.`;
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
          { role: "system", content: systemContent },
          ...messages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please wait a moment and try again." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits exhausted. Please add funds in Settings → Workspace → Usage." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const text = await response.text();
      console.error("AI gateway error:", response.status, text);
      return new Response(
        JSON.stringify({ error: "AI service error" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("advisor-assistant error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
