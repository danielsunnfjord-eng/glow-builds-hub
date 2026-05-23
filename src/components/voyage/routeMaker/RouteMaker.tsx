import { useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { ROUTE_MAKER_STEPS } from "./prompts";

interface BriefData {
  destinations?: string;
  origin?: string;
  start_date?: string;
  end_date?: string;
  duration_nights?: string;
  travelers_adults?: string;
  travelers_children?: string;
  children_ages?: string;
  season?: string;
  travel_style?: string;
  pacing?: string;
  budget_level?: string;
  budget_amount?: string;
  currency?: string;
  accommodation_pref?: string;
  transport_pref?: string;
  interests?: string;
  must_haves?: string;
  avoid?: string;
  dietary?: string;
  mobility?: string;
  prior_visits?: string;
  occasion?: string;
  notes?: string;
}

const EMPTY_BRIEF: BriefData = {};

const BRIEF_FIELDS: Array<{
  key: keyof BriefData;
  label: string;
  type?: "text" | "textarea" | "date" | "number" | "select";
  placeholder?: string;
  options?: string[];
  full?: boolean;
}> = [
  { key: "destinations", label: "Destination(s)", placeholder: "e.g. Norway — Oslo, Bergen, Lofoten", full: true },
  { key: "origin", label: "Origin / departure city", placeholder: "e.g. São Paulo" },
  { key: "occasion", label: "Occasion", placeholder: "honeymoon, family trip, milestone…" },
  { key: "start_date", label: "Start date", type: "date" },
  { key: "end_date", label: "End date", type: "date" },
  { key: "duration_nights", label: "Duration (nights)", type: "number", placeholder: "10" },
  { key: "season", label: "Season / month", placeholder: "June, winter…" },
  { key: "travelers_adults", label: "Adults", type: "number", placeholder: "2" },
  { key: "travelers_children", label: "Children", type: "number", placeholder: "0" },
  { key: "children_ages", label: "Children ages", placeholder: "5, 8" },
  { key: "travel_style", label: "Travel style", type: "select", options: ["", "Luxury", "Boutique", "Premium comfort", "Mid-range", "Adventure", "Backpacker"] },
  { key: "pacing", label: "Pacing", type: "select", options: ["", "Slow & immersive", "Balanced", "Fast / cover-a-lot"] },
  { key: "budget_level", label: "Budget level", type: "select", options: ["", "Entry", "Mid", "Premium", "Luxury", "Ultra-luxury"] },
  { key: "currency", label: "Currency", type: "select", options: ["", "EUR", "USD", "NOK", "BRL", "GBP"] },
  { key: "budget_amount", label: "Total budget (approx.)", placeholder: "e.g. 12 000" },
  { key: "accommodation_pref", label: "Accommodation preferences", placeholder: "design hotels, lodges, cabins…", full: true },
  { key: "transport_pref", label: "Transport preferences", placeholder: "rental car, train, private driver…", full: true },
  { key: "interests", label: "Interests", type: "textarea", placeholder: "nature, food, history, photography…", full: true },
  { key: "must_haves", label: "Must-have experiences", type: "textarea", placeholder: "fjord cruise, northern lights…", full: true },
  { key: "avoid", label: "Things to avoid", type: "textarea", placeholder: "long drives, crowds…", full: true },
  { key: "dietary", label: "Dietary restrictions", placeholder: "vegetarian, gluten-free…", full: true },
  { key: "mobility", label: "Mobility / accessibility", placeholder: "limited walking, stroller…", full: true },
  { key: "prior_visits", label: "Prior visits", placeholder: "first time / been before to…", full: true },
  { key: "notes", label: "Other notes for the planner", type: "textarea", full: true },
];

const composeBriefText = (b: BriefData): string => {
  const parts: string[] = [];
  const add = (label: string, val?: string) => {
    if (val && val.trim()) parts.push(`- ${label}: ${val.trim()}`);
  };
  add("Destination(s)", b.destinations);
  add("Origin", b.origin);
  add("Occasion", b.occasion);
  if (b.start_date || b.end_date) add("Dates", `${b.start_date ?? "?"} → ${b.end_date ?? "?"}`);
  add("Duration (nights)", b.duration_nights);
  add("Season", b.season);
  const travelers = [
    b.travelers_adults ? `${b.travelers_adults} adults` : "",
    b.travelers_children ? `${b.travelers_children} children${b.children_ages ? ` (ages ${b.children_ages})` : ""}` : "",
  ].filter(Boolean).join(", ");
  if (travelers) parts.push(`- Travelers: ${travelers}`);
  add("Travel style", b.travel_style);
  add("Pacing", b.pacing);
  add("Budget level", b.budget_level);
  if (b.budget_amount) add("Budget amount", `${b.budget_amount}${b.currency ? ` ${b.currency}` : ""}`);
  add("Accommodation preferences", b.accommodation_pref);
  add("Transport preferences", b.transport_pref);
  add("Interests", b.interests);
  add("Must-have experiences", b.must_haves);
  add("Things to avoid", b.avoid);
  add("Dietary", b.dietary);
  add("Mobility", b.mobility);
  add("Prior visits", b.prior_visits);
  add("Other notes", b.notes);
  return parts.join("\n");
};

interface RouteMakerRow {
  id: string;
  user_id: string;
  title: string;
  status: string;
  brief_text: string;
  brief_data: BriefData | null;
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

  const { data: tripRequests = [] } = useQuery({
    queryKey: ["route-maker-trip-requests"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("trip_requests")
        .select("id,client_name,destination,start_date,end_date,created_at,departure,trip_duration,estimated_budget,adults,children_count,children_ages,accommodation_type,dietary_restrictions,mobility_notes,must_have_experiences,travel_pace,visited_before,interests,notes")
        .order("created_at", { ascending: false })
        .limit(100);
      if (error) throw error;
      return data ?? [];
    },
  });

  const mapTripRequestToBrief = (tr: any): { brief: BriefData; title: string } => {
    const brief: BriefData = {
      destinations: tr.destination ?? "",
      origin: tr.departure ?? "",
      start_date: tr.start_date ?? "",
      end_date: tr.end_date ?? "",
      duration_nights: tr.trip_duration ?? "",
      travelers_adults: tr.adults != null ? String(tr.adults) : "",
      travelers_children: tr.children_count != null ? String(tr.children_count) : "",
      children_ages: Array.isArray(tr.children_ages) ? tr.children_ages.join(", ") : "",
      accommodation_pref: tr.accommodation_type ?? "",
      pacing: tr.travel_pace ?? "",
      budget_amount: tr.estimated_budget ?? "",
      interests: Array.isArray(tr.interests) ? tr.interests.join(", ") : "",
      must_haves: tr.must_have_experiences ?? "",
      dietary: tr.dietary_restrictions ?? "",
      mobility: tr.mobility_notes ?? "",
      prior_visits: tr.visited_before ? "Yes — has visited before" : "First-time visitor",
      notes: tr.notes ?? "",
    };
    const title = `${tr.client_name ?? "Client"} — ${tr.destination ?? "trip"}`;
    return { brief, title };
  };

  const importFromTripRequest = (trId: string) => {
    const tr = tripRequests.find((t: any) => t.id === trId);
    if (!tr) return;
    const { brief, title: newTitle } = mapTripRequestToBrief(tr);
    setBriefData(brief);
    setTitle(newTitle);
    toast.success("Imported from intake form — review and Save.");
  };

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
  const [briefData, setBriefData] = useState<BriefData>(EMPTY_BRIEF);
  useEffect(() => {
    if (current) {
      setTitle(current.title);
      setBriefData(current.brief_data ?? EMPTY_BRIEF);
    }
  }, [current?.id]);

  const setBriefField = (key: keyof BriefData, value: string) => {
    setBriefData((prev) => ({ ...prev, [key]: value }));
  };

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

  const persistBrief = async () => {
    if (!current) return;
    const composed = composeBriefText(briefData);
    const { error } = await supabase
      .from("route_maker_itineraries")
      .update({ title, brief_text: composed, brief_data: briefData as never })
      .eq("id", current.id);
    return error;
  };

  const saveMeta = async () => {
    if (!current) return;
    const error = await persistBrief();
    if (error) return toast.error(error.message);
    toast.success("Saved");
    qc.invalidateQueries({ queryKey: ["route-maker-list"] });
    qc.invalidateQueries({ queryKey: ["route-maker-row", current.id] });
  };

  const runStep = async (stepId: string) => {
    if (!current) return;
    // Always persist brief/title before running so the edge function reads fresh data.
    await persistBrief();

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
                <div className="space-y-4">
                  <div className="rounded-md border border-parchment-3 bg-parchment/40 p-3">
                    <Label className="text-xs">Prefill brief from a customer intake form</Label>
                    <div className="mt-1 flex flex-wrap items-center gap-2">
                      <select
                        defaultValue=""
                        onChange={(e) => {
                          if (e.target.value) {
                            importFromTripRequest(e.target.value);
                            e.target.value = "";
                          }
                        }}
                        className="flex h-9 flex-1 min-w-[240px] rounded-md border border-input bg-background px-2 py-1 text-sm"
                      >
                        <option value="">— Select a trip request to import —</option>
                        {tripRequests.map((tr: any) => (
                          <option key={tr.id} value={tr.id}>
                            {(tr.client_name ?? "?")} · {(tr.destination ?? "?")} · {new Date(tr.created_at).toLocaleDateString()}
                          </option>
                        ))}
                      </select>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => { setBriefData(EMPTY_BRIEF); toast.success("Brief cleared — start a manual route."); }}
                      >
                        Clear (manual)
                      </Button>
                    </div>
                    <p className="mt-1 text-[0.7rem] text-voyage-muted">
                      Import a customer enquiry to prefill all fields, or leave empty and fill manually to build a generic catalog route.
                    </p>
                  </div>
                  <div>
                    <Label className="text-xs">Title (internal)</Label>
                    <Input value={title} onChange={(e) => setTitle(e.target.value)} />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {BRIEF_FIELDS.map((f) => {
                      const val = (briefData[f.key] ?? "") as string;
                      const common = {
                        value: val,
                        onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
                          setBriefField(f.key, e.target.value),
                        placeholder: f.placeholder,
                      };
                      return (
                        <div key={f.key} className={f.full ? "md:col-span-2" : ""}>
                          <Label className="text-xs">{f.label}</Label>
                          {f.type === "textarea" ? (
                            <Textarea rows={3} {...common} />
                          ) : f.type === "select" ? (
                            <select
                              {...common}
                              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                            >
                              {f.options?.map((o) => (
                                <option key={o} value={o}>{o || "—"}</option>
                              ))}
                            </select>
                          ) : (
                            <Input type={f.type ?? "text"} {...common} />
                          )}
                        </div>
                      );
                    })}
                  </div>
                  <details className="text-xs text-voyage-muted">
                    <summary className="cursor-pointer">Preview compiled brief sent to AI</summary>
                    <pre className="mt-2 bg-parchment/40 border border-parchment-3 rounded p-2 whitespace-pre-wrap break-words">
{composeBriefText(briefData) || "(empty)"}
                    </pre>
                  </details>
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
