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
  currency?: string;
  environment?: "sandbox" | "live";
  /** Dynamic NOK-based pricing (new flow) */
  base_nok?: number;
  fx_rate?: number;
  amount_minor?: number;
}

const ALLOWED_CURRENCIES = ["usd", "eur", "brl", "nok"] as const;
type CurrencyCode = (typeof ALLOWED_CURRENCIES)[number];
const PRICE_COLUMN: Record<CurrencyCode, "price_usd" | "price_eur" | "price_brl" | "price_nok"> = {
  usd: "price_usd",
  eur: "price_eur",
  brl: "price_brl",
  nok: "price_nok",
};

const MINOR_PRECISION: Record<CurrencyCode, number> = { usd: 2, eur: 2, brl: 2, nok: 0 };

/** Live NOK-base rates, server-side, used to sanity-check the client amount. */
async function fetchNokRates(): Promise<Record<string, number> | null> {
  try {
    const r = await fetch(
      "https://api.frankfurter.dev/v1/latest?base=NOK&symbols=BRL,EUR,USD",
    );
    if (!r.ok) throw new Error("fx");
    const data = (await r.json()) as { rates?: Record<string, number> };
    if (!data?.rates?.["USD"]) throw new Error("fx");
    return { NOK: 1, ...data.rates };
  } catch {
    try {
      const r = await fetch("https://open.er-api.com/v6/latest/NOK");
      if (!r.ok) throw new Error("fx");
      const data = (await r.json()) as { rates?: Record<string, number> };
      if (!data?.rates?.["USD"]) throw new Error("fx");
      return { NOK: 1, BRL: data.rates["BRL"]!, EUR: data.rates["EUR"]!, USD: data.rates["USD"]! };
    } catch {
      return null;
    }
  }
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
        `id, slug, title_en, title_pt, title_no, summary_en,
         price_eur, price_usd, price_brl, price_nok,
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

    // Resolve currency + amount server-side. Never trust a client-sent amount.
    const requested = (body.currency ?? "eur").toLowerCase();
    let currency: CurrencyCode = ALLOWED_CURRENCIES.includes(requested as CurrencyCode)
      ? (requested as CurrencyCode)
      : "eur";
    if (currency !== (requested as CurrencyCode)) {
      console.warn(`Invalid currency '${requested}', falling back to EUR`);
    }
    let amount = Number(itin[PRICE_COLUMN[currency]] ?? 0);
    if (!Number.isFinite(amount) || amount <= 0) {
      console.warn(
        `Missing/invalid price for currency '${currency}' on itinerary ${itin.id}; falling back to EUR`,
      );
      currency = "eur";
      amount = Number(itin.price_eur ?? 0);
    }
    if (!Number.isFinite(amount) || amount <= 0) {
      return json({ error: "Itinerary has no valid price" }, 500);
    }

    const { data: purchase, error: purchaseErr } = await supabase
      .from("catalog_purchases")
      .insert({
        itinerary_id: itin.id,
        customer_email: body.email,
        amount_total: amount,
        currency: currency.toUpperCase(),
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
            currency,
            unit_amount: Math.round(amount * 100),
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
