// Estimate a per-person budget for an itinerary using Claude.
// Returns a strict JSON object — see SYSTEM prompt below.
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';

const LANG_NAME: Record<string, string> = {
  en: "English",
  pt: "Portuguese (Brazilian Portuguese, pt-BR)",
  no: "Norwegian (Bokmål)",
};

const DEFAULT_CURRENCY: Record<string, string> = {
  en: "USD",
  pt: "BRL",
  no: "NOK",
};

const COVER_HINT: Record<string, string> = {
  en: 'e.g. "From $1,230 per person"',
  pt: 'e.g. "A partir de R$1.230 por pessoa"',
  no: 'e.g. "Fra kr 12 300 per person"',
};

function buildSystem(langCode: string, currency: string): string {
  const langName = LANG_NAME[langCode] || "English";
  const cover = COVER_HINT[langCode] || COVER_HINT.en;
  return `You are a travel cost expert. Based on the itinerary content provided, generate a realistic estimated budget breakdown per person. Analyse the accommodation type, transport methods, activities, experiences, and dining recommendations mentioned. Use real current price ranges for the specific destination and region — not generic global averages.

LANGUAGE: Write ALL free-text fields ("note" for each category, the top-level "notes", and "cover_label") entirely in ${langName}. Do not mix languages. Numeric values stay numeric.

CURRENCY: Return prices in ${currency}. Set "currency": "${currency}". Convert local/reference prices into ${currency} using reasonable current exchange rates. Do NOT return values in EUR unless ${currency} is EUR.

COVER LABEL: Localize the phrasing naturally for ${langName} (${cover}).

Return ONLY a valid JSON object with no extra text, in this exact format:
{
"currency": "${currency}",
"per_day": {
"accommodation": {"low": 0, "high": 0, "note": ""},
"transport": {"low": 0, "high": 0, "note": ""},
"activities": {"low": 0, "high": 0, "note": ""},
"food_beverage": {"low": 0, "high": 0, "note": ""},
"entrance_fees": {"low": 0, "high": 0, "note": ""},
"miscellaneous": {"low": 0, "high": 0, "note": ""}
},
"total_per_day": {"low": 0, "high": 0},
"total_per_person": {"low": 0, "high": 0},
"duration_days": 0,
"notes": "",
"cover_label": ""
}`;
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
    const { content, destination, trip_duration, language, currency } = await req.json();
    if (!content || typeof content !== 'string' || content.trim().length < 20) {
      return new Response(JSON.stringify({ error: 'Missing or empty itinerary content' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const langCode = (typeof language === 'string' && ['en', 'pt', 'no'].includes(language)) ? language : 'en';
    const ccy = (typeof currency === 'string' && currency.trim()) ? currency.trim().toUpperCase() : DEFAULT_CURRENCY[langCode];

    // Guard against oversize payloads (Claude context is 200k tokens ≈ 600k chars).
    // Cap at ~150k chars to leave headroom for system prompt + response.
    const MAX_CHARS = 150_000;
    let trimmed = content;
    if (trimmed.length > MAX_CHARS) {
      const head = trimmed.slice(0, Math.floor(MAX_CHARS * 0.7));
      const tail = trimmed.slice(-Math.floor(MAX_CHARS * 0.3));
      trimmed = `${head}\n\n[...content truncated for length...]\n\n${tail}`;
    }

    const userMsg = [
      destination ? `Destination/Region: ${destination}` : '',
      trip_duration ? `Trip duration: ${trip_duration}` : '',
      `Output language: ${LANG_NAME[langCode]}`,
      `Output currency: ${ccy}`,
      '',
      'Itinerary content:',
      trimmed,
    ].filter(Boolean).join('\n');

    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-5',
        max_tokens: 2000,
        system: buildSystem(langCode, ccy),
        messages: [{ role: 'user', content: userMsg }],
      }),
    });
    if (!res.ok) {
      const errText = await res.text();
      return new Response(JSON.stringify({ error: 'Claude API error', detail: errText }), {
        status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    const data = await res.json();
    const text = (data?.content?.[0]?.text || '').trim();
    const cleaned = text.replace(/^```json\s*|\s*```$/gi, '').trim();
    const match = cleaned.match(/\{[\s\S]*\}/);
    let budget: any = null;
    try { budget = JSON.parse(match ? match[0] : cleaned); } catch {
      return new Response(JSON.stringify({ error: 'Failed to parse Claude JSON', raw: text }), {
        status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ budget }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
