import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const STRIPE_KEY = Deno.env.get("STRIPE_SANDBOX_API_KEY")!;
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

interface Body {
  itinerary_id: string;
  email: string;
  origin: string;
  language?: string;
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
      .select("id, slug, title_en, title_pt, title_no, price_eur, hero_image_url, is_published")
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

    // Create pending purchase row to get the download_token
    const { data: purchase, error: purchaseErr } = await supabase
      .from("catalog_purchases")
      .insert({
        itinerary_id: itin.id,
        customer_email: body.email,
        amount_total: itin.price_eur,
        currency: "EUR",
        status: "pending",
      })
      .select("id, download_token")
      .single();

    if (purchaseErr || !purchase) {
      console.error("purchase insert error", purchaseErr);
      return json({ error: "Could not create purchase" }, 500);
    }

    const successUrl = `${body.origin}/itineraries-shop/success?token=${purchase.download_token}&session_id={CHECKOUT_SESSION_ID}`;
    const cancelUrl = `${body.origin}/itineraries-shop/${itin.slug}?canceled=1`;

    // Build Stripe Checkout session
    const params = new URLSearchParams();
    params.append("mode", "payment");
    params.append("success_url", successUrl);
    params.append("cancel_url", cancelUrl);
    params.append("customer_email", body.email);
    params.append("line_items[0][price_data][currency]", "eur");
    params.append("line_items[0][price_data][product_data][name]", title);
    params.append(
      "line_items[0][price_data][unit_amount]",
      String(Math.round(Number(itin.price_eur) * 100)),
    );
    if (itin.hero_image_url) {
      params.append(
        "line_items[0][price_data][product_data][images][0]",
        itin.hero_image_url,
      );
    }
    params.append("line_items[0][quantity]", "1");
    params.append("automatic_tax[enabled]", "true");
    params.append("metadata[purchase_id]", purchase.id);
    params.append("metadata[itinerary_id]", itin.id);
    params.append("metadata[download_token]", purchase.download_token);

    const stripeRes = await fetch("https://api.stripe.com/v1/checkout/sessions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${STRIPE_KEY}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: params.toString(),
    });

    const session = await stripeRes.json();
    if (!stripeRes.ok) {
      console.error("Stripe error", session);
      return json({ error: session?.error?.message ?? "Stripe error" }, 500);
    }

    await supabase
      .from("catalog_purchases")
      .update({ stripe_session_id: session.id })
      .eq("id", purchase.id);

    return json({ url: session.url });
  } catch (e) {
    console.error(e);
    return json({ error: String(e) }, 500);
  }
});
