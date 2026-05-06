import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const LANGS = [
  { code: "en", label: "English" },
  { code: "pt", label: "Português (BR)" },
  { code: "no", label: "Norsk" },
] as const;

type LangCode = typeof LANGS[number]["code"];

interface Props {
  editing: any;
  setEditing: (v: any) => void;
}

const TranslateBar = ({ editing, setEditing }: Props) => {
  const { toast } = useToast();
  const [source, setSource] = useState<LangCode>("en");
  const [busy, setBusy] = useState(false);

  const sourceFilled = () => {
    const t = (editing[`title_${source}`] || "").trim();
    const s = (editing[`summary_${source}`] || "").trim();
    const d = (editing[`description_${source}`] || "").trim();
    const w = (editing[`what_you_get_${source}`] || "").trim();
    return t || s || d || w;
  };

  const translate = async () => {
    if (!sourceFilled()) {
      toast({ title: "Fill at least one field in the source language first.", variant: "destructive" });
      return;
    }
    const targets = LANGS.map((l) => l.code).filter((c) => c !== source);
    setBusy(true);
    try {
      const { data, error } = await supabase.functions.invoke("translate-catalog-fields", {
        body: {
          source,
          targets,
          fields: {
            title: editing[`title_${source}`] || "",
            summary: editing[`summary_${source}`] || "",
            description: editing[`description_${source}`] || "",
            what_you_get: editing[`what_you_get_${source}`] || "",
          },
        },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      const tr = data.translations || {};
      const next: any = { ...editing };
      for (const t of targets) {
        if (tr[`title_${t}`] !== undefined) next[`title_${t}`] = tr[`title_${t}`];
        if (tr[`summary_${t}`] !== undefined) next[`summary_${t}`] = tr[`summary_${t}`];
        if (tr[`description_${t}`] !== undefined) next[`description_${t}`] = tr[`description_${t}`];
        if (tr[`what_you_get_${t}`] !== undefined) next[`what_you_get_${t}`] = tr[`what_you_get_${t}`];
      }
      setEditing(next);
      toast({ title: "Translated", description: `Filled ${targets.map((t) => t.toUpperCase()).join(" + ")}.` });
    } catch (e: any) {
      toast({ title: "Translation failed", description: String(e.message || e), variant: "destructive" });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="border border-sage/40 bg-sage/5 rounded-lg px-4 py-3 flex flex-wrap items-center gap-3">
      <span className="text-[0.78rem] font-medium text-ink">
        🌐 Write in one language → AI fills the others
      </span>
      <div className="flex items-center gap-2 ml-auto">
        <label className="text-[0.7rem] uppercase tracking-[0.1em] text-voyage-muted">I'm writing in</label>
        <select
          value={source}
          onChange={(e) => setSource(e.target.value as LangCode)}
          className="px-2 py-1.5 rounded-sm bg-voyage-white border border-parchment-3 text-ink text-[0.78rem] focus:outline-none focus:border-gold"
        >
          {LANGS.map((l) => (
            <option key={l.code} value={l.code}>{l.label}</option>
          ))}
        </select>
        <button
          type="button"
          onClick={translate}
          disabled={busy}
          className="px-4 py-1.5 rounded-sm bg-ink text-voyage-white text-[0.7rem] font-medium tracking-[0.1em] uppercase hover:bg-gold hover:text-ink disabled:opacity-50"
        >
          {busy ? "Translating…" : "Translate to other languages"}
        </button>
      </div>
    </div>
  );
};

export default TranslateBar;
