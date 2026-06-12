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

    const successUrl = `${body.origin}/catalogue/success?token=${purchase.download_token}&session_id={CHECKOUT_SESSION_ID}`;
    const cancelUrl = `${body.origin}/catalogue/${itin.slug}?canceled=1`;

    const stripe = createStripeClient("sandbox");

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
            product_data: {
              name: title,
              ...(itin.hero_image_url ? { images: [itin.hero_image_url] } : {}),
            },
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
