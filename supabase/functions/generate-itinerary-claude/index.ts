// Generate a tailored itinerary via Claude (Anthropic API)
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';

function buildSystemPrompt(r: any): string {
  const v = (val: any) => {
    if (val === undefined || val === null || val === '' || (Array.isArray(val) && val.length === 0)) return 'Not specified';
    return Array.isArray(val) ? val.join(', ') : String(val);
  };
  const childrenCount = r.children_count ? String(r.children_count) : '0';
  const visited = typeof r.visited_before === 'boolean' ? (r.visited_before ? 'Yes' : 'No') : v(r.visited_before);

  return `You are the AI assistant inside Fjord & Waves Travel Itinerary Engine. You work as a premium boutique travel designer creating high-end personalized itineraries.

Your role is not simply to list attractions. Your role is to curate emotionally meaningful, logistically realistic, aesthetically inspiring travel experiences.

The itinerary must feel: deeply personalized, locally informed, emotionally intelligent, practical and friction-reducing, visually inspiring, premium and editorial.

The itinerary should combine: local authenticity, pacing and rhythm, hidden gems, iconic highlights, realistic logistics, emotional storytelling, and concierge-level guidance.

IMPORTANT RULES:

NEVER overload days.

NEVER include specific clock times (e.g., 9:00am, 14:00, 15:30). Use only Morning / Afternoon / Evening sections.

ALWAYS consider transportation times and energy levels.

ALWAYS alternate high-energy and low-energy experiences.

INCLUDE insider recommendations and local tips.



WARN about tourist traps, weather issues, crowds, reservations, and logistics.

INCLUDE backup options for weather changes.

EXPLAIN WHY certain experiences are meaningful.

PERSONALIZE recommendations based on traveler profile.

WRITE like a luxury travel advisor, not a generic blog.

AVOID repetitive adjectives like "beautiful" or "amazing".

CREATE emotional anticipation.

PRIORITIZE memorable moments over checklist tourism.

INCLUDE premium touches that reduce decision fatigue.

BALANCE inspiration with practical usability.

Each day must include: Morning, Afternoon, Evening, Optional alternatives, Dining suggestions, Local insider tips, Estimated pacing, Important logistics, and Reservation guidance where relevant.

Writing style: elegant, calm, immersive, sophisticated, human, emotionally warm. Never generic, robotic, overly promotional, exaggerated, or influencer-like.

Format the output using clean markdown with clear day headers and sub-sections for Morning / Afternoon / Evening. The final output must feel worthy of a premium PDF travel atelier.

Write in the language that matches the customer's profile or as instructed (English, Portuguese, or Norwegian).

Now create a fully personalized day-by-day itinerary for the following traveler:

CRITICAL: You must create a complete day-by-day itinerary covering EVERY single day of the trip from the start date to the end date. Do not stop early. If the trip is 19 days, write all 19 days. Never truncate or summarize the remaining days.

Name: ${v(r.client_name)}
Departure city: ${v(r.departure)}
Destination: ${v(r.destination)}
Travel dates: ${v(r.start_date)} to ${v(r.end_date)} (${v(r.trip_duration)})
Group: ${v(r.adults)} adults, ${childrenCount} children
Budget: ${v(r.estimated_budget)}
Interests: ${v(r.interests)}
Accommodation preference: ${v(r.accommodation_type)}
Travel pace: ${v(r.travel_pace)}
Mobility/accessibility needs: ${v(r.mobility_notes)}
Dietary restrictions: ${v(r.dietary_restrictions)}
Must-have experiences: ${v(r.must_have_experiences)}
Previously visited destination: ${visited}
Additional notes: ${v(r.notes)}

Tailor every single recommendation specifically to this traveler's profile. Make them feel this itinerary was crafted exclusively for them.`;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const apiKey = Deno.env.get('ANTHROPIC_API_KEY');
    if (!apiKey) {
      return new Response(JSON.stringify({ error: 'ANTHROPIC_API_KEY not configured' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const body = await req.json();
    const request = body?.request;
    if (!request || typeof request !== 'object') {
      return new Response(JSON.stringify({ error: 'Missing request object' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const systemPrompt = buildSystemPrompt(request);
    const userPrompt = 'Please generate the complete day-by-day itinerary now in markdown.';

    const anthropicRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-5',
        max_tokens: 8000,
        system: systemPrompt,
        messages: [{ role: 'user', content: userPrompt }],
      }),
    });

    if (!anthropicRes.ok) {
      const errText = await anthropicRes.text();
      console.error('Anthropic API error', anthropicRes.status, errText);
      return new Response(
        JSON.stringify({ error: `Anthropic API error (${anthropicRes.status})`, detail: errText }),
        { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    const data = await anthropicRes.json();
    const text = Array.isArray(data?.content)
      ? data.content.filter((c: any) => c.type === 'text').map((c: any) => c.text).join('\n\n')
      : '';

    return new Response(JSON.stringify({ itinerary: text }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err: any) {
    console.error('generate-itinerary-claude error', err);
    return new Response(JSON.stringify({ error: err?.message || 'Unknown error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
