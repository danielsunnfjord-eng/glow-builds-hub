import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { jsPDF } from "https://esm.sh/jspdf@2.5.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const LANG_NAMES: Record<string, string> = {
  en: "English",
  pt: "Portuguese (Brazil)",
  no: "Norwegian (Bokmål)",
  es: "Spanish",
  fr: "French",
  de: "German",
  it: "Italian",
};

const SYSTEM = (langName: string) => `You are a senior travel writer for Fjord & Waves Travel — premium concierge advisory.

Produce a COMPLETE, DETAILED, READY-TO-PRINT travel itinerary document in ${langName}, in a DAY-BY-DAY JOURNEY format. The output is the actual product the customer downloads as a PDF — make it valuable, specific, beautifully written, and geographically logical (a realistic route through the destination, not a list of separate ideas). No fluff, no placeholders, no Morning/Afternoon/Evening sub-blocks.

Voice: warm, refined, evocative but never floral. First-person plural ("we suggest…", "you'll discover…"). No clichés. No emojis.

Auto-detect the language of the source materials provided and translate/synthesise everything into ${langName}.

Return STRICT JSON only (no markdown fences) with this exact shape:
{
  "title": "string",
  "subtitle": "string (one-line tagline)",
  "intro": "string (2-3 paragraphs introducing the trip)",
  "trip_overview": {
    "destination": "string",
    "duration": "string",
    "best_for": "string",
    "estimated_budget": "string",
    "best_season": "string"
  },
  "route_overview": [
    { "day": 1, "place": "string (town / area for the day)", "transport": "string (how you arrive that day — e.g. 'Arrival flight to Bergen', 'Drive 2h north', 'Ferry to the islands', 'Stay put')" }
  ],
  "highlights": ["string", "..."],
  "days": [
    {
      "day": 1,
      "title": "string (e.g. 'Arrival and the Road to the Fjords')",
      "location": "string (base town / area for the day)",
      "route": "string (one short line: 'From Oslo to Bergen by morning train (~7h)' or 'Base: Bergen — no transit today')",
      "narrative": [
        "string (paragraph 1 — what happens first, how the day opens)",
        "string (paragraph 2 — the main activity / sights, with specific place names)",
        "string (paragraph 3 — connection to the next stop, where to eat, transitions)"
      ],
      "tip": "string (ONE short insider tip — a single sentence or two)"
    }
  ],
  "practical_info": {
    "getting_there": "string",
    "getting_around": "string",
    "money": "string",
    "language_basics": "string",
    "what_to_pack": "string",
    "etiquette": "string"
  },
  "closing": "string (warm closing paragraph)"
}

Rules:
- "route_overview" MUST contain one entry per day and exactly match the length of "days".
- Each day's "narrative" array MUST contain 2–4 paragraphs of 2–4 sentences each. Weave logistics (drive times, ferries, walking distances, booking notes) INTO the narrative — never list them separately.
- Do NOT output morning/afternoon/evening fields. Do NOT output a separate where_to_stay or where_to_eat field on days — fold restaurant and lodging mentions into the narrative.
- Days array length should match the trip duration (default 5–10 days if unclear) and must form a sensible, non-backtracking route.
- Be specific: name real neighbourhoods, real restaurants/hotels where possible from the sources, real practical details.
- All content in ${langName}. Keep proper nouns in their original spelling.`;

async function fetchUrlText(url: string): Promise<string> {
  try {
    const r = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0 FjordWavesBot" } });
    if (!r.ok) return "";
    const html = await r.text();
    return html
      .replace(/<script[\s\S]*?<\/script>/gi, "")
      .replace(/<style[\s\S]*?<\/style>/gi, "")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 8000);
  } catch {
    return "";
  }
}

function renderPdf(doc: any, heroUrl: string | null): Uint8Array {
  // Caller will populate doc; this just returns bytes
  const ab = doc.output("arraybuffer");
  return new Uint8Array(ab);
}

// Wrap text helper using jsPDF splitTextToSize
function addWrapped(pdf: any, text: string, x: number, y: number, maxWidth: number, lineHeight: number, opts?: { bottomMargin?: number }) {
  const bottomMargin = opts?.bottomMargin ?? 60;
  const lines = pdf.splitTextToSize(text || "", maxWidth);
  for (const line of lines) {
    if (y > pdf.internal.pageSize.getHeight() - bottomMargin) {
      pdf.addPage();
      y = 60;
    }
    pdf.text(line, x, y);
    y += lineHeight;
  }
  return y;
}

async function fetchImageDataUrl(url: string): Promise<string | null> {
  try {
    const r = await fetch(url);
    if (!r.ok) return null;
    const buf = new Uint8Array(await r.arrayBuffer());
    const ct = r.headers.get("content-type") || "image/jpeg";
    let b64 = "";
    const chunk = 0x8000;
    for (let i = 0; i < buf.length; i += chunk) {
      b64 += String.fromCharCode(...buf.subarray(i, i + chunk));
    }
    return `data:${ct};base64,${btoa(b64)}`;
  } catch {
    return null;
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY missing");

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const supaUser = createClient(SUPABASE_URL, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: ures } = await supaUser.auth.getUser();
    if (!ures?.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const { data: isStaff } = await supaUser.rpc("is_staff", { _user_id: ures.user.id });
    if (!isStaff) {
      return new Response(JSON.stringify({ error: "Staff access required" }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const mode: string = (body.mode || "full").toString(); // "draft" | "render" | "full" | "signed_url"
    const language: string = (body.language || "en").toString();
    const langName = LANG_NAMES[language] || "English";
    const supaService = createClient(SUPABASE_URL, SERVICE_KEY);

    if (mode === "get_draft") {
      const itineraryId: string = (body.itinerary_id || "").toString();
      if (!itineraryId) {
        return new Response(JSON.stringify({ error: "itinerary_id required" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const { data, error } = await supaService
        .from("catalog_itinerary_drafts")
        .select("draft, language")
        .eq("itinerary_id", itineraryId)
        .maybeSingle();
      if (error) throw error;
      return new Response(JSON.stringify(data || { draft: null, language: "en" }), {
        status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (mode === "save_draft") {
      const itineraryId: string = (body.itinerary_id || "").toString();
      if (!itineraryId || !body.draft) {
        return new Response(JSON.stringify({ error: "itinerary_id and draft required" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const { error } = await supaService
        .from("catalog_itinerary_drafts")
        .upsert({ itinerary_id: itineraryId, draft: body.draft, language, updated_by: ures.user.id }, { onConflict: "itinerary_id" });
      if (error) throw error;
      return new Response(JSON.stringify({ ok: true }), {
        status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // --- Mode: signed_url — returns a short-lived signed URL for an existing PDF ---
    if (mode === "signed_url") {
      const pdf_path: string = (body.pdf_path || "").toString();
      if (!pdf_path) {
        return new Response(JSON.stringify({ error: "pdf_path required" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const { data, error } = await supaService.storage
        .from("catalog-pdfs")
        .createSignedUrl(pdf_path, 600);
      if (error) throw error;
      return new Response(JSON.stringify({ url: data.signedUrl }), {
        status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // --- Mode: refine_draft — apply a natural-language instruction to the existing draft JSON ---
    if (mode === "refine_draft") {
      const currentDraft = body.draft;
      const instruction: string = (body.instruction || "").toString().slice(0, 4000);
      const refUrls: string[] = Array.isArray(body.urls) ? body.urls.slice(0, 5) : [];
      if (!currentDraft || !instruction) {
        return new Response(JSON.stringify({ error: "draft and instruction required" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const urlTexts = await Promise.all(refUrls.map(async (u) => `# Source: ${u}\n${await fetchUrlText(u)}`));
      const refineSystem = `You are an editor refining a travel itinerary JSON document for Fjord & Waves Travel.

You will receive:
- The CURRENT itinerary JSON document
- An INSTRUCTION from the advisor describing what to change, add, or improve
- Optional REFERENCE URL CONTENT to draw facts from

Apply the instruction precisely. Preserve the exact JSON shape and keys. Only modify what the instruction targets — keep all other content intact. Keep language consistent with the current document. Return STRICT JSON only (no markdown), the full updated document with the same shape:

{
  "title": "string", "subtitle": "string", "cover_image_url": "string",
  "intro": "string",
  "trip_overview": { "destination": "string", "duration": "string", "best_for": "string", "estimated_budget": "string", "best_season": "string" },
  "highlights": ["string"],
  "days": [{ "day": 1, "title": "string", "location": "string", "image_url": "string", "morning": "string", "afternoon": "string", "evening": "string", "where_to_stay": "string", "where_to_eat": "string", "tips": "string" }],
  "practical_info": { "getting_there": "string", "getting_around": "string", "money": "string", "language_basics": "string", "what_to_pack": "string", "etiquette": "string" },
  "closing": "string"
}

When asked to add links, embed them inline in the relevant paragraph as plain URLs (e.g. "see https://example.com"). Do not invent image URLs — leave image_url empty if not provided.`;

      const userMsg = [
        "CURRENT DOCUMENT:\n" + JSON.stringify(currentDraft, null, 2),
        "INSTRUCTION:\n" + instruction,
        urlTexts.length ? "REFERENCE URL CONTENT:\n" + urlTexts.join("\n\n").slice(0, 16000) : "",
      ].filter(Boolean).join("\n\n---\n\n");

      const aiResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [
            { role: "system", content: refineSystem },
            { role: "user", content: userMsg + "\n\nReturn the full updated JSON document." },
          ],
          response_format: { type: "json_object" },
        }),
      });

      if (!aiResp.ok) {
        const t = await aiResp.text();
        const status = aiResp.status === 429 || aiResp.status === 402 ? aiResp.status : 500;
        const msg = aiResp.status === 429 ? "Rate limit reached, please try again shortly." :
                    aiResp.status === 402 ? "AI credits exhausted." :
                    `AI gateway error: ${t.slice(0, 300)}`;
        return new Response(JSON.stringify({ error: msg }), {
          status, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const aiData = await aiResp.json();
      const content = aiData.choices?.[0]?.message?.content || "{}";
      let updated: any;
      try { updated = JSON.parse(content); }
      catch { const m = content.match(/\{[\s\S]*\}/); updated = m ? JSON.parse(m[0]) : currentDraft; }
      return new Response(JSON.stringify({ draft: updated }), {
        status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // --- Mode: fetch_pdf — stream PDF bytes back through the function (avoids domain blockers) ---
    if (mode === "fetch_pdf") {
      const pdf_path: string = (body.pdf_path || "").toString();
      if (!pdf_path) {
        return new Response(JSON.stringify({ error: "pdf_path required" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const { data, error } = await supaService.storage.from("catalog-pdfs").download(pdf_path);
      if (error) throw error;
      const buf = new Uint8Array(await data.arrayBuffer());
      return new Response(buf, {
        status: 200,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/pdf",
          "Content-Disposition": `inline; filename="itinerary.pdf"`,
        },
      });
    }

    const brief: string = (body.brief || "").toString().slice(0, 6000);
    const urls: string[] = Array.isArray(body.urls) ? body.urls.slice(0, 5) : [];
    const documentsText: string = (body.documents_text || "").toString().slice(0, 16000);
    const heroImageUrl: string | null = body.hero_image_url || null;
    const heroImageCredit: string = (body.hero_image_credit || "").toString();
    const heroImageCaption: string = (body.hero_image_caption || "").toString();
    const itineraryContext: any = body.itinerary_context || null; // existing fields the editor already filled

    let doc: any;

    if (mode === "render" && body.draft) {
      // Skip AI — use provided edited draft directly
      doc = body.draft;
    } else {
      const urlTexts = await Promise.all(urls.map(async (u) => `# Source: ${u}\n${await fetchUrlText(u)}`));

      const ctxBlocks: string[] = [];
      if (itineraryContext) {
        ctxBlocks.push("EXISTING CATALOG CONTENT (use as the canonical source of truth — expand into a full document):\n" +
          JSON.stringify(itineraryContext, null, 2));
      }
      if (brief) ctxBlocks.push(`ADVISOR BRIEF:\n${brief}`);
      if (documentsText) ctxBlocks.push(`UPLOADED DOCUMENT EXCERPT:\n${documentsText}`);
      if (urlTexts.length) ctxBlocks.push(`REFERENCE URL CONTENT:\n${urlTexts.join("\n\n").slice(0, 16000)}`);

      if (!ctxBlocks.length) {
        return new Response(JSON.stringify({ error: "Provide a brief, document, URL or existing itinerary content." }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const aiResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [
            { role: "system", content: SYSTEM(langName) },
            { role: "user", content: ctxBlocks.join("\n\n---\n\n") + `\n\nNow write the complete itinerary document in ${langName}. Return STRICT JSON only.` },
          ],
          response_format: { type: "json_object" },
        }),
      });

      if (!aiResp.ok) {
        const t = await aiResp.text();
        const status = aiResp.status === 429 || aiResp.status === 402 ? aiResp.status : 500;
        const msg = aiResp.status === 429 ? "Rate limit reached, please try again shortly." :
                    aiResp.status === 402 ? "AI credits exhausted." :
                    `AI gateway error: ${t.slice(0, 300)}`;
        return new Response(JSON.stringify({ error: msg }), {
          status, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const aiData = await aiResp.json();
      const content = aiData.choices?.[0]?.message?.content || "{}";
      try {
        doc = JSON.parse(content);
      } catch {
        const m = content.match(/\{[\s\S]*\}/);
        doc = m ? JSON.parse(m[0]) : {};
      }

      // Mode: draft — return the editable JSON, do not render PDF yet
      if (mode === "draft") {
        return new Response(JSON.stringify({ draft: doc, language }), {
          status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    // --- Hotel recommendations & hero credit/caption: pull from body or DB row ---
    let hotels: any[] = Array.isArray(body.hotels) ? body.hotels : [];
    let heroCredit = heroImageCredit;
    let heroCaption = heroImageCaption;
    const itineraryId: string | null = (body.itinerary_id || "").toString() || null;
    if (itineraryId && (!hotels.length || !heroCredit || !heroCaption)) {
      const { data: row } = await supaService
        .from("catalog_itineraries")
        .select("hotels, hero_image_credit, hero_image_caption")
        .eq("id", itineraryId)
        .maybeSingle();
      if (row) {
        if (!hotels.length && Array.isArray((row as any).hotels)) hotels = (row as any).hotels;
        if (!heroCredit) heroCredit = (row as any).hero_image_credit || "";
        if (!heroCaption) heroCaption = (row as any).hero_image_caption || "";
      }
    }
    const visibleHotels = hotels.filter((h: any) => h && h.visible !== false && (h.name || "").trim());

    // Normalize photos: legacy string[] → [{url, credit, caption}]
    const normPhoto = (p: any) =>
      typeof p === "string" ? { url: p, credit: "", caption: "" }
      : p && typeof p === "object" ? { url: p.url || "", credit: p.credit || "", caption: p.caption || "" }
      : null;

    // --- Render PDF (premium layout) ---
    const coverImageUrl = doc.cover_image_url || heroImageUrl;
    const pdf = new jsPDF({ unit: "pt", format: "a4" });
    const W = pdf.internal.pageSize.getWidth();
    const H = pdf.internal.pageSize.getHeight();
    const M = 56;
    const contentW = W - M * 2;
    const GOLD: [number, number, number] = [180, 140, 60];
    const INK: [number, number, number] = [28, 32, 38];
    const MUTED: [number, number, number] = [110, 110, 110];

    // ============ COVER ============
    // Cream background
    pdf.setFillColor(248, 244, 236);
    pdf.rect(0, 0, W, H, "F");

    // Hero image: top ~55% of page
    let heroData: string | null = null;
    if (coverImageUrl) heroData = await fetchImageDataUrl(coverImageUrl);
    const heroH = H * 0.55;
    if (heroData) {
      try { pdf.addImage(heroData, "JPEG", 0, 0, W, heroH, undefined, "FAST"); } catch {}
    } else {
      pdf.setFillColor(20, 24, 30);
      pdf.rect(0, 0, W, heroH, "F");
    }
    // Hero credit overlay (bottom-right of image)
    if (heroCredit) {
      const text = String(heroCredit);
      pdf.setFont("helvetica", "normal"); pdf.setFontSize(7.5);
      const tw = pdf.getTextWidth(text) + 12;
      pdf.setFillColor(0, 0, 0); pdf.setGState(new (pdf as any).GState({ opacity: 0.45 }));
      pdf.rect(W - tw - 10, heroH - 22, tw, 14, "F");
      pdf.setGState(new (pdf as any).GState({ opacity: 1 }));
      pdf.setTextColor(255, 255, 255);
      pdf.text(text, W - 16, heroH - 12, { align: "right" });
    }

    // Content block below hero — stacked top-down with explicit spacing
    let y = heroH + 50;

    // Hero caption (italic) right under the hero, above the label
    if (heroCaption) {
      pdf.setFont("times", "italic"); pdf.setFontSize(11); pdf.setTextColor(...MUTED);
      const capLines = pdf.splitTextToSize(String(heroCaption), contentW - 60);
      for (const ln of capLines.slice(0, 2)) { pdf.text(ln, W / 2, y, { align: "center" }); y += 14; }
      y += 8;
    }

    // Small label
    pdf.setTextColor(...GOLD);
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(9);
    pdf.text("PREPARED EXCLUSIVELY FOR YOU", W / 2, y, { align: "center" });
    y += 32;

    // Title (serif, large)
    pdf.setTextColor(...INK);
    pdf.setFont("times", "bold");
    pdf.setFontSize(30);
    const titleLines = pdf.splitTextToSize(doc.title || "Itinerary", contentW);
    titleLines.forEach((l: string) => {
      pdf.text(l, W / 2, y, { align: "center" });
      y += 34;
    });
    y += 12;

    // Divider line
    pdf.setDrawColor(...GOLD);
    pdf.setLineWidth(0.6);
    pdf.line(W / 2 - 40, y, W / 2 + 40, y);
    y += 22;

    // Destination — small uppercase
    const destination = doc.trip_overview?.destination || "";
    if (destination) {
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(10);
      pdf.setTextColor(...MUTED);
      pdf.text(String(destination).toUpperCase(), W / 2, y, { align: "center", charSpace: 2 });
      y += 20;
    }

    // Second divider
    pdf.setDrawColor(...GOLD);
    pdf.setLineWidth(0.6);
    pdf.line(W / 2 - 40, y, W / 2 + 40, y);
    y += 24;

    // Italic description paragraph
    const desc = doc.subtitle || doc.intro || "";
    if (desc) {
      pdf.setFont("times", "italic");
      pdf.setFontSize(12);
      pdf.setTextColor(...INK);
      const descW = contentW - 40;
      const descLines = pdf.splitTextToSize(String(desc), descW);
      const maxLines = Math.min(descLines.length, Math.floor((H - M - y) / 16));
      for (let i = 0; i < maxLines; i++) {
        pdf.text(descLines[i], W / 2, y, { align: "center" });
        y += 16;
      }
    }

    // ============ INTRODUCTION ============
    pdf.addPage();
    pdf.setTextColor(...GOLD);
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(10);
    pdf.text("INTRODUCTION", M, 70);
    pdf.setDrawColor(...GOLD); pdf.line(M, 76, M + 30, 76);

    pdf.setTextColor(...INK);
    pdf.setFont("times", "bold");
    pdf.setFontSize(26);
    let iy = 110;
    iy = addWrapped(pdf, doc.title || "", M, iy, contentW, 30);
    iy += 6;

    pdf.setFont("times", "normal");
    pdf.setFontSize(11.5);
    iy = addWrapped(pdf, doc.intro || "", M, iy + 6, contentW, 17);

    // What to expect
    if (Array.isArray(doc.highlights) && doc.highlights.length) {
      iy += 18;
      if (iy > H - 200) { pdf.addPage(); iy = 80; }
      pdf.setFont("helvetica", "bold"); pdf.setFontSize(10);
      pdf.setTextColor(...GOLD);
      pdf.text("WHAT TO EXPECT", M, iy);
      pdf.setDrawColor(...GOLD); pdf.line(M, iy + 6, M + 30, iy + 6);
      iy += 22;
      pdf.setTextColor(...INK); pdf.setFont("times", "normal"); pdf.setFontSize(11);
      for (const h of doc.highlights) {
        if (iy > H - 80) { pdf.addPage(); iy = 80; }
        pdf.setTextColor(...GOLD); pdf.text("◆", M, iy);
        pdf.setTextColor(...INK);
        iy = addWrapped(pdf, String(h), M + 16, iy, contentW - 16, 16);
        iy += 4;
      }
    }

    // Assistance note
    iy += 18;
    if (iy > H - 160) { pdf.addPage(); iy = 80; }
    pdf.setFillColor(248, 244, 235);
    const noteH = 90;
    pdf.rect(M, iy, contentW, noteH, "F");
    pdf.setTextColor(...GOLD); pdf.setFont("helvetica", "bold"); pdf.setFontSize(9);
    pdf.text("A NOTE FROM YOUR TRAVEL DESIGNER", M + 14, iy + 18);
    pdf.setTextColor(...INK); pdf.setFont("times", "italic"); pdf.setFontSize(10.5);
    addWrapped(
      pdf,
      "This itinerary is your inspiration and guide. Our team is available to assist you with hotel bookings, private transfers, exclusive experiences, restaurant reservations, and any other arrangements that will make your journey seamless and memorable.",
      M + 14, iy + 34, contentW - 28, 14,
    );

    // ============ DAYS ============
    if (Array.isArray(doc.days)) {
      for (const d of doc.days) {
        pdf.addPage();
        // Day header band
        pdf.setFillColor(248, 244, 235);
        pdf.rect(0, 0, W, 90, "F");
        pdf.setTextColor(...GOLD); pdf.setFont("helvetica", "bold"); pdf.setFontSize(11);
        pdf.text(`DAY ${d.day || ""}`, M, 42);
        pdf.setDrawColor(...GOLD); pdf.line(M, 48, M + 24, 48);
        pdf.setTextColor(...INK); pdf.setFont("times", "bold"); pdf.setFontSize(22);
        pdf.text(d.title || "", M, 74);

        let yy = 120;
        if (d.location) {
          pdf.setFont("times", "italic"); pdf.setFontSize(11); pdf.setTextColor(...MUTED);
          yy = addWrapped(pdf, d.location, M, yy, contentW, 14);
          pdf.setTextColor(...INK);
          yy += 6;
        }

        if (d.image_url) {
          const dayImage = await fetchImageDataUrl(d.image_url);
          if (dayImage) {
            try {
              pdf.addImage(dayImage, "JPEG", M, yy, contentW, 160, undefined, "FAST");
              yy += 178;
            } catch {}
          }
        }

        const periods: [string, string][] = [
          ["Morning", d.morning || ""],
          ["Afternoon", d.afternoon || ""],
          ["Evening", d.evening || ""],
        ];
        for (const [h, v] of periods) {
          if (!v) continue;
          if (yy > H - 100) { pdf.addPage(); yy = 80; }
          pdf.setFont("helvetica", "bold"); pdf.setFontSize(9.5); pdf.setTextColor(...GOLD);
          pdf.text(h.toUpperCase(), M, yy); yy += 14;
          pdf.setFont("times", "normal"); pdf.setFontSize(11); pdf.setTextColor(...INK);
          yy = addWrapped(pdf, v, M, yy, contentW, 15);
          yy += 12;
        }

        const tips: [string, string][] = [
          ["Dining tip", d.where_to_eat || ""],
          ["Insider tip", d.tips || ""],
        ];
        for (const [h, v] of tips) {
          if (!v) continue;
          if (yy > H - 100) { pdf.addPage(); yy = 80; }
          pdf.setFillColor(250, 246, 238);
          const lines = pdf.splitTextToSize(v, contentW - 24);
          const boxH = lines.length * 14 + 28;
          pdf.rect(M, yy, contentW, boxH, "F");
          pdf.setFont("helvetica", "bold"); pdf.setFontSize(9); pdf.setTextColor(...GOLD);
          pdf.text(h.toUpperCase(), M + 12, yy + 16);
          pdf.setFont("times", "italic"); pdf.setFontSize(10.5); pdf.setTextColor(...INK);
          let ty = yy + 30;
          for (const ln of lines) { pdf.text(ln, M + 12, ty); ty += 14; }
          yy += boxH + 10;
        }
      }
    }

    // ============ WHERE TO STAY ============
    if (visibleHotels.length) {
      pdf.addPage();
      pdf.setTextColor(...GOLD); pdf.setFont("helvetica", "bold"); pdf.setFontSize(10);
      pdf.text("WHERE TO STAY", M, 70);
      pdf.setDrawColor(...GOLD); pdf.line(M, 76, M + 30, 76);
      pdf.setTextColor(...INK); pdf.setFont("times", "bold"); pdf.setFontSize(26);
      pdf.text("Hotel Recommendations", M, 110);

      let hy = 140;
      for (const h of visibleHotels) {
        // Estimate space; new page if needed
        if (hy > H - 280) { pdf.addPage(); hy = 80; }

        pdf.setFont("times", "bold"); pdf.setFontSize(16); pdf.setTextColor(...INK);
        pdf.text(h.name || "", M, hy); hy += 18;
        if (h.location) {
          pdf.setFont("times", "italic"); pdf.setFontSize(10.5); pdf.setTextColor(...MUTED);
          pdf.text(h.location, M, hy); hy += 14;
        }
        if (h.description) {
          pdf.setFont("times", "normal"); pdf.setFontSize(10.5); pdf.setTextColor(...INK);
          hy = addWrapped(pdf, h.description, M, hy + 6, contentW, 14);
          hy += 6;
        }
        if (Array.isArray(h.perks) && h.perks.length) {
          pdf.setFont("helvetica", "bold"); pdf.setFontSize(9); pdf.setTextColor(...GOLD);
          pdf.text("EXCLUSIVE PERKS", M, hy + 6); hy += 16;
          pdf.setFont("times", "normal"); pdf.setFontSize(10.5); pdf.setTextColor(...INK);
          for (const p of h.perks) {
            if (hy > H - 80) { pdf.addPage(); hy = 80; }
            pdf.setTextColor(...GOLD); pdf.text("✓", M, hy);
            pdf.setTextColor(...INK);
            hy = addWrapped(pdf, String(p), M + 14, hy, contentW - 14, 14);
            hy += 2;
          }
        }
        // Photos grid (3 side-by-side, with optional credit overlay + caption below)
        const photos = (Array.isArray(h.photos) ? h.photos : []).map(normPhoto).filter(Boolean).slice(0, 3) as Array<{url:string,credit:string,caption:string}>;
        if (photos.length) {
          if (hy > H - 220) { pdf.addPage(); hy = 80; }
          const gap = 8;
          const cellW = (contentW - gap * 2) / 3;
          const cellH = cellW * 0.72;
          const imgTop = hy + 8;
          for (let i = 0; i < photos.length; i++) {
            const ph = photos[i];
            if (!ph || !ph.url) continue;
            const data = await fetchImageDataUrl(ph.url);
            if (!data) continue;
            const x = M + i * (cellW + gap);
            try { pdf.addImage(data, "JPEG", x, imgTop, cellW, cellH, undefined, "FAST"); } catch {}
            if (ph.credit) {
              pdf.setFont("helvetica", "normal"); pdf.setFontSize(6.5);
              const cw = pdf.getTextWidth(ph.credit) + 8;
              const cwClamped = Math.min(cw, cellW - 4);
              pdf.setFillColor(0, 0, 0); pdf.setGState(new (pdf as any).GState({ opacity: 0.5 }));
              pdf.rect(x + cellW - cwClamped - 4, imgTop + cellH - 12, cwClamped, 10, "F");
              pdf.setGState(new (pdf as any).GState({ opacity: 1 }));
              pdf.setTextColor(255, 255, 255);
              pdf.text(ph.credit, x + cellW - 6, imgTop + cellH - 4, { align: "right", maxWidth: cwClamped - 4 });
            }
          }
          let capY = imgTop + cellH + 10;
          let maxCapH = 0;
          for (let i = 0; i < photos.length; i++) {
            const ph = photos[i];
            if (!ph || !ph.caption) continue;
            const x = M + i * (cellW + gap);
            pdf.setFont("times", "italic"); pdf.setFontSize(8.5); pdf.setTextColor(...MUTED);
            const capLines = pdf.splitTextToSize(ph.caption, cellW);
            let cy = capY;
            for (const ln of capLines.slice(0, 2)) { pdf.text(ln, x, cy); cy += 10; }
            maxCapH = Math.max(maxCapH, cy - capY);
          }
          hy = imgTop + cellH + (maxCapH ? maxCapH + 14 : 14);
        } else {
          hy += 10;
        }

        // Divider
        pdf.setDrawColor(220, 215, 205); pdf.setLineWidth(0.5);
        pdf.line(M, hy, M + contentW, hy);
        hy += 24;
      }
    }

    // ============ PRACTICAL INFO ============
    if (doc.practical_info) {
      pdf.addPage();
      pdf.setTextColor(...GOLD); pdf.setFont("helvetica", "bold"); pdf.setFontSize(10);
      pdf.text("PRACTICAL INFORMATION", M, 70);
      pdf.setDrawColor(...GOLD); pdf.line(M, 76, M + 30, 76);
      pdf.setTextColor(...INK); pdf.setFont("times", "bold"); pdf.setFontSize(22);
      pdf.text("Good to know", M, 110);

      let yy = 140;
      const pi = doc.practical_info;
      const items: [string, string][] = [
        ["Getting there", pi.getting_there || ""],
        ["Getting around", pi.getting_around || ""],
        ["Money", pi.money || ""],
        ["Language basics", pi.language_basics || ""],
        ["What to pack", pi.what_to_pack || ""],
        ["Etiquette", pi.etiquette || ""],
      ];
      for (const [h, v] of items) {
        if (!v) continue;
        if (yy > H - 100) { pdf.addPage(); yy = 80; }
        pdf.setFont("helvetica", "bold"); pdf.setFontSize(9.5); pdf.setTextColor(...GOLD);
        pdf.text(h.toUpperCase(), M, yy); yy += 14;
        pdf.setFont("times", "normal"); pdf.setFontSize(10.5); pdf.setTextColor(...INK);
        yy = addWrapped(pdf, v, M, yy, contentW, 14);
        yy += 12;
      }
    }

    // ============ BACK PAGE ============
    pdf.addPage();
    pdf.setFillColor(20, 24, 30);
    pdf.rect(0, 0, W, H, "F");
    pdf.setTextColor(...GOLD); pdf.setFont("times", "italic"); pdf.setFontSize(14);
    pdf.text("FJORD & WAVES TRAVEL", W / 2, H / 2 - 80, { align: "center" });
    pdf.setDrawColor(...GOLD); pdf.line(W / 2 - 30, H / 2 - 68, W / 2 + 30, H / 2 - 68);

    pdf.setTextColor(255, 255, 255); pdf.setFont("times", "italic"); pdf.setFontSize(13);
    const closingMsg =
      "We are here every step of your journey. Reach out to us for any assistance, personalisation, or simply to share your experience.";
    const closingLines = pdf.splitTextToSize(closingMsg, contentW - 60);
    let cy = H / 2 - 30;
    for (const ln of closingLines) { pdf.text(ln, W / 2, cy, { align: "center" }); cy += 20; }

    pdf.setFont("helvetica", "normal"); pdf.setFontSize(10);
    pdf.setTextColor(220, 220, 220);
    cy += 30;
    pdf.text("hello@fjordwavestravel.com", W / 2, cy, { align: "center" }); cy += 16;
    pdf.text("fjordwavestravel.com", W / 2, cy, { align: "center" }); cy += 16;
    pdf.setTextColor(...GOLD);
    pdf.text("@fjordwavestravel", W / 2, cy, { align: "center" });

    // ============ FOOTERS ============
    const pageCount = (pdf as any).internal.getNumberOfPages();
    for (let i = 2; i < pageCount; i++) {
      pdf.setPage(i);
      pdf.setFont("helvetica", "normal"); pdf.setFontSize(8);
      pdf.setTextColor(150, 150, 150);
      pdf.text(`${i} / ${pageCount}`, W - M, H - 24, { align: "right" });
      pdf.text("FJORD & WAVES TRAVEL", M, H - 24);
    }

    const bytes = renderPdf(pdf, coverImageUrl);

    // Upload to private bucket
    const path = `${crypto.randomUUID()}.pdf`;
    const { error: upErr } = await supaService.storage
      .from("catalog-pdfs")
      .upload(path, bytes, { contentType: "application/pdf", upsert: false });
    if (upErr) throw upErr;

    return new Response(JSON.stringify({ pdf_path: path, language, pages: pageCount }), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-catalog-pdf error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
