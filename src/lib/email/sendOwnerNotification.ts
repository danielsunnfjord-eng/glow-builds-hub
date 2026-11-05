import * as React from "react";
import { render } from "@react-email/render";
import { createClient } from "@supabase/supabase-js";
import { TEMPLATES } from "@/lib/email-templates/registry";

// Server-only helper: enqueues an app email for a template with a fixed
// recipient (e.g. the owner-notification templates). Used by public action
// routes that cannot supply a visitor JWT to /lovable/email/transactional/send.
// Mirrors the send route's suppression/token/log/enqueue steps.

const SITE_NAME = "Fjord & Waves Travel";
const SENDER_DOMAIN = "notify.fjordwavestravel.com";
const FROM_DOMAIN = "fjordwavestravel.com";

function redactEmail(email: string | null | undefined): string {
  if (!email) return "***";
  const [localPart, domain] = email.split("@");
  if (!localPart || !domain) return "***";
  return `${localPart[0]}***@${domain}`;
}

function generateToken(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export type NotifyResult = { sent: boolean; reason?: string };

export async function sendOwnerNotification(
  templateName: string,
  templateData: Record<string, unknown>,
  idempotencyKey: string,
): Promise<NotifyResult> {
  const supabaseUrl = import.meta.env["VITE_SUPABASE_URL"];
  const supabaseServiceKey = process.env["SUPABASE_SERVICE_ROLE_KEY"];
  if (!supabaseUrl || !supabaseServiceKey) {
    console.error("Owner notification: missing Supabase env vars");
    return { sent: false, reason: "not_configured" };
  }

  const template = TEMPLATES[templateName];
  if (!template) {
    console.error("Owner notification: template not registered", { templateName });
    return { sent: false, reason: "template_missing" };
  }
  // Fixed recipient only — this helper is not for per-visitor mail.
  const recipient = template.to;
  if (!recipient) {
    console.error("Owner notification: template has no fixed recipient", { templateName });
    return { sent: false, reason: "no_recipient" };
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  const normalizedEmail = recipient.toLowerCase();

  // Suppression list (fail-closed).
  const { data: suppressed, error: suppressionError } = await supabase
    .from("suppressed_emails")
    .select("id")
    .eq("email", normalizedEmail)
    .maybeSingle();
  if (suppressionError) {
    console.error("Owner notification: suppression check failed", {
      code: suppressionError.code,
      recipient_redacted: redactEmail(recipient),
    });
    return { sent: false, reason: "suppression_check_failed" };
  }
  if (suppressed) return { sent: false, reason: "suppressed" };

  // Get or create the unsubscribe token for the recipient.
  const { data: existingToken, error: tokenError } = await supabase
    .from("email_unsubscribe_tokens")
    .select("token, used_at")
    .eq("email", normalizedEmail)
    .maybeSingle();
  if (tokenError) {
    console.error("Owner notification: token lookup failed", { code: tokenError.code });
    return { sent: false, reason: "token_lookup_failed" };
  }
  let unsubscribeToken: string;
  if (existingToken && !existingToken.used_at) {
    unsubscribeToken = existingToken.token;
  } else if (!existingToken) {
    unsubscribeToken = generateToken();
    const { error: insertError } = await supabase
      .from("email_unsubscribe_tokens")
      .upsert(
        { token: unsubscribeToken, email: normalizedEmail },
        { onConflict: "email", ignoreDuplicates: true },
      );
    if (insertError) {
      console.error("Owner notification: token upsert failed", { code: insertError.code });
      return { sent: false, reason: "token_upsert_failed" };
    }
    const { data: stored } = await supabase
      .from("email_unsubscribe_tokens")
      .select("token")
      .eq("email", normalizedEmail)
      .maybeSingle();
    if (!stored) return { sent: false, reason: "token_readback_failed" };
    unsubscribeToken = stored.token;
  } else {
    console.warn("Owner notification: unsubscribe token already used but not suppressed", {
      recipient_redacted: redactEmail(recipient),
    });
    return { sent: false, reason: "unsubscribed" };
  }

  const element = React.createElement(template.component, templateData);
  const html = await render(element);
  const plainText = await render(element, { plainText: true });
  const resolvedSubject =
    typeof template.subject === "function" ? template.subject(templateData) : template.subject;

  const messageId = crypto.randomUUID();
  await supabase.from("email_send_log").insert({
    message_id: messageId,
    template_name: templateName,
    recipient_email: recipient,
    status: "pending",
  });

  const { error: enqueueError } = await supabase.rpc("enqueue_email" as never, {
    queue_name: "transactional_emails",
    payload: {
      message_id: messageId,
      to: recipient,
      from: `${SITE_NAME} <noreply@${FROM_DOMAIN}>`,
      sender_domain: SENDER_DOMAIN,
      subject: resolvedSubject,
      html,
      text: plainText,
      purpose: "transactional",
      label: templateName,
      idempotency_key: idempotencyKey,
      unsubscribe_token: unsubscribeToken,
      queued_at: new Date().toISOString(),
    },
  } as never);

  if (enqueueError) {
    console.error("Owner notification: enqueue failed", {
      code: enqueueError.code,
      message: enqueueError.message,
      recipient_redacted: redactEmail(recipient),
    });
    await supabase.from("email_send_log").insert({
      message_id: messageId,
      template_name: templateName,
      recipient_email: recipient,
      status: "failed",
      error_message: "Failed to enqueue email",
    });
    return { sent: false, reason: "enqueue_failed" };
  }

  console.log("Owner notification enqueued", {
    templateName,
    recipient_redacted: redactEmail(recipient),
  });
  return { sent: true };
}
