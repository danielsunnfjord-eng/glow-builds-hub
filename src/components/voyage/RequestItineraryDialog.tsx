import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import ItineraryEditor from "./ItineraryEditor";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, Sparkles } from "lucide-react";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  request: any | null;
  onSaved?: () => void;
}

const RequestItineraryDialog = ({ open, onOpenChange, request, onSaved }: Props) => {
  const [phase, setPhase] = useState<"idle" | "generating" | "ready" | "saving">("idle");
  const [content, setContent] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open || !request) return;
    setError(null);
    setContent("");
    setPhase("generating");
    (async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
        const anonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
        const res = await fetch(
          `https://${projectId}.supabase.co/functions/v1/generate-itinerary-claude`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              apikey: anonKey,
              Authorization: `Bearer ${session?.access_token ?? anonKey}`,
            },
            body: JSON.stringify({ request }),
          },
        );
        if (!res.ok || !res.body) {
          const txt = await res.text();
          throw new Error(txt || `Request failed (${res.status})`);
        }
        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let acc = "";
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          acc += decoder.decode(value, { stream: true });
          setContent(acc);
        }
        if (!acc) throw new Error("Empty response from AI");
        setPhase("ready");
      } catch (e: any) {
        setError(e?.message || "Failed to generate itinerary");
        setPhase("idle");
      }
    })();
  }, [open, request]);

  const handleSave = async () => {
    if (!request) return;
    setPhase("saving");
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const adults = request.adults || request.group_size || 1;
      const childrenCount = request.children_count || 0;

      const payload: any = {
        user_id: user.id,
        client_name: request.client_name || "Unnamed client",
        client_email: request.client_email || null,
        group_size: adults + childrenCount,
        destination: request.destination || null,
        departure: request.departure || null,
        trip_duration: request.trip_duration || null,
        start_date: request.start_date || null,
        end_date: request.end_date || null,
        estimated_budget: request.estimated_budget || null,
        currency: "EUR",
        itinerary_status: "in_progress",
        payment_status: "pending",
        itinerary_content: content,
        notes: request.notes || null,
      };

      const { error: insertErr } = await supabase.from("client_projects").insert(payload);
      if (insertErr) throw insertErr;

      const { error: updErr } = await supabase
        .from("trip_requests" as any)
        .update({ status: "converted" } as any)
        .eq("id", request.id);
      if (updErr) throw updErr;

      toast.success("Project saved");
      onSaved?.();
      onOpenChange(false);
    } catch (e: any) {
      toast.error(e?.message || "Failed to save");
      setPhase("ready");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl w-[95vw] max-h-[92vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="font-serif text-xl flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-gold" />
            AI-Generated Itinerary {request?.client_name ? `· ${request.client_name}` : ""}
          </DialogTitle>
          <DialogDescription>
            Review and edit freely. Click <strong>Save as Project</strong> to create the project record and mark the request as converted.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-auto border border-parchment-3 rounded-md bg-voyage-white min-h-[360px]">
          {phase === "generating" && (
            <div className="flex flex-col items-center justify-center h-full py-20 text-voyage-muted">
              <Loader2 className="w-6 h-6 animate-spin mb-3" />
              <p className="text-sm">Claude is crafting the itinerary…</p>
            </div>
          )}
          {error && (
            <div className="p-6 text-sm text-destructive">
              {error}
            </div>
          )}
          {(phase === "ready" || phase === "saving") && (
            <ItineraryEditor content={content} onContentChange={setContent} />
          )}
        </div>

        <div className="flex justify-end gap-2 pt-3">
          <button
            onClick={() => onOpenChange(false)}
            className="px-4 py-2 rounded-sm border border-parchment-3 text-[0.72rem] font-medium tracking-[0.08em] uppercase text-voyage-muted hover:border-ink hover:text-ink transition-all"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={phase !== "ready" || !content.trim()}
            className="px-5 py-2 rounded-sm bg-gold text-ink text-[0.72rem] font-semibold tracking-[0.1em] uppercase hover:bg-gold-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-2"
          >
            {phase === "saving" && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            Save as Project
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default RequestItineraryDialog;
