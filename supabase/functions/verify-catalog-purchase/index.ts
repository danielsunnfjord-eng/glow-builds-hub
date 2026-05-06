import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const STRIPE_KEY = Deno.env.get("STRIPE_SANDBOX_API_KEY")!;
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
    const { token, session_id } = await req.json();
    if (!token || !session_id) return json({ error: "Missing fields" }, 400);

    const supabase = createClient(SUPABASE_URL, SERVICE_ROLE);

    const { data: purchase } = await supabase
      .from("catalog_purchases")
      .select("id, status, itinerary_id, stripe_session_id, download_expires_at")
      .eq("download_token", token)
      .maybeSingle();

    if (!purchase) return json({ error: "Not found" }, 404);
    if (purchase.stripe_session_id !== session_id) {
      return json({ error: "Mismatched session" }, 400);
    }

    // If already paid, return ready
    if (purchase.status === "paid") {
      const { data: itin } = await supabase
        .from("catalog_itineraries")
        .select("title_en, title_pt, title_no, slug")
        .eq("id", purchase.itinerary_id)
        .single();
      return json({ status: "paid", itinerary: itin });
    }

    // Check Stripe session status
    const res = await fetch(`https://api.stripe.com/v1/checkout/sessions/${session_id}`, {
      headers: { Authorization: `Bearer ${STRIPE_KEY}` },
    });
    const session = await res.json();
    if (!res.ok) return json({ error: "Stripe error" }, 500);

    if (session.payment_status === "paid") {
      const expires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
      await supabase
        .from("catalog_purchases")
        .update({
          status: "paid",
          download_expires_at: expires,
          customer_name: session.customer_details?.name ?? null,
        })
        .eq("id", purchase.id);

      const { data: itin } = await supabase
        .from("catalog_itineraries")
        .select("title_en, title_pt, title_no, slug")
        .eq("id", purchase.itinerary_id)
        .single();

      return json({ status: "paid", itinerary: itin });
    }

    return json({ status: session.payment_status ?? "pending" });
  } catch (e) {
    console.error(e);
    return json({ error: String(e) }, 500);
  }
});
