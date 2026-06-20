// Mirrors published catalog itineraries as real Stripe Products.
// Idempotent: creates a Product if one doesn't exist yet for the current
// environment (sandbox/live), otherwise updates it.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { type StripeEnv, createStripeClient } from "../_shared/stripe.ts";

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

interface Body {
  itinerary_id?: string; // sync a single itinerary; omit to sync all published
  environment?: StripeEnv; // defaults to 'sandbox'
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const body = (await req.json().catch(() => ({}))) as Body;
    const env: StripeEnv = body.environment === "live" ? "live" : "sandbox";
    const supabase = createClient(SUPABASE_URL, SERVICE_ROLE);
    const stripe = createStripeClient(env);

    const idColumn = env === "live" ? "stripe_product_id_live" : "stripe_product_id_sandbox";

    let query = supabase
      .from("catalog_itineraries")
      .select(
        `id, slug, title_en, subtitle_en, hero_image_url, stripe_tax_code,
         stripe_product_id_sandbox, stripe_product_id_live, is_published`,
      );

    if (body.itinerary_id) {
      query = query.eq("id", body.itinerary_id);
    } else {
      query = query.eq("is_published", true);
    }

    const { data: itineraries, error } = await query;
    if (error) throw error;
    if (!itineraries || itineraries.length === 0) {
      return json({ synced: 0, results: [] });
    }

    const results: Array<{ id: string; product_id: string; action: string }> = [];

    for (const itin of itineraries) {
      const name = itin.title_en || `Itinerary ${itin.slug}`;
      const description = itin.subtitle_en || undefined;
      const images = itin.hero_image_url ? [itin.hero_image_url] : undefined;
      const taxCode = itin.stripe_tax_code || "txcd_10000000";
      const existingId = (itin as any)[idColumn] as string | null;

      let productId: string;
      let action: string;

      if (existingId) {
        try {
          await stripe.products.update(existingId, {
            name,
            ...(description ? { description } : {}),
            ...(images ? { images } : {}),
            tax_code: taxCode,
            metadata: { lovable_itinerary_id: itin.id, slug: itin.slug },
          });
          productId = existingId;
          action = "updated";
        } catch (e) {
          console.warn("update failed, recreating", existingId, e);
          const created = await stripe.products.create({
            name,
            ...(description ? { description } : {}),
            ...(images ? { images } : {}),
            tax_code: taxCode,
            metadata: { lovable_itinerary_id: itin.id, slug: itin.slug },
          });
          productId = created.id;
          action = "recreated";
        }
      } else {
        const created = await stripe.products.create({
          name,
          ...(description ? { description } : {}),
          ...(images ? { images } : {}),
          tax_code: taxCode,
          metadata: { lovable_itinerary_id: itin.id, slug: itin.slug },
        });
        productId = created.id;
        action = "created";
      }

      await supabase
        .from("catalog_itineraries")
        .update({
          [idColumn]: productId,
          stripe_synced_at: new Date().toISOString(),
        })
        .eq("id", itin.id);

      results.push({ id: itin.id, product_id: productId, action });
    }

    return json({ synced: results.length, environment: env, results });
  } catch (e) {
    console.error("sync error", e);
    return json({ error: String((e as Error).message ?? e) }, 500);
  }
});
