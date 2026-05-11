import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const input =
  "w-full px-3 py-2.5 rounded-sm bg-voyage-white border border-parchment-3 text-ink text-[0.85rem] focus:outline-none focus:border-gold transition-colors";
const label = "block text-[0.7rem] uppercase tracking-[0.1em] text-voyage-muted mb-1";

const cloneDoc = (doc: any) => JSON.parse(JSON.stringify(doc || {}));

const buildDraftFromCatalog = (editing: any, language: string) => ({
  title: editing.title_en || editing.title_pt || editing.title_no || "Untitled itinerary",
  subtitle: editing.summary_en || editing.summary_pt || editing.summary_no || "",
  cover_image_url: editing.hero_image_url || "",
  intro: editing.description_en || editing.description_pt || editing.description_no || "",
  trip_overview: {
    destination: editing.destination || "",
    duration: editing.duration || "",
    best_for: editing.group_size_label || "",
    estimated_budget: editing.estimated_trip_budget || "",
    best_season: "",
  },
  highlights: String(editing.what_you_get_en || editing.what_you_get_pt || editing.what_you_get_no || "")
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean),
  days: [],
  practical_info: {
    getting_there: "",
    getting_around: "",
    money: "",
    language_basics: "",
    what_to_pack: "",
    etiquette: "",
  },
  closing: "",
  language,
});

interface Props {
  editing: any;
  setEditing: (v: any) => void;
}

const AiAssistantPanel = ({ editing, setEditing }: Props) => {
  const { toast } = useToast();
  const [open, setOpen] = useState(true);
  const [brief, setBrief] = useState("");
  const [urls, setUrls] = useState("");
  const [docText, setDocText] = useState("");
  const [contextImages, setContextImages] = useState<string[]>([]);
  const [genText, setGenText] = useState(false);
  const [genHero, setGenHero] = useState(false);
  const [genGallery, setGenGallery] = useState(false);
  const [galleryPrompt, setGalleryPrompt] = useState("");
  const [galleryCount, setGalleryCount] = useState(4);
  const [genPdf, setGenPdf] = useState(false);
  const [pdfLang, setPdfLang] = useState<"en" | "pt" | "no" | "es" | "fr" | "de" | "it">("en");
  const [parsing, setParsing] = useState(false);
  const [draft, setDraft] = useState<any | null>(null);
  const [draftJson, setDraftJson] = useState("");
  const [renderingPdf, setRenderingPdf] = useState(false);
  const [previewing, setPreviewing] = useState(false);
  const [previewUrl, setPreviewUrl] = useState("");
  const [showDraftPreview, setShowDraftPreview] = useState(true);
  const [loadingSavedDraft, setLoadingSavedDraft] = useState(false);
  const [savingDraft, setSavingDraft] = useState(false);
  const [draftView, setDraftView] = useState<"edit" | "preview" | "json">("edit");
  const [uploadingDraftImage, setUploadingDraftImage] = useState<string | null>(null);

  // Live-parse the editable JSON for the rough HTML preview
  let draftPreview: any = null;
  let draftPreviewError = "";
  if (draftJson) {
    try { draftPreview = JSON.parse(draftJson); }
    catch (e: any) { draftPreviewError = e?.message || "Invalid JSON"; }
  }

  const setDraftDocument = useCallback((next: any) => {
    setDraft(next);
    setDraftJson(JSON.stringify(next, null, 2));
  }, []);

  const updateDraftDocument = (updater: (doc: any) => any) => {
    const source = draftPreview || draft || buildDraftFromCatalog(editing, pdfLang);
    const next = updater(cloneDoc(source));
    setDraftDocument(next);
  };

  const uploadCatalogImage = async (file: File): Promise<string> => {
    const ext = file.name.split(".").pop() || "jpg";
    const path = `${crypto.randomUUID()}.${ext}`;
    const { error } = await supabase.storage
      .from("catalog-images")
      .upload(path, file, { contentType: file.type });
    if (error) throw error;
    const { data } = supabase.storage.from("catalog-images").getPublicUrl(path);
    return data.publicUrl;
  };

  const uploadDraftImage = async (file: File, applyUrl: (url: string) => void, key: string) => {
    setUploadingDraftImage(key);
    try {
      const url = await uploadCatalogImage(file);
      applyUrl(url);
      toast({ title: "Image uploaded" });
    } catch (e: any) {
      toast({ title: "Upload failed", description: String(e.message || e), variant: "destructive" });
    } finally {
      setUploadingDraftImage(null);
    }
  };

  const onParseDoc = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setParsing(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/parse-form-upload`;
      const r = await fetch(url, {
        method: "POST",
        headers: { Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}` },
        body: fd,
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error || "Parse failed");
      setDocText((prev) => (prev ? prev + "\n\n" : "") + (data.text || data.extractedText || ""));
      toast({ title: "Document parsed", description: `${file.name} added as context.` });
    } catch (err: any) {
      toast({ title: "Parse failed", description: String(err.message || err), variant: "destructive" });
    } finally {
      setParsing(false);
      e.target.value = "";
    }
  };

  const onContextImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    for (const f of files) {
      const reader = new FileReader();
      const dataUrl = await new Promise<string>((res) => {
        reader.onload = () => res(reader.result as string);
        reader.readAsDataURL(f);
      });
      setContextImages((prev) => [...prev, dataUrl]);
    }
    e.target.value = "";
  };

  const generateText = async () => {
    setGenText(true);
    try {
      const urlList = urls.split(/\n|,/).map((u) => u.trim()).filter(Boolean);
      const { data, error } = await supabase.functions.invoke("generate-catalog-itinerary", {
        body: { brief, urls: urlList, documents_text: docText, images: contextImages },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      const it = data.itinerary;
      setEditing({
        ...editing,
        slug: editing.slug || it.slug,
        price_eur: editing.price_eur || it.price_eur,
        destination: editing.destination || it.destination,
        duration: editing.duration || it.duration,
        group_size_label: editing.group_size_label || it.group_size_label,
        estimated_trip_budget: editing.estimated_trip_budget || it.estimated_trip_budget,
        title_en: it.title_en, title_pt: it.title_pt, title_no: it.title_no,
        summary_en: it.summary_en, summary_pt: it.summary_pt, summary_no: it.summary_no,
        description_en: it.description_en, description_pt: it.description_pt, description_no: it.description_no,
        what_you_get_en: it.what_you_get_en, what_you_get_pt: it.what_you_get_pt, what_you_get_no: it.what_you_get_no,
        _ai_image_prompt: it.image_prompt,
      });
      toast({ title: "Content generated", description: "Review and edit the fields below." });
    } catch (e: any) {
      toast({ title: "AI error", description: String(e.message || e), variant: "destructive" });
    } finally {
      setGenText(false);
    }
  };

  const generateHero = async () => {
    const prompt =
      editing._ai_image_prompt ||
      `${editing.destination || brief || "scenic destination"} — ${editing.title_en || ""}`;
    setGenHero(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-catalog-images", {
        body: { hero_prompt: prompt },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setEditing({ ...editing, hero_image_url: data.hero_image_url });
      toast({ title: "Hero image created" });
    } catch (e: any) {
      toast({ title: "Image error", description: String(e.message || e), variant: "destructive" });
    } finally {
      setGenHero(false);
    }
  };

  const generateGallery = async () => {
    const base = editing._ai_image_prompt || editing.destination || editing.title_en || brief;
    if (!base && !galleryPrompt.trim()) {
      toast({ title: "Add a destination, generate text first, or describe the gallery you want" });
      return;
    }
    const count = Math.min(Math.max(Number(galleryCount) || 4, 1), 6);
    let prompts: string[];
    if (galleryPrompt.trim()) {
      // Split user prompt by newlines — each line is one image. If single line, expand to N variations.
      const lines = galleryPrompt.split("\n").map((l) => l.trim()).filter(Boolean);
      if (lines.length >= 2) {
        prompts = lines.slice(0, count).map((l) => (base ? `${base} — ${l}` : l));
      } else {
        const single = lines[0];
        prompts = Array.from({ length: count }, (_, i) =>
          base
            ? `${base} — ${single} (variation ${i + 1}, different angle / composition)`
            : `${single} (variation ${i + 1}, different angle / composition)`
        );
      }
    } else {
      const defaults = [
        `${base} — local cuisine, beautifully plated dish on rustic table`,
        `${base} — boutique hotel interior, warm light, premium design`,
        `${base} — unique landscape detail, soft golden hour`,
        `${base} — cultural moment, candid scene, atmosphere`,
        `${base} — signature experience, editorial composition`,
        `${base} — architectural detail, refined aesthetic`,
      ];
      prompts = defaults.slice(0, count);
    }
    setGenGallery(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-catalog-images", {
        body: { gallery_prompts: prompts },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setEditing({
        ...editing,
        gallery_images: [...(editing.gallery_images || []), ...(data.gallery_image_urls || [])],
      });
      toast({ title: `Added ${data.gallery_image_urls?.length || 0} gallery images` });
    } catch (e: any) {
      toast({ title: "Image error", description: String(e.message || e), variant: "destructive" });
    } finally {
      setGenGallery(false);
    }
  };

  const generatePdfDraft = async () => {
    const hasInput = brief || urls || docText || editing.title_en || editing.description_en || editing.summary_en;
    if (!hasInput) {
      toast({ title: "Add a brief or fill the itinerary fields first", variant: "destructive" });
      return;
    }
    setGenPdf(true);
    try {
      const urlList = urls.split(/\n|,/).map((u) => u.trim()).filter(Boolean);
      const itinerary_context = {
        title: editing.title_en, summary: editing.summary_en, description: editing.description_en,
        what_you_get: editing.what_you_get_en, destination: editing.destination,
        duration: editing.duration, group_size_label: editing.group_size_label,
        estimated_trip_budget: editing.estimated_trip_budget,
      };
      const { data, error } = await supabase.functions.invoke("generate-catalog-pdf", {
        body: {
          mode: "draft",
          language: pdfLang,
          brief, urls: urlList, documents_text: docText,
          hero_image_url: editing.hero_image_url || null,
          itinerary_context,
        },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setDraftDocument(data.draft);
      setDraftView("edit");
      if (editing.id) {
        await supabase.functions.invoke("generate-catalog-pdf", {
          body: { mode: "save_draft", itinerary_id: editing.id, draft: data.draft, language: pdfLang },
        });
      }
      toast({ title: "Draft ready", description: "Review and edit below, then click Render PDF." });
    } catch (e: any) {
      toast({ title: "Draft failed", description: String(e.message || e), variant: "destructive" });
    } finally {
      setGenPdf(false);
    }
  };

  const renderPdfFromDraft = async () => {
    let parsed: any;
    try {
      parsed = JSON.parse(draftJson);
    } catch (e: any) {
      toast({ title: "Invalid JSON", description: "Please fix the draft JSON before rendering.", variant: "destructive" });
      return;
    }
    setRenderingPdf(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-catalog-pdf", {
        body: {
          mode: "render",
          language: pdfLang,
          draft: parsed,
          hero_image_url: editing.hero_image_url || null,
        },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      if (editing.id) {
        await supabase.functions.invoke("generate-catalog-pdf", {
          body: { mode: "save_draft", itinerary_id: editing.id, draft: parsed, language: pdfLang },
        });
      }
      setEditing({ ...editing, pdf_path: data.pdf_path });
      toast({ title: "PDF rendered", description: `${data.pages} pages. Attached as the itinerary PDF.` });
    } catch (e: any) {
      toast({ title: "Render failed", description: String(e.message || e), variant: "destructive" });
    } finally {
      setRenderingPdf(false);
    }
  };

  const previewAttachedPdf = async () => {
    if (!editing.pdf_path) {
      toast({ title: "No PDF attached yet" });
      return;
    }
    setPreviewing(true);
    try {
      const { data: sess } = await supabase.auth.getSession();
      const token = sess?.session?.access_token;
      const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-catalog-pdf`;
      const r = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token || import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
        },
        body: JSON.stringify({ mode: "fetch_pdf", pdf_path: editing.pdf_path }),
      });
      if (!r.ok) {
        const t = await r.text();
        throw new Error(t || `HTTP ${r.status}`);
      }
      const blob = await r.blob();
      const blobUrl = URL.createObjectURL(blob);
      setPreviewUrl((current) => {
        if (current) URL.revokeObjectURL(current);
        return blobUrl;
      });
      toast({ title: "Preview ready", description: "The PDF is shown below without opening a blocked tab." });
    } catch (e: any) {
      toast({ title: "Preview failed", description: String(e.message || e), variant: "destructive" });
    } finally {
      setPreviewing(false);
    }
  };

  const loadSavedDraft = useCallback(async () => {
    if (!editing.id) return;
    setLoadingSavedDraft(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-catalog-pdf", {
        body: { mode: "get_draft", itinerary_id: editing.id },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      if (data?.draft) {
        setDraftDocument(data.draft);
        setPdfLang(data.language || "en");
        setDraftView("edit");
        setShowDraftPreview(true);
      } else {
        toast({ title: "No saved draft", description: "Generate a draft first, then save it for later editing." });
      }
    } catch (e: any) {
      toast({ title: "Could not open draft", description: String(e.message || e), variant: "destructive" });
    } finally {
      setLoadingSavedDraft(false);
    }
  }, [editing.id, setDraftDocument, toast]);

  const saveDraft = async () => {
    if (!editing.id) {
      toast({ title: "Save the itinerary first", description: "Create the catalog item before saving its client document draft." });
      return;
    }
    let parsed: any;
    try {
      parsed = JSON.parse(draftJson);
    } catch {
      toast({ title: "Invalid JSON", description: "Please fix the draft before saving.", variant: "destructive" });
      return;
    }
    setSavingDraft(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-catalog-pdf", {
        body: { mode: "save_draft", itinerary_id: editing.id, draft: parsed, language: pdfLang },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      toast({ title: "Draft saved", description: "You can reopen and continue editing it later." });
    } catch (e: any) {
      toast({ title: "Save failed", description: String(e.message || e), variant: "destructive" });
    } finally {
      setSavingDraft(false);
    }
  };

  const closePreview = () => {
    setPreviewUrl((current) => {
      if (current) URL.revokeObjectURL(current);
      return "";
    });
  };

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  useEffect(() => {
    setDraft(null);
    setDraftJson("");
    setPreviewUrl((current) => {
      if (current) URL.revokeObjectURL(current);
      return "";
    });
  }, [editing.id]);

  return (
    <div className="border border-gold/40 bg-gold/5 rounded-lg overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex justify-between items-center px-5 py-3 text-left"
      >
        <span className="font-serif font-semibold text-ink flex items-center gap-2">
          ✨ AI Assistant
          <span className="text-[0.7rem] font-sans font-normal text-voyage-muted normal-case tracking-normal">
            Generate all fields and images from a brief, documents, or web sources
          </span>
        </span>
        <span className="text-voyage-muted text-sm">{open ? "▾" : "▸"}</span>
      </button>

      {open && (
        <div className="px-5 pb-5 space-y-4 border-t border-gold/30">
          <div className="pt-4">
            <label className={label}>Brief</label>
            <textarea
              className={input + " min-h-[90px]"}
              placeholder="Write in any language. e.g. 'Roteiro de 7 dias pelos fiordes noruegueses para casais — Bergen, Flåm, Geiranger. Slow travel, trens panorâmicos, hotéis boutique, frutos do mar locais. Preço alvo ~€89.'"
              value={brief}
              onChange={(e) => setBrief(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={label}>Reference URLs (one per line)</label>
              <textarea
                className={input + " min-h-[70px]"}
                placeholder={"https://visitnorway.com/...\nhttps://example.com/article"}
                value={urls}
                onChange={(e) => setUrls(e.target.value)}
              />
            </div>
            <div>
              <label className={label}>Document context (PDF / DOCX)</label>
              <input type="file" accept=".pdf,.docx,.txt" onChange={onParseDoc} className="text-[0.78rem]" disabled={parsing} />
              {parsing && <div className="text-[0.7rem] text-voyage-muted mt-1">Parsing…</div>}
              {docText && (
                <div className="text-[0.7rem] text-sage mt-1">
                  ✓ {docText.length} chars of document context loaded
                  <button onClick={() => setDocText("")} className="ml-2 text-destructive hover:underline">clear</button>
                </div>
              )}
              <label className={label + " mt-3"}>Reference images</label>
              <input type="file" accept="image/*" multiple onChange={onContextImageUpload} className="text-[0.78rem]" />
              {contextImages.length > 0 && (
                <div className="flex gap-1 mt-2 flex-wrap">
                  {contextImages.map((img, i) => (
                    <div key={i} className="relative">
                      <img src={img} alt="" className="w-12 h-12 object-cover rounded" />
                      <button
                        onClick={() => setContextImages(contextImages.filter((_, j) => j !== i))}
                        className="absolute -top-1 -right-1 bg-destructive text-voyage-white w-4 h-4 rounded-full text-[0.6rem] leading-none"
                      >×</button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-wrap gap-2 pt-2">
            <button
              type="button"
              onClick={generateText}
              disabled={genText || (!brief && !urls && !docText && contextImages.length === 0)}
              className="px-4 py-2 rounded-sm bg-ink text-voyage-white text-[0.72rem] font-medium tracking-[0.1em] uppercase hover:bg-gold hover:text-ink disabled:opacity-50"
            >
              {genText ? "Generating…" : "✨ Generate all text fields"}
            </button>
            <button
              type="button"
              onClick={generateHero}
              disabled={genHero}
              className="px-4 py-2 rounded-sm border border-ink text-ink text-[0.72rem] font-medium tracking-[0.1em] uppercase hover:bg-ink hover:text-voyage-white disabled:opacity-50"
            >
              {genHero ? "Creating…" : "🖼 Generate hero image"}
            </button>
          </div>

          <div className="border-t border-gold/30 pt-4 space-y-2">
            <label className={label}>Gallery image prompt (optional)</label>
            <textarea
              className={input + " min-h-[70px]"}
              placeholder={"Describe the kind of gallery images you want.\nExamples:\n- Misty fjord at sunrise from a wooden viewpoint\n- Plate of fresh local seafood, overhead shot\n- Cozy cabin interior with fireplace\n\nTip: one description per line = one image. A single description = N variations."}
              value={galleryPrompt}
              onChange={(e) => setGalleryPrompt(e.target.value)}
            />
            <div className="flex flex-wrap items-end gap-3">
              <div>
                <label className={label}>How many images</label>
                <select
                  className={input + " w-auto"}
                  value={galleryCount}
                  onChange={(e) => setGalleryCount(Number(e.target.value))}
                >
                  {[1,2,3,4,5,6].map((n) => <option key={n} value={n}>{n}</option>)}
                </select>
              </div>
              <button
                type="button"
                onClick={generateGallery}
                disabled={genGallery}
                className="px-4 py-2 rounded-sm border border-ink text-ink text-[0.72rem] font-medium tracking-[0.1em] uppercase hover:bg-ink hover:text-voyage-white disabled:opacity-50"
              >
                {genGallery ? "Creating…" : `🖼 Generate gallery (${galleryCount} ${galleryCount === 1 ? "image" : "images"})`}
              </button>
              <span className="text-[0.7rem] text-voyage-muted">Leave prompt empty to use smart defaults (cuisine, hotel, landscape, culture…).</span>
            </div>
          </div>
          <p className="text-[0.7rem] text-voyage-muted">
            ✨ Inputs can be in <strong>any language</strong> (English, Portuguese, Norwegian, Spanish, French…). The AI auto-detects and produces all 3 catalog languages. Existing slug, price and metadata are preserved.
          </p>

          <div className="border-t border-gold/30 pt-4 mt-2">
            <div className="font-serif font-semibold text-ink text-[0.85rem] mb-2">
              📄 Downloadable PDF document
            </div>
            <p className="text-[0.7rem] text-voyage-muted mb-3">
              Two-step flow: <strong>1)</strong> AI writes a full draft (cover, day-by-day, practical info) in the language you choose. <strong>2)</strong> Review &amp; edit the draft below. <strong>3)</strong> Render it into the final PDF customers download after purchase.
            </p>
            <div className="flex flex-wrap items-end gap-3">
              <div>
                <label className={label}>Output language</label>
                <select
                  className={input + " w-auto"}
                  value={pdfLang}
                  onChange={(e) => setPdfLang(e.target.value as any)}
                >
                  <option value="en">English</option>
                  <option value="pt">Português (BR)</option>
                  <option value="no">Norsk (Bokmål)</option>
                  <option value="es">Español</option>
                  <option value="fr">Français</option>
                  <option value="de">Deutsch</option>
                  <option value="it">Italiano</option>
                </select>
              </div>
              <button
                type="button"
                onClick={generatePdfDraft}
                disabled={genPdf}
                className="px-4 py-2 rounded-sm bg-ink text-voyage-white text-[0.72rem] font-medium tracking-[0.1em] uppercase hover:bg-gold hover:text-ink disabled:opacity-50"
              >
                {genPdf ? "Writing draft…" : draft ? "↻ Re-generate draft" : "✍️ 1. Generate draft"}
              </button>
              {editing.id && (
                <button
                  type="button"
                  onClick={loadSavedDraft}
                  disabled={loadingSavedDraft}
                  className="px-4 py-2 rounded-sm border border-ink text-ink text-[0.72rem] font-medium tracking-[0.1em] uppercase hover:bg-ink hover:text-voyage-white disabled:opacity-50"
                >
                  {loadingSavedDraft ? "Opening…" : "Open saved draft"}
                </button>
              )}
              {editing.pdf_path && (
                <button
                  type="button"
                  onClick={previewAttachedPdf}
                  disabled={previewing}
                  className="px-4 py-2 rounded-sm border border-ink text-ink text-[0.72rem] font-medium tracking-[0.1em] uppercase hover:bg-ink hover:text-voyage-white disabled:opacity-50"
                >
                  {previewing ? "Opening…" : "👁 Preview attached PDF"}
                </button>
              )}
              {editing.pdf_path && (
                <span className="text-[0.7rem] text-sage">✓ Attached: {editing.pdf_path}</span>
              )}
            </div>

            {previewUrl && (
              <div className="mt-4 border border-gold/30 bg-parchment-1/40 rounded-sm overflow-hidden">
                <div className="flex items-center justify-between gap-3 px-3 py-2 border-b border-gold/20">
                  <span className="text-[0.72rem] uppercase tracking-[0.1em] text-voyage-muted">PDF preview</span>
                  <div className="flex flex-wrap gap-2">
                    <a
                      href={previewUrl}
                      download="itinerary-preview.pdf"
                      className="px-3 py-1.5 rounded-sm border border-ink text-ink text-[0.68rem] font-medium tracking-[0.1em] uppercase hover:bg-ink hover:text-voyage-white"
                    >
                      Download
                    </a>
                    <button
                      type="button"
                      onClick={closePreview}
                      className="px-3 py-1.5 rounded-sm border border-parchment-3 text-voyage-muted text-[0.68rem] font-medium tracking-[0.1em] uppercase hover:text-ink"
                    >
                      Close
                    </button>
                  </div>
                </div>
                <iframe
                  title="Attached itinerary PDF preview"
                  src={previewUrl}
                  className="w-full h-[72vh] bg-voyage-white"
                />
              </div>
            )}

            {draft && (
              <div className="mt-4 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <label className={label + " mb-0"}>
                    Editable draft (JSON) — tweak any text, then render
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowDraftPreview((v) => !v)}
                    className="text-[0.7rem] uppercase tracking-[0.1em] text-voyage-muted hover:text-ink"
                  >
                    {showDraftPreview ? "Hide preview" : "👁 Show preview"}
                  </button>
                </div>

                {showDraftPreview && (
                  <div className="rounded-sm border border-parchment-3 bg-voyage-white p-5 max-h-[60vh] overflow-auto">
                    {draftPreviewError ? (
                      <p className="text-[0.75rem] text-red-600">JSON error: {draftPreviewError}</p>
                    ) : draftPreview ? (
                      <DraftPreview doc={draftPreview} />
                    ) : null}
                  </div>
                )}

                <textarea
                  className={input + " min-h-[320px] font-mono text-[0.72rem]"}
                  value={draftJson}
                  onChange={(e) => setDraftJson(e.target.value)}
                  spellCheck={false}
                />
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={renderPdfFromDraft}
                    disabled={renderingPdf}
                    className="px-4 py-2 rounded-sm bg-gold text-ink text-[0.72rem] font-medium tracking-[0.1em] uppercase hover:bg-ink hover:text-voyage-white disabled:opacity-50"
                  >
                    {renderingPdf ? "Rendering…" : "📄 2. Render PDF from this draft"}
                  </button>
                  {editing.id && (
                    <button
                      type="button"
                      onClick={saveDraft}
                      disabled={savingDraft}
                      className="px-4 py-2 rounded-sm border border-ink text-ink text-[0.72rem] font-medium tracking-[0.1em] uppercase hover:bg-ink hover:text-voyage-white disabled:opacity-50"
                    >
                      {savingDraft ? "Saving…" : "Save draft"}
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => { setDraft(null); setDraftJson(""); }}
                    className="px-4 py-2 rounded-sm border border-parchment-3 text-voyage-muted text-[0.72rem] font-medium tracking-[0.1em] uppercase hover:text-ink"
                  >
                    Discard draft
                  </button>
                  <span className="text-[0.7rem] text-voyage-muted self-center">
                    Edit titles, day text, where_to_eat, tips, practical info, etc. Keep the JSON shape intact.
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// Rough in-browser preview of the AI-generated itinerary draft JSON.
// Mirrors the structure rendered server-side by the jsPDF renderer so
// advisors can review content before triggering a full PDF render.
const DraftPreview = ({ doc }: { doc: any }) => {
  if (!doc || typeof doc !== "object") return null;
  const ov = doc.trip_overview || {};
  const pi = doc.practical_info || {};
  const days = Array.isArray(doc.days) ? doc.days : [];
  const highlights = Array.isArray(doc.highlights) ? doc.highlights : [];

  return (
    <div className="font-serif text-ink text-[0.85rem] leading-relaxed space-y-6">
      <header className="text-center border-b border-parchment-3 pb-4">
        <p className="text-[0.65rem] uppercase tracking-[0.18em] text-gold mb-1">
          Fjord & Waves Travel
        </p>
        <h1 className="text-2xl font-semibold">{doc.title || "Untitled itinerary"}</h1>
        {doc.subtitle && <p className="italic text-voyage-muted mt-1">{doc.subtitle}</p>}
      </header>

      {doc.intro && (
        <section>
          <h2 className="text-[0.7rem] uppercase tracking-[0.14em] text-gold mb-2">Overview</h2>
          {String(doc.intro).split(/\n\n+/).map((p, i) => (
            <p key={i} className="mb-2 whitespace-pre-line">{p}</p>
          ))}
        </section>
      )}

      {Object.values(ov).some(Boolean) && (
        <section>
          <h2 className="text-[0.7rem] uppercase tracking-[0.14em] text-gold mb-2">Trip details</h2>
          <dl className="grid grid-cols-[140px_1fr] gap-y-1 text-[0.8rem]">
            {[
              ["Destination", ov.destination],
              ["Duration", ov.duration],
              ["Best for", ov.best_for],
              ["Estimated budget", ov.estimated_budget],
              ["Best season", ov.best_season],
            ].map(([k, v]) => v ? (
              <div key={k as string} className="contents">
                <dt className="font-semibold">{k}</dt>
                <dd>{v as string}</dd>
              </div>
            ) : null)}
          </dl>
        </section>
      )}

      {highlights.length > 0 && (
        <section>
          <h2 className="text-[0.7rem] uppercase tracking-[0.14em] text-gold mb-2">Highlights</h2>
          <ul className="list-disc pl-5 space-y-1">
            {highlights.map((h: any, i: number) => <li key={i}>{String(h)}</li>)}
          </ul>
        </section>
      )}

      {days.length > 0 && (
        <section className="space-y-5">
          <h2 className="text-[0.7rem] uppercase tracking-[0.14em] text-gold">Day by day</h2>
          {days.map((d: any, i: number) => (
            <article key={i} className="border-t border-parchment-3 pt-3">
              <p className="text-[0.65rem] uppercase tracking-[0.18em] text-gold">Day {d.day ?? i + 1}</p>
              <h3 className="text-lg font-semibold">{d.title || ""}</h3>
              {d.location && <p className="italic text-voyage-muted text-[0.78rem] mb-2">{d.location}</p>}
              {[
                ["Morning", d.morning],
                ["Afternoon", d.afternoon],
                ["Evening", d.evening],
                ["Where to stay", d.where_to_stay],
                ["Where to eat", d.where_to_eat],
                ["Tips", d.tips],
              ].map(([k, v]) => v ? (
                <div key={k as string} className="mt-2">
                  <p className="text-[0.7rem] uppercase tracking-[0.1em] font-semibold">{k}</p>
                  <p className="whitespace-pre-line">{v as string}</p>
                </div>
              ) : null)}
            </article>
          ))}
        </section>
      )}

      {Object.values(pi).some(Boolean) && (
        <section>
          <h2 className="text-[0.7rem] uppercase tracking-[0.14em] text-gold mb-2">Practical information</h2>
          {[
            ["Getting there", pi.getting_there],
            ["Getting around", pi.getting_around],
            ["Money", pi.money],
            ["Language basics", pi.language_basics],
            ["What to pack", pi.what_to_pack],
            ["Etiquette", pi.etiquette],
          ].map(([k, v]) => v ? (
            <div key={k as string} className="mb-2">
              <p className="text-[0.7rem] uppercase tracking-[0.1em] font-semibold">{k}</p>
              <p className="whitespace-pre-line">{v as string}</p>
            </div>
          ) : null)}
        </section>
      )}

      {doc.closing && (
        <section className="border-t border-parchment-3 pt-3 italic text-voyage-muted">
          {doc.closing}
        </section>
      )}
    </div>
  );
};

export default AiAssistantPanel;
