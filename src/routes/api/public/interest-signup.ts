import { createClient } from "@supabase/supabase-js";
import { createFileRoute } from "@tanstack/react-router";
import { THEME_TRIPS } from "@/lib/themeTrips";
import { sendOwnerNotification } from "@/lib/email/sendOwnerNotification";

// Public action route for the Theme Travels interest form: validates the
// submission, stores it in interest_signups and emails the owner. No site
// auth — the handler verifies and sanitises everything itself.

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const MAX_LEN = { name: 120, email: 200, period: 120, trip: 120, message: 2000, locale: 8 };

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

        let body: Record<string, unknown>;
        try {
          body = await request.json();
        } catch {
          return Response.json({ error: "Invalid JSON" }, { status: 400 });
        }

        const str = (v: unknown) => (typeof v === "string" ? v.trim() : "");
        const tripSlug = str(body.trip).slice(0, MAX_LEN.trip);
        const period = str(body.period).slice(0, MAX_LEN.period);
        const name = str(body.name).slice(0, MAX_LEN.name);
        const email = str(body.email).slice(0, MAX_LEN.email);
        const message = str(body.message).slice(0, MAX_LEN.message) || null;
        const locale = str(body.locale).slice(0, MAX_LEN.locale) || "en";

        if (!tripSlug || !period || !name || !EMAIL_RE.test(email)) {
          return Response.json({ error: "Missing or invalid fields" }, { status: 400 });
        }
        if (!THEME_TRIPS.some((t) => t.slug === tripSlug)) {
          return Response.json({ error: "Unknown trip" }, { status: 400 });
        }

        const supabase = createClient(supabaseUrl, supabaseServiceKey);
        const { data, error } = await supabase
          .from("interest_signups")
          .insert({ trip: tripSlug, period, name, email, message, locale })
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
        const notify = await sendOwnerNotification(
          "interest-signup-notify",
          { trip: tripTitle, period, name, email, message: message ?? "", locale },
          `interest-signup-notify-${data.id}`,
        );
        if (!notify.sent) {
          console.warn("Interest signup: owner notification not sent", { reason: notify.reason });
        }

        return Response.json({ ok: true });
      },
    },
  },
});
