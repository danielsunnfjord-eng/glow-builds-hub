import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const LANG_NAMES: Record<string, string> = {
  en: "English",
  pt: "Brazilian Portuguese (pt-BR)",
  no: "Norwegian Bokmål",
};

const TIME_RULES: Record<string, string> = {
  en: 'Convert clock times to English style ("15h" -> "3pm", "20h30" -> "8:30pm").',
  pt: 'Convert clock times to Brazilian style ("3pm" -> "15h", "8:30pm" -> "20h30").',
  no: 'Convert clock times to Norwegian style ("3pm" -> "kl. 15", "8:30pm" -> "kl. 20.30").',
};

const systemPrompt = (source: string, target: string) =>
  `You are a senior travel copywriter and translator for Fjord & Waves Travel, a premium concierge advisory.

Translate the given text from ${LANG_NAMES[source]} into ${LANG_NAMES[target]}.

FORMATTING — non-negotiable:
- The input is Markdown and may contain raw HTML. Preserve the structure EXACTLY: the same headings at the same levels and positions, the same list items, the same **bold** / *italic* marks, the same tables, the same blank-line paragraph breaks, the same HTML tags and attributes.
- Preserve every link exactly: [text](url) keeps an identical URL and <a href="..."> keeps identical attributes. Only visible link text may be translated.
- Never add, remove, merge or reorder headings, paragraphs or list items. No commentary, no preamble, no code fences.

LANGUAGE:
- Translate naturally, never literally. Warm, refined, premium concierge voice. No clichés, no emojis.
- Keep restaurant, hotel, street and venue names, addresses, phone numbers, prices and currency codes exactly as written.
- Translate place names that have an established name in the target language (e.g. "Bairro Gótico" -> "Gothic Quarter"); otherwise keep the original.
- ${TIME_RULES[target] ?? ""}

Return ONLY the translated text.`;

const structure = (t: string) => ({
  h2: (t.match(/^##\s/gm) || []).length,
  h3: (t.match(/^###\s/gm) || []).length,
  links: (t.match(/\[[^\]]*\]\([^)]*\)/g) || []).length,
  anchors: (t.match(/<a\s[^>]*>/gi) || []).length,
});

const structureMatches = (a: string, b: string) => {
  const x = structure(a);
  const y = structure(b);
  return x.h2 === y.h2 && x.h3 === y.h3 && x.links === y.links && x.anchors === y.anchors;
};

const cleanup = (t: string) =>
  t.replace(/^```(?:markdown|html)?\s*\n?/i, "").replace(/\n?```\s*$/i, "").trim();

async function callGateway(text: string, source: string, target: string, apiKey: string) {
  const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "google/gemini-2.5-pro",
      messages: [
        { role: "system", content: systemPrompt(source, target) },
        { role: "user", content: text },
      ],
    }),
  });

  if (!resp.ok) {
    const detail = await resp.text();
    if (resp.status === 429) throw new Error("Rate limit reached, please try again shortly.");
    if (resp.status === 402) throw new Error("AI credits exhausted — add credits to continue.");
    throw new Error(`AI gateway error (${resp.status}): ${detail.slice(0, 300)}`);
  }

  const data = await resp.json();
  const out = data?.choices?.[0]?.message?.content;
  if (typeof out !== "string" || !out.trim()) throw new Error("AI returned no text");
  return cleanup(out);
}

export type TranslateChunksInput = {
  source: string;
  target: string;
  items: { id: string; text: string }[];
};

export const translateCatalogChunks = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: TranslateChunksInput) => {
    if (!data || !LANG_NAMES[data.source] || !LANG_NAMES[data.target] || data.source === data.target) {
      throw new Error("Invalid source/target language");
    }
    const items = (Array.isArray(data.items) ? data.items : [])
      .filter((i) => i && typeof i.id === "string" && typeof i.text === "string" && i.text.trim().length > 0)
      .slice(0, 12);
    if (!items.length) throw new Error("Nothing to translate");
    return { source: data.source, target: data.target, items };
  })
  .handler(async ({ data }) => {
    const apiKey = process.env["LOVABLE_API_KEY"];
    if (!apiKey) throw new Error("LOVABLE_API_KEY is not configured");

    const translations: Record<string, string> = {};
    const warnings: string[] = [];

    for (const item of data.items) {
      let out = await callGateway(item.text, data.source, data.target, apiKey);
      if (!structureMatches(item.text, out)) {
        // One retry — formatting must survive the translation.
        const retry = await callGateway(item.text, data.source, data.target, apiKey);
        out = retry;
        if (!structureMatches(item.text, retry)) warnings.push(item.id);
      }
      translations[item.id] = out;
    }

    return { translations, warnings };
  });
