import { useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { ROUTE_MAKER_STEPS } from "./prompts";

interface RouteMakerRow {
  id: string;
  user_id: string;
  title: string;
  status: string;
  brief_text: string;
  brief_analysis: unknown;
  route: unknown;
  days: unknown;
  experiences: unknown;
  accommodations: unknown;
  logistics: unknown;
  quality: unknown;
  sales_copy: unknown;
  seo: unknown;
  pdf_intro: string | null;
  packing: unknown;
  upsell: string | null;
  budget: unknown;
  route_approved_at: string | null;
  created_at: string;
  updated_at: string;
}

const COLUMN_FOR_STEP: Record<string, keyof RouteMakerRow> = {
  brief: "brief_analysis",
  route: "route",
  days: "days",
  experiences: "experiences",
  accommodations: "accommodations",
  logistics: "logistics",
  quality: "quality",
  sales: "sales_copy",
  seo: "seo",
  pdf_intro: "pdf_intro",
  packing: "packing",
  upsell: "upsell",
  budget: "budget",
};

const RouteMaker = () => {
  const qc = useQueryClient();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [runningStep, setRunningStep] = useState<string | null>(null);

  const { data: itineraries = [] } = useQuery({
    queryKey: ["route-maker-list"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("route_maker_itineraries")
        .select("id,title,status,updated_at")
        .order("updated_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const { data: current } = useQuery({
    queryKey: ["route-maker-row", selectedId],
    enabled: !!selectedId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("route_maker_itineraries")
        .select("*")
        .eq("id", selectedId!)
        .maybeSingle();
      if (error) throw error;
      return data as RouteMakerRow | null;
    },
  });

  // Local editable mirrors for fields we save explicitly.
  const [title, setTitle] = useState("");
  const [brief, setBrief] = useState("");
  useEffect(() => {
    if (current) {
      setTitle(current.title);
      setBrief(current.brief_text);
    }
  }, [current?.id]);

  const createNew = async () => {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) {
      toast.error("Please sign in.");
      return;
    }
    const { data, error } = await supabase
      .from("route_maker_itineraries")
      .insert({ user_id: userData.user.id, title: "Untitled route", brief_text: "" })
      .select("id")
      .single();
    if (error) {
      toast.error(error.message);
      return;
    }
    qc.invalidateQueries({ queryKey: ["route-maker-list"] });
    setSelectedId(data.id);
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this itinerary? This cannot be undone.")) return;
    const { error } = await supabase.from("route_maker_itineraries").delete().eq("id", id);
    if (error) return toast.error(error.message);
    if (selectedId === id) setSelectedId(null);
    qc.invalidateQueries({ queryKey: ["route-maker-list"] });
  };

  const saveMeta = async () => {
    if (!current) return;
    const { error } = await supabase
      .from("route_maker_itineraries")
      .update({ title, brief_text: brief })
      .eq("id", current.id);
    if (error) return toast.error(error.message);
    toast.success("Saved");
    qc.invalidateQueries({ queryKey: ["route-maker-list"] });
    qc.invalidateQueries({ queryKey: ["route-maker-row", current.id] });
  };

  const runStep = async (stepId: string) => {
    if (!current) return;
    // Always persist brief/title before running so the edge function reads fresh data.
    if (title !== current.title || brief !== current.brief_text) {
      await supabase
        .from("route_maker_itineraries")
        .update({ title, brief_text: brief })
        .eq("id", current.id);
    }
    setRunningStep(stepId);
    try {
      const { data, error } = await supabase.functions.invoke("route-maker-step", {
        body: { itinerary_id: current.id, step: stepId },
      });
      if (error) throw error;
      if ((data as { error?: string })?.error) throw new Error((data as { error: string }).error);
      toast.success(`${stepId} generated`);
      qc.invalidateQueries({ queryKey: ["route-maker-row", current.id] });
      qc.invalidateQueries({ queryKey: ["route-maker-list"] });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Step failed");
    } finally {
      setRunningStep(null);
    }
  };

  const approveRoute = async () => {
    if (!current) return;
    const { error } = await supabase
      .from("route_maker_itineraries")
      .update({ route_approved_at: new Date().toISOString(), status: "route_approved" })
      .eq("id", current.id);
    if (error) return toast.error(error.message);
    toast.success("Route approved — you can now generate the day-by-day.");
    qc.invalidateQueries({ queryKey: ["route-maker-row", current.id] });
  };

  // Group steps by step number for the staged UI
  const stepGroups = useMemo(() => {
    const groups = new Map<number, typeof ROUTE_MAKER_STEPS[number][]>();
    for (const s of ROUTE_MAKER_STEPS) {
      const arr = groups.get(s.step) ?? [];
      arr.push(s);
      groups.set(s.step, arr);
    }
    return Array.from(groups.entries()).sort(([a], [b]) => a - b);
  }, []);

  const routeApproved = !!current?.route_approved_at;

  return (
    <div>
      <div className="mb-8 flex items-start justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl font-bold mb-1">Route Maker</h1>
          <p className="text-[0.85rem] text-voyage-muted">
            AI-assisted, staged itinerary production. Each step runs on demand — nothing is auto-chained.
          </p>
        </div>
        <Button onClick={createNew}>+ New itinerary</Button>
      </div>

      <div className="grid grid-cols-12 gap-6">
        {/* List */}
        <aside className="col-span-12 md:col-span-3">
          <div className="text-[0.7rem] font-semibold tracking-[0.1em] uppercase text-voyage-muted mb-2">
            Itineraries
          </div>
          <div className="border border-parchment-3 rounded-md bg-voyage-white divide-y divide-parchment-3">
            {itineraries.length === 0 && (
              <div className="p-4 text-sm text-voyage-muted">No itineraries yet.</div>
            )}
            {itineraries.map((it) => (
              <button
                key={it.id}
                onClick={() => setSelectedId(it.id)}
                className={`w-full text-left p-3 hover:bg-parchment/60 transition ${
                  selectedId === it.id ? "bg-parchment/80" : ""
                }`}
              >
                <div className="text-sm font-medium text-ink truncate">{it.title}</div>
                <div className="text-[0.7rem] text-voyage-muted mt-0.5">
                  {it.status} · {new Date(it.updated_at).toLocaleDateString()}
                </div>
              </button>
            ))}
          </div>
        </aside>

        {/* Editor */}
        <section className="col-span-12 md:col-span-9">
          {!current ? (
            <div className="border border-dashed border-parchment-3 rounded-lg p-16 text-center bg-parchment/40">
              <div className="text-4xl mb-4">🗺</div>
              <p className="text-sm text-voyage-muted">
                Select an itinerary on the left, or create a new one to start.
              </p>
            </div>
          ) : (
            <div className="space-y-8">
              {/* Brief */}
              <div className="border border-parchment-3 rounded-md bg-voyage-white p-5">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="font-serif text-lg">Brief</h2>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={saveMeta}>Save</Button>
                    <Button variant="ghost" size="sm" onClick={() => remove(current.id)}>Delete</Button>
                  </div>
                </div>
                <div className="space-y-3">
                  <div>
                    <Label className="text-xs">Title (internal)</Label>
                    <Input value={title} onChange={(e) => setTitle(e.target.value)} />
                  </div>
                  <div>
                    <Label className="text-xs">Travel brief</Label>
                    <Textarea
                      rows={6}
                      value={brief}
                      onChange={(e) => setBrief(e.target.value)}
                      placeholder="Describe the trip: travelers, destinations, length, season, style, constraints, must-haves…"
                    />
                  </div>
                </div>
              </div>

              {/* Staged steps */}
              {stepGroups.map(([stepNum, steps]) => {
                const isStep3Plus = stepNum >= 3;
                const blocked = isStep3Plus && !routeApproved;
                return (
                  <div key={stepNum} className="border border-parchment-3 rounded-md bg-voyage-white p-5">
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="font-serif text-lg">
                        Step {stepNum}
                        {stepNum === 1 && " — Analyze brief"}
                        {stepNum === 2 && " — Generate route"}
                        {stepNum === 3 && " — Day-by-day"}
                        {stepNum === 4 && " — Enrich"}
                        {stepNum === 5 && " — Quality check"}
                        {stepNum === 6 && " — Publish package"}
                      </h2>
                      {stepNum === 2 && (
                        <Button
                          size="sm"
                          variant={routeApproved ? "secondary" : "default"}
                          onClick={approveRoute}
                          disabled={!current.route || routeApproved}
                        >
                          {routeApproved ? "✓ Route approved" : "Approve route →"}
                        </Button>
                      )}
                    </div>

                    {blocked && (
                      <div className="text-xs text-voyage-muted mb-3 italic">
                        Approve the route in Step 2 to unlock this stage.
                      </div>
                    )}

                    <div className="space-y-4">
                      {steps.map((s) => {
                        const col = COLUMN_FOR_STEP[s.id];
                        const output = col ? (current as any)[col] : null;
                        const hasOutput = output !== null && output !== undefined && output !== "";
                        return (
                          <div key={s.id} className="border border-parchment-3/60 rounded p-3">
                            <div className="flex items-center justify-between mb-2">
                              <div className="text-sm font-medium">{s.label}</div>
                              <Button
                                size="sm"
                                variant={hasOutput ? "outline" : "default"}
                                disabled={blocked || runningStep === s.id}
                                onClick={() => runStep(s.id)}
                              >
                                {runningStep === s.id
                                  ? "Running…"
                                  : hasOutput
                                  ? "Re-run"
                                  : "Generate"}
                              </Button>
                            </div>
                            {hasOutput && (
                              <pre className="text-[0.72rem] bg-parchment/40 border border-parchment-3 rounded p-2 overflow-auto max-h-72 whitespace-pre-wrap break-words text-ink-2">
                                {typeof output === "string"
                                  ? output
                                  : JSON.stringify(output, null, 2)}
                              </pre>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default RouteMaker;
