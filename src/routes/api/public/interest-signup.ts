import { createClient } from "@supabase/supabase-js";
import { createFileRoute } from "@tanstack/react-router";
import { THEME_TRIPS } from "@/lib/themeTrips";
import { sendOwnerNotification } from "@/lib/email/sendOwnerNotification";
import { interestSignupSchema } from "@/lib/interestSignup";

// Public action route for the Theme Travels interest form: validates the
// submission, stores it in interest_signups and emails the owner. No site
// auth — the handler verifies and sanitises everything itself.

export const Route = createFileRoute("/api/public/interest-signup")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const supabaseUrl = import.meta.env["VITE_SUPABASE_URL"];
        const supabaseServiceKey = process.env["SUPABASE_SERVICE_ROLE_KEY"];
        if (!supabaseUrl || !supabaseServiceKey) {
          console.error("Interest signup: missing Supabase env vars");
          return Response.json({ error: "Server configuration error" }, { status: 500 });
        }

        let body: unknown;
        try {
          body = await request.json();
        } catch {
          return Response.json({ error: "Invalid JSON" }, { status: 400 });
        }

        const parsed = interestSignupSchema.safeParse(body);
        if (!parsed.success) {
          return Response.json({ error: "Missing or invalid fields" }, { status: 400 });
        }
        const { trip: tripSlug, period, name, email, message, locale, phone, number_of_people, audience, consent } = parsed.data;

        const supabase = createClient(supabaseUrl, supabaseServiceKey);
        const { data, error } = await supabase
          .from("interest_signups")
          .insert({ trip: tripSlug, period, name, email, message: message || null, locale,
            phone: phone || null, number_of_people, audience, consent, consent_at: new Date().toISOString() })
          .select("id")
          .single();
        if (error || !data) {
          console.error("Interest signup: insert failed", {
            code: error?.code,
            message: error?.message,
          });
          return Response.json({ error: "Could not save signup" }, { status: 500 });
        }

        // Owner notification — a failure here must not fail the visitor's signup.
        const tripTitle = THEME_TRIPS.find((t) => t.slug === tripSlug)?.copy[
          locale === "no" || locale === "pt" ? locale : "en"
        ]?.title ?? tripSlug;
        try {
        const notify = await sendOwnerNotification(
          "interest-signup-notify",
          { trip: tripTitle, period, name, email, phone: phone || "", number_of_people, audience, consent, message: message ?? "", locale },
          `interest-signup-notify-${data.id}`,
        );
        if (!notify.sent) {
          console.warn("Interest signup: owner notification not sent", { reason: notify.reason });
        }
        } catch {
          console.warn("Interest signup: notification failed after signup was saved");
        }

        return Response.json({ ok: true });
      },
    },
  },
});
