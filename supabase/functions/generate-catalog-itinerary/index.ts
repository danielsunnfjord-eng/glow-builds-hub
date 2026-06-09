// Generate a general catalogue itinerary via Claude (Anthropic API)
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';

const SYSTEM_PROMPT =
  "You are an expert travel writer and planner for Fjord & Waves Travel. " +
  "Create an inspiring, detailed general travel itinerary based on the destination and experience type provided. " +
  "Include a compelling introduction, day-by-day plan, highlights, practical tips, best time to visit, and suggested accommodation types. " +
  "Write in an engaging, inspiring tone for travelers seeking curated experiences. " +
  "Format the response as clean markdown with H1 for the itinerary title, H2 for major sections (Introduction, Highlights, Day-by-Day, Practical Tips, Best Time to Visit, Where to Stay), " +
  "and H3 for individual days. Use lists, bold, and short paragraphs where helpful.";

const LANG_NAMES: Record<string, string> = {
  en: 'English',
  pt: 'Brazilian Portuguese (pt-BR)',
  no: 'Norwegian (Bokmål)',
};

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

    let userPrompt: string;
    if (mode === 'section') {
      userPrompt =
        `Write the response entirely in ${langName}.\n\n` +
        `Here is an existing itinerary draft (markdown):\n\n` +
        `"""\n${existing_content}\n"""\n\n` +
        `Please regenerate ONLY the section described below, keeping the same overall style and tone. ` +
        `Return JUST the rewritten section as markdown — no preamble, no explanation.\n\n` +
        `Section instruction: ${section_instruction}`;
    } else {
      const lines: string[] = [];
      const push = (label: string, val: any) => {
        if (val === undefined || val === null || val === '') return;
        lines.push(`- **${label}:** ${val}`);
      };
      push('Working title', title);
      push('Destination / Country', destination);
      push('Type of experience', experience_type);
      push('Duration', duration);
      push('Brief / notes', brief);

      userPrompt =
        `Write the response entirely in ${langName}.\n\n` +
        `Please craft a complete general travel itinerary using the following inputs:\n\n` +
        lines.join('\n') +
        `\n\nProduce the itinerary now in markdown.`;
    }

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

    return new Response(JSON.stringify({ content: text }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err: any) {
    console.error('generate-catalog-itinerary error', err);
    return new Response(JSON.stringify({ error: err?.message || 'Unknown error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
