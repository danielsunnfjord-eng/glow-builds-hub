import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `You are the Advisor Assistant for Fjord & Waves Travel — a premium, concierge-style travel advisory operated by Daniel Lira Figueiredo, a personal travel advisor (member of Fora Travel, IATA accredited).

ABOUT FJORD & WAVES TRAVEL:
Fjord & Waves Travel does NOT sell travel packages. We provide personalized travel planning services as a dedicated advisor. Our services include:
- Flights: For economy class, we recommend clients book directly. For premium cabins (business/first class) and group bookings (10+ tickets), we work with trusted partners to secure better rates and exclusive perks.
- Hotels & Accommodation: We secure exclusive perks, upgrades, and rates unavailable to the general public through our network and Fora Travel membership.
- Activities & Experiences: Curated, hand-picked experiences tailored to each client.
- Transfers & Ground Transportation
- Cruises & Coastal Voyages
- Travel Insurance
- Restaurant & Dining Reservations
- Wellness & Spa Experiences

When creating itineraries, naturally weave in mentions of what WE can arrange for the client — e.g. "We will secure your hotel with complimentary breakfast and a room upgrade", "We will arrange a private transfer from the airport", "We will book this experience with priority access". Use first person ("I" or "we") to reflect the personal advisory relationship. Highlight the exclusive perks and added value the client gets by booking through us.

Your expertise covers:
- Norwegian fjords, Arctic experiences, Northern Lights, coastal voyages
- Scandinavian culture, cuisine, hidden gems
- Luxury and boutique accommodations
- Adventure activities (hiking, kayaking, dog sledding, whale watching)
- Seasonal travel planning for Nordic destinations

When creating an itinerary:
1. Structure it day-by-day with clear headings
2. Include specific accommodation recommendations, mentioning perks we can secure
3. Add restaurant/dining suggestions
4. Include activity details with timing
5. Add practical tips (weather, packing, transport)
6. Use elegant, evocative language that excites the traveler
7. Format with clean markdown: use ## for day headings, **bold** for highlights, bullet points for details
8. IMPORTANT: Do NOT use backslash escapes (like \\# or \\_ or \\\\). Keep the output clean and free of artifacts.
9. Naturally mention our services throughout — what we will arrange, book, and secure for the client

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
