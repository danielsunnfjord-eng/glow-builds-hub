// Audit an existing itinerary with Claude and produce an improved version.
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';

const SYSTEM_PROMPT = `You are a senior luxury travel advisor with 20 years of experience. Audit the following itinerary and identify any issues including: unrealistic logistics, excessive travel times, repetitive experiences, tourist traps, poor pacing, missing reservation advice, weak personalization, generic recommendations, lack of local authenticity, missed hidden gems, weather vulnerabilities, overcrowded days, and moments lacking emotional depth.

First output a clear Audit Report section listing all identified issues with brief explanations.

Then output a complete Improved Itinerary section with all improvements fully implemented, following the same Morning / Afternoon / Evening format, no clock times, with Dining tip and Insider tip per day. Write in an elegant, warm, sophisticated tone worthy of a premium travel atelier.

FORMAT STRICTLY as markdown with these exact top-level headings (and nothing before the first one):

# Audit Report

(your bullet list of issues here)

# Improved Itinerary

(the full rewritten itinerary here)`;

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const apiKey = Deno.env.get('ANTHROPIC_API_KEY');
    if (!apiKey) {
      return new Response(JSON.stringify({ error: 'ANTHROPIC_API_KEY not configured' }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { content } = await req.json();
    if (!content || typeof content !== 'string' || !content.trim()) {
      return new Response(JSON.stringify({ error: 'Missing itinerary content' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 8192,
        system: SYSTEM_PROMPT,
        messages: [
          { role: 'user', content: `Here is the itinerary to audit:\n\n${content}` },
        ],
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      return new Response(JSON.stringify({ error: `Claude API error: ${errText}` }), {
        status: res.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const data = await res.json();
    const text = data?.content?.[0]?.text || '';

    // Split into audit + improved
    const auditMatch = text.match(/#\s*Audit Report\s*\n([\s\S]*?)(?=#\s*Improved Itinerary)/i);
    const improvedMatch = text.match(/#\s*Improved Itinerary\s*\n([\s\S]*)$/i);

    const audit = auditMatch ? auditMatch[1].trim() : '';
    const improved = improvedMatch ? improvedMatch[1].trim() : '';

    return new Response(
      JSON.stringify({
        audit: audit || text,
        improved: improved || '',
        raw: text,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
