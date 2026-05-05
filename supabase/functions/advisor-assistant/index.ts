import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const BASE_PROMPT = `You are the Advisor Assistant for Fjord & Waves Travel — a premium, concierge-style travel advisory operated by Daniel Lira Figueiredo (Fora Travel member, IATA accredited).

ABOUT FJORD & WAVES TRAVEL:
We do NOT sell packages. We provide bespoke planning as a dedicated advisor. Services we provide:
- Flights (economy direct; premium/group via partners with perks)
- Hotels & boutique accommodations (exclusive amenities, upgrades, breakfast, resort credits via Fora Travel)
- Curated activities & experiences with priority access
- Private transfers & ground transportation
- Cruises & coastal voyages
- Travel insurance
- Restaurant reservations (hard-to-book tables)
- Wellness & spa experiences

VOICE: Warm, refined, first-person ("I will arrange…", "We secure…"). Evocative but never floral. Premium concierge tone.

EXPERTISE: Norwegian fjords, Arctic, Northern Lights, coastal voyages, Scandinavian culture & cuisine, luxury/boutique stays, adventure activities, seasonal Nordic planning.

When asked to PRODUCE A FULL ITINERARY, output ONLY clean markdown in this premium structure:

# {Destination} — {trip duration} for {client first name}
*A bespoke itinerary curated by Fjord & Waves Travel*

![{Destination} cover](https://source.unsplash.com/1600x900/?{destination-keywords-comma-separated})

## Overview
2–3 sentences setting the tone of the journey, season, and what makes it special.

## At a Glance
- 📍 **Route:** {city A → city B → city C}
- 🗓 **When:** {dates / season}
- 👥 **Travellers:** {count}
- ✨ **Highlights:** {3-4 bullet highlights}

---

## Day 1 — {Place} · {Theme}
![{Place} {theme}](https://source.unsplash.com/1600x900/?{place},{theme-keyword})

*One evocative sentence framing the day.*

**Morning**
- 09:00 — {Activity} — short sensory description
- ![{specific attraction}](https://source.unsplash.com/1200x700/?{attraction-keywords})

**Afternoon**
- 13:00 — {Lunch venue} — what makes it special
- 15:00 — {Activity}

**Evening**
- 19:30 — {Dinner / experience}

**Where you'll stay**
> {Hotel name} — one line on character + the perks I'll secure (upgrade if available, breakfast, late checkout, resort credit, etc.).

**What I'll arrange for you today**
- {Booking 1}
- {Booking 2}

---

(Repeat the Day block for each day.)

## Practical Notes
- ☁ Weather & packing
- 💱 Currency & tipping
- 🔌 Plugs & connectivity
- 🚗 Getting around

## What I'll Secure For You
A short closing paragraph summarising the bookings, perks, and concierge touches I'll handle on your behalf.

CRITICAL FORMATTING RULES:
1. Use ONLY clean markdown. NEVER use backslash escapes (\\#, \\_, \\\\).
2. ALWAYS embed inline cover images for each day using:
   ![alt text](https://source.unsplash.com/1600x900/?keyword1,keyword2,keyword3)
   Use 2–4 lowercase comma-separated keywords describing the place/attraction. ASCII only, no spaces — replace spaces with hyphens.
3. Add 1–2 attraction images per day in the same format (1200x700).
4. Use ## for Day headings (NOT ###). Use --- between days.
5. Naturally weave in what WE arrange throughout — never list services as a sales pitch.
6. Use the client's first name once at the top, never repeatedly.
7. Keep prose tight — evocative, not verbose.`;

const CHAT_MODE_INSTRUCTION = `
═══════════════════════════════════════════
MODE: DISCUSSION (do NOT rewrite the itinerary)
═══════════════════════════════════════════
The advisor already has an itinerary draft (provided below for your reference). Your job is ONLY to:
- Answer questions about it
- Suggest specific improvements in plain prose ("On Day 2 you could swap X for Y because…")
- Recommend hotels, restaurants, activities, perks the advisor could add
- Flag issues (timing, logistics, weather, season fit)

DO NOT output a revised full itinerary. DO NOT use ## Day headings. DO NOT include image markdown.
Be concise, conversational, and concrete. Reference specific days/sections when suggesting changes.
The advisor will explicitly request edits when ready.`;

const EDIT_MODE_INSTRUCTION = `
═══════════════════════════════════════════
MODE: APPLY EDITS (return full revised itinerary)
═══════════════════════════════════════════
The advisor wants you to update the existing itinerary (provided below). Apply ONLY the requested changes.

STRICT PRESERVATION RULES — failure to follow these breaks the advisor's work:
1. The current itinerary contains image placeholder tokens like [[IMG_0]], [[IMG_1]], [[IMG_2]], etc. These represent real images. You MUST keep every token EXACTLY as written (same spelling, same brackets, same number, on its own line) and in its original position. Do NOT translate, rename, remove, merge, or wrap them in markdown.
2. KEEP all unchanged days, headings, and prose verbatim. Only modify what the advisor asked you to modify.
3. If the advisor asks to add a NEW day or section, you may add new image markdown for that new section using \`![alt](https://source.unsplash.com/1200x700/?keywords)\` — but never invent new [[IMG_n]] tokens, and never replace existing tokens with markdown.
4. If the advisor explicitly asks you to remove or rearrange a day, move the [[IMG_n]] tokens belonging to that day with it (or delete them only if the whole section is deleted).
5. Output the COMPLETE revised itinerary — no commentary, no preamble, no "Here is the revised itinerary:" intro.`;

const CREATE_MODE_INSTRUCTION = `
═══════════════════════════════════════════
MODE: CREATE FULL ITINERARY
═══════════════════════════════════════════
Produce a complete premium itinerary following the exact structure above, with cover images for every day.`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, projectContext, language, mode, currentItinerary, autoImages } = await req.json();

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

    let systemContent = BASE_PROMPT;

    const resolvedMode = mode || (currentItinerary ? "discuss" : "create");
    if (resolvedMode === "discuss") systemContent += "\n" + CHAT_MODE_INSTRUCTION;
    else if (resolvedMode === "edit") systemContent += "\n" + EDIT_MODE_INSTRUCTION;
    else systemContent += "\n" + CREATE_MODE_INSTRUCTION;

    if (autoImages === false && resolvedMode !== "discuss") {
      systemContent += "\n\nIMAGE OVERRIDE: Do NOT include any image markdown in this response.";
    }

    if (language && language !== "English") {
      systemContent += `\n\nIMPORTANT: Respond entirely in ${language}. Image alt text keywords may stay in English for search compatibility.`;
    }

    if (projectContext) {
      systemContent += `\n\nClient project context:
- Client: ${projectContext.clientName || "Not specified"}
- Email: ${projectContext.clientEmail || "Not specified"}
- Departure: ${projectContext.departure || "Not specified"}
- Destination: ${projectContext.destination || "Not specified"}
- Group size: ${projectContext.groupSize || "Not specified"}
- Trip duration: ${projectContext.tripDuration || "Not specified"}
- Dates: ${projectContext.startDate || "?"} → ${projectContext.endDate || "?"}
- Budget: ${projectContext.estimatedBudget || "Not specified"}
- Notes: ${projectContext.notes || "None"}
Use ALL details (interests, pace, mobility, dietary, children ages, must-haves) to personalise.`;
    }

    if (currentItinerary && (resolvedMode === "discuss" || resolvedMode === "edit")) {
      systemContent += `\n\n═══ CURRENT ITINERARY DRAFT ═══\n${currentItinerary}\n═══ END DRAFT ═══`;
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
