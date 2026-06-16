// Generate a thematic catalogue guide via Claude (Anthropic API)
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';

const BASE_SYSTEM_PROMPT = `You are the AI assistant inside Fjord & Waves Travel Itinerary Engine. You work as a premium boutique travel designer and editorial travel writer.

Your role is not simply to list attractions. Your role is to curate emotionally meaningful, logistically realistic, aesthetically inspiring travel experiences that inspire travelers and make them feel the destination before they even arrive.

The itinerary must feel: locally informed, emotionally intelligent, practical and friction-reducing, visually inspiring, premium and editorial.

The itinerary should combine: local authenticity, pacing and rhythm, hidden gems, iconic highlights, realistic logistics, emotional storytelling, concierge-level guidance, and seamless transport planning.

IMPORTANT RULES:
1. NEVER overload days.
2. ALWAYS consider transportation times and energy levels.
3. ALWAYS alternate high-energy and low-energy experiences.
4. INCLUDE insider recommendations and local tips.
5. INCLUDE realistic timing guidance.
6. WARN about tourist traps, weather issues, crowds, reservations, and logistics.
7. INCLUDE backup options for weather changes.
8. EXPLAIN WHY certain experiences are meaningful.
9. WRITE like a luxury travel advisor, not a generic blog.
10. AVOID repetitive adjectives like "beautiful" or "amazing".
11. CREATE emotional anticipation.
12. PRIORITIZE memorable moments over checklist tourism.
13. INCLUDE premium touches that reduce decision fatigue.
14. BALANCE inspiration with practical usability.
15. NEVER use AI clichés or words like: tapestry, nestled, vibrant, bustling, seamlessly, delve, curated, elevate, timeless, unparalleled, testament, treasure trove, gem, haven, boasts.
16. Keep each Morning / Afternoon / Evening section concise — 2-4 sentences. Dining tip and Insider tip: one sentence each. No clock times.
17. Write the way an experienced, well-travelled human advisor would speak — personal, grounded, and real.

TRANSPORT LOGISTICS — CRITICAL:
18. For EVERY day that involves moving between locations, clearly state: how to get there (car, ferry, train, bus, or combination), approximate travel time and distance, and whether advance booking is required.
19. ALWAYS flag transport that requires planning ahead — ferries that book out in peak season, trains that need reservation, toll roads, routes that only run on certain days, or connections with limited frequency.
20. ALWAYS warn about transport realities specific to that destination — for example: in Norway, ferries replace bridges and mountain passes close in winter; in Brazil, driving between cities differs greatly from driving within them; in Italy, ZTL restricted zones catch rental car drivers off guard; in remote areas, petrol stations can be hours apart.
21. ALWAYS design the day's sequence around realistic transport — account for ferry departure times, drive durations on narrow or winding roads, and the energy cost of long transfers.
22. If public transport is limited or impractical for a destination, say so clearly and recommend a rental car or private transfer instead — never assume the traveler can wing it.
23. Weave transport guidance naturally into the day narrative as part of the flow — not as a dry bullet list. For example: "The ferry from Balestrand to Flåm takes just under two hours — book it the evening before in July, as it fills by mid-morning. Sit on the starboard side heading east."

Each day must include: Morning, Afternoon, Evening, Optional alternatives, Dining suggestion, Local insider tip, Transport guidance, and Reservation guidance where relevant.

Begin with a compelling 2-3 paragraph editorial introduction that captures the soul of the destination and sets the emotional tone for the journey.

Writing style: elegant, calm, immersive, sophisticated, human, emotionally warm. Never generic, robotic, overly promotional, exaggerated, or influencer-like.

Format the output using clean markdown with clear day headers (\`## Day N — Theme\`) and sub-sections for Morning / Afternoon / Evening (use \`### Morning\`, \`### Afternoon\`, \`### Evening\`). The final output must feel worthy of a premium PDF travel atelier.

Write in the following language: {language}

Now create a premium editorial travel itinerary for:
— Destination: {destination}
— Experience type: {experience_type}
— Duration: {duration}
— Additional notes from editor: {notes}`;


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

    const systemPrompt = buildSystemPrompt({
      language: langName,
      destination,
      experience_type,
      duration,
      notes: brief,
    });

    // Build the sequence of user prompts (one per Anthropic call).
    const userPrompts: string[] = [];

    if (mode === 'section') {
      userPrompts.push(
        `Write the response entirely in ${langName}.\n\n` +
          `Here is an existing catalogue guide draft (markdown), already in day-by-day format:\n\n` +
          `"""\n${existing_content}\n"""\n\n` +
          `Please regenerate ONLY the section described below, keeping the same day-by-day journey style, tone and conventions ` +
          `(no Morning/Afternoon/Evening sub-headings, logistics woven into narrative, 2–4 short paragraphs per day). ` +
          `Return JUST the rewritten section as markdown — no preamble, no explanation.\n\n` +
          `Section instruction: ${section_instruction}`,
      );
    } else {
      // Two-pass day-by-day generation to keep streams flowing and avoid truncation.
      userPrompts.push(
        `Produce the day-by-day catalogue journey now in markdown. ` +
          `Write the short editorial introduction (max 2 short paragraphs), then the \`## Trip Overview\` bullet list covering EVERY day of the trip, ` +
          `then the FIRST HALF of the day-by-day sections in full (\`## Day N — Theme\` headings, italic base/route line, then 2–4 short narrative paragraphs each). ` +
          `Stop cleanly at the end of a day — do not write Practical Tips yet; the guide will be continued in a follow-up call.`,
      );
      userPrompts.push(
        `Continue the day-by-day catalogue journey. ` +
          `Do not repeat the introduction, the trip overview, or any days already written. ` +
          `Start directly with the next \`## Day N — Theme\` heading and complete all remaining days, then write the final \`## Practical Tips\` section. ` +
          `End naturally — no closing remarks.`,
      );
    }

    return streamSequentialCalls({ apiKey, systemPrompt, userPrompts });
  } catch (err: any) {
    console.error('generate-catalog-itinerary error', err);
    return new Response(JSON.stringify({ error: err?.message || 'Unknown error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

// Run multiple Anthropic streaming calls sequentially, forwarding text deltas
// from each as plain-text chunks to the client. Keeps the edge-function idle
// timer alive because bytes flow continuously.
function streamSequentialCalls(opts: {
  apiKey: string;
  systemPrompt: string;
  userPrompts: string[];
}): Response {
  const { apiKey, systemPrompt, userPrompts } = opts;
  const encoder = new TextEncoder();
  const decoder = new TextDecoder();

  const stream = new ReadableStream({
    async start(controller) {
      try {
        for (let i = 0; i < userPrompts.length; i++) {
          const res = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-api-key': apiKey,
              'anthropic-version': '2023-06-01',
            },
            body: JSON.stringify({
              model: 'claude-sonnet-4-5',
              max_tokens: 8192,
              stream: true,
              system: systemPrompt,
              messages: [{ role: 'user', content: userPrompts[i] }],
            }),
          });

          if (!res.ok || !res.body) {
            const errText = await res.text().catch(() => '');
            console.error('Anthropic API error', res.status, errText);
            controller.enqueue(
              encoder.encode(`\n\n[Error from upstream model (${res.status}): ${errText}]\n`),
            );
            break;
          }

          // Separate chunks with a blank line so the second call doesn't glue
          // onto the last line of the first call.
          if (i > 0) controller.enqueue(encoder.encode('\n\n'));

          const reader = res.body.getReader();
          let buffer = '';
          while (true) {
            const { value, done } = await reader.read();
            if (done) break;
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
          }
        }
      } catch (e) {
        console.error('stream error', e);
      } finally {
        controller.close();
      }
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
}
