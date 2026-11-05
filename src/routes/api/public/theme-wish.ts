import { createClient } from "@supabase/supabase-js";
import { createFileRoute } from "@tanstack/react-router";
import { themeWishSchema } from "@/lib/themeWish";
import { sendOwnerNotification } from "@/lib/email/sendOwnerNotification";

export const Route = createFileRoute("/api/public/theme-wish")({
  server: { handlers: { POST: async ({ request }) => {
    let body: unknown;
    try { body = await request.json(); } catch { return Response.json({ error: "Invalid request" }, { status: 400 }); }
    const parsed = themeWishSchema.safeParse(body);
    if (!parsed.success) return Response.json({ error: "Missing or invalid fields" }, { status: 400 });
    const url = import.meta.env["VITE_SUPABASE_URL"];
    const key = process.env["SUPABASE_SERVICE_ROLE_KEY"];
    if (!url || !key) return Response.json({ error: "Sending unavailable" }, { status: 503 });
    // Validated public submission only; no anonymous read or update access.
    const client = createClient(url, key, { auth: { persistSession: false } });
    const { data, error } = await client.from("theme_travel_wishes").insert(parsed.data).select("id").single();
    if (error || !data) {
      console.error("Theme wish save failed", { code: error?.code });
      return Response.json({ error: "Could not save wish" }, { status: 500 });
    }
    try {
      const result = await sendOwnerNotification("theme-wish-notify", parsed.data, `theme-wish-notify-${data.id}`);
      if (!result.sent) console.warn("Theme wish notification unavailable", { reason: result.reason });
    } catch { console.warn("Theme wish notification failed after saving"); }
    return Response.json({ ok: true });
  } } },
});