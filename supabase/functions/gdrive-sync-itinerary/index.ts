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
  // Fetch current document structure to find the end of the body.
  const r = await fetch(
    `${DOCS_GATEWAY}/documents/${docId}?fields=body(content(endIndex))`,
    { method: "GET", headers: docsHeaders() },
  );
  if (!r.ok) throw new Error(`Docs get failed: ${r.status} ${await r.text()}`);
  const doc = await r.json();
  const content: Array<{ endIndex?: number }> = doc?.body?.content ?? [];
  const lastEnd = content.length ? Number(content[content.length - 1]?.endIndex ?? 1) : 1;
  // Google Docs requires a trailing newline; valid delete range is [1, endIndex-1).
  const deleteEnd = Math.max(1, lastEnd - 1);
  if (deleteEnd <= 1) return; // already empty

  const batch = await fetch(`${DOCS_GATEWAY}/documents/${docId}:batchUpdate`, {
    method: "POST",
    headers: docsHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify({
      requests: [
        { deleteContentRange: { range: { startIndex: 1, endIndex: deleteEnd } } },
      ],
    }),
  });
  if (!batch.ok) {
    throw new Error(`Docs batchUpdate clear failed: ${batch.status} ${await batch.text()}`);
  }
}

async function driveUpdateDocHtml(fileId: string, html: string): Promise<void> {
  // Step 1: clear the existing Doc body via the Google Docs API so the
  // subsequent HTML upload does not append to leftover content. This is the
  // fix for duplicated days/sections appearing in the synced Doc.
  await docsClearBody(fileId);

  // Step 2: write the new HTML content. Drive converts the uploaded HTML
  // back into the existing Google Doc body.
  const r = await fetch(
    `${UPLOAD_GATEWAY}/files/${fileId}?uploadType=media`,
    {
      method: "PATCH",
      headers: gwHeaders({ "Content-Type": "text/html; charset=UTF-8" }),
      body: html,
    },
  );
  if (!r.ok) throw new Error(`Doc update failed: ${r.status} ${await r.text()}`);
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
    if (!LOVABLE_API_KEY || !GOOGLE_DRIVE_API_KEY) {
      throw new Error("Google Drive connector is not linked to this project.");
    }

    const body = await req.json().catch(() => ({}));
    const itinerary_id = body?.itinerary_id;
    const requested = body?.action;
    const action: "sync" | "check" | "pull" | "export-html" =
      requested === "check" ? "check"
        : requested === "pull" ? "pull"
        : requested === "export-html" ? "export-html"
        : "sync";
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
      .select("id, title_en, destination, duration, summary_en, itinerary_content_en, gdrive_folder_id, gdoc_id, gdoc_url, gdoc_last_synced_at")
      .eq("id", itinerary_id)
      .single();
    if (error || !row) throw new Error(`Itinerary not found: ${error?.message ?? "no row"}`);

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
      const meta = await driveGetMeta(row.gdoc_id);
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

    const title = row.title_en || "Untitled itinerary";
    const html = buildDocHtml({
      title,
      destination: row.destination,
      duration: row.duration,
      summary: row.summary_en,
      contentMarkdown: row.itinerary_content_en,
    });

    let gdocId = row.gdoc_id as string | null;
    let gdocUrl = row.gdoc_url as string | null;
    let folderId = row.gdrive_folder_id as string | null;

    if (!gdocId) {
      // First sync: create a per-itinerary folder under Drafts, then create the Doc.
      const folderName = `${title} — ${itinerary_id.slice(0, 8)}`;
      folderId = await driveCreateFolder(folderName, settings.drafts_folder_id!);
      const created = await driveCreateDocFromHtml(title, html, folderId);
      gdocId = created.id;
      gdocUrl = created.webViewLink || (await driveGetWebViewLink(gdocId));
    } else {
      await driveUpdateDocHtml(gdocId, html);
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
