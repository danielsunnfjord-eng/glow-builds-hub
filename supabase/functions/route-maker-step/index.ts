// Route Maker — runs a single staged AI step and persists output to the itinerary row.
// Each step ID maps to one prompt from src/components/voyage/routeMaker/prompts.ts.
// Prompts are duplicated here (edge functions cannot import from src/).

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const SYSTEM_PROMPT = `You are an expert travel itinerary strategist and experience designer.

Your role is to help create structured, realistic, inspiring and commercially valuable travel itineraries.

You prioritize:
- logical pacing
- geographic efficiency
- realistic transportation
- authentic local experiences
- traveler comfort
- balanced activity levels
- memorable highlights
- practical usability

You avoid:
- unrealistic schedules
- generic tourism recommendations
- repetitive experiences
- overly promotional language
- tourist traps unless culturally important

Your itineraries should feel:
- curated, premium, practical, immersive, emotionally engaging, professionally planned

Always optimize for excellent traveler experience, realistic logistics, strong trip flow, clear structure, scalable formatting.

When generating outputs: be concise but descriptive, avoid unnecessary filler, prefer structured outputs, use consistent formatting, prioritize clarity and usability.`;

// ---------- prompt templates ----------

const PROMPTS: Record<string, string> = {
  brief: `ITINERARY BRIEF ANALYZER: Analyze the following travel brief and extract the key planning requirements.

Identify: trip style, traveler profile, pacing expectations, logistical constraints, experience priorities, accommodation expectations, transport implications, potential itinerary challenges.

Return structured JSON only.

Travel brief:
{{travel_brief}}`,

  route: `ROUTE GENERATOR

Create a high-level travel route structure.

Focus ONLY on: destination sequence, pacing, transportation logic, geographic efficiency, overnight distribution, balancing activity and recovery, seasonal suitability.

Do NOT write detailed descriptions, recommend specific hotels, create marketing copy, or create packing lists.

Return: itinerary title, short concept summary, destination sequence, nights per location, transport logic, key experiences per stop.

Return structured JSON only.

Traveler context:
{{traveler_context}}

Destination context:
{{destination_context}}

Trip constraints:
{{trip_constraints}}`,

  days: `DAY-BY-DAY GENERATOR: Expand the approved itinerary structure into a detailed day-by-day travel itinerary.

For each day include: day title, location, experience summary, recommended activities, transport notes, pacing guidance, meal suggestions, optional experiences, practical travel considerations.

Tone: immersive, practical, premium, clear, emotionally engaging.
Avoid: exaggerated marketing language, unrealistic schedules, repetitive wording.
Maintain realistic timing and geography.

Return structured JSON only.

Approved route:
{{approved_route}}`,

  experiences: `EXPERIENCE RECOMMENDATION GENERATOR

Recommend curated travel experiences that fit this itinerary.

Prioritize authentic local experiences, memorable moments, strong destination identity, realistic logistics, traveler compatibility.
Avoid generic tourist attractions unless iconic, unrealistic detours, repetitive experiences.

For each recommendation include: experience title, category, why it fits the itinerary, ideal traveler type, duration estimate, seasonal relevance.

Return structured JSON only.

Itinerary:
{{itinerary}}

Traveler profile:
{{traveler_profile}}`,

  accommodations: `ACCOMMODATION MATCHER

Recommend accommodations that match the travel style, pacing and destination flow of this itinerary.

Prioritize location efficiency, experience quality, atmosphere, aesthetic alignment, traveler compatibility.
Avoid generic chain hotels unless strategically useful, unrealistic luxury mismatches, poorly located accommodations.

For each recommendation include: accommodation name, accommodation type, atmosphere/style, why it fits this itinerary, ideal traveler type, recommended stay duration.

Return structured JSON only.

Itinerary:
{{itinerary}}

Accommodation preferences:
{{accommodation_preferences}}`,

  logistics: `TRANSPORT & LOGISTICS GENERATOR

Generate practical transportation and logistics guidance for this itinerary.

Focus on realistic travel times, transportation modes, transfer logic, route efficiency, seasonal considerations, traveler convenience.
Include recommended transport methods, estimated transfer times, important logistical notes, transportation warnings if relevant, optimization suggestions.
Avoid exact live schedules and unreliable timing claims.

Return structured JSON only.

Itinerary:
{{itinerary}}`,

  budget: `BUDGET ESTIMATOR

Estimate realistic travel budget ranges for this itinerary.

Include estimated: accommodation costs, transportation costs, food budget, activity budget, optional upgrades.
Provide budget tier, mid-range tier, premium tier.
Avoid exact pricing guarantees and unrealistic low-budget assumptions.

Return structured JSON only.

Itinerary:
{{itinerary}}

Traveler profile:
{{traveler_profile}}`,

  quality: `ITINERARY QUALITY CHECKER

Review this itinerary for quality, realism and traveler experience.

Check for unrealistic travel times, poor pacing, repetitive experiences, geographic inefficiencies, insufficient recovery time, inconsistent tone, missing logistical clarity, activity overload, weak flow between destinations.

Return: quality score, key issues, improvement suggestions, pacing observations, logistical concerns.

Return structured JSON only.

Itinerary:
{{itinerary}}`,

  sales: `WEBSITE SALES COPY GENERATOR

Create premium travel sales page copy for this itinerary.

Tone: cinematic, elegant, adventurous, emotionally immersive, premium but approachable.
The copy should inspire confidence, communicate authenticity, create emotional connection, explain the uniqueness of the route, feel curated and expert-led.
Avoid exaggerated luxury language, generic travel clichés, overly aggressive sales language.

Generate: headline, subheadline, short description, long description, highlights section, who this trip is ideal for, practical expectations.

Return structured JSON only.

Itinerary:
{{itinerary}}`,

  seo: `SEO GENERATOR

Generate SEO content for this travel itinerary page.

Include: SEO title, meta description, URL slug, keyword targets, image alt text suggestions, structured content summary.
Optimize for organic search, travel intent, clarity, click-through rate. Avoid keyword stuffing.

Return structured JSON only.

Itinerary:
{{itinerary}}`,

  pdf_intro: `PDF INTRO GENERATOR

Write a premium editorial-style introduction for this travel guide PDF.

The introduction should emotionally immerse the traveler, establish the feeling of the journey, communicate the travel philosophy, inspire confidence and excitement.
Tone: cinematic, elegant, experiential, human, authentic.
Avoid clichés, exaggerated promises, generic tourism language.

Return ONLY the introduction prose (no JSON, no headings, no preamble).

Itinerary:
{{itinerary}}`,

  packing: `PACKING LIST GENERATOR

Generate a practical packing guide for this itinerary.

Consider climate, season, activities, transportation style, comfort, local conditions.
Organize by: clothing, footwear, travel essentials, technology, optional gear.
Keep recommendations practical and realistic.

Return structured JSON only.

Itinerary:
{{itinerary}}`,

  upsell: `PERSONALIZATION CALL UPSELL

Create a short premium upsell section inviting travelers to book a personalized itinerary consultation.

The tone should feel expert-led, approachable, premium, helpful.
Focus on personalization, insider knowledge, stress reduction, unique experiences, travel optimization.
Keep it concise and conversion-focused.

Return ONLY the upsell prose (no JSON, no headings).`,
};

// Steps that return free-text prose instead of JSON
const TEXT_STEPS = new Set(["pdf_intro", "upsell"]);

// Which column on the itinerary row each step writes to
const COLUMN_FOR_STEP: Record<string, string> = {
  brief: "brief_analysis",
  route: "route",
  days: "days",
  experiences: "experiences",
  accommodations: "accommodations",
  logistics: "logistics",
  budget: "budget",
  quality: "quality",
  sales: "sales_copy",
  seo: "seo",
  pdf_intro: "pdf_intro",
  packing: "packing",
  upsell: "upsell",
};

function render(template: string, vars: Record<string, string>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, k) => vars[k] ?? "");
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY missing");

    // Auth: identify caller via JWT (RLS-friendly client).
    const authHeader = req.headers.get("Authorization") ?? "";
    if (!authHeader.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userClient = createClient(SUPABASE_URL, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData, error: userErr } = await userClient.auth.getUser();
    if (userErr || !userData.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Service role client for staff-checked reads/writes inside this function.
    const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const { data: isStaffRow } = await admin.rpc("is_staff", { _user_id: userData.user.id });
    if (!isStaffRow) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const itineraryId: string = body.itinerary_id;
    const step: string = body.step;
    const vars: Record<string, string> = body.vars ?? {};

    if (!itineraryId || !step) {
      return new Response(JSON.stringify({ error: "itinerary_id and step are required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const template = PROMPTS[step];
    const column = COLUMN_FOR_STEP[step];
    if (!template || !column) {
      return new Response(JSON.stringify({ error: `Unknown step: ${step}` }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Load the row so the caller doesn't need to pass duplicate context.
    const { data: row, error: rowErr } = await admin
      .from("route_maker_itineraries").select("*").eq("id", itineraryId).maybeSingle();
    if (rowErr || !row) {
      return new Response(JSON.stringify({ error: "Itinerary not found" }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Build template variables: explicit vars from caller, plus auto-filled context from the row.
    const autoVars: Record<string, string> = {
      travel_brief: row.brief_text || "",
      traveler_context: vars.traveler_context ?? JSON.stringify(row.brief_analysis ?? {}, null, 2),
      destination_context: vars.destination_context ?? "",
      trip_constraints: vars.trip_constraints ?? "",
      approved_route: JSON.stringify(row.route ?? {}, null, 2),
      itinerary: JSON.stringify({ route: row.route, days: row.days }, null, 2),
      traveler_profile: vars.traveler_profile ?? JSON.stringify(row.brief_analysis ?? {}, null, 2),
      accommodation_preferences: vars.accommodation_preferences ?? "",
    };
    const finalVars = { ...autoVars, ...vars };
    const userPrompt = render(template, finalVars);

    // Build AI request. JSON steps use response_format: json_object. Text steps return prose.
    const aiBody: Record<string, unknown> = {
      model: "google/gemini-2.5-flash",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: userPrompt },
      ],
    };
    if (!TEXT_STEPS.has(step)) {
      aiBody.response_format = { type: "json_object" };
    }

    const aiResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify(aiBody),
    });
    if (!aiResp.ok) {
      const t = await aiResp.text();
      const status = aiResp.status === 429 || aiResp.status === 402 ? aiResp.status : 500;
      const msg = aiResp.status === 429 ? "Rate limit reached, please try again shortly."
                : aiResp.status === 402 ? "AI credits exhausted. Add credits in Settings → Workspace → Usage."
                : `AI gateway error: ${t.slice(0, 300)}`;
      return new Response(JSON.stringify({ error: msg }), {
        status, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const aiData = await aiResp.json();
    const content: string = aiData.choices?.[0]?.message?.content ?? "";

    let output: unknown;
    if (TEXT_STEPS.has(step)) {
      output = content.trim();
    } else {
      try {
        output = JSON.parse(content);
      } catch {
        // Best-effort fallback: extract first JSON block
        const m = content.match(/\{[\s\S]*\}/);
        if (!m) {
          return new Response(JSON.stringify({ error: "AI did not return valid JSON", raw: content.slice(0, 500) }), {
            status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        output = JSON.parse(m[0]);
      }
    }

    // Persist output to the matching column.
    const update: Record<string, unknown> = { [column]: output, updated_at: new Date().toISOString() };

    // Convenience status bumps.
    if (step === "route" && row.status === "draft") update.status = "route_drafted";
    if (step === "days") update.status = "days_done";

    const { error: updErr } = await admin
      .from("route_maker_itineraries").update(update).eq("id", itineraryId);
    if (updErr) {
      return new Response(JSON.stringify({ error: `Persist failed: ${updErr.message}` }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ step, output }), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("route-maker-step error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
