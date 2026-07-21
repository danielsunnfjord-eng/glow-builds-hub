// Sync a catalog itinerary to a mirrored Google Doc in Drive.
// - On first call for an itinerary: creates a Drive folder + Google Doc and stores their IDs.
// - On subsequent calls: replaces the Google Doc body with the latest editor content (HTML).
// Uses the Lovable connector gateway for Google Drive (no direct provider API calls).

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { marked } from "https://esm.sh/marked@12.0.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const GATEWAY = "https://connector-gateway.lovable.dev/google_drive/drive/v3";
const UPLOAD_GATEWAY = "https://connector-gateway.lovable.dev/google_drive/upload/drive/v3";
const DOCS_GATEWAY = "https://connector-gateway.lovable.dev/google_docs/v1";

const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY") ?? "";
const GOOGLE_DRIVE_API_KEY = Deno.env.get("GOOGLE_DRIVE_API_KEY") ?? "";
const GOOGLE_DOCS_API_KEY = Deno.env.get("GOOGLE_DOCS_API_KEY") ?? "";

function gwHeaders(extra: Record<string, string> = {}) {
  return {
    Authorization: `Bearer ${LOVABLE_API_KEY}`,
    "X-Connection-Api-Key": GOOGLE_DRIVE_API_KEY,
    ...extra,
  };
}

function docsHeaders(extra: Record<string, string> = {}) {
  return {
    Authorization: `Bearer ${LOVABLE_API_KEY}`,
    "X-Connection-Api-Key": GOOGLE_DOCS_API_KEY,
    ...extra,
  };
}

async function driveCreateFolder(name: string, parentId?: string): Promise<string> {
  const body: Record<string, unknown> = {
    name,
    mimeType: "application/vnd.google-apps.folder",
  };
  if (parentId) body.parents = [parentId];
  const r = await fetch(`${GATEWAY}/files?fields=id`, {
    method: "POST",
    headers: gwHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify(body),
  });
  if (!r.ok) throw new Error(`Drive folder create failed: ${r.status} ${await r.text()}`);
  const j = await r.json();
  return j.id as string;
}

async function driveCreateDocFromHtml(
  name: string,
  html: string,
  parentId: string,
): Promise<{ id: string; webViewLink: string }> {
  // Multipart upload: metadata + HTML body. Drive converts HTML to Google Doc.
  const boundary = "lovable_boundary_" + crypto.randomUUID();
  const metadata = {
    name,
    mimeType: "application/vnd.google-apps.document",
    parents: [parentId],
  };
  const body =
    `--${boundary}\r\n` +
    `Content-Type: application/json; charset=UTF-8\r\n\r\n` +
    JSON.stringify(metadata) + `\r\n` +
    `--${boundary}\r\n` +
    `Content-Type: text/html; charset=UTF-8\r\n\r\n` +
    html + `\r\n` +
    `--${boundary}--`;

  const r = await fetch(
    `${UPLOAD_GATEWAY}/files?uploadType=multipart&fields=id,webViewLink`,
    {
      method: "POST",
      headers: gwHeaders({ "Content-Type": `multipart/related; boundary=${boundary}` }),
      body,
    },
  );
  if (!r.ok) throw new Error(`Doc create failed: ${r.status} ${await r.text()}`);
  return await r.json();
}

async function docsClearBody(docId: string): Promise<void> {
  console.log(`[docsClearBody] start docId=${docId}`);
  // Fetch current document structure to find the end of the body.
  const r = await fetch(
    `${DOCS_GATEWAY}/documents/${docId}?fields=body(content(endIndex))`,
    { method: "GET", headers: docsHeaders() },
  );
  console.log(`[docsClearBody] GET document status=${r.status}`);
  if (!r.ok) throw new Error(`Docs get failed: ${r.status} ${await r.text()}`);
  const doc = await r.json();
  const content: Array<{ endIndex?: number }> = doc?.body?.content ?? [];
  const lastEnd = content.length ? Number(content[content.length - 1]?.endIndex ?? 1) : 1;
  // Google Docs requires a trailing newline; valid delete range is [1, endIndex-1).
  const deleteEnd = Math.max(1, lastEnd - 1);
  console.log(`[docsClearBody] lastEnd=${lastEnd} deleteEnd=${deleteEnd} contentElements=${content.length}`);
  if (deleteEnd <= 1) {
    console.log(`[docsClearBody] body already empty — skipping delete`);
    return;
  }

  const batch = await fetch(`${DOCS_GATEWAY}/documents/${docId}:batchUpdate`, {
    method: "POST",
    headers: docsHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify({
      requests: [
        { deleteContentRange: { range: { startIndex: 1, endIndex: deleteEnd } } },
      ],
    }),
  });
  console.log(`[docsClearBody] deleteContentRange status=${batch.status}`);
  if (!batch.ok) {
    throw new Error(`Docs batchUpdate clear failed: ${batch.status} ${await batch.text()}`);
  }
  console.log(`[docsClearBody] body cleared successfully`);
}

// ---------- Markdown → Google Docs batchUpdate requests ----------

type InlineRun = { text: string; bold?: boolean; italic?: boolean };

function parseInline(s: string): InlineRun[] {
  const runs: InlineRun[] = [];
  let buf = "";
  let bold = false;
  let italic = false;
  const flush = () => {
    if (buf) {
      runs.push({ text: buf, bold: bold || undefined, italic: italic || undefined });
      buf = "";
    }
  };
  let i = 0;
  while (i < s.length) {
    if (s.startsWith("**", i) || s.startsWith("__", i)) {
      flush();
      bold = !bold;
      i += 2;
      continue;
    }
    const ch = s[i];
    if ((ch === "*" || ch === "_") && s[i + 1] !== ch) {
      flush();
      italic = !italic;
      i += 1;
      continue;
    }
    buf += ch;
    i += 1;
  }
  flush();
  return runs;
}

type Block =
  | { kind: "heading"; level: number; runs: InlineRun[] }
  | { kind: "paragraph"; runs: InlineRun[] }
  | { kind: "bullet"; runs: InlineRun[] }
  | { kind: "numbered"; runs: InlineRun[] };

function parseMarkdownBlocks(md: string): Block[] {
  const blocks: Block[] = [];
  const lines = md.replace(/\r\n/g, "\n").split("\n");
  let para: string[] = [];
  const flushPara = () => {
    if (para.length) {
      blocks.push({ kind: "paragraph", runs: parseInline(para.join(" ")) });
      para = [];
    }
  };
  for (const raw of lines) {
    const line = raw.trimEnd();
    if (!line.trim()) {
      flushPara();
      continue;
    }
    const h = line.match(/^(#{1,6})\s+(.*)$/);
    if (h) {
      flushPara();
      blocks.push({ kind: "heading", level: h[1].length, runs: parseInline(h[2]) });
      continue;
    }
    const b = line.match(/^\s*[-*+]\s+(.*)$/);
    if (b) {
      flushPara();
      blocks.push({ kind: "bullet", runs: parseInline(b[1]) });
      continue;
    }
    const n = line.match(/^\s*\d+\.\s+(.*)$/);
    if (n) {
      flushPara();
      blocks.push({ kind: "numbered", runs: parseInline(n[1]) });
      continue;
    }
    if (/^[-_*]{3,}$/.test(line)) {
      flushPara();
      continue;
    }
    para.push(line);
  }
  flushPara();
  return blocks;
}

function buildBatchRequests(opts: {
  title: string;
  destination?: string | null;
  duration?: string | null;
  summary?: string | null;
  contentMarkdown?: string | null;
}): unknown[] {
  const blocks: Block[] = [];
  blocks.push({ kind: "heading", level: 1, runs: [{ text: opts.title }] });
  const metaBits = [opts.destination, opts.duration].filter(Boolean).join(" · ");
  if (metaBits) blocks.push({ kind: "paragraph", runs: [{ text: metaBits, italic: true }] });
  if (opts.summary) blocks.push({ kind: "paragraph", runs: [{ text: opts.summary }] });
  if (opts.contentMarkdown) blocks.push(...parseMarkdownBlocks(opts.contentMarkdown));
  blocks.push({
    kind: "paragraph",
    runs: [{
      text: "Note: The styled cover page and budget table from the Fjord & Waves editor are not mirrored here. Edit narrative copy freely; styled blocks remain in the app.",
      italic: true,
    }],
  });

  const requests: unknown[] = [];
  let idx = 1;
  const paraStyleOps: { start: number; end: number; namedStyleType: string }[] = [];
  const bulletOps: { start: number; end: number; preset: string }[] = [];
  const textStyleOps: { start: number; end: number; bold?: boolean; italic?: boolean }[] = [];

  for (const block of blocks) {
    const paraStart = idx;
    for (const run of block.runs) {
      if (!run.text) continue;
      requests.push({ insertText: { location: { index: idx }, text: run.text } });
      const runStart = idx;
      idx += run.text.length;
      if (run.bold || run.italic) {
        textStyleOps.push({ start: runStart, end: idx, bold: run.bold, italic: run.italic });
      }
    }
    requests.push({ insertText: { location: { index: idx }, text: "\n" } });
    idx += 1;
    const paraEnd = idx;
    if (block.kind === "heading") {
      paraStyleOps.push({
        start: paraStart,
        end: paraEnd,
        namedStyleType: `HEADING_${Math.min(6, Math.max(1, block.level))}`,
      });
    } else if (block.kind === "bullet") {
      bulletOps.push({ start: paraStart, end: paraEnd, preset: "BULLET_DISC_CIRCLE_SQUARE" });
    } else if (block.kind === "numbered") {
      bulletOps.push({ start: paraStart, end: paraEnd, preset: "NUMBERED_DECIMAL_ALPHA_ROMAN" });
    }
  }

  for (const op of paraStyleOps) {
    requests.push({
      updateParagraphStyle: {
        range: { startIndex: op.start, endIndex: op.end },
        paragraphStyle: { namedStyleType: op.namedStyleType },
        fields: "namedStyleType",
      },
    });
  }
  for (const op of bulletOps) {
    requests.push({
      createParagraphBullets: {
        range: { startIndex: op.start, endIndex: op.end },
        bulletPreset: op.preset,
      },
    });
  }
  for (const op of textStyleOps) {
    const ts: Record<string, boolean> = {};
    const fields: string[] = [];
    if (op.bold) { ts.bold = true; fields.push("bold"); }
    if (op.italic) { ts.italic = true; fields.push("italic"); }
    requests.push({
      updateTextStyle: {
        range: { startIndex: op.start, endIndex: op.end },
        textStyle: ts,
        fields: fields.join(","),
      },
    });
  }
  return requests;
}

async function docsReplaceBody(
  fileId: string,
  opts: {
    title: string;
    destination?: string | null;
    duration?: string | null;
    summary?: string | null;
    contentMarkdown?: string | null;
  },
): Promise<void> {
  console.log(`[docsReplaceBody] start fileId=${fileId}`);
  // Step 1: clear the existing body via Docs API deleteContentRange.
  await docsClearBody(fileId);

  // Step 2: build batchUpdate requests from markdown source and insert via
  // the Docs API. This is the canonical "replace body" path — no Drive media
  // PATCH, no HTML re-conversion, so the new content cannot be appended on
  // top of leftover content.
  const requests = buildBatchRequests(opts);
  console.log(`[docsReplaceBody] built ${requests.length} batchUpdate requests`);

  const r = await fetch(`${DOCS_GATEWAY}/documents/${fileId}:batchUpdate`, {
    method: "POST",
    headers: docsHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify({ requests }),
  });
  console.log(`[docsReplaceBody] batchUpdate write status=${r.status}`);
  if (!r.ok) {
    throw new Error(`Docs batchUpdate write failed: ${r.status} ${await r.text()}`);
  }
  console.log(`[docsReplaceBody] body replaced successfully`);
}

async function driveGetWebViewLink(fileId: string): Promise<string> {
  const r = await fetch(`${GATEWAY}/files/${fileId}?fields=webViewLink`, {
    method: "GET",
    headers: gwHeaders(),
  });
  if (!r.ok) throw new Error(`Drive get failed: ${r.status} ${await r.text()}`);
  const j = await r.json();
  return j.webViewLink as string;
}

async function driveGetMeta(fileId: string): Promise<{ modifiedTime: string | null; webViewLink: string | null; trashed: boolean }> {
  const r = await fetch(`${GATEWAY}/files/${fileId}?fields=modifiedTime,webViewLink,trashed`, {
    method: "GET",
    headers: gwHeaders(),
  });
  if (!r.ok) throw new Error(`Drive meta failed: ${r.status} ${await r.text()}`);
  const j = await r.json();
  return { modifiedTime: j.modifiedTime ?? null, webViewLink: j.webViewLink ?? null, trashed: !!j.trashed };
}

// Export a Google Doc to Markdown via Drive's export endpoint.
async function driveExportMarkdown(fileId: string): Promise<string> {
  const url = `${GATEWAY}/files/${fileId}/export?mimeType=${encodeURIComponent("text/markdown")}`;
  const r = await fetch(url, { method: "GET", headers: gwHeaders() });
  if (!r.ok) throw new Error(`Drive export failed: ${r.status} ${await r.text()}`);
  return await r.text();
}

// Export a Google Doc to HTML via Drive's export endpoint.
async function driveExportHtml(fileId: string): Promise<string> {
  const url = `${GATEWAY}/files/${fileId}/export?mimeType=${encodeURIComponent("text/html")}`;
  const r = await fetch(url, { method: "GET", headers: gwHeaders() });
  if (!r.ok) throw new Error(`Drive HTML export failed: ${r.status} ${await r.text()}`);
  return await r.text();
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function buildDocHtml(opts: {
  title: string;
  destination?: string | null;
  duration?: string | null;
  summary?: string | null;
  contentMarkdown?: string | null;
}): string {
  const bodyHtml = opts.contentMarkdown
    ? marked.parse(opts.contentMarkdown, { breaks: true, gfm: true }) as string
    : "";
  const metaBits: string[] = [];
  if (opts.destination) metaBits.push(escapeHtml(opts.destination));
  if (opts.duration) metaBits.push(escapeHtml(opts.duration));
  const metaLine = metaBits.length ? `<p><em>${metaBits.join(" · ")}</em></p>` : "";
  const summaryHtml = opts.summary
    ? `<p>${escapeHtml(opts.summary)}</p>`
    : "";
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${escapeHtml(opts.title)}</title></head><body>
<h1>${escapeHtml(opts.title)}</h1>
${metaLine}
${summaryHtml}
<hr/>
${bodyHtml}
<p><em>Note: The styled cover page and budget table from the Fjord &amp; Waves editor are not mirrored here. Edit narrative copy freely; styled blocks remain in the app.</em></p>
</body></html>`;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    if (!LOVABLE_API_KEY || !GOOGLE_DRIVE_API_KEY || !GOOGLE_DOCS_API_KEY) {
      throw new Error("Google Drive and Google Docs connectors must both be linked to this project.");
    }

    const body = await req.json().catch(() => ({}));
    const itinerary_id = body?.itinerary_id;
    const requested = body?.action;
    const action: "sync" | "check" | "pull" | "export-html" =
      requested === "check" ? "check"
        : requested === "pull" ? "pull"
        : requested === "export-html" ? "export-html"
        : "sync";
    const reqLang = body?.language;
    const language: "en" | "pt" | "no" =
      reqLang === "pt" || reqLang === "no" ? reqLang : "en";
    if (!itinerary_id || typeof itinerary_id !== "string") {
      return new Response(JSON.stringify({ error: "itinerary_id is required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { data: row, error } = await supabase
      .from("catalog_itineraries")
      .select("id, title_en, title_pt, title_no, destination, duration, summary_en, summary_pt, summary_no, itinerary_content_en, itinerary_content_pt, itinerary_content_no, gdrive_folder_id, gdoc_id, gdoc_url, gdoc_last_synced_at")
      .eq("id", itinerary_id)
      .single();
    if (error || !row) throw new Error(`Itinerary not found: ${error?.message ?? "no row"}`);

    // Resolve language-aware fields with fallbacks so PT/NO itineraries never
    // produce an empty Google Doc body when only their translated column is set.
    const resolvedTitle: string =
      (row as any)[`title_${language}`] || row.title_en || row.title_pt || row.title_no || "Untitled itinerary";
    const resolvedSummary: string | null =
      (row as any)[`summary_${language}`] || row.summary_en || row.summary_pt || row.summary_no || null;
    const primaryContent = (row as any)[`itinerary_content_${language}`] as string | null;
    let resolvedContent: string | null = primaryContent || null;
    let contentSourceLang: "en" | "pt" | "no" = language;
    if (!resolvedContent) {
      const candidates: Array<["en" | "pt" | "no", string | null]> = [
        ["en", row.itinerary_content_en],
        ["pt", row.itinerary_content_pt],
        ["no", row.itinerary_content_no],
      ];
      for (const [lang, val] of candidates) {
        if (val) {
          resolvedContent = val;
          contentSourceLang = lang;
          break;
        }
      }
    }
    console.log(
      `[sync] requested language=${language} content source=${contentSourceLang} fallback=${contentSourceLang !== language} hasContent=${!!resolvedContent}`,
    );

    // CHECK MODE: report Drive doc's last-modified time vs our last sync. Does not write.
    if (action === "check") {
      if (!row.gdoc_id) {
        return new Response(
          JSON.stringify({
            ok: true,
            exists: false,
            gdoc_id: null,
            gdoc_url: row.gdoc_url ?? null,
            last_synced_at: row.gdoc_last_synced_at ?? null,
            doc_modified_time: null,
            conflict: false,
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
      let meta: Awaited<ReturnType<typeof driveGetMeta>> | null = null;
      try {
        meta = await driveGetMeta(row.gdoc_id);
      } catch (err) {
        const msg = (err as Error).message ?? "";
        if (msg.includes("404")) {
          // Doc was deleted manually in Drive — clear stale ids so the next
          // sync recreates them, and report as non-existent.
          await supabase
            .from("catalog_itineraries")
            .update({ gdoc_id: null, gdoc_url: null, gdrive_folder_id: null, gdoc_last_synced_at: null })
            .eq("id", itinerary_id);
          return new Response(
            JSON.stringify({
              ok: true,
              exists: false,
              gdoc_id: null,
              gdoc_url: null,
              last_synced_at: null,
              doc_modified_time: null,
              conflict: false,
            }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } },
          );
        }
        throw err;
      }
      const synced = row.gdoc_last_synced_at ? new Date(row.gdoc_last_synced_at).getTime() : 0;
      const modified = meta.modifiedTime ? new Date(meta.modifiedTime).getTime() : 0;
      // 30s grace to absorb clock skew and Drive's post-sync touch.
      const conflict = !!meta.modifiedTime && modified > synced + 30_000 && !meta.trashed;
      return new Response(
        JSON.stringify({
          ok: true,
          exists: !meta.trashed,
          gdoc_id: row.gdoc_id,
          gdoc_url: meta.webViewLink ?? row.gdoc_url ?? null,
          last_synced_at: row.gdoc_last_synced_at ?? null,
          doc_modified_time: meta.modifiedTime,
          conflict,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // PULL MODE: export the Google Doc as Markdown and return it. Also bump
    // gdoc_last_synced_at to the doc's modifiedTime so the client clears the
    // conflict banner once it has replaced its editor content.
    if (action === "pull") {
      if (!row.gdoc_id) {
        return new Response(JSON.stringify({ error: "No Google Doc linked to this itinerary yet." }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const meta = await driveGetMeta(row.gdoc_id);
      if (meta.trashed) {
        return new Response(JSON.stringify({ error: "Linked Google Doc has been moved to trash." }), {
          status: 410, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const markdown = await driveExportMarkdown(row.gdoc_id);
      const syncedAt = meta.modifiedTime ?? new Date().toISOString();
      await supabase
        .from("catalog_itineraries")
        .update({ gdoc_last_synced_at: syncedAt, gdoc_url: meta.webViewLink ?? row.gdoc_url })
        .eq("id", itinerary_id);
      return new Response(
        JSON.stringify({
          ok: true,
          gdoc_id: row.gdoc_id,
          gdoc_url: meta.webViewLink ?? row.gdoc_url ?? null,
          synced_at: syncedAt,
          doc_modified_time: meta.modifiedTime,
          markdown,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // EXPORT-HTML MODE: export the linked Google Doc as raw HTML. The client
    // sanitises it down to a structural allow-list before feeding it to
    // Paged.js. Read-only; does not write back.
    if (action === "export-html") {
      if (!row.gdoc_id) {
        return new Response(JSON.stringify({ error: "No Google Doc linked to this itinerary yet." }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const meta = await driveGetMeta(row.gdoc_id);
      if (meta.trashed) {
        return new Response(JSON.stringify({ error: "Linked Google Doc has been moved to trash." }), {
          status: 410, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const html = await driveExportHtml(row.gdoc_id);
      return new Response(
        JSON.stringify({
          ok: true,
          gdoc_id: row.gdoc_id,
          gdoc_url: meta.webViewLink ?? row.gdoc_url ?? null,
          doc_modified_time: meta.modifiedTime,
          html,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }



    // Load (or initialize) the Drafts root folder.
    let { data: settings } = await supabase
      .from("drive_settings")
      .select("id, drafts_folder_id, root_folder_id")
      .limit(1)
      .maybeSingle();

    if (!settings) {
      const rootId = await driveCreateFolder("Fjord & Waves Itineraries");
      const draftsId = await driveCreateFolder("Drafts", rootId);
      const ins = await supabase
        .from("drive_settings")
        .insert({ root_folder_id: rootId, drafts_folder_id: draftsId })
        .select("id, drafts_folder_id, root_folder_id")
        .single();
      if (ins.error) throw new Error(`drive_settings insert failed: ${ins.error.message}`);
      settings = ins.data;
    } else if (!settings.drafts_folder_id) {
      const rootId = settings.root_folder_id || (await driveCreateFolder("Fjord & Waves Itineraries"));
      const draftsId = await driveCreateFolder("Drafts", rootId);
      await supabase
        .from("drive_settings")
        .update({ root_folder_id: rootId, drafts_folder_id: draftsId })
        .eq("id", settings.id);
      settings.drafts_folder_id = draftsId;
      settings.root_folder_id = rootId;
    }

    const title = resolvedTitle;
    const html = buildDocHtml({
      title,
      destination: row.destination,
      duration: row.duration,
      summary: resolvedSummary,
      contentMarkdown: resolvedContent,
    });

    let gdocId = row.gdoc_id as string | null;
    let gdocUrl = row.gdoc_url as string | null;
    let folderId = row.gdrive_folder_id as string | null;

    // Pre-flight: if the linked Doc or folder was deleted/trashed manually in
    // Drive, clear the stale ids so the create-path below recreates them
    // seamlessly. This makes "Regenerate with AI" self-healing.
    const probeExists = async (fileId: string): Promise<boolean> => {
      try {
        const meta = await driveGetMeta(fileId);
        return !meta.trashed;
      } catch (err) {
        console.log(`[probeExists] ${fileId} not accessible: ${(err as Error).message}`);
        return false;
      }
    };
    if (gdocId && !(await probeExists(gdocId))) {
      console.log(`[sync] linked gdoc ${gdocId} missing/trashed — will recreate`);
      gdocId = null;
      gdocUrl = null;
    }
    if (folderId && !(await probeExists(folderId))) {
      console.log(`[sync] linked folder ${folderId} missing/trashed — will recreate`);
      folderId = null;
      // Doc lived inside that folder; force recreate as well.
      gdocId = null;
      gdocUrl = null;
    }

    if (!gdocId) {
      // First sync (or recovery after manual deletion): create a per-itinerary
      // folder under Drafts if needed, then create the Doc.
      if (!folderId) {
        const folderName = `${title} — ${itinerary_id.slice(0, 8)}`;
        folderId = await driveCreateFolder(folderName, settings.drafts_folder_id!);
      }
      const created = await driveCreateDocFromHtml(title, html, folderId);
      gdocId = created.id;
      gdocUrl = created.webViewLink || (await driveGetWebViewLink(gdocId));
    } else {
      // Update path: use the Docs API to clear + rewrite the body. We do NOT
      // re-use the Drive media PATCH here because it does not reliably replace
      // an existing Google Doc body and caused duplicated content.
      await docsReplaceBody(gdocId, {
        title,
        destination: row.destination,
        duration: row.duration,
        summary: row.summary_en,
        contentMarkdown: row.itinerary_content_en,
      });
      if (!gdocUrl) gdocUrl = await driveGetWebViewLink(gdocId);
    }

    const nowIso = new Date().toISOString();
    await supabase
      .from("catalog_itineraries")
      .update({
        gdoc_id: gdocId,
        gdoc_url: gdocUrl,
        gdrive_folder_id: folderId,
        gdoc_last_synced_at: nowIso,
      })
      .eq("id", itinerary_id);

    return new Response(
      JSON.stringify({ ok: true, gdoc_id: gdocId, gdoc_url: gdocUrl, synced_at: nowIso }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    console.error("gdrive-sync-itinerary error", e);
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
