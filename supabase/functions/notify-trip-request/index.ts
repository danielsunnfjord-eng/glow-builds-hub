import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const ADVISOR_EMAIL = "daniel.lirafigueiredo@fora.travel";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const {
      clientName, clientEmail, destination, departure, groupSize,
      tripDuration, startDate, endDate, budget, notes,
      interests, mobilityNotes, accommodationType,
      dietaryRestrictions, mustHaveExperiences, travelPace, visitedBefore,
    } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: "LOVABLE_API_KEY missing" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-lite",
        messages: [
          {
            role: "system",
            content: "You generate a brief, clean HTML email notification for a travel advisor about a new trip request. Use simple HTML with inline styles. Keep it professional and concise. Do NOT include html/head/body tags, just the content div.",
          },
          {
            role: "user",
            content: `New trip request received:
- Client: ${clientName}
- Email: ${clientEmail}
- From: ${departure || "Not specified"}
- To: ${destination || "Not specified"}
- Group: ${groupSize} people
- Duration: ${tripDuration || "Not specified"}
- Dates: ${startDate || "?"} to ${endDate || "?"}
- Budget: ${budget || "Not specified"}
- Interests: ${interests?.length ? interests.join(", ") : "Not specified"}
- Accommodation preference: ${accommodationType || "Not specified"}
- Travel pace: ${travelPace || "Not specified"}
- Mobility/accessibility: ${mobilityNotes || "None"}
- Dietary restrictions: ${dietaryRestrictions || "None"}
- Must-have experiences: ${mustHaveExperiences || "None"}
- Visited before: ${visitedBefore ? "Yes" : "No"}
- Notes: ${notes || "None"}

Generate a clean HTML notification email body.`,
          },
        ],
      }),
    });

    let emailBody = `<h2>New Trip Request</h2><p><strong>${clientName}</strong> (${clientEmail}) submitted a trip request.</p>
<ul>
<li>Destination: ${destination || "—"}</li>
<li>Departure: ${departure || "—"}</li>
<li>Group: ${groupSize}</li>
<li>Duration: ${tripDuration || "—"}</li>
<li>Dates: ${startDate || "?"} → ${endDate || "?"}</li>
<li>Budget: ${budget || "—"}</li>
<li>Interests: ${interests?.length ? interests.join(", ") : "—"}</li>
<li>Accommodation: ${accommodationType || "—"}</li>
<li>Travel pace: ${travelPace || "—"}</li>
<li>Mobility: ${mobilityNotes || "—"}</li>
<li>Dietary: ${dietaryRestrictions || "—"}</li>
<li>Must-have: ${mustHaveExperiences || "—"}</li>
<li>Visited before: ${visitedBefore ? "Yes" : "No"}</li>
</ul>
${notes ? `<p><strong>Notes:</strong> ${notes}</p>` : ""}`;

    if (aiResponse.ok) {
      const aiData = await aiResponse.json();
      const aiContent = aiData.choices?.[0]?.message?.content;
      if (aiContent) emailBody = aiContent;
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { error } = await supabase.functions.invoke("send-itinerary-email", {
      body: {
        recipientEmail: ADVISOR_EMAIL,
        clientName: "System",
        destination: destination || "New Request",
        templateName: "notification",
        customSubject: `🌍 New Trip Request: ${clientName} → ${destination || "TBD"}`,
        customBody: emailBody,
      },
    });

    if (error) {
      console.error("Email send error:", error);
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("notify-trip-request error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
