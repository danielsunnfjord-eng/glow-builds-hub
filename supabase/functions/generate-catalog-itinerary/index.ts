// Generate a general catalogue itinerary via Claude (Anthropic API)
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';

const BASE_SYSTEM_PROMPT = `You are the AI assistant inside Fjord & Waves Travel Itinerary Engine. You work as a premium boutique travel designer and editorial travel writer.

Your role is not simply to list attractions. Your role is to curate emotionally meaningful, logistically realistic, aesthetically inspiring travel experiences that inspire travelers and make them feel the destination before they even arrive.

The itinerary must feel: locally informed, emotionally intelligent, practical and friction-reducing, visually inspiring, premium and editorial.

The itinerary should combine: local authenticity, pacing and rhythm, hidden gems, iconic highlights, realistic logistics, emotional storytelling, and concierge-level guidance.

IMPORTANT RULES:

NEVER overload days.

ALWAYS consider transportation times and energy levels.

ALWAYS alternate high-energy and low-energy experiences.

INCLUDE insider recommendations and local tips.

INCLUDE realistic timing guidance.

WARN about tourist traps, weather issues, crowds, reservations, and logistics.

INCLUDE backup options for weather changes.

EXPLAIN WHY certain experiences are meaningful.

WRITE like a luxury travel advisor, not a generic blog.

AVOID repetitive adjectives like "beautiful" or "amazing".

CREATE emotional anticipation.

PRIORITIZE memorable moments over checklist tourism.

INCLUDE premium touches that reduce decision fatigue.

BALANCE inspiration with practical usability.

Each day must include: Morning, Afternoon, Evening, Optional alternatives, Dining suggestions, Local insider tips, Estimated pacing, Important logistics, and Reservation guidance where relevant.

CRITICAL: You must cover EVERY single day of the trip from day 1 to the last day without exception. Never stop early. Never truncate. If the itinerary is 10 days, all 10 days must be written in full using Morning / Afternoon / Evening structure with no clock times.

Begin with a compelling 2-3 paragraph editorial introduction that captures the soul of the destination and sets the emotional tone for the journey.

Writing style: elegant, calm, immersive, sophisticated, human, emotionally warm. Never generic, robotic, overly promotional, exaggerated, or influencer-like.

Format the output using clean markdown with clear day headers and sub-sections for Morning / Afternoon / Evening. The final output must feel worthy of a premium PDF travel atelier.

Write in the following language: {language}

Now create a premium editorial travel itinerary for:

Destination: {destination}

Experience type: {experience_type}

Duration: {duration}

Additional notes from editor: {notes}`;

const LANG_NAMES: Record<string, string> = {
  en: 'English',
  pt: 'Brazilian Portuguese (pt-BR)',
  no: 'Norwegian (Bokmål)',
};

function buildSystemPrompt(values: {
  language: string;
  destination: string;
  experience_type: string;
  duration: string;
  notes: string;
}): string {
  return BASE_SYSTEM_PROMPT
    .replace(/{language}/g, values.language)
    .replace(/{destination}/g, values.destination || 'Not specified')
    .replace(/{experience_type}/g, values.experience_type || 'Not specified')
    .replace(/{duration}/g, values.duration || 'Not specified')
    .replace(/{notes}/g, values.notes || 'None');
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

    const body = await req.json().catch(() => ({}));
    const {
      title = '',
      destination = '',
      experience_type = '',
      duration = '',
      language = 'en',
      brief = '',
      mode = 'full', // 'full' | 'section'
      section_instruction = '',
      existing_content = '',
    } = body || {};

    if (mode === 'full' && !destination && !title) {
      return new Response(JSON.stringify({ error: 'destination or title is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const langName = LANG_NAMES[language] || 'English';

    let systemPrompt: string;
    let userPrompt: string;

    if (mode === 'section') {
      systemPrompt = buildSystemPrompt({
        language: langName,
        destination,
        experience_type,
        duration,
        notes: brief,
      });
      userPrompt =
        `Write the response entirely in ${langName}.\n\n` +
        `Here is an existing itinerary draft (markdown):\n\n` +
        `"""\n${existing_content}\n"""\n\n` +
        `Please regenerate ONLY the section described below, keeping the same overall style and tone. ` +
        `Return JUST the rewritten section as markdown — no preamble, no explanation.\n\n` +
        `Section instruction: ${section_instruction}`;
    } else {
      systemPrompt = buildSystemPrompt({
        language: langName,
        destination,
        experience_type,
        duration,
        notes: brief,
      });
      userPrompt = `Produce the complete premium editorial travel itinerary now in markdown.`;
    }

    const anthropicRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-5',
        max_tokens: 16000,
        stream: true,
        system: systemPrompt,
        messages: [{ role: 'user', content: userPrompt }],
      }),
    });

    if (!anthropicRes.ok || !anthropicRes.body) {
      const errText = await anthropicRes.text().catch(() => '');
      console.error('Anthropic API error', anthropicRes.status, errText);
      return new Response(
        JSON.stringify({ error: `Anthropic API error (${anthropicRes.status})`, detail: errText }),
        { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    // Stream SSE from Anthropic, extract text deltas, forward as plain text chunks.
    // Keeps the edge-function idle timer alive (resets on each byte sent).
    const encoder = new TextEncoder();
    const decoder = new TextDecoder();
    const reader = anthropicRes.body.getReader();
    let buffer = '';

    const stream = new ReadableStream({
      async pull(controller) {
        try {
          const { value, done } = await reader.read();
          if (done) {
            controller.close();
            return;
          }
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() ?? '';
          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed.startsWith('data:')) continue;
            const payload = trimmed.slice(5).trim();
            if (!payload || payload === '[DONE]') continue;
            try {
              const evt = JSON.parse(payload);
              if (evt.type === 'content_block_delta' && evt.delta?.type === 'text_delta') {
                controller.enqueue(encoder.encode(evt.delta.text));
              }
            } catch { /* ignore parse errors */ }
          }
        } catch (e) {
          controller.error(e);
        }
      },
      cancel() {
        reader.cancel().catch(() => {});
      },
    });

    return new Response(stream, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'text/plain; charset=utf-8',
        'X-Content-Type-Options': 'nosniff',
        'Cache-Control': 'no-cache, no-transform',
      },
    });
  } catch (err: any) {
    console.error('generate-catalog-itinerary error', err);
    return new Response(JSON.stringify({ error: err?.message || 'Unknown error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
