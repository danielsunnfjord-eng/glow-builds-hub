import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { createStripeClient } from "../_shared/stripe.ts";

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
    const { token, session_id } = await req.json();
    if (!token || !session_id) return json({ error: "Missing fields" }, 400);

    const supabase = createClient(SUPABASE_URL, SERVICE_ROLE);

    const { data: purchase } = await supabase
      .from("catalog_purchases")
      .select("id, status, itinerary_id, stripe_session_id, customer_email, amount_total, currency, stripe_environment")
      .eq("download_token", token)
      .maybeSingle();

    if (!purchase) return json({ error: "Not found" }, 404);
    if (purchase.stripe_session_id !== session_id) {
      return json({ error: "Mismatched session" }, 400);
    }

    const fetchItin = () =>
      supabase
        .from("catalog_itineraries")
        .select("title_en, title_pt, title_no, slug, pdf_path")
        .eq("id", purchase.itinerary_id)
        .single();

    if (purchase.status === "paid") {
      const { data: itin } = await fetchItin();
      return json({ status: "paid", itinerary: itin });
    }

    const stripeEnv: "sandbox" | "live" =
      purchase.stripe_environment === "live" ? "live" : "sandbox";
    const stripe = createStripeClient(stripeEnv);
    const session = await stripe.checkout.sessions.retrieve(session_id);

    if (session.payment_status === "paid") {
      const expires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
      const customerName = session.customer_details?.name ?? null;
      await supabase
        .from("catalog_purchases")
        .update({
          status: "paid",
          download_expires_at: expires,
          customer_name: customerName,
        })
        .eq("id", purchase.id);

      const { data: itin } = await fetchItin();

      // Send confirmation email with a durable download link that always
      // resolves a fresh signed URL (works even if pdf_path is attached later).
      try {
        const title = itin?.title_en ?? "your itinerary";
        const downloadUrl = `${SUPABASE_URL}/functions/v1/download-catalog-pdf?token=${encodeURIComponent(token)}`;

        await supabase.functions.invoke("send-transactional-email", {
          body: {
            templateName: "catalog-purchase-confirmation",
            recipientEmail: purchase.customer_email,
            idempotencyKey: `catalog-purchase-${purchase.id}`,
            templateData: {
              customerName,
              itineraryTitle: title,
              downloadUrl,
              amount: purchase.amount_total ? String(purchase.amount_total) : undefined,
              currency: purchase.currency ?? "EUR",
            },
          },
        });
      } catch (mailErr) {
        console.error("send confirmation email failed", mailErr);
      }

      // Internal sale notification to Daniel
      try {
        await supabase.functions.invoke("send-transactional-email", {
          body: {
            templateName: "catalog-sale-notification",
            idempotencyKey: `catalog-sale-notify-${purchase.id}`,
            templateData: {
              customerName,
              customerEmail: purchase.customer_email,
              itineraryTitle: itin?.title_en ?? "(unknown)",
              itinerarySlug: itin?.slug,
              amount: purchase.amount_total ? String(purchase.amount_total) : undefined,
              currency: purchase.currency ?? "EUR",
              purchasedAt: new Date().toISOString(),
            },
          },
        });
      } catch (notifyErr) {
        console.error("send internal sale notification failed", notifyErr);
      }

      return json({ status: "paid", itinerary: itin });
    }

    return json({ status: session.payment_status ?? "pending" });
  } catch (e) {
    console.error("verify error", e);
    return json({ error: String((e as Error).message ?? e) }, 500);
  }
});
