import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Seo from "@/components/Seo";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string;

type State = "loading" | "valid" | "already" | "invalid" | "submitting" | "done" | "error";

export default function Unsubscribe() {
  const [params] = useSearchParams();
  const token = params.get("token");
  const [state, setState] = useState<State>("loading");
  const [errorMsg, setErrorMsg] = useState<string>("");

  useEffect(() => {
    if (!token) {
      setState("invalid");
      return;
    }
    (async () => {
      try {
        const res = await fetch(
          `${SUPABASE_URL}/functions/v1/handle-email-unsubscribe?token=${encodeURIComponent(token)}`,
          { headers: { apikey: SUPABASE_ANON_KEY } }
        );
        const data = await res.json();
        if (data.valid) setState("valid");
        else if (data.reason === "already_unsubscribed") setState("already");
        else setState("invalid");
      } catch {
        setState("invalid");
      }
    })();
  }, [token]);

  const handleConfirm = async () => {
    if (!token) return;
    setState("submitting");
    try {
      const { data, error } = await supabase.functions.invoke("handle-email-unsubscribe", {
        body: { token },
      });
      if (error) throw error;
      if (data?.success) setState("done");
      else if (data?.reason === "already_unsubscribed") setState("already");
      else throw new Error("Unexpected response");
    } catch (e: any) {
      setErrorMsg(e?.message || "Something went wrong.");
      setState("error");
    }
  };

  return (
    <main className="min-h-screen bg-parchment flex items-center justify-center px-6 py-16">
      <div className="max-w-md w-full bg-white border border-gold/20 rounded-sm p-10 text-center">
        <h1 className="text-2xl font-serif text-ink mb-4">Email preferences</h1>

        {state === "loading" && <p className="text-ink/70">Checking your link…</p>}

        {state === "valid" && (
          <>
            <p className="text-ink/80 mb-6">
              Click below to unsubscribe from emails sent by Fjord &amp; Waves Travel.
            </p>
            <button
              onClick={handleConfirm}
              className="px-6 py-3 bg-ink text-parchment text-xs uppercase tracking-[0.15em] hover:bg-ink/90 transition-colors"
            >
              Confirm unsubscribe
            </button>
          </>
        )}

        {state === "submitting" && <p className="text-ink/70">Processing…</p>}

        {state === "done" && (
          <p className="text-ink/80">
            You've been unsubscribed. We won't send you any further emails.
          </p>
        )}

        {state === "already" && (
          <p className="text-ink/80">This email is already unsubscribed.</p>
        )}

        {state === "invalid" && (
          <p className="text-ink/80">This unsubscribe link is invalid or expired.</p>
        )}

        {state === "error" && (
          <p className="text-red-700">{errorMsg}</p>
        )}
      </div>
    </main>
  );
}
