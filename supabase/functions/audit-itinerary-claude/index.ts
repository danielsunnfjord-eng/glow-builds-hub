// Audit an existing itinerary with Claude.
// Two modes:
//   - mode: "audit"   → single short call returning JSON { audit }
//   - mode: "rewrite" → chunked streaming text/plain response with the rewritten itinerary
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';

const LANG_NAMES: Record<string, string> = {
  en: 'English',
  pt: 'Brazilian Portuguese (pt-BR)',
  no: 'Norwegian (Bokmål)',
};

const langLine = (lang: string) => {
  const name = LANG_NAMES[lang] || 'English';
  return `Write ALL of your output natively in ${name}. This includes every suggestion title, every "why" explanation, and every rewritten body. Never mix languages, never fall back to English (unless the target language is English). Write as a native speaker would — do not translate word-for-word.`;
};

const AUDIT_SYSTEM = (lang: string) => `You are a senior luxury travel advisor with 20 years of experience. Audit the following itinerary and identify concrete improvements covering: unrealistic logistics, excessive travel times, repetitive experiences, tourist traps, poor pacing, missing reservation advice, weak personalization, generic recommendations, lack of local authenticity, missed hidden gems, weather vulnerabilities, overcrowded days, and moments lacking emotional depth.

${langLine(lang)}

Output ONLY valid JSON in this exact shape — no prose, no markdown, no code fences:
{ "items": [ { "title": "Short actionable suggestion (max ~12 words, ideally referencing the specific day)", "why": "One sentence explaining why this improvement matters." } ] }

Provide between 4 and 10 distinct items. Each item must be a single specific, actionable improvement. Do not rewrite the itinerary.`;

const IMPROVE_SYSTEM = (lang: string) => `You are a senior luxury travel advisor with 20 years of experience. Rewrite the provided itinerary applying ALL improvements from the audit notes. Use the same Morning / Afternoon / Evening format, no clock times, with a Dining tip and an Insider tip per day. Write in an elegant, warm, sophisticated tone worthy of a premium travel atelier.

${langLine(lang)}

Output ONLY the complete improved itinerary in markdown. Do not include an audit section, preamble, or commentary. Never stop mid-sentence — if space is tight, shorten descriptions slightly but always finish every day through the last day.`;

const CATALOGUE_IMPROVE_SYSTEM = (lang: string) => `You are a senior luxury travel advisor with 20 years of experience. Rewrite the provided catalogue travel guide applying ALL improvements from the audit notes.

${langLine(lang)}

This is a catalogue guide, NOT a custom day-by-day itinerary. Preserve a thematic structure with markdown ## section headers such as Where to Stay, Getting Around, Must-See Highlights, Hidden Gems & Local Favourites, Food & Drink, Experiences & Activities, and Practical Tips. Adapt section titles to the destination and experience type.

Never use Day 1, Day 2, Morning, Afternoon, Evening, or clock-time itinerary structure. Each section should contain concise, specific paragraphs with real places, logistics, restaurants, dishes, neighbourhoods, routes, hikes, and booking advice where relevant.

Output ONLY the complete improved guide in markdown. Do not include an audit section, preamble, or commentary.`;

function computeTotalDays(content: string, startDate?: string, endDate?: string, tripDuration?: string): number {
  const s = startDate ? Date.parse(startDate) : NaN;
  const e = endDate ? Date.parse(endDate) : NaN;
  if (Number.isFinite(s) && Number.isFinite(e) && e >= s) {
    return Math.round((e - s) / 86400000) + 1;
  }
  if (tripDuration) {
    const m = String(tripDuration).match(/\d+/);
    if (m) return parseInt(m[0], 10);
  }
  // Fallback: count "Day N" markers in the original content.
  const matches = content.match(/##\s*Day\s+\d+/gi) || content.match(/\bDay\s+\d+\b/gi);
  return matches ? matches.length : 0;
}

function splitDayRanges(totalDays: number, numChunks: number): Array<[number, number]> {
  if (totalDays <= 0 || numChunks <= 0) return [];
  if (numChunks === 1) return [[1, totalDays]];
  const base = Math.floor(totalDays / numChunks);
  const remainder = totalDays % numChunks;
  const ranges: Array<[number, number]> = [];
  let cursor = 1;
  for (let i = 0; i < numChunks; i++) {
    const size = base + (i < remainder ? 1 : 0);
    if (size <= 0) continue;
    const end = cursor + size - 1;
    ranges.push([cursor, end]);
    cursor = end + 1;
  }
  return ranges;
}

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

function streamRewrite(opts: {
  apiKey: string;
  content: string;
  audit: string;
  totalDays: number;
  structure?: string;
  singleBatch?: boolean;
  language?: string;
}): Response {
  const { apiKey, content, audit, totalDays, structure, singleBatch, language = 'en' } = opts;
  const encoder = new TextEncoder();
  const decoder = new TextDecoder();

  const isCatalogueGuide = structure === 'catalogue-thematic';

  const numChunks = singleBatch ? 1 : totalDays >= 22 ? 4 : totalDays >= 15 ? 3 : totalDays >= 8 ? 2 : 1;
  const ranges = totalDays > 0 ? splitDayRanges(totalDays, numChunks) : [];

  const baseContext =
    `Original itinerary:\n\n${content}\n\n---\n\nAudit notes to address:\n\n${audit || '(no audit notes provided — improve based on general best practices)'}\n\n---\n\n`;

  const userPrompts: string[] = isCatalogueGuide
    ? [baseContext + 'Now output the complete improved thematic catalogue guide in markdown. Preserve ## thematic section headers. Do not use day numbering or Morning / Afternoon / Evening sections.']
    : ranges.length
    ? ranges.map(([start, end], idx) => {
        if (ranges.length === 1) {
          return baseContext + 'Now output the complete improved itinerary in markdown.';
        }
        if (idx === 0) {
          return (
            baseContext +
            `Output the improved itinerary in markdown. Write Day ${start} through Day ${end} in full ` +
            `using Morning / Afternoon / Evening structure (no clock times), with Dining tip and Insider tip per day. ` +
            `Stop immediately after Day ${end} — do not write Day ${end + 1} or later. No closing summary; it will continue in a follow-up call.`
          );
        }
        return (
          `Continue the improved itinerary from Day ${start}. Do not repeat previous days. ` +
          `Start directly with "## Day ${start}". Write Day ${start} through Day ${end} in full using the same structure.` +
          (idx === ranges.length - 1
            ? ` Complete every day through Day ${end} without truncating.`
            : ` Stop immediately after Day ${end} — do not write later days.`)
        );
      })
    : [baseContext + 'Now output the complete improved itinerary in markdown.'];

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
              system: isCatalogueGuide ? CATALOGUE_IMPROVE_SYSTEM(language) : IMPROVE_SYSTEM(language),
              messages: [{ role: 'user', content: userPrompts[i] }],
            }),
          });

          if (!res.ok || !res.body) {
            const errText = await res.text().catch(() => '');
            controller.enqueue(encoder.encode(`\n\n[Error from upstream (${res.status}): ${errText}]\n`));
            break;
          }

          if (i > 0) controller.enqueue(encoder.encode('\n\n'));

          const reader = res.body.getReader();
          let buffer = '';
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop() ?? '';
            for (const line of lines) {
              const t = line.trim();
              if (!t.startsWith('data:')) continue;
              const payload = t.slice(5).trim();
              if (!payload || payload === '[DONE]') continue;
              try {
                const evt = JSON.parse(payload);
                if (evt.type === 'content_block_delta' && evt.delta?.type === 'text_delta') {
                  controller.enqueue(encoder.encode(evt.delta.text));
                }
              } catch { /* ignore */ }
            }
          }
        }
      } catch (e) {
        console.error('rewrite stream error', e);
        controller.enqueue(encoder.encode(`\n\n[Error from upstream: ${(e as Error)?.message || 'Rewrite stream failed'}]\n`));
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

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const apiKey = Deno.env.get('ANTHROPIC_API_KEY');
    if (!apiKey) {
      return new Response(JSON.stringify({ error: 'ANTHROPIC_API_KEY not configured' }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const body = await req.json();
    const { content, mode = 'audit', audit = '', start_date, end_date, trip_duration, structure = '', single_batch = false, sections, improvement, language = 'en' } = body || {};
    const langName = LANG_NAMES[language] || 'English';

    // Sectional rewrite: receives a list of labeled sections + ONE improvement,
    // returns only the sections that were changed. Output is capped so the call
    // stays fast and well within any timeout.
    if (mode === 'rewrite_sections') {
      if (!Array.isArray(sections) || !sections.length) {
        return new Response(JSON.stringify({ error: 'Missing sections' }), {
          status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (!improvement || typeof improvement?.title !== 'string' || !improvement.title.trim()) {
        return new Response(JSON.stringify({ error: 'Missing improvement' }), {
          status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const SECTIONAL_SYSTEM = `You are a senior luxury travel advisor with 20 years of experience. You receive a travel document split into labeled sections plus ONE specific improvement to apply.

${langLine(language)}

Rewrite ONLY the section(s) that need to change to apply this improvement. Leave every other section completely untouched and DO NOT include them in your output. Most improvements affect only one section; some may legitimately affect a few. Never rewrite the whole document.

CRITICAL RULES for each returned section "body":
- Output ONLY the replacement body for that exact section id.
- DO NOT include the section's own heading line (no leading "#", "##", or "###" line).
- DO NOT include any other section's heading (no other "Day N", "Morning", "Afternoon", "Evening", or "##"/"###" headings).
- DO NOT include neighboring days or repeat content from other sections.
- DO NOT return the full itinerary or a merged document.
- The body REPLACES the existing body of that section verbatim — anything you include will appear in the final document exactly once.
- The rewritten body MUST be written natively in ${langName} to match the rest of the document.

Preserve the existing tone, voice, and sub-content of the section. Keep changes focused and surgical.

Output ONLY valid JSON in this exact shape — no prose, no markdown, no code fences:
{ "sections": [ { "id": "<section id>", "body": "<new body markdown without the heading line>" } ] }

If no section needs to change to apply this improvement, output: { "sections": [] }`;

      const improvementLine = `${improvement.title}${improvement.why ? ` — ${improvement.why}` : ''}`;
      const docBlocks = sections
        .map((s: any) => `--- SECTION id=${String(s?.id || '')} ---\n${String(s?.heading || '(preamble — no heading)')}\n${String(s?.body || '')}`)
        .join('\n\n');
      const userMsg = `Improvement to apply:\n${improvementLine}\n\nDocument sections:\n\n${docBlocks}`;

      try {
        const text = await callClaude(apiKey, SECTIONAL_SYSTEM, userMsg, 2000);
        const cleaned = text.replace(/^```json\s*|\s*```$/gi, '').trim();
        const match = cleaned.match(/\{[\s\S]*\}/);
        let parsed: any = null;
        try { parsed = JSON.parse(match ? match[0] : cleaned); } catch { parsed = null; }
        const outSections = Array.isArray(parsed?.sections)
          ? parsed.sections
              .map((s: any) => ({ id: String(s?.id || ''), body: String(s?.body ?? '') }))
              .filter((s: any) => s.id)
          : [];
        return new Response(JSON.stringify({ sections: outSections }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      } catch (e) {
        return new Response(JSON.stringify({ error: (e as Error).message }), {
          status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    if (!content || typeof content !== 'string' || !content.trim()) {
      return new Response(JSON.stringify({ error: 'Missing itinerary content' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (mode === 'rewrite') {
      const totalDays = computeTotalDays(content, start_date, end_date, trip_duration);
      return streamRewrite({ apiKey, content, audit, totalDays, structure, singleBatch: Boolean(single_batch) });
    }

    // Default: audit-only (short, fast). Returns JSON items.
    const auditText = await callClaude(
      apiKey,
      AUDIT_SYSTEM,
      `Here is the itinerary to audit:\n\n${content}`,
      2000,
    );

    let items: Array<{ title: string; why: string }> = [];
    try {
      const cleaned = auditText.replace(/^```json\s*|\s*```$/gi, '').trim();
      const match = cleaned.match(/\{[\s\S]*\}/);
      const parsed = JSON.parse(match ? match[0] : cleaned);
      if (Array.isArray(parsed?.items)) {
        items = parsed.items
          .map((it: any) => ({
            title: String(it?.title || it?.suggestion || '').trim(),
            why: String(it?.why || it?.reason || it?.explanation || '').trim(),
          }))
          .filter((it: any) => it.title);
      }
    } catch {
      // fall through — leave items empty, client will fallback parse the text
    }

    return new Response(JSON.stringify({ audit: auditText, items }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
