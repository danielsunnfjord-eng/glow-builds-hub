// Generate a thematic catalogue guide via Claude (Anthropic API)
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { createClient } from 'npm:@supabase/supabase-js@2';

// Canonical persona origin/destination tokens (lowercase). UI sends the same
// tokens; the traveler_personas table stores rows in the same casing.
const PERSONA_ORIGINS = new Set(['brazil', 'usa', 'norway', 'europe', 'global']);
const PERSONA_DESTINATIONS = new Set([
  'brazil', 'portugal', 'france', 'italy', 'spain', 'germany',
  'uk', 'norway', 'sweden', 'denmark', 'greece', 'usa',
]);

function normalizePersonaToken(v: unknown, allowed: Set<string>): string | null {
  if (typeof v !== 'string') return null;
  const t = v.trim().toLowerCase();
  return allowed.has(t) ? t : null;
}

// Two-tier persona lookup: exact (origin, destination) → (global, destination).
// Returns null with no injection when neither tier matches, and never throws
// into the caller — a persona miss must not break generation.
async function fetchTravelerPersona(
  origin: string | null,
  destination: string | null,
): Promise<{ origin: string; destination: string; notes: string } | null> {
  if (!destination) return null;
  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!supabaseUrl || !serviceKey) return null;
  const client = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  try {
    if (origin) {
      const { data } = await client
        .from('traveler_personas')
        .select('origin,destination,notes')
        .eq('origin', origin)
        .eq('destination', destination)
        .eq('is_active', true)
        .maybeSingle();
      if (data) return data as any;
    }
    if (origin !== 'global') {
      const { data } = await client
        .from('traveler_personas')
        .select('origin,destination,notes')
        .eq('origin', 'global')
        .eq('destination', destination)
        .eq('is_active', true)
        .maybeSingle();
      if (data) return data as any;
    }
  } catch (e) {
    console.error('fetchTravelerPersona failed', e);
  }
  return null;
}

const ORIGIN_LABEL: Record<string, string> = {
  brazil: 'Brazil',
  usa: 'USA',
  norway: 'Norway',
  europe: 'Europe',
  global: 'Global',
};
const DEST_LABEL: Record<string, string> = {
  brazil: 'Brazil', portugal: 'Portugal', france: 'France', italy: 'Italy',
  spain: 'Spain', germany: 'Germany', uk: 'UK', norway: 'Norway',
  sweden: 'Sweden', denmark: 'Denmark', greece: 'Greece', usa: 'USA',
};

function buildPersonaBlock(
  clientOrigin: string | null,
  persona: { origin: string; destination: string; notes: string } | null,
): string {
  if (!persona) return '';
  const originLabel = ORIGIN_LABEL[clientOrigin || persona.origin] || (clientOrigin || persona.origin);
  const destLabel = DEST_LABEL[persona.destination] || persona.destination;
  const matchNote =
    clientOrigin && clientOrigin !== persona.origin
      ? ` (no exact row for ${originLabel} → ${destLabel}; using generic ${ORIGIN_LABEL[persona.origin] || persona.origin} framing)`
      : '';
  return `TRAVELER CONTEXT
Origin: ${originLabel}${matchNote}
Destination market: ${destLabel}

Framing guidance for this traveler:
${persona.notes}

Weave the framing above into the editorial voice naturally — currency references, flight/logistics reality, cultural cues, and safety/vaccine notes should feel like a concierge speaking to this specific traveler, never as a bulleted checklist and never quoting this block verbatim.

`;
}

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

WRITING STYLE — HUMAN AND NATURAL:
15. Write the way an experienced, well-travelled human advisor would speak to a trusted client over a coffee. The writing must feel personal, grounded and real — never like it was generated by an AI.

STRICTLY AVOID:
— Words like: tapestry, nestled, vibrant, bustling, charming, seamlessly, delve, curated, elevate, timeless, unparalleled, testament, journey of discovery, treasure trove, gem, haven, boasts, offers a unique blend
— Opening sentences that start with "Imagine..." or "Welcome to..."
— Overly poetic or flowery descriptions that feel exaggerated
— Long complex sentences packed with multiple clauses
— Repetitive sentence structures throughout the document
— Adjective overload — never use more than one adjective per noun
— Summarising conclusions at the end of each day like "This day will leave you with memories to cherish"

INSTEAD:
— Use short, confident, specific sentences
— Name exact places, streets, dishes, and experiences — specificity makes writing feel human
— Alternate between short and medium length sentences naturally
— Let facts and details do the emotional work — avoid telling the reader how to feel
— Write as if you have personally been there and are sharing what you genuinely loved
— Use occasional dry wit or warmth where it fits naturally
— Trust the reader — do not over-explain or over-sell

TRANSPORT LOGISTICS — CRITICAL:
16. For EVERY day that involves moving between locations, clearly state: how to get there (car, ferry, train, bus, or combination), approximate travel time and distance, and whether advance booking is required.
17. ALWAYS flag transport that requires planning ahead — ferries that book out in peak season, trains that need reservation, toll roads, routes that only run on certain days, or connections with limited frequency.
18. ALWAYS warn about transport realities specific to that destination — for example: in Norway, ferries replace bridges and mountain passes close in winter; in Brazil, driving between cities differs greatly from driving within them; in Italy, ZTL restricted zones catch rental car drivers off guard; in remote areas, petrol stations can be hours apart.
19. ALWAYS design the day's sequence around realistic transport — account for ferry departure times, drive durations on narrow or winding roads, and the energy cost of long transfers.
20. If public transport is limited or impractical for a destination, say so clearly and recommend a rental car or private transfer instead — never assume the traveler can wing it.
21. Weave transport guidance naturally into the day narrative as part of the flow — not as a dry bullet list. For example: "The ferry from Balestrand to Flåm takes just under two hours — book it the evening before in July, as it fills by mid-morning. Sit on the starboard side heading east."

ACCURACY AND VERIFICATION — CRITICAL:
22. NEVER invent specific details — if uncertain about opening hours, ferry times, phone numbers, booking links or any time-sensitive detail, write a placeholder like "[verify current times]" or "[confirm availability]" instead of guessing.
23. ALWAYS base transportation times, distances and driving durations on realistic road conditions for that specific region — not generic estimates.
24. NEVER invent restaurant names, hotel names, or specific local businesses unless they are very well-known and established landmarks.
25. For ferry routes, train schedules and public transport — always flag that times and availability must be verified with the operator, and suggest the most likely official website to check.
26. Flag any detail that changes seasonally with "[seasonal — verify]".
27. NEVER include specific prices, costs or fees for any activities, transport, restaurants or attractions. Instead, direct readers to check current prices directly with the provider.

STRUCTURE:
28. Keep each Morning / Afternoon / Evening section concise — 2-4 sentences. Dining tip and Insider tip: one sentence each. No clock times.
29. Each day must include: Morning, Afternoon, Evening, Optional alternatives, Dining suggestion, Local insider tip, Transport guidance, and Reservation guidance where relevant.
30. Begin with a compelling 2-3 paragraph destination-specific editorial introduction (this comes AFTER the static company intro section, which is added separately by the PDF template) that captures the soul of the destination and sets the emotional tone for the journey.

PDF STRUCTURE (for your awareness — your markdown output is the destination editorial + day-by-day; the cover, company intro, hotels, practical tips and back page are assembled around your output by the template):
— COVER PAGE: Fjord & Waves logo, hero image, title, destination, duration
— INTRODUCTORY SECTION (About Our Itineraries & Service) — added by the template, not by you
— DESTINATION-SPECIFIC EDITORIAL INTRODUCTION — written by you, 2-3 paragraphs, ends naturally as a bridge into Day 1
— DAY-BY-DAY ITINERARY — written by you, Morning / Afternoon / Evening structure
— HOTEL RECOMMENDATIONS (Where to Stay) — added manually in admin
— PRACTICAL TIPS — seasonal advice, packing, booking, weather
— BACK PAGE — Fjord & Waves branding and contact details

FINAL OUTPUT REQUIREMENTS:
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

const GUIDE_SYSTEM_PROMPT = `You are the AI assistant inside Fjord & Waves Travel Itinerary Engine. You work as a premium boutique travel designer and editorial travel writer.

Your role is to produce a practical, destination-focused travel guide — not a day-by-day itinerary. The guide should feel like a concise, high-end reference written for a traveler who already knows they want to visit the destination and needs trustworthy, actionable guidance to plan their own pace.

The guide must feel: locally informed, practically useful, logistically realistic, emotionally warm, premium and editorial.

IMPORTANT RULES:
1. NEVER produce a day-by-day structure or \`## Day N\` headings.
2. ORGANISE the guide into clear thematic sections such as: Getting There, Getting Around, Where to Stay (areas + style notes), Money & Costs, Language Basics, When to Go / Seasonal Notes, What to Pack, Etiquette & Culture, Safety & Health, Food & Dining, Top Experiences, Hidden Gems, and Useful Contacts.
3. ALWAYS include realistic transport guidance: how to arrive, how to move between regions, whether a rental car or public transport makes sense, and any booking-ahead warnings.
4. ALWAYS flag seasonal realities, weather traps, and reservation windows.
5. INCLUDE a short, curated list of experiences that define the destination — with a sentence or two on why each matters.
6. WARN about tourist traps, common mistakes, and logistics that catch visitors off guard.
7. EXPLAIN WHY certain recommendations are meaningful.
8. WRITE like a luxury travel advisor, not a generic blog.
9. AVOID repetitive adjectives like "beautiful" or "amazing".
10. BALANCE inspiration with practical usability.

WRITING STYLE — HUMAN AND NATURAL:
11. Write the way an experienced, well-travelled human advisor would speak to a trusted client over a coffee. The writing must feel personal, grounded and real — never like it was generated by an AI.

STRICTLY AVOID:
— Words like: tapestry, nestled, vibrant, bustling, charming, seamlessly, delve, curated, elevate, timeless, unparalleled, testament, journey of discovery, treasure trove, gem, haven, boasts, offers a unique blend
— Opening sentences that start with "Imagine..." or "Welcome to..."
— Overly poetic or flowery descriptions that feel exaggerated
— Long complex sentences packed with multiple clauses
— Repetitive sentence structures throughout the document
— Adjective overload — never use more than one adjective per noun
— Summarising conclusions at the end of each section

INSTEAD:
— Use short, confident, specific sentences
— Name exact places, streets, dishes, and experiences — specificity makes writing feel human
— Alternate between short and medium length sentences naturally
— Let facts and details do the emotional work — avoid telling the reader how to feel
— Write as if you have personally been there and are sharing what you genuinely loved
— Use occasional dry wit or warmth where it fits naturally
— Trust the reader — do not over-explain or over-sell

ACCURACY AND VERIFICATION — CRITICAL:
— NEVER invent specific details — if uncertain about opening hours, ferry times, phone numbers, booking links or any time-sensitive detail, write a placeholder like "[verify current times]" or "[confirm availability]" instead of guessing.
— ALWAYS base transportation times, distances and driving durations on realistic road conditions for that specific region.
— NEVER invent restaurant names, hotel names, or specific local businesses unless they are very well-known and established landmarks.
— For ferry routes, train schedules and public transport — always flag that times and availability must be verified with the operator, and suggest the most likely official website to check.
— Flag any detail that changes seasonally with "[seasonal — verify]".
— NEVER include specific prices, costs or fees for any activities, transport, restaurants or attractions. Instead, direct readers to check current prices directly with the provider.

STRUCTURE:
— Use clean markdown with clear \`##\` section headings.
— Keep each section concise but useful — 2-6 short paragraphs or bullet points where appropriate.
— Begin with a short editorial introduction (2-3 paragraphs) that captures the soul of the destination and sets the tone.

PDF STRUCTURE (for your awareness — your markdown output is the destination guide; the cover, company intro, hotels, practical tips and back page are assembled around your output by the template):
— COVER PAGE: Fjord & Waves logo, hero image, title, destination
— INTRODUCTORY SECTION (About Our Itineraries & Service) — added by the template, not by you
— DESTINATION-SPECIFIC EDITORIAL INTRODUCTION — written by you, 2-3 paragraphs, ends naturally as a bridge into the guide
— THEMATIC PRACTICAL GUIDE — written by you
— HOTEL RECOMMENDATIONS (Where to Stay) — added manually in admin
— PRACTICAL TIPS — added by the template
— BACK PAGE — Fjord & Waves branding and contact details

FINAL OUTPUT REQUIREMENTS:
Writing style: elegant, calm, immersive, sophisticated, human, emotionally warm. Never generic, robotic, overly promotional, exaggerated, or influencer-like.

Format the output using clean markdown with clear section headings. The final output must feel worthy of a premium PDF travel atelier.

Write in the following language: {language}

Now create a premium practical travel guide for:
— Destination: {destination}
— Experience type: {experience_type}
— Additional notes from editor: {notes}`;

function buildGuideSystemPrompt(values: {
  language: string;
  destination: string;
  experience_type: string;
  notes: string;
}): string {
  return GUIDE_SYSTEM_PROMPT
    .replace(/{language}/g, values.language)
    .replace(/{destination}/g, values.destination || 'Not specified')
    .replace(/{experience_type}/g, values.experience_type || 'Not specified')
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
      mode = 'full', // 'full' | 'section' | 'metadata'
      section_instruction = '',
      existing_content = '',
      client_origin = '',
      destination_market = '',
    } = body || {};

    const originToken = normalizePersonaToken(client_origin, PERSONA_ORIGINS);
    const destToken = normalizePersonaToken(destination_market, PERSONA_DESTINATIONS);

    if (mode === 'full' && !destination && !title) {
      return new Response(JSON.stringify({ error: 'destination or title is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // One-shot non-streaming JSON call: returns cover intros + short descriptions
    // for all three languages in a single Anthropic request.
    if (mode === 'metadata') {
      const excerpt = String(existing_content || '').slice(0, 20000);
      // Detect number of days from the itinerary content (e.g. "Day 1", "Day 2", ... "Day 7")
      const dayMatches = excerpt.match(/\bDay\s+(\d+)\b/gi) || [];
      const detectedDayCount = dayMatches.reduce((max, m) => {
        const n = parseInt(m.replace(/[^0-9]/g, ''), 10);
        return Number.isFinite(n) && n > max ? n : max;
      }, 0);
      // Fallback: parse duration string like "7 days", "7-day", "7"
      const durationMatch = String(duration || '').match(/\d+/);
      const durationDays = durationMatch ? parseInt(durationMatch[0], 10) : 0;
      const expectedDayCount = Math.max(detectedDayCount, durationDays, 1);
      const metaLangName = LANG_NAMES[language] || 'English';
      // "Day" word used in day_overview labels — must match the target language.
      const dayWord = language === 'pt' ? 'Dia' : language === 'no' ? 'Dag' : 'Day';
      const metaSystem = `You are an editorial copywriter for Fjord & Waves Travel, a premium boutique travel atelier.
You write in a calm, confident, human voice — never generic, never overly poetic, never AI-clichéd.
STRICTLY AVOID the words: tapestry, nestled, vibrant, bustling, charming, seamlessly, delve, curated, elevate, timeless, unparalleled, testament, journey of discovery, treasure trove, gem, haven, boasts.
Never open with "Imagine..." or "Welcome to...".
Name specific places, landscapes or experiences from the itinerary excerpt to ground the writing.
You write natively in each requested language — never translate word-for-word from English. Brazilian Portuguese should read like a Brazilian wrote it; Norwegian should read like a Norwegian (Bokmål) wrote it.
The itinerary's primary language for the subpage fields (subpage_checklist, subpage_day_overview, subpage_expectations) is: ${metaLangName}. Write ALL strings in those three fields natively in ${metaLangName}, never in English (unless the primary language is English).
You must output STRICT JSON only — no markdown fences, no preamble, no commentary.`;
      const metaUser = `Trip metadata:
— Title: ${title || '(untitled)'}
— Destination: ${destination || '(unspecified)'}
— Duration: ${duration || '(unspecified)'}
— Experience type: ${experience_type || '(unspecified)'}
— Editor brief: ${brief || '(none)'}

Itinerary excerpt (markdown, may be partial):
"""
${excerpt}
"""

Write the following pieces of copy and return them as a single JSON object with EXACTLY these keys:

{
  "cover_intro_en": "3–4 sentence evocative cover-page introduction in English. Sets the emotional tone, names the destination and a couple of grounding specifics from the itinerary. Reads like a luxury travel atelier — calm, confident, sensory but restrained. No headings, no markdown, no quotes.",
  "cover_intro_pt": "Same as cover_intro_en but written natively in Brazilian Portuguese (pt-BR).",
  "cover_intro_no": "Same as cover_intro_en but written natively in Norwegian (Bokmål).",
  "summary_en": "2–3 sentence catalogue teaser in English — suitable for catalogue cards and listings. Tight, inviting, specific. No markdown, no quotes.",
  "summary_pt": "Same as summary_en but written natively in Brazilian Portuguese (pt-BR).",
  "summary_no": "Same as summary_en but written natively in Norwegian (Bokmål).",
  "subpage_checklist": ["Exactly 4 short strings (max ~10 words each) describing what the customer specifically gets from THIS itinerary — grounded in the actual places, experiences and themes in the excerpt. Not generic. Written natively in ${metaLangName}."],
  "subpage_day_overview": [{"label": "${dayWord} 1 — <concise route or theme drawn from the actual day in the excerpt, in ${metaLangName}>", "description": "1–2 sentence preview of that day, grounded in real places/experiences from the excerpt. Written natively in ${metaLangName}."}],
  "subpage_expectations": [{"title": "Short evocative title (2–4 words) in ${metaLangName}", "description": "1–2 sentence card based on the tone and content of this itinerary. Written natively in ${metaLangName}."}]
}

Rules for the new arrays:
- "subpage_checklist": EXACTLY 4 items, each a single short line, specific to this itinerary. Write every item natively in ${metaLangName}.
- "subpage_day_overview": MUST contain EXACTLY ${expectedDayCount} entries — one per day of this ${expectedDayCount}-day itinerary, in order from day 1 through day ${expectedDayCount}. Do NOT stop early, do NOT merge days, do NOT skip any day. Every day from 1 to ${expectedDayCount} must appear exactly once. Each "label" must start with "${dayWord} N — " (where N is the day number) and reflect that day's actual route/theme from the excerpt, in ${metaLangName}. Descriptions must also be in ${metaLangName}. If the excerpt does not fully describe a later day, still produce an entry inferred from the surrounding context and destination — never omit it.
- "subpage_expectations": EXACTLY 4 cards capturing the distinctive feel of THIS trip (not boilerplate). Titles and descriptions must be short, evocative and written natively in ${metaLangName}.

Return ONLY the JSON object. No code fences, no explanation.`;

      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-5',
          max_tokens: 4096,
          system: metaSystem,
          messages: [{ role: 'user', content: metaUser }],
        }),
      });
      if (!res.ok) {
        const errText = await res.text().catch(() => '');
        return new Response(JSON.stringify({ error: `Anthropic ${res.status}: ${errText}` }), {
          status: 502,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      const data = await res.json();
      const text: string = data?.content?.[0]?.text || '';
      const cleaned = text.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/, '').trim();
      let parsed: any = null;
      try { parsed = JSON.parse(cleaned); } catch {
        const match = cleaned.match(/\{[\s\S]*\}/);
        if (match) { try { parsed = JSON.parse(match[0]); } catch { /* noop */ } }
      }
      if (!parsed) {
        return new Response(JSON.stringify({ error: 'Could not parse metadata JSON', raw: text }), {
          status: 502,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      return new Response(JSON.stringify(parsed), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const langName = LANG_NAMES[language] || 'English';

    const persona = await fetchTravelerPersona(originToken, destToken);
    const personaBlock = buildPersonaBlock(originToken, persona);
    console.log('[persona]', {
      requested: { origin: originToken, destination: destToken },
      matched: persona ? { origin: persona.origin, destination: persona.destination } : null,
    });

    const baseSystem = buildSystemPrompt({
      language: langName,
      destination,
      experience_type,
      duration,
      notes: brief,
    });
    const systemPrompt = personaBlock ? personaBlock + baseSystem : baseSystem;

    // Build the sequence of user prompts (one per Anthropic call).
    const userPrompts: string[] = [];

    if (mode === 'section') {
      userPrompts.push(
        `Write the response entirely in ${langName}.\n\n` +
          `Here is an existing catalogue itinerary draft (markdown):\n\n` +
          `"""\n${existing_content}\n"""\n\n` +
          `Please regenerate ONLY the section described below, keeping the same premium editorial style, tone and conventions ` +
          `(Morning / Afternoon / Evening sub-sections of 2-4 sentences each, one-sentence Dining tip and Insider tip, transport guidance woven into the narrative, no clock times, no AI clichés). ` +
          `Return JUST the rewritten section as markdown — no preamble, no explanation.\n\n` +
          `Section instruction: ${section_instruction}`,
      );
    } else {
      // Two-pass generation to keep streams flowing and avoid truncation.
      userPrompts.push(
        `Produce the premium editorial itinerary now in markdown. ` +
          `Write the compelling 2-3 paragraph editorial introduction first (no heading), ` +
          `then the FIRST HALF of the day-by-day sections in full. ` +
          `Each day must use a \`## Day N — Theme\` heading and include \`### Morning\`, \`### Afternoon\`, \`### Evening\` sub-sections (2-4 sentences each), plus one-sentence Dining suggestion, Local insider tip, Transport guidance, Reservation guidance (where relevant), and Optional alternatives. ` +
          `Stop cleanly at the end of a day — the itinerary will be continued in a follow-up call.`,
      );
      userPrompts.push(
        `Continue the premium editorial itinerary you started in the previous assistant turn. ` +
          `The intro and the first batch of \`## Day N — Theme\` sections are already written above — do NOT repeat any of them. ` +
          `Look at the highest Day number that appears in the previous assistant turn and start your reply directly with the NEXT \`## Day N — Theme\` heading (no preamble, no recap). ` +
          `Complete all remaining days using the same Morning / Afternoon / Evening structure with Dining, Insider tip, Transport, Reservation and Optional alternatives sub-items. ` +
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
        // Text streamed so far across all passes — used to (a) seed the
        // next pass as an `assistant` turn so Claude can actually see what
        // was already written and (b) detect already-emitted `## Day N`
        // headings to suppress duplicates if the model still echoes them.
        let priorAssistantText = '';
        const emittedDayNumbers = new Set<number>();
        const DAY_HEADING_RE = /^\s{0,3}##\s+Day\s+(\d+)\b/i;
        const ANY_DAY_HEADING_RE = /^\s{0,3}##\s+Day\s+\d+\b/i;
        const TOP_HEADING_RE = /^\s{0,3}#\s+/;

        // Seed the duplicate-detection set from pass 1 as it streams.
        const recordDaysFrom = (text: string) => {
          for (const ln of text.split('\n')) {
            const m = ln.match(DAY_HEADING_RE);
            if (m) emittedDayNumbers.add(Number(m[1]));
          }
        };

        for (let i = 0; i < userPrompts.length; i++) {
          // Build the messages array: replay prior assistant text so the
          // next pass actually has context to continue from.
          const messages: Array<{ role: 'user' | 'assistant'; content: string }> = [
            { role: 'user', content: userPrompts[0] },
          ];
          if (i > 0) {
            messages.push({ role: 'assistant', content: priorAssistantText });
            for (let j = 1; j <= i; j++) {
              messages.push({ role: 'user', content: userPrompts[j] });
            }
          }

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
              messages,
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
          if (i > 0) {
            controller.enqueue(encoder.encode('\n\n'));
            priorAssistantText += '\n\n';
          }

          const reader = res.body.getReader();
          let buffer = '';
          // Per-pass line buffer so we can run heading-dedup at line
          // granularity without breaking the streamed UX. Pass 1 just
          // records the days it sees; pass 2+ may suppress duplicates.
          let lineBuf = '';
          let suppressing = false;

          const handleDelta = (delta: string) => {
            priorAssistantText += delta;
            if (i === 0) {
              recordDaysFrom(delta);
              controller.enqueue(encoder.encode(delta));
              return;
            }
            // Pass 2+: process line-by-line to dedup `## Day N` sections.
            lineBuf += delta;
            let nlIdx = lineBuf.indexOf('\n');
            let emit = '';
            while (nlIdx !== -1) {
              const line = lineBuf.slice(0, nlIdx + 1);
              lineBuf = lineBuf.slice(nlIdx + 1);
              const trimmed = line.replace(/\n$/, '');
              const dayMatch = trimmed.match(DAY_HEADING_RE);
              if (dayMatch) {
                const n = Number(dayMatch[1]);
                if (emittedDayNumbers.has(n)) {
                  console.warn(`[generate-catalog] pass ${i + 1}: suppressing duplicate ## Day ${n} heading`);
                  suppressing = true;
                } else {
                  emittedDayNumbers.add(n);
                  suppressing = false;
                  emit += line;
                }
              } else if (suppressing) {
                // Stop suppressing when we hit a new (non-duplicate) day
                // heading or any top-level `# ` heading.
                if (ANY_DAY_HEADING_RE.test(trimmed) || TOP_HEADING_RE.test(trimmed)) {
                  suppressing = false;
                  emit += line;
                }
                // else: drop the line silently.
              } else {
                emit += line;
              }
              nlIdx = lineBuf.indexOf('\n');
            }
            if (emit) controller.enqueue(encoder.encode(emit));
          };

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
                  handleDelta(evt.delta.text);
                }
              } catch { /* ignore parse errors */ }
            }
          }

          // Flush any trailing line buffer for this pass (pass 2+ path).
          if (i > 0 && lineBuf) {
            if (!suppressing) controller.enqueue(encoder.encode(lineBuf));
            lineBuf = '';
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
