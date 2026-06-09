// Generate a tailored itinerary via Claude (Anthropic API)
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';

const SYSTEM_PROMPT =
  "You are an expert travel planner for Fjord & Waves Travel, a premium travel agency. " +
  "Based on the customer's details, create a detailed day-by-day itinerary including activities, " +
  "restaurant suggestions, accommodation recommendations, transportation tips, and insider advice. " +
  "Tailor everything to the group size, budget, pace, interests, dietary needs, and accessibility requirements. " +
  "Write in a warm, professional, and inspiring tone. " +
  "Format the response as clean markdown with H1 for the trip title, H2 for each day (e.g. '## Day 1 — ...'), " +
  "and use lists, bold, and short paragraphs where helpful.";

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

    // Compose a clear, structured prompt from the customer's submission.
    const lines: string[] = [];
    const push = (label: string, val: any) => {
      if (val === undefined || val === null || val === '' || (Array.isArray(val) && val.length === 0)) return;
      lines.push(`- **${label}:** ${Array.isArray(val) ? val.join(', ') : val}`);
    };
    push('Client name', request.client_name);
    push('Email', request.client_email);
    push('Phone', request.phone);
    push('Departing from', request.departure);
    push('Destination', request.destination);
    push('Group size', request.group_size);
    push('Adults', request.adults);
    push('Children', request.children_count);
    push('Children ages', request.children_ages);
    push('Trip duration', request.trip_duration);
    push('Start date', request.start_date);
    push('End date', request.end_date);
    push('Estimated budget', request.estimated_budget);
    push('Travel pace', request.travel_pace);
    push('Accommodation preference', request.accommodation_type);
    push('Interests', request.interests);
    push('Must-have experiences', request.must_have_experiences);
    push('Dietary restrictions', request.dietary_restrictions);
    push('Mobility / accessibility', request.mobility_notes);
    push('Visited before', request.visited_before ? 'Yes' : null);
    push('Additional notes', request.notes);

    const userPrompt =
      "Please craft a complete day-by-day itinerary for the following customer:\n\n" +
      lines.join('\n') +
      "\n\nProduce the itinerary now in markdown.";

    const anthropicRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 4096,
        system: SYSTEM_PROMPT,
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
