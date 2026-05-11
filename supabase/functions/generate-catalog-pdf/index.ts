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

Produce a COMPLETE, DETAILED, READY-TO-PRINT travel itinerary document in ${langName}. The output is the actual product the customer downloads as a PDF — make it valuable, specific, and beautifully written. No fluff, no placeholders.

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
  "highlights": ["string", "..."] ,
  "days": [
    {
      "day": 1,
      "title": "string",
      "location": "string",
      "morning": "string (detailed paragraph)",
      "afternoon": "string",
      "evening": "string",
      "where_to_stay": "string (1-3 specific suggestions)",
      "where_to_eat": "string (1-3 specific suggestions with cuisine notes)",
      "tips": "string"
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
- Days array length should match the trip duration (default 5-10 days if unclear).
- Be specific: name real neighbourhoods, real restaurants/hotels where possible from the sources, real practical details.
- Each day's morning/afternoon/evening = one substantial paragraph (3-6 sentences).
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
          model: "google/gemini-2.5-pro",
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

    // --- Render PDF ---
    const coverImageUrl = doc.cover_image_url || heroImageUrl;
    const pdf = new jsPDF({ unit: "pt", format: "a4" });
    const W = pdf.internal.pageSize.getWidth();
    const H = pdf.internal.pageSize.getHeight();
    const M = 56; // margin
    const contentW = W - M * 2;

    // Cover
    let heroData: string | null = null;
    if (coverImageUrl) heroData = await fetchImageDataUrl(coverImageUrl);
    if (heroData) {
      try { pdf.addImage(heroData, "JPEG", 0, 0, W, H * 0.55, undefined, "FAST"); } catch {}
      pdf.setFillColor(20, 20, 20);
      pdf.rect(0, H * 0.5, W, H * 0.5, "F");
    } else {
      pdf.setFillColor(245, 240, 230);
      pdf.rect(0, 0, W, H, "F");
    }

    pdf.setTextColor(255, 255, 255);
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(34);
    let y = heroData ? H * 0.62 : H * 0.35;
    const titleLines = pdf.splitTextToSize(doc.title || "Itinerary", contentW);
    titleLines.forEach((l: string) => { pdf.text(l, M, y); y += 38; });

    pdf.setFont("helvetica", "italic");
    pdf.setFontSize(14);
    y = addWrapped(pdf, doc.subtitle || "", M, y + 6, contentW, 18);

    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(10);
    pdf.setTextColor(220, 200, 150);
    pdf.text("FJORD & WAVES TRAVEL", M, H - M);
    pdf.setTextColor(255, 255, 255);
    pdf.text(langName, W - M, H - M, { align: "right" });

    // Intro page
    pdf.addPage();
    pdf.setTextColor(30, 30, 30);
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(20);
    pdf.text("Overview", M, 80);

    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(11);
    y = addWrapped(pdf, doc.intro || "", M, 110, contentW, 16);

    // Trip overview box
    if (doc.trip_overview) {
      y += 14;
      const ov = doc.trip_overview;
      const rows: [string, string][] = [
        ["Destination", ov.destination || ""],
        ["Duration", ov.duration || ""],
        ["Best for", ov.best_for || ""],
        ["Estimated budget", ov.estimated_budget || ""],
        ["Best season", ov.best_season || ""],
      ];
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(13);
      pdf.text("Trip details", M, y); y += 18;
      pdf.setFontSize(10);
      for (const [k, v] of rows) {
        if (!v) continue;
        if (y > H - 80) { pdf.addPage(); y = 80; }
        pdf.setFont("helvetica", "bold"); pdf.text(k, M, y);
        pdf.setFont("helvetica", "normal");
        y = addWrapped(pdf, v, M + 130, y, contentW - 130, 14);
        y += 4;
      }
    }

    // Highlights
    if (Array.isArray(doc.highlights) && doc.highlights.length) {
      y += 10;
      if (y > H - 120) { pdf.addPage(); y = 80; }
      pdf.setFont("helvetica", "bold"); pdf.setFontSize(13);
      pdf.text("Highlights", M, y); y += 18;
      pdf.setFont("helvetica", "normal"); pdf.setFontSize(10);
      for (const h of doc.highlights) {
        if (y > H - 60) { pdf.addPage(); y = 80; }
        pdf.text("•", M, y);
        y = addWrapped(pdf, String(h), M + 14, y, contentW - 14, 14);
        y += 2;
      }
    }

    // Days
    if (Array.isArray(doc.days)) {
      for (const d of doc.days) {
        pdf.addPage();
        pdf.setFont("helvetica", "bold"); pdf.setFontSize(11);
        pdf.setTextColor(180, 140, 60);
        pdf.text(`DAY ${d.day || ""}`, M, 70);
        pdf.setTextColor(30, 30, 30);
        pdf.setFontSize(22);
        let yy = 96;
        yy = addWrapped(pdf, d.title || "", M, yy, contentW, 26);
        if (d.location) {
          pdf.setFont("helvetica", "italic"); pdf.setFontSize(11);
          pdf.setTextColor(120, 120, 120);
          yy = addWrapped(pdf, d.location, M, yy + 4, contentW, 14);
          pdf.setTextColor(30, 30, 30);
        }
        yy += 10;

        if (d.image_url) {
          const dayImage = await fetchImageDataUrl(d.image_url);
          if (dayImage) {
            try {
              pdf.addImage(dayImage, "JPEG", M, yy, contentW, 150, undefined, "FAST");
              yy += 168;
            } catch {}
          }
        }

        const sections: [string, string][] = [
          ["Morning", d.morning || ""],
          ["Afternoon", d.afternoon || ""],
          ["Evening", d.evening || ""],
          ["Where to stay", d.where_to_stay || ""],
          ["Where to eat", d.where_to_eat || ""],
          ["Tips", d.tips || ""],
        ];
        for (const [h, v] of sections) {
          if (!v) continue;
          if (yy > H - 100) { pdf.addPage(); yy = 80; }
          pdf.setFont("helvetica", "bold"); pdf.setFontSize(11);
          pdf.text(h, M, yy); yy += 14;
          pdf.setFont("helvetica", "normal"); pdf.setFontSize(10.5);
          yy = addWrapped(pdf, v, M, yy, contentW, 14);
          yy += 10;
        }
      }
    }

    // Practical info
    if (doc.practical_info) {
      pdf.addPage();
      pdf.setFont("helvetica", "bold"); pdf.setFontSize(22);
      pdf.text("Practical information", M, 80);
      let yy = 110;
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
        pdf.setFont("helvetica", "bold"); pdf.setFontSize(12);
        pdf.text(h, M, yy); yy += 14;
        pdf.setFont("helvetica", "normal"); pdf.setFontSize(10.5);
        yy = addWrapped(pdf, v, M, yy, contentW, 14);
        yy += 10;
      }
    }

    // Closing
    if (doc.closing) {
      pdf.addPage();
      pdf.setFont("helvetica", "bold"); pdf.setFontSize(20);
      pdf.text("Bon voyage", M, 100);
      pdf.setFont("helvetica", "italic"); pdf.setFontSize(12);
      addWrapped(pdf, doc.closing, M, 134, contentW, 18);
    }

    // Footer page numbers
    const pageCount = (pdf as any).internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      pdf.setPage(i);
      pdf.setFont("helvetica", "normal"); pdf.setFontSize(8);
      pdf.setTextColor(150, 150, 150);
      pdf.text(`${i} / ${pageCount}`, W - M, H - 24, { align: "right" });
      pdf.text("fjordwavestravel.com", M, H - 24);
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
