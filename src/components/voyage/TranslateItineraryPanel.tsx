import { useState } from "react";
import { Languages, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { translateCatalogChunks } from "@/lib/translateCatalog.functions";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export type Lang = "en" | "pt" | "no";

const LANGS: { code: Lang; label: string }[] = [
  { code: "en", label: "English" },
  { code: "pt", label: "Português (BR)" },
  { code: "no", label: "Norsk" },
];

const FIELD_LABELS: Record<string, string> = {
  title: "Title",
  summary: "Summary",
  description: "Description",
  what_you_get: "What you get",
  cover_intro: "Cover intro",
  itinerary_content: "Full body content",
};

const MAX_CHUNK = 6000;

/** Split long markdown into chunks that always break on a `## ` heading. */
export function splitMarkdown(text: string, max = MAX_CHUNK): string[] {
  if (text.length <= max) return [text];
  const parts = text.split(/\n(?=##\s)/g);
  const chunks: string[] = [];
  let current = "";
  for (const part of parts) {
    if (current && (current.length + part.length + 1) > max) {
      chunks.push(current);
      current = part;
    } else {
      current = current ? `${current}\n${part}` : part;
    }
  }
  if (current) chunks.push(current);
  return chunks;
}

type Result = Record<Lang, Record<string, string>>;

interface Props {
  itineraryId: string | null;
  sourceDefault: Lang;
  onApplied?: (values: Record<string, string>) => void;
}

const TranslateItineraryPanel = ({ itineraryId, sourceDefault, onApplied }: Props) => {
  const [source, setSource] = useState<Lang>(sourceDefault);
  const [targets, setTargets] = useState<Lang[]>(LANGS.map((l) => l.code).filter((c) => c !== sourceDefault));
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState("");
  const [result, setResult] = useState<Result | null>(null);
  const [sourceValues, setSourceValues] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [overwrite, setOverwrite] = useState<Record<Lang, boolean>>({ en: false, pt: false, no: false });
  const [existing, setExisting] = useState<Record<Lang, boolean>>({ en: false, pt: false, no: false });

  const toggleTarget = (code: Lang) =>
    setTargets((t) => (t.includes(code) ? t.filter((c) => c !== code) : [...t, code]));

  const run = async () => {
    if (!itineraryId) {
      toast.error("Save the itinerary first — translation reads the stored version.");
      return;
    }
    const validTargets = targets.filter((t) => t !== source);
    if (!validTargets.length) {
      toast.error("Pick at least one target language.");
      return;
    }

    setBusy(true);
    setResult(null);
    try {
      const { data: row, error } = await supabase
        .from("catalog_itineraries")
        .select("*")
        .eq("id", itineraryId)
        .single();
      if (error) throw error;

      const r = row as Record<string, any>;
      const src: Record<string, string> = {
        title: (r[`title_${source}`] || "").toString(),
        summary: (r[`summary_${source}`] || "").toString(),
        description: (r[`description_${source}`] || "").toString(),
        what_you_get: (r[`what_you_get_${source}`] || "").toString(),
        cover_intro: (r[`cover_intro_${source}`] || "").toString(),
        itinerary_content: (r[`itinerary_content_${source}`] || "").toString(),
      };
      if (!Object.values(src).some((v) => v.trim())) {
        throw new Error(`Nothing written in ${LANGS.find((l) => l.code === source)?.label} yet.`);
      }

      const filled: Record<Lang, boolean> = { en: false, pt: false, no: false };
      for (const t of validTargets) {
        filled[t] = Boolean((r[`itinerary_content_${t}`] || "").toString().trim());
      }
      setExisting(filled);
      setSourceValues(src);

      const collected: Result = { en: {}, pt: {}, no: {} };

      for (const target of validTargets) {
        // Short fields go in one call; the long body is chunked on heading boundaries.
        const shortItems = (["title", "summary", "description", "what_you_get", "cover_intro"] as const)
          .filter((f) => src[f].trim())
          .map((f) => ({ id: f, text: src[f] }));

        if (shortItems.length) {
          setProgress(`${target.toUpperCase()} — fields…`);
          const res = await translateCatalogChunks({ data: { source, target, items: shortItems } });
          Object.assign(collected[target], res.translations);
        }

        if (src.itinerary_content.trim()) {
          const chunks = splitMarkdown(src.itinerary_content);
          const out: string[] = [];
          for (let i = 0; i < chunks.length; i++) {
            setProgress(`${target.toUpperCase()} — body ${i + 1}/${chunks.length}…`);
            const res = await translateCatalogChunks({
              data: { source, target, items: [{ id: `body_${i}`, text: chunks[i] }] },
            });
            out.push(res.translations[`body_${i}`] || "");
            if (res.warnings?.length) {
              toast.warning(`Formatting drifted slightly in ${target.toUpperCase()} body part ${i + 1} — check the preview.`);
            }
          }
          collected[target].itinerary_content = out.join("\n");
        }
      }

      setResult(collected);
      setProgress("");
      toast.success("Translation ready — review before saving.");
    } catch (e: any) {
      toast.error(e?.message || "Translation failed");
    } finally {
      setBusy(false);
      setProgress("");
    }
  };

  const apply = async () => {
    if (!result || !itineraryId) return;
    setSaving(true);
    try {
      const payload: Record<string, any> = {};
      const applied: Record<string, string> = {};
      for (const target of targets.filter((t) => t !== source)) {
        const values = result[target];
        if (!values || !Object.keys(values).length) continue;
        if (existing[target] && !overwrite[target]) continue;
        for (const [field, value] of Object.entries(values)) {
          if (!value?.trim()) continue;
          payload[`${field}_${target}`] = value;
          applied[`${field}_${target}`] = value;
        }
      }
      if (!Object.keys(payload).length) {
        toast.error("Nothing selected to save — tick “overwrite” for languages that already have content.");
        setSaving(false);
        return;
      }
      const { error } = await supabase
        .from("catalog_itineraries")
        .update(payload as never)
        .eq("id", itineraryId);
      if (error) throw error;
      onApplied?.(applied);
      setResult(null);
      toast.success("Translations saved.");
    } catch (e: any) {
      toast.error(e?.message || "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const activeTargets = targets.filter((t) => t !== source);

  return (
    <div className="border border-sage/40 bg-sage/5 rounded-lg px-4 py-3 space-y-3">
      <div className="flex flex-wrap items-center gap-3">
        <span className="text-[0.78rem] font-medium text-ink flex items-center gap-2">
          <Languages className="h-4 w-4" /> Translate the full itinerary (body, cover intro and fields)
        </span>
        <div className="flex items-center gap-2 ml-auto flex-wrap">
          <Label className="text-[0.7rem] uppercase tracking-[0.1em] text-voyage-muted">From</Label>
          <Select value={source} onValueChange={(v: Lang) => setSource(v)}>
            <SelectTrigger className="h-8 w-[150px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              {LANGS.map((l) => <SelectItem key={l.code} value={l.code}>{l.label}</SelectItem>)}
            </SelectContent>
          </Select>
          {LANGS.filter((l) => l.code !== source).map((l) => (
            <label key={l.code} className="flex items-center gap-1.5 text-[0.72rem] text-ink">
              <input
                type="checkbox"
                checked={targets.includes(l.code)}
                onChange={() => toggleTarget(l.code)}
              />
              {l.label}
            </label>
          ))}
          <Button size="sm" onClick={run} disabled={busy || !activeTargets.length}>
            {busy ? <><Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />{progress || "Translating…"}</> : "Translate"}
          </Button>
        </div>
      </div>
      <p className="text-[0.68rem] text-voyage-muted">
        Reads the saved version, keeps every heading, list, bold and link intact, and shows a preview before writing anything.
        Language-neutral blocks (subpage highlights, checklist, day overview, expectations) are shared across languages and are left untouched.
      </p>

      <Dialog open={!!result} onOpenChange={(o) => { if (!o) setResult(null); }}>
        <DialogContent className="max-w-5xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Review translation</DialogTitle>
          </DialogHeader>
          <div className="space-y-6">
            {result && activeTargets.map((target) => (
              <div key={target} className="space-y-3">
                <div className="flex items-center gap-3 flex-wrap">
                  <h3 className="text-sm font-semibold text-ink">
                    {LANGS.find((l) => l.code === target)?.label}
                  </h3>
                  {existing[target] && (
                    <label className="flex items-center gap-1.5 text-[0.72rem] text-amber-700">
                      <input
                        type="checkbox"
                        checked={!!overwrite[target]}
                        onChange={(e) => setOverwrite((o) => ({ ...o, [target]: e.target.checked }))}
                      />
                      This language already has content — overwrite it
                    </label>
                  )}
                </div>
                {Object.entries(result[target]).map(([field, value]) => (
                  <div key={field} className="grid md:grid-cols-2 gap-3">
                    <div>
                      <Label className="text-[0.68rem] uppercase tracking-[0.1em] text-voyage-muted">
                        {FIELD_LABELS[field] || field} — source
                      </Label>
                      <pre className="mt-1 whitespace-pre-wrap text-[0.72rem] leading-relaxed bg-muted/40 rounded p-2 max-h-56 overflow-y-auto font-sans">
                        {sourceValues[field] || ""}
                      </pre>
                    </div>
                    <div>
                      <Label className="text-[0.68rem] uppercase tracking-[0.1em] text-voyage-muted">
                        {FIELD_LABELS[field] || field} — {target.toUpperCase()}
                      </Label>
                      <pre className="mt-1 whitespace-pre-wrap text-[0.72rem] leading-relaxed bg-sage/10 rounded p-2 max-h-56 overflow-y-auto font-sans">
                        {value}
                      </pre>
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setResult(null)} disabled={saving}>Discard</Button>
            <Button onClick={apply} disabled={saving}>
              {saving ? <><Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />Saving…</> : "Save translations"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TranslateItineraryPanel;
