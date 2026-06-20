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

const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY") ?? "";
const GOOGLE_DRIVE_API_KEY = Deno.env.get("GOOGLE_DRIVE_API_KEY") ?? "";

function gwHeaders(extra: Record<string, string> = {}) {
  return {
    Authorization: `Bearer ${LOVABLE_API_KEY}`,
    "X-Connection-Api-Key": GOOGLE_DRIVE_API_KEY,
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

async function driveUpdateDocHtml(fileId: string, html: string): Promise<void> {
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

    const { itinerary_id } = await req.json();
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
      .select("id, title_en, destination, duration, summary_en, itinerary_content_en, gdrive_folder_id, gdoc_id, gdoc_url")
      .eq("id", itinerary_id)
      .single();
    if (error || !row) throw new Error(`Itinerary not found: ${error?.message ?? "no row"}`);

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
