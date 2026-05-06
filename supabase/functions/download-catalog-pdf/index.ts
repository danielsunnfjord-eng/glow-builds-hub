import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const { token } = await req.json();
    if (!token) return json({ error: "Missing token" }, 400);

    const supabase = createClient(SUPABASE_URL, SERVICE_ROLE);

    const { data: purchase } = await supabase
      .from("catalog_purchases")
      .select("id, status, itinerary_id, download_expires_at, download_count")
      .eq("download_token", token)
      .maybeSingle();

    if (!purchase) return json({ error: "Not found" }, 404);
    if (purchase.status !== "paid") return json({ error: "Not paid" }, 403);
    if (
      purchase.download_expires_at &&
      new Date(purchase.download_expires_at) < new Date()
    ) {
      return json({ error: "Link expired" }, 403);
    }

    const { data: itin } = await supabase
      .from("catalog_itineraries")
      .select("pdf_path, title_en")
      .eq("id", purchase.itinerary_id)
      .single();

    if (!itin?.pdf_path) return json({ error: "PDF not available yet" }, 404);

    const { data: signed, error: signedErr } = await supabase.storage
      .from("catalog-pdfs")
      .createSignedUrl(itin.pdf_path, 60 * 10, {
        download: `${itin.title_en}.pdf`.replace(/[^\w.\- ]/g, ""),
      });

    if (signedErr || !signed) {
      return json({ error: "Could not sign URL" }, 500);
    }

    await supabase
      .from("catalog_purchases")
      .update({ download_count: purchase.download_count + 1 })
      .eq("id", purchase.id);

    return json({ url: signed.signedUrl });
  } catch (e) {
    console.error(e);
    return json({ error: String(e) }, 500);
  }
});
