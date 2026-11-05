import { useState } from "react";
import { createFileRoute, useSearch } from "@tanstack/react-router";

// Branded one-click unsubscribe page. The email footer links here with a
// token; the page validates it against /email/unsubscribe and confirms.

export const Route = createFileRoute("/unsubscribe")({
  validateSearch: (search: Record<string, unknown>) => ({
    token: typeof search.token === "string" ? search.token : "",
  }),
  head: () => ({
    meta: [
      { title: "Unsubscribe | Fjord & Waves Travel" },
      {
        name: "description",
        content: "Stop receiving automatic notifications from Fjord & Waves Travel.",
      },
      { property: "og:title", content: "Unsubscribe | Fjord & Waves Travel" },
      {
        property: "og:description",
        content: "Stop receiving automatic notifications from Fjord & Waves Travel.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
});

function UnsubscribeInner() {
  const { token } = useSearch({ from: "/unsubscribe" });
  const [state, setState] = useState<"checking" | "confirm" | "done" | "already" | "invalid" | "error">(
    token ? "checking" : "invalid",
  );

  useState(() => {
    if (!token) return;
    fetch(`/email/unsubscribe?token=${encodeURIComponent(token)}`)
      .then(async (res) => {
        const data = await res.json().catch(() => ({}));
        if (res.ok && data.valid) setState("confirm");
        else if (data.reason === "already_unsubscribed") setState("already");
        else setState("invalid");
      })
      .catch(() => setState("error"));
  });

  async function confirm() {
    try {
      const res = await fetch("/email/unsubscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.success) setState("done");
      else if (data.reason === "already_unsubscribed") setState("already");
      else setState("error");
    } catch {
      setState("error");
    }
  }

  const card =
    "mx-auto max-w-md rounded-lg border border-parchment-3 bg-voyage-white p-10 text-center";
  const btn =
    "mt-6 w-full rounded-sm bg-gold px-7 py-3.5 text-[0.72rem] font-semibold uppercase tracking-[0.16em] text-ink transition hover:bg-gold-2";

  return (
    <main className="flex min-h-[70vh] items-center bg-parchment px-6 py-24">
      <div className="w-full">
        {state === "checking" && (
          <div className={card}>
            <p className="text-ink-2">Checking your unsubscribe link…</p>
          </div>
        )}
        {state === "confirm" && (
          <div className={card}>
            <h1 className="font-serif text-3xl font-bold text-ink">Confirm unsubscribe</h1>
            <p className="mt-3 text-ink-2">
              This stops all automatic notifications from Fjord &amp; Waves Travel to this email
              address.
            </p>
            <button onClick={confirm} className={btn}>
              Confirm unsubscribe
            </button>
          </div>
        )}
        {state === "done" && (
          <div className={card}>
            <h1 className="font-serif text-3xl font-bold text-ink">You are unsubscribed</h1>
            <p className="mt-3 text-ink-2">
              You will no longer receive automatic notifications from Fjord &amp; Waves Travel.
            </p>
          </div>
        )}
        {state === "already" && (
          <div className={card}>
            <h1 className="font-serif text-3xl font-bold text-ink">Already unsubscribed</h1>
            <p className="mt-3 text-ink-2">This link has already been used.</p>
          </div>
        )}
        {(state === "invalid" || state === "error") && (
          <div className={card}>
            <h1 className="font-serif text-3xl font-bold text-ink">Link not valid</h1>
            <p className="mt-3 text-ink-2">
              This unsubscribe link is missing, invalid or expired. If you received an email from us
              recently, use the unsubscribe link inside that email.
            </p>
          </div>
        )}
      </div>
    </main>
  );
}

export default function UnsubscribePage() {
  return <UnsubscribeInner />;
}
