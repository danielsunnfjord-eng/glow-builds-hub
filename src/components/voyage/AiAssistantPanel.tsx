import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const input =
  "w-full px-3 py-2.5 rounded-sm bg-voyage-white border border-parchment-3 text-ink text-[0.85rem] focus:outline-none focus:border-gold transition-colors";
const label = "block text-[0.7rem] uppercase tracking-[0.1em] text-voyage-muted mb-1";

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
  const [parsing, setParsing] = useState(false);

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
    if (!base) {
      toast({ title: "Add destination or generate text first" });
      return;
    }
    const prompts = [
      `${base} — local cuisine, beautifully plated dish on rustic table`,
      `${base} — boutique hotel interior, warm light, premium design`,
      `${base} — unique landscape detail, soft golden hour`,
      `${base} — cultural moment, candid scene, atmosphere`,
    ];
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
              placeholder="e.g. 7-day romantic trip along the Norwegian fjords for couples — Bergen, Flåm, Geiranger. Focus on slow travel, scenic train, boutique stays, local seafood. Target price ~€89."
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
            <button
              type="button"
              onClick={generateGallery}
              disabled={genGallery}
              className="px-4 py-2 rounded-sm border border-ink text-ink text-[0.72rem] font-medium tracking-[0.1em] uppercase hover:bg-ink hover:text-voyage-white disabled:opacity-50"
            >
              {genGallery ? "Creating…" : "🖼 Generate gallery (4 images)"}
            </button>
          </div>
          <p className="text-[0.7rem] text-voyage-muted">
            Text generation fills empty fields and overrides titles/summaries/descriptions/what-you-get in all 3 languages. Existing slug, price and metadata are preserved.
          </p>
        </div>
      )}
    </div>
  );
};

export default AiAssistantPanel;
