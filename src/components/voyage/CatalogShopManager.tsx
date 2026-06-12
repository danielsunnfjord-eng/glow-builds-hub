import { useEffect, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Sparkles, Loader2, Upload, Wand2, Eye } from "lucide-react";
import ItineraryEditor from "./ItineraryEditor";
import PdfPreview from "./PdfPreview";

type Lang = "en" | "pt" | "no";

interface CatalogRow {
  id: string;
  slug: string;
  title_en: string;
  destination: string | null;
  duration: string | null;
  price_eur: number;
  hero_image_url: string | null;
  is_published: boolean;
  updated_at: string;
  view_count: number;
  summary_en: string;
  description_en: string;
  itinerary_content_en: string | null;
  itinerary_content_pt: string | null;
  itinerary_content_no: string | null;
  experience_type: string | null;
  season: string | null;
}

interface SuggestionRow {
  id: string;
  destination: string;
  experience_type: string | null;
  details: string | null;
  email: string;
  status: string;
  created_at: string;
}

const slugify = (s: string) =>
  s.toLowerCase().trim().replace(/[^\w\s-]/g, "").replace(/\s+/g, "-").replace(/-+/g, "-").slice(0, 80);

const EXPERIENCE_TYPES = [
  "Adventure", "Culture", "Gastronomy", "Nature", "City Break", "Relaxation",
  "Beach", "Romantic", "Family", "Wellness", "Luxury",
];

const SEASONS = ["Spring", "Summer", "Autumn", "Winter"];

interface EditorState {
  id: string | null;
  title: string;
  destination: string;
  experienceType: string;
  season: string;
  duration: string;
  language: Lang;
  brief: string;
  summary: string;
  content: string;
  priceEur: string;
  heroImageUrl: string;
  isPublished: boolean;
}

const blankEditor: EditorState = {
  id: null,
  title: "",
  destination: "",
  experienceType: "",
  season: "",
  duration: "",
  language: "en",
  brief: "",
  summary: "",
  content: "",
  priceEur: "0",
  heroImageUrl: "",
  isPublished: false,
};

const CatalogShopManager = () => {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [editorOpen, setEditorOpen] = useState(false);
  const [state, setState] = useState<EditorState>(blankEditor);
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [sectionPrompt, setSectionPrompt] = useState("");
  const [regenerating, setRegenerating] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const [previewRow, setPreviewRow] = useState<CatalogRow | null>(null);

  const { data: rows = [], isLoading } = useQuery({
    queryKey: ["catalog-shop-list"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("catalog_itineraries")
        .select("id, slug, title_en, destination, duration, price_eur, hero_image_url, is_published, updated_at, view_count, summary_en, description_en, itinerary_content_en, itinerary_content_pt, itinerary_content_no, experience_type, season")
        .order("updated_at", { ascending: false });
      if (error) throw error;
      return data as unknown as CatalogRow[];
    },
  });

  const filtered = rows.filter((r) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return [r.title_en, r.slug, r.destination].filter(Boolean).join(" ").toLowerCase().includes(q);
  });

  const openCreate = () => {
    setState(blankEditor);
    setSectionPrompt("");
    setEditorOpen(true);
  };

  const openEdit = (r: CatalogRow) => {
    const lang: Lang = r.itinerary_content_no ? "no" : r.itinerary_content_pt ? "pt" : "en";
    const content =
      (lang === "no" ? r.itinerary_content_no : lang === "pt" ? r.itinerary_content_pt : r.itinerary_content_en) || "";
    setState({
      id: r.id,
      title: r.title_en || "",
      destination: r.destination || "",
      experienceType: r.experience_type || "",
      season: r.season || "",
      duration: r.duration || "",
      language: lang,
      brief: "",
      summary: r.summary_en || "",
      content,
      priceEur: String(r.price_eur ?? 0),
      heroImageUrl: r.hero_image_url || "",
      isPublished: r.is_published,
    });
    setSectionPrompt("");
    setEditorOpen(true);
  };

  const callCatalogStream = async (body: Record<string, unknown>): Promise<string> => {
    const { data: sess } = await supabase.auth.getSession();
    const token = sess?.session?.access_token;
    const url = `https://${import.meta.env.VITE_SUPABASE_PROJECT_ID}.functions.supabase.co/generate-catalog-itinerary`;
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(body),
    });
    if (!res.ok || !res.body) {
      const errText = await res.text().catch(() => "");
      throw new Error(errText || `Edge function error (${res.status})`);
    }
    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let text = "";
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      text += decoder.decode(value, { stream: true });
      setState((s) => ({ ...s, content: text }));
    }
    text += decoder.decode();
    return text;
  };

  const runGenerate = async () => {
    if (!state.destination && !state.title) {
      toast.error("Add at least a title or destination first.");
      return;
    }
    setGenerating(true);
    try {
      const text = await callCatalogStream({
        title: state.title,
        destination: state.destination,
        experience_type: state.experienceType,
        duration: state.duration,
        language: state.language,
        brief: state.brief,
        mode: "full",
      });
      if (!text) throw new Error("No content returned");
      setState((s) => ({ ...s, content: text }));
      toast.success("Itinerary generated. Edit freely before saving.");
    } catch (e: any) {
      toast.error(e?.message || "Failed to generate");
    } finally {
      setGenerating(false);
    }
  };

  const runRegenerateSection = async () => {
    if (!sectionPrompt.trim()) {
      toast.error("Describe which section to regenerate.");
      return;
    }
    if (!state.content.trim()) {
      toast.error("Generate or write the itinerary first.");
      return;
    }
    setRegenerating(true);
    const baseContent = state.content;
    try {
      // Stream into a temporary buffer; appended at end so we don't overwrite base.
      const { data: sess } = await supabase.auth.getSession();
      const token = sess?.session?.access_token;
      const url = `https://${import.meta.env.VITE_SUPABASE_PROJECT_ID}.functions.supabase.co/generate-catalog-itinerary`;
      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          mode: "section",
          language: state.language,
          existing_content: baseContent,
          section_instruction: sectionPrompt,
        }),
      });
      if (!res.ok || !res.body) {
        const errText = await res.text().catch(() => "");
        throw new Error(errText || `Edge function error (${res.status})`);
      }
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let section = "";
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        section += decoder.decode(value, { stream: true });
        setState((s) => ({ ...s, content: `${baseContent}\n\n${section}` }));
      }
      section += decoder.decode();
      const finalText = section.trim();
      if (!finalText) throw new Error("No content returned");
      setState((s) => ({ ...s, content: `${baseContent}\n\n${finalText}` }));
      setSectionPrompt("");
      toast.success("New section appended to the end — drag it into place in the editor.");
    } catch (e: any) {
      toast.error(e?.message || "Failed to regenerate");
    } finally {
      setRegenerating(false);
    }
  };


  const handleUploadCover = async (file: File) => {
    setUploading(true);
    try {
      const ext = file.name.split(".").pop() || "jpg";
      const path = `${crypto.randomUUID()}.${ext}`;
      const { error } = await supabase.storage.from("catalog-images").upload(path, file, {
        cacheControl: "3600", upsert: false, contentType: file.type,
      });
      if (error) throw error;
      const { data } = supabase.storage.from("catalog-images").getPublicUrl(path);
      setState((s) => ({ ...s, heroImageUrl: data.publicUrl }));
      toast.success("Cover uploaded");
    } catch (e: any) {
      toast.error(e?.message || "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const save = async (publish?: boolean) => {
    if (!state.title.trim()) { toast.error("Title is required"); return; }
    setSaving(true);
    try {
      const slug = slugify(state.title) || crypto.randomUUID().slice(0, 8);
      const contentField =
        state.language === "no" ? "itinerary_content_no"
        : state.language === "pt" ? "itinerary_content_pt"
        : "itinerary_content_en";
      const titleField =
        state.language === "no" ? "title_no"
        : state.language === "pt" ? "title_pt"
        : "title_en";
      const summaryField =
        state.language === "no" ? "summary_no"
        : state.language === "pt" ? "summary_pt"
        : "summary_en";

      const payload: any = {
        title_en: state.title, // always keep an English-side mirror so list/SEO never go blank
        [titleField]: state.title,
        [summaryField]: state.summary || "",
        [contentField]: state.content,
        destination: state.destination || null,
        duration: state.duration || null,
        price_eur: Number(state.priceEur) || 0,
        hero_image_url: state.heroImageUrl || null,
        is_published: publish !== undefined ? publish : state.isPublished,
        slug,
      };

      if (state.id) {
        const { error } = await supabase.from("catalog_itineraries").update(payload).eq("id", state.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("catalog_itineraries").insert(payload);
        if (error) throw error;
      }
      toast.success(state.id ? "Saved" : "Created");
      qc.invalidateQueries({ queryKey: ["catalog-shop-list"] });
      setEditorOpen(false);
    } catch (e: any) {
      toast.error(e?.message || "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const togglePublish = async (r: CatalogRow) => {
    const { error } = await supabase
      .from("catalog_itineraries")
      .update({ is_published: !r.is_published })
      .eq("id", r.id);
    if (error) return toast.error(error.message);
    toast.success(r.is_published ? "Unpublished" : "Published");
    qc.invalidateQueries({ queryKey: ["catalog-shop-list"] });
  };

  const remove = async (r: CatalogRow) => {
    if (!confirm(`Delete "${r.title_en}"? This cannot be undone.`)) return;
    const { error } = await supabase.from("catalog_itineraries").delete().eq("id", r.id);
    if (error) return toast.error(error.message);
    toast.success("Deleted");
    qc.invalidateQueries({ queryKey: ["catalog-shop-list"] });
  };

  const published = rows.filter((r) => r.is_published).length;

  return (
    <div>
      <div className="mb-6 flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="font-serif text-3xl font-bold mb-1">Itinerary catalogue</h1>
          <p className="text-[0.85rem] text-voyage-muted">
            Create AI-assisted itineraries to sell on the public shop.
            {rows.length > 0 && <> {published} of {rows.length} published.</>}
          </p>
        </div>
        <Button onClick={openCreate} className="bg-ink text-voyage-white hover:bg-gold hover:text-ink">
          <Sparkles className="w-4 h-4 mr-2" /> Create New Itinerary
        </Button>
      </div>

      <div className="mb-4">
        <Input placeholder="Search…" value={search} onChange={(e) => setSearch(e.target.value)} className="max-w-md" />
      </div>

      <div className="border border-parchment-3 rounded-md bg-voyage-white overflow-hidden">
        {isLoading && <div className="p-8 text-center text-sm text-voyage-muted">Loading…</div>}
        {!isLoading && filtered.length === 0 && (
          <div className="p-12 text-center text-sm text-voyage-muted">No itineraries yet — click "Create New Itinerary".</div>
        )}
        {filtered.length > 0 && (
          <div className="divide-y divide-parchment-3">
            {filtered.map((r) => (
              <div key={r.id} className="flex items-center gap-4 p-4 hover:bg-parchment/30">
                <div className="w-20 h-16 rounded bg-parchment-2 flex-shrink-0 overflow-hidden">
                  {r.hero_image_url ? <img src={r.hero_image_url} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full bg-gradient-to-br from-fjord/30 to-ocean/30" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <div className="font-medium text-ink truncate">{r.title_en || "(untitled)"}</div>
                    {r.is_published ? (
                      <span className="text-[0.65rem] uppercase tracking-wider bg-fjord/15 text-fjord px-2 py-0.5 rounded">Published</span>
                    ) : (
                      <span className="text-[0.65rem] uppercase tracking-wider bg-parchment-2 text-voyage-muted px-2 py-0.5 rounded">Draft</span>
                    )}
                  </div>
                  <div className="text-[0.75rem] text-voyage-muted mt-0.5 truncate">
                    {[r.destination, r.duration].filter(Boolean).join(" · ") || "No metadata"} ·{" "}
                    {Number(r.price_eur) > 0 ? `€${Number(r.price_eur).toFixed(0)}` : "no price"} · {r.view_count} views
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {r.is_published && r.slug && (
                    <a href={`/catalogue/${r.slug}`} target="_blank" rel="noreferrer" className="text-[0.72rem] uppercase tracking-wider text-voyage-muted hover:text-ink px-2">View</a>
                  )}
                  <Button size="sm" variant="ghost" onClick={() => setPreviewRow(r)} title="Preview PDF">
                    <Eye className="w-4 h-4 mr-1" /> Preview PDF
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => openEdit(r)}>Edit</Button>
                  <Button size="sm" variant={r.is_published ? "outline" : "default"} onClick={() => togglePublish(r)}>
                    {r.is_published ? "Unpublish" : "Publish"}
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => remove(r)} className="text-destructive hover:text-destructive">Delete</Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Dialog open={editorOpen} onOpenChange={setEditorOpen}>
        <DialogContent className="max-w-5xl max-h-[92vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{state.id ? "Edit itinerary" : "Create new itinerary"}</DialogTitle>
          </DialogHeader>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <Label>Title</Label>
              <Input value={state.title} onChange={(e) => setState({ ...state, title: e.target.value })} />
            </div>
            <div>
              <Label>Destination / country</Label>
              <Input value={state.destination} onChange={(e) => setState({ ...state, destination: e.target.value })} />
            </div>
            <div>
              <Label>Type of experience</Label>
              <div className="flex flex-wrap gap-2 mt-1.5 p-2 rounded-md border border-input bg-background min-h-10">
                {EXPERIENCE_TYPES.map((t) => {
                  const active = state.experienceType === t;
                  return (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setState({ ...state, experienceType: active ? "" : t })}
                      className={`px-2.5 py-1 rounded-full text-xs border transition-colors ${
                        active
                          ? "bg-primary text-primary-foreground border-primary"
                          : "bg-background text-foreground border-input hover:bg-muted"
                      }`}
                    >
                      {t}
                    </button>
                  );
                })}
              </div>
            </div>
            <div>
              <Label>Season</Label>
              <Select value={state.season || "any"} onValueChange={(v) => setState({ ...state, season: v === "any" ? "" : v })}>
                <SelectTrigger><SelectValue placeholder="Any season" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="any">Any season</SelectItem>
                  {SEASONS.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Duration</Label>
              <Input placeholder="e.g. 5 days" value={state.duration} onChange={(e) => setState({ ...state, duration: e.target.value })} />
            </div>
            <div>
              <Label>Language</Label>
              <Select value={state.language} onValueChange={(v: Lang) => setState({ ...state, language: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="en">English</SelectItem>
                  <SelectItem value="pt">Português (BR)</SelectItem>
                  <SelectItem value="no">Norsk</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Price (EUR)</Label>
              <Input type="number" min="0" step="1" value={state.priceEur} onChange={(e) => setState({ ...state, priceEur: e.target.value })} />
            </div>
            <div className="md:col-span-2">
              <Label>Short brief / notes for AI</Label>
              <Textarea rows={2} value={state.brief} onChange={(e) => setState({ ...state, brief: e.target.value })} placeholder="Any specific angle, audience, must-include experiences…" />
            </div>
            <div className="md:col-span-2">
              <Label>Short description (shown on shop card)</Label>
              <Textarea rows={2} value={state.summary} onChange={(e) => setState({ ...state, summary: e.target.value })} />
            </div>
            <div className="md:col-span-2">
              <Label>Cover image</Label>
              <div className="flex items-center gap-3">
                {state.heroImageUrl && <img src={state.heroImageUrl} alt="cover" className="w-24 h-16 object-cover rounded" />}
                <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && handleUploadCover(e.target.files[0])} />
                <Button type="button" variant="outline" size="sm" onClick={() => fileRef.current?.click()} disabled={uploading}>
                  {uploading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Upload className="w-4 h-4 mr-2" />}
                  {state.heroImageUrl ? "Replace" : "Upload"}
                </Button>
                {state.heroImageUrl && (
                  <Button type="button" variant="ghost" size="sm" onClick={() => setState({ ...state, heroImageUrl: "" })}>Remove</Button>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between mb-2 gap-2 flex-wrap">
            <Label className="text-base">Itinerary body</Label>
            <Button onClick={runGenerate} disabled={generating} className="bg-gold text-ink hover:bg-ink hover:text-voyage-white">
              {generating ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Sparkles className="w-4 h-4 mr-2" />}
              {state.content ? "Regenerate with AI" : "Generate with AI"}
            </Button>
          </div>

          <ItineraryEditor
            content={state.content}
            onContentChange={(md) => setState((s) => ({ ...s, content: md }))}
            placeholder="Write or generate the itinerary…"
          />

          <div className="mt-3 p-3 border border-parchment-3 rounded bg-parchment/40">
            <Label className="text-[0.78rem]">Regenerate a specific section with AI</Label>
            <div className="flex gap-2 mt-1">
              <Input
                value={sectionPrompt}
                onChange={(e) => setSectionPrompt(e.target.value)}
                placeholder='e.g. "Rewrite Day 2 with more focus on gastronomy"'
              />
              <Button variant="outline" onClick={runRegenerateSection} disabled={regenerating}>
                {regenerating ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Wand2 className="w-4 h-4 mr-2" />}
                Regenerate
              </Button>
            </div>
            <p className="text-[0.7rem] text-voyage-muted mt-1">The new section is appended at the bottom — paste it into place in the editor and delete the old one.</p>
          </div>

          <div className="flex justify-between items-center mt-6 pt-4 border-t">
            <div className="text-[0.75rem] text-voyage-muted">
              Status: {state.isPublished ? <span className="text-fjord font-medium">Published</span> : <span>Draft</span>}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setEditorOpen(false)}>Cancel</Button>
              <Button variant="outline" onClick={() => save(false)} disabled={saving}>
                {saving && <Loader2 className="w-4 h-4 animate-spin mr-2" />}Save as Draft
              </Button>
              <Button onClick={() => save(true)} disabled={saving} className="bg-ink text-voyage-white hover:bg-gold hover:text-ink">
                {saving && <Loader2 className="w-4 h-4 animate-spin mr-2" />}Save & Publish
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {previewRow && (
        <PdfPreview
          content={
            previewRow.itinerary_content_en ||
            previewRow.itinerary_content_pt ||
            previewRow.itinerary_content_no ||
            ""
          }
          project={{
            client_name: previewRow.title_en || "",
            destination: previewRow.destination,
            trip_duration: previewRow.duration,
            hero_image_url: previewRow.hero_image_url,
            cover_tagline: previewRow.summary_en || null,
          }}
          onClose={() => setPreviewRow(null)}
          onExport={() => window.print()}
        />
      )}
    </div>
  );
};

export default CatalogShopManager;
