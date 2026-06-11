// Audit an existing itinerary with Claude and produce an improved version.
// Split into two sequential calls to stay under the 150s edge idle timeout.
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';

const AUDIT_SYSTEM = `You are a senior luxury travel advisor with 20 years of experience. Audit the following itinerary and identify any issues including: unrealistic logistics, excessive travel times, repetitive experiences, tourist traps, poor pacing, missing reservation advice, weak personalization, generic recommendations, lack of local authenticity, missed hidden gems, weather vulnerabilities, overcrowded days, and moments lacking emotional depth.

Output ONLY a concise Audit Report as a markdown bullet list. Do not rewrite the itinerary. Be specific and actionable. Keep it under ~400 words.`;

const IMPROVE_SYSTEM = `You are a senior luxury travel advisor with 20 years of experience. Rewrite the provided itinerary applying ALL improvements from the audit notes. Use the same Morning / Afternoon / Evening format, no clock times, with a Dining tip and an Insider tip per day. Write in an elegant, warm, sophisticated tone worthy of a premium travel atelier.

Output ONLY the complete improved itinerary in markdown. Do not include an audit section, preamble, or commentary. Never stop mid-sentence — if space is tight, shorten descriptions slightly but always finish every day through the last day.`;

async function callClaude(apiKey: string, system: string, user: string, maxTokens: number) {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-5',
      max_tokens: maxTokens,
      system,
      messages: [{ role: 'user', content: user }],
    }),
  });
  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Claude API error: ${errText}`);
  }
  const data = await res.json();
  return (data?.content?.[0]?.text || '').trim();
}

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

    // Call 1 — audit only (short)
    const audit = await callClaude(
      apiKey,
      AUDIT_SYSTEM,
      `Here is the itinerary to audit:\n\n${content}`,
      2048,
    );

    // Call 2 — full improved itinerary
    const improved = await callClaude(
      apiKey,
      IMPROVE_SYSTEM,
      `Original itinerary:\n\n${content}\n\n---\n\nAudit notes to address:\n\n${audit}\n\n---\n\nNow output the complete improved itinerary.`,
      8192,
    );

    return new Response(
      JSON.stringify({ audit, improved, raw: `# Audit Report\n\n${audit}\n\n# Improved Itinerary\n\n${improved}` }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
