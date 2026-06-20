import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { createStripeClient } from "../_shared/stripe.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

interface Body {
  itinerary_id: string;
  email: string;
  origin: string;
  language?: string;
  environment?: "sandbox" | "live";
}

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const body = (await req.json()) as Body;
    if (!body.itinerary_id || !body.email || !body.origin) {
      return json({ error: "Missing fields" }, 400);
    }
    const emailOk = /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(body.email);
    if (!emailOk) return json({ error: "Invalid email" }, 400);

    const supabase = createClient(SUPABASE_URL, SERVICE_ROLE);

    const { data: itin, error: itinErr } = await supabase
      .from("catalog_itineraries")
      .select(
        `id, slug, title_en, title_pt, title_no, summary_en, price_eur,
         hero_image_url, is_published, stripe_tax_code,
         stripe_product_id_sandbox, stripe_product_id_live`,
      )
      .eq("id", body.itinerary_id)
      .maybeSingle();

    if (itinErr || !itin || !itin.is_published) {
      return json({ error: "Itinerary not found" }, 404);
    }

    const lang = body.language ?? "en";
    const title =
      (lang === "pt" && itin.title_pt) ||
      (lang === "no" && itin.title_no) ||
      itin.title_en;

    const stripeEnv: "sandbox" | "live" =
      body.environment === "live" ? "live" : "sandbox";

    const { data: purchase, error: purchaseErr } = await supabase
      .from("catalog_purchases")
      .insert({
        itinerary_id: itin.id,
        customer_email: body.email,
        amount_total: itin.price_eur,
        currency: "EUR",
        status: "pending",
        stripe_environment: stripeEnv,
      })
      .select("id, download_token")
      .single();

    if (purchaseErr || !purchase) {
      console.error("purchase insert error", purchaseErr);
      return json({ error: "Could not create purchase" }, 500);
    }

    const successUrl = `${body.origin}/catalogue/success?token=${purchase.download_token}&session_id={CHECKOUT_SESSION_ID}`;
    const cancelUrl = `${body.origin}/catalogue/${itin.slug}?canceled=1`;

    const stripe = createStripeClient(stripeEnv);

    // Resolve (or lazily create) a Stripe Product for this itinerary so the
    // Stripe dashboard, receipts, and Stripe Tax see proper product metadata
    // instead of an ad-hoc line item.
    let productId =
      stripeEnv === "live"
        ? itin.stripe_product_id_live
        : itin.stripe_product_id_sandbox;

    if (!productId) {
      const created = await stripe.products.create({
        name: itin.title_en || title,
        ...(itin.summary_en ? { description: itin.summary_en } : {}),
        ...(itin.hero_image_url ? { images: [itin.hero_image_url] } : {}),
        tax_code: itin.stripe_tax_code || "txcd_10000000",
        metadata: { lovable_itinerary_id: itin.id, slug: itin.slug },
      });
      productId = created.id;
      const col =
        stripeEnv === "live"
          ? "stripe_product_id_live"
          : "stripe_product_id_sandbox";
      await supabase
        .from("catalog_itineraries")
        .update({ [col]: productId, stripe_synced_at: new Date().toISOString() })
        .eq("id", itin.id);
    }

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      success_url: successUrl,
      cancel_url: cancelUrl,
      customer_email: body.email,
      line_items: [
        {
          price_data: {
            currency: "eur",
            unit_amount: Math.round(Number(itin.price_eur) * 100),
            product: productId,
          },
          quantity: 1,
        },
      ],
      payment_intent_data: { description: title },
      metadata: {
        purchase_id: purchase.id,
        itinerary_id: itin.id,
        download_token: purchase.download_token,
      },
    });

    await supabase
      .from("catalog_purchases")
      .update({ stripe_session_id: session.id })
      .eq("id", purchase.id);

    return json({ url: session.url });
  } catch (e) {
    console.error("checkout error", e);
    return json({ error: String((e as Error).message ?? e) }, 500);
  }
});
