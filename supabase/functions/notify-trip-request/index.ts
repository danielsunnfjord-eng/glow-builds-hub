import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const payload = await req.json();

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    const idempotencyKey = `trip-request-${payload.clientEmail || 'unknown'}-${Date.now()}`;
    const messageId = crypto.randomUUID();

    // Enqueue directly to the transactional_emails pgmq queue, bypassing
    // the send-transactional-email gateway (which requires a JWT-format key).
    // The process-email-queue dispatcher will pick this up and send it.
    const queuePayload = {
      message_id: messageId,
      template_name: "trip-request-notification",
      recipient_email: "daniel.lirafigueiredo@fora.travel",
      idempotency_key: idempotencyKey,
      template_data: payload,
      purpose: "transactional",
      enqueued_at: new Date().toISOString(),
    };

    const { error: enqueueError } = await supabase.rpc("enqueue_email", {
      queue_name: "transactional_emails",
      payload: queuePayload,
    });

    if (enqueueError) {
      console.error("enqueue_email error:", enqueueError);
      return new Response(JSON.stringify({ error: enqueueError.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Log the pending send so process-email-queue can correlate it.
    await supabase.from("email_send_log").insert({
      message_id: messageId,
      template_name: "trip-request-notification",
      recipient_email: "daniel.lirafigueiredo@fora.travel",
      idempotency_key: idempotencyKey,
      status: "pending",
    });

    return new Response(JSON.stringify({ success: true, messageId }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("notify-trip-request error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
