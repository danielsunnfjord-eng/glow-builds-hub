import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Loader2, Pencil, Save, X, RotateCcw } from "lucide-react";

// Canonical tokens — MUST match generate-catalog-itinerary/index.ts and the
// EditorState dropdowns. Values stored in the DB are lowercase; labels shown
// to admins are humanised.
export const PERSONA_ORIGINS: Array<{ value: string; label: string }> = [
  { value: "brazil", label: "Brazil" },
  { value: "usa", label: "USA" },
  { value: "norway", label: "Norway" },
  { value: "europe", label: "Europe" },
  { value: "global", label: "Global (fallback)" },
];

export const PERSONA_DESTINATIONS: Array<{ value: string; label: string }> = [
  { value: "brazil", label: "Brazil" },
  { value: "portugal", label: "Portugal" },
  { value: "france", label: "France" },
  { value: "italy", label: "Italy" },
  { value: "spain", label: "Spain" },
  { value: "germany", label: "Germany" },
  { value: "uk", label: "UK" },
  { value: "norway", label: "Norway" },
  { value: "sweden", label: "Sweden" },
  { value: "denmark", label: "Denmark" },
  { value: "greece", label: "Greece" },
  { value: "usa", label: "USA" },
];

interface PersonaRow {
  id: string;
  origin: string;
  destination: string;
  notes: string;
  is_active: boolean;
  updated_at: string;
}

const originLabel = (v: string) => PERSONA_ORIGINS.find((o) => o.value === v)?.label ?? v;
const destLabel = (v: string) => PERSONA_DESTINATIONS.find((d) => d.value === v)?.label ?? v;

const TravelerPersonasPanel = () => {
  const qc = useQueryClient();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draftNotes, setDraftNotes] = useState("");
  const [newOrigin, setNewOrigin] = useState<string>("");
  const [newDest, setNewDest] = useState<string>("");
  const [newNotes, setNewNotes] = useState("");
  const [filterOrigin, setFilterOrigin] = useState<string>("all");

  const { data: rows = [], isLoading } = useQuery({
    queryKey: ["traveler_personas"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("traveler_personas" as any)
        .select("id,origin,destination,notes,is_active,updated_at")
        .order("origin", { ascending: true })
        .order("destination", { ascending: true });
      if (error) throw error;
      return (data as any[]) as PersonaRow[];
    },
  });

  const upsert = useMutation({
    mutationFn: async (payload: Partial<PersonaRow> & { origin: string; destination: string; notes: string }) => {
      if (payload.id) {
        const { error } = await supabase
          .from("traveler_personas" as any)
          .update({ notes: payload.notes, is_active: payload.is_active ?? true } as any)
          .eq("id", payload.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("traveler_personas" as any)
          .insert({
            origin: payload.origin,
            destination: payload.destination,
            notes: payload.notes,
            is_active: true,
          } as any);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["traveler_personas"] });
      toast.success("Persona saved");
      setEditingId(null);
      setNewOrigin("");
      setNewDest("");
      setNewNotes("");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const toggleActive = useMutation({
    mutationFn: async (row: PersonaRow) => {
      const { error } = await supabase
        .from("traveler_personas" as any)
        .update({ is_active: !row.is_active } as any)
        .eq("id", row.id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["traveler_personas"] }),
    onError: (e: Error) => toast.error(e.message),
  });

  const del = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("traveler_personas" as any).delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["traveler_personas"] });
      toast.success("Persona deleted");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const startEdit = (row: PersonaRow) => {
    setEditingId(row.id);
    setDraftNotes(row.notes);
  };
  const cancelEdit = () => {
    setEditingId(null);
    setDraftNotes("");
  };

  const filtered = filterOrigin === "all" ? rows : rows.filter((r) => r.origin === filterOrigin);

  return (
    <details className="rounded-sm border border-parchment-3 bg-parchment/40 mb-6">
      <summary className="cursor-pointer select-none px-4 py-3 text-[0.9rem] font-semibold text-ink flex items-center justify-between gap-3">
        <span className="flex items-center gap-2">
          🌍 Traveler Personas
          <span className="text-[0.72rem] font-normal text-voyage-muted">
            {rows.length} row{rows.length === 1 ? "" : "s"} · injected into AI prompt at generation time
          </span>
        </span>
        <span className="text-[0.72rem] text-voyage-muted">Expand</span>
      </summary>

      <div className="px-4 pb-4 space-y-4">
        <p className="text-[0.78rem] text-voyage-muted leading-relaxed">
          Each row describes how travelers from an <strong>Origin</strong> think about a <strong>Destination</strong> —
          currency framing, safety cues, flight reality, cultural pace. When a new itinerary is generated the matching
          row (or the <em>Global</em> fallback for the destination) is prepended to the AI system prompt so voice and
          detail land right for that traveler. Edits take effect on the very next generation.
        </p>

        {/* Filter */}
        <div className="flex items-center gap-3">
          <Label className="text-[0.75rem] text-voyage-muted">Filter by origin</Label>
          <Select value={filterOrigin} onValueChange={setFilterOrigin}>
            <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All origins</SelectItem>
              {PERSONA_ORIGINS.map((o) => (
                <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Table */}
        {isLoading ? (
          <div className="flex items-center gap-2 text-[0.8rem] text-voyage-muted py-4">
            <Loader2 className="w-4 h-4 animate-spin" /> Loading personas…
          </div>
        ) : filtered.length === 0 ? (
          <p className="text-[0.8rem] text-voyage-muted py-2">No personas match this filter.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-[0.8rem] border-collapse">
              <thead>
                <tr className="text-left text-voyage-muted border-b border-parchment-3">
                  <th className="py-2 pr-3 font-medium w-32">Origin</th>
                  <th className="py-2 pr-3 font-medium w-32">Destination</th>
                  <th className="py-2 pr-3 font-medium">Framing notes</th>
                  <th className="py-2 pr-3 font-medium w-20">Active</th>
                  <th className="py-2 font-medium w-32">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((r) => (
                  <tr key={r.id} className="border-b border-parchment-3/50 align-top">
                    <td className="py-2 pr-3 font-medium text-ink">{originLabel(r.origin)}</td>
                    <td className="py-2 pr-3 text-ink-2">{destLabel(r.destination)}</td>
                    <td className="py-2 pr-3 text-ink-2">
                      {editingId === r.id ? (
                        <Textarea
                          rows={5}
                          value={draftNotes}
                          onChange={(e) => setDraftNotes(e.target.value)}
                          className="text-[0.8rem]"
                        />
                      ) : (
                        <div className="whitespace-pre-wrap max-w-[600px]">{r.notes}</div>
                      )}
                    </td>
                    <td className="py-2 pr-3">
                      <button
                        type="button"
                        onClick={() => toggleActive.mutate(r)}
                        className={`inline-block px-2 py-0.5 rounded-sm text-[0.7rem] font-medium ${
                          r.is_active
                            ? "bg-emerald-100 text-emerald-900"
                            : "bg-parchment-3 text-voyage-muted"
                        }`}
                        title="Click to toggle"
                      >
                        {r.is_active ? "Active" : "Off"}
                      </button>
                    </td>
                    <td className="py-2">
                      {editingId === r.id ? (
                        <div className="flex gap-1">
                          <Button
                            size="sm"
                            variant="default"
                            onClick={() =>
                              upsert.mutate({
                                id: r.id,
                                origin: r.origin,
                                destination: r.destination,
                                notes: draftNotes,
                                is_active: r.is_active,
                              })
                            }
                            disabled={upsert.isPending}
                          >
                            {upsert.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                          </Button>
                          <Button size="sm" variant="ghost" onClick={cancelEdit}>
                            <X className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      ) : (
                        <div className="flex gap-1">
                          <Button size="sm" variant="ghost" onClick={() => startEdit(r)}>
                            <Pencil className="w-3.5 h-3.5" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              if (confirm(`Delete persona ${originLabel(r.origin)} → ${destLabel(r.destination)}?`)) {
                                del.mutate(r.id);
                              }
                            }}
                          >
                            <RotateCcw className="w-3.5 h-3.5 rotate-180" />
                          </Button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Add new */}
        <div className="border-t border-parchment-3 pt-4 space-y-3">
          <h4 className="text-[0.85rem] font-semibold text-ink">Add persona row</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <Label className="text-[0.75rem]">Origin</Label>
              <Select value={newOrigin} onValueChange={setNewOrigin}>
                <SelectTrigger><SelectValue placeholder="Choose origin…" /></SelectTrigger>
                <SelectContent>
                  {PERSONA_ORIGINS.map((o) => (
                    <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-[0.75rem]">Destination</Label>
              <Select value={newDest} onValueChange={setNewDest}>
                <SelectTrigger><SelectValue placeholder="Choose destination…" /></SelectTrigger>
                <SelectContent>
                  {PERSONA_DESTINATIONS.map((d) => (
                    <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <Label className="text-[0.75rem]">Framing notes</Label>
            <Textarea
              rows={4}
              value={newNotes}
              onChange={(e) => setNewNotes(e.target.value)}
              placeholder="Currency framing, flight reality, cultural pace, safety cues, must-mention warnings…"
              className="text-[0.8rem]"
            />
          </div>
          <div className="flex justify-end">
            <Button
              type="button"
              size="sm"
              disabled={!newOrigin || !newDest || !newNotes.trim() || upsert.isPending}
              onClick={() =>
                upsert.mutate({ origin: newOrigin, destination: newDest, notes: newNotes.trim() })
              }
            >
              {upsert.isPending ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : null}
              Add persona
            </Button>
          </div>
        </div>
      </div>
    </details>
  );
};

export default TravelerPersonasPanel;
