import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import {
  Sparkles, Loader2, Upload, Wand2, Eye, ClipboardCheck, RefreshCcw,
  Plus, Trash2, Check, X as XIcon, CheckCircle2, AlertCircle, Hotel as HotelIcon, Undo2,
} from "lucide-react";
import ItineraryEditor from "./ItineraryEditor";
import PdfPreview from "./PdfPreview";
import AuditChecklist from "./AuditChecklist";
import {
  parseAuditItems,
  serializeAuditItems,
  itemsToPromptText,
  type SelectableAuditItem,
} from "@/lib/auditParser";
import { normalizePhotos, type PhotoMeta } from "@/lib/photoMeta";

type Lang = "en" | "pt" | "no";

interface HotelRec {
  id: string;
  name: string;
  location: string;
  description: string;
  perks: string[];
  photos: PhotoMeta[]; // up to 3
  visible: boolean;
}

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
  summary_pt: string | null;
  summary_no: string | null;
  description_en: string;
  itinerary_content_en: string | null;
  itinerary_content_pt: string | null;
  itinerary_content_no: string | null;
  experience_type: string[] | null;
  season: string | null;
  hotels: HotelRec[] | null;
  audit_report: string | null;
  audited_at: string | null;
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

const newHotel = (): HotelRec => ({
  id: crypto.randomUUID(),
  name: "",
  location: "",
  description: "",
  perks: [],
  photos: [],
  visible: true,
});

interface EditorState {
  id: string | null;
  title: string;
  destination: string;
  experienceType: string[];
  season: string;
  duration: string;
  language: Lang;
  brief: string;
  summary: string;
  summaryPt: string;
  summaryNo: string;
  content: string;
  priceEur: string;
  heroImageUrl: string;
  heroImageCredit: string;
  heroImageCaption: string;
  isPublished: boolean;
  hotels: HotelRec[];
  auditReport: string;
  auditItems: SelectableAuditItem[];
  auditedAt: string | null;
  previousContent: string | null;
}

const blankEditor: EditorState = {
  id: null,
  title: "",
  destination: "",
  experienceType: [],
  season: "",
  duration: "",
  language: "en",
  brief: "",
  summary: "",
  summaryPt: "",
  summaryNo: "",
  content: "",
  priceEur: "0",
  heroImageUrl: "",
  heroImageCredit: "",
  heroImageCaption: "",
  isPublished: false,
  hotels: [],
  auditReport: "",
  auditItems: [],
  auditedAt: null,
  previousContent: null,
};

const CatalogShopManager = () => {
  const qc = useQueryClient();
  const { t } = useTranslation();
  const [tab, setTab] = useState<"itineraries" | "suggestions">("itineraries");
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
  const [auditing, setAuditing] = useState(false);
  const [applyingAudit, setApplyingAudit] = useState(false);

  const { data: suggestions = [], isLoading: suggestionsLoading } = useQuery({
    queryKey: ["customer-suggestions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("customer_suggestions" as any)
        .select("id, destination, experience_type, details, email, status, created_at")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as SuggestionRow[];
    },
  });

  const updateSuggestionStatus = async (id: string, status: string) => {
    const { error } = await supabase.from("customer_suggestions" as any).update({ status } as any).eq("id", id);
    if (error) return toast.error(error.message);
    qc.invalidateQueries({ queryKey: ["customer-suggestions"] });
  };

  const deleteSuggestion = async (id: string) => {
    if (!confirm(t("adminSuggestions.deleteConfirm"))) return;
    const { error } = await supabase.from("customer_suggestions" as any).delete().eq("id", id);
    if (error) return toast.error(error.message);
    qc.invalidateQueries({ queryKey: ["customer-suggestions"] });
  };

  const newSuggestionsCount = suggestions.filter((s) => s.status === "new").length;

  const { data: rows = [], isLoading } = useQuery({
    queryKey: ["catalog-shop-list"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("catalog_itineraries")
        .select("id, slug, title_en, destination, duration, price_eur, hero_image_url, is_published, updated_at, view_count, summary_en, summary_pt, summary_no, description_en, itinerary_content_en, itinerary_content_pt, itinerary_content_no, experience_type, season, hotels, audit_report, audited_at")
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
    const hotels = Array.isArray(r.hotels)
      ? r.hotels.map((h: any) => ({
          id: h.id || crypto.randomUUID(),
          name: h.name || "",
          location: h.location || "",
          description: h.description || "",
          perks: Array.isArray(h.perks) ? h.perks : [],
          photos: normalizePhotos(h.photos).slice(0, 3),
          visible: h.visible !== false,
        }))
      : [];
    setState({
      id: r.id,
      title: r.title_en || "",
      destination: r.destination || "",
      experienceType: Array.isArray(r.experience_type) ? r.experience_type : r.experience_type ? [r.experience_type] : [],
      season: r.season || "",
      duration: r.duration || "",
      language: lang,
      brief: "",
      summary: r.summary_en || "",
      summaryPt: r.summary_pt || "",
      summaryNo: r.summary_no || "",
      content,
      priceEur: String(r.price_eur ?? 0),
      heroImageUrl: r.hero_image_url || "",
      heroImageCredit: (r as any).hero_image_credit || "",
      heroImageCaption: (r as any).hero_image_caption || "",
      isPublished: r.is_published,
      hotels,
      auditReport: r.audit_report || "",
      auditItems: parseAuditItems(r.audit_report).map((i) => ({ ...i, selected: true })),
      auditedAt: r.audited_at || null,
      previousContent: null,
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
        experience_type: state.experienceType.join(", "),
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

  const runAudit = async () => {
    if (!state.content.trim()) {
      toast.error("Generate or write the itinerary first.");
      return;
    }
    setAuditing(true);
    try {
      const { data, error } = await supabase.functions.invoke("audit-itinerary-claude", {
        body: { content: state.content, mode: "audit" },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      const parsed = parseAuditItems(data?.items?.length ? data.items : data?.audit);
      if (!parsed.length) throw new Error("No audit suggestions returned");
      const items: SelectableAuditItem[] = parsed.map((i) => ({ ...i, selected: true }));
      const serialized = serializeAuditItems(items);
      const now = new Date().toISOString();
      setState((s) => ({
        ...s,
        auditItems: items,
        auditReport: serialized,
        auditedAt: now,
        previousContent: null,
      }));
      if (state.id) {
        await supabase
          .from("catalog_itineraries")
          .update({ audit_report: serialized, audited_at: now })
          .eq("id", state.id);
        qc.invalidateQueries({ queryKey: ["catalog-shop-list"] });
      }
      toast.success("Audit complete — pick which improvements to apply.");
    } catch (e: any) {
      toast.error(e?.message || "Audit failed");
    } finally {
      setAuditing(false);
    }
  };

  const toggleAuditItem = (id: string) =>
    setState((s) => ({
      ...s,
      auditItems: s.auditItems.map((i) => (i.id === id ? { ...i, selected: !i.selected } : i)),
    }));
  const selectAllAudit = () =>
    setState((s) => ({ ...s, auditItems: s.auditItems.map((i) => ({ ...i, selected: true })) }));
  const deselectAllAudit = () =>
    setState((s) => ({ ...s, auditItems: s.auditItems.map((i) => ({ ...i, selected: false })) }));
  const keepOriginalAudit = () => {
    setState((s) =>
      s.previousContent === null ? s : { ...s, content: s.previousContent, previousContent: null },
    );
    toast.success("Original itinerary restored");
  };

  const applyAudit = async () => {
    const selected = state.auditItems.filter((i) => i.selected);
    if (!selected.length || !state.content.trim()) {
      toast.error("Select at least one improvement to apply.");
      return;
    }
    setApplyingAudit(true);
    const original = state.content;
    const auditText = itemsToPromptText(selected);
    try {
      const { data: sess } = await supabase.auth.getSession();
      const token = sess?.session?.access_token;
      const url = `https://${import.meta.env.VITE_SUPABASE_PROJECT_ID}.functions.supabase.co/audit-itinerary-claude`;
      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          mode: "rewrite",
          content: original,
          audit: `Apply ONLY the following selected improvements. Leave everything else unchanged.\n\n${auditText}`,
          trip_duration: state.duration,
        }),
      });
      if (!res.ok || !res.body) {
        const errText = await res.text().catch(() => "");
        throw new Error(errText || `Rewrite failed (${res.status})`);
      }
      setState((s) => ({ ...s, previousContent: original, content: "" }));
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let rewritten = "";
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        rewritten += decoder.decode(value, { stream: true });
        setState((s) => ({ ...s, content: rewritten }));
      }
      rewritten += decoder.decode();
      if (!rewritten.trim()) throw new Error("Empty rewrite");
      setState((s) => ({ ...s, content: rewritten.trim() }));
      toast.success("Improvements applied. Review the rewritten itinerary.");
    } catch (e: any) {
      toast.error(e?.message || "Failed to apply improvements");
      setState((s) => ({ ...s, content: original, previousContent: null }));
    } finally {
      setApplyingAudit(false);
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

  const uploadHotelPhoto = async (hotelId: string, file: File) => {
    try {
      const ext = file.name.split(".").pop() || "jpg";
      const path = `hotels/${crypto.randomUUID()}.${ext}`;
      const { error } = await supabase.storage.from("catalog-images").upload(path, file, {
        cacheControl: "3600", upsert: false, contentType: file.type,
      });
      if (error) throw error;
      const { data } = supabase.storage.from("catalog-images").getPublicUrl(path);
      setState((s) => ({
        ...s,
        hotels: s.hotels.map((h) =>
          h.id === hotelId
            ? { ...h, photos: [...h.photos, { url: data.publicUrl, credit: "", caption: "" }].slice(0, 3) }
            : h,
        ),
      }));
    } catch (e: any) {
      toast.error(e?.message || "Photo upload failed");
    }
  };

  const updateHotelPhoto = (hotelId: string, slot: number, patch: Partial<PhotoMeta>) =>
    setState((s) => ({
      ...s,
      hotels: s.hotels.map((h) =>
        h.id === hotelId
          ? { ...h, photos: h.photos.map((p, i) => (i === slot ? { ...p, ...patch } : p)) }
          : h,
      ),
    }));

  const updateHotel = (id: string, patch: Partial<HotelRec>) =>
    setState((s) => ({ ...s, hotels: s.hotels.map((h) => (h.id === id ? { ...h, ...patch } : h)) }));

  const removeHotel = (id: string) =>
    setState((s) => ({ ...s, hotels: s.hotels.filter((h) => h.id !== id) }));

  const addHotel = () => setState((s) => ({ ...s, hotels: [...s.hotels, newHotel()] }));

  // Pre-publish checklist
  type Check = { key: string; label: string; ok: boolean };
  const buildChecklist = (s: EditorState): Check[] => [
    { key: "audited", label: "Itinerary has been audited", ok: !!s.auditedAt },
    { key: "cover", label: "Cover image has been uploaded", ok: !!s.heroImageUrl },
    {
      key: "hotels",
      label: "At least one hotel recommendation has been added",
      ok: s.hotels.some((h) => h.name.trim()),
    },
    { key: "price", label: "Price has been set", ok: Number(s.priceEur) > 0 },
    {
      key: "summaries",
      label: "Short description filled in for EN / PT / NO",
      ok: !!s.summary.trim() && !!s.summaryPt.trim() && !!s.summaryNo.trim(),
    },
  ];

  const checklist = buildChecklist(state);
  const canPublish = checklist.every((c) => c.ok);

  const save = async (publish?: boolean) => {
    if (!state.title.trim()) { toast.error("Title is required"); return; }
    if (publish === true && !canPublish) {
      toast.error("Complete the pre-publish checklist before publishing.");
      return;
    }
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

      const payload: any = {
        title_en: state.title,
        [titleField]: state.title,
        summary_en: state.summary || "",
        summary_pt: state.summaryPt || "",
        summary_no: state.summaryNo || "",
        [contentField]: state.content,
        destination: state.destination || null,
        duration: state.duration || null,
        experience_type: state.experienceType.length ? state.experienceType : null,
        season: state.season || null,
        price_eur: Number(state.priceEur) || 0,
        hero_image_url: state.heroImageUrl || null,
        hero_image_credit: state.heroImageCredit || null,
        hero_image_caption: state.heroImageCaption || null,
        is_published: publish !== undefined ? publish : state.isPublished,
        slug,
        hotels: state.hotels,
        audit_report: state.auditReport || null,
        audited_at: state.auditedAt,
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
    if (!r.is_published) {
      // Re-run the same checklist for inline publish.
      const stub: EditorState = {
        ...blankEditor,
        id: r.id,
        title: r.title_en,
        summary: r.summary_en || "",
        summaryPt: r.summary_pt || "",
        summaryNo: r.summary_no || "",
        priceEur: String(r.price_eur ?? 0),
        heroImageUrl: r.hero_image_url || "",
        hotels: Array.isArray(r.hotels) ? r.hotels : [],
        auditedAt: r.audited_at || null,
      };
      const missing = buildChecklist(stub).filter((c) => !c.ok);
      if (missing.length) {
        toast.error("Cannot publish — open Edit and complete: " + missing.map((m) => m.label).join("; "));
        return;
      }
    }
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
      <div className="flex gap-1 border-b border-parchment-3 mb-6">
        <button
          onClick={() => setTab("itineraries")}
          className={`px-4 py-2.5 text-[0.72rem] font-semibold tracking-[0.1em] uppercase border-b-2 transition-all ${
            tab === "itineraries" ? "border-ink text-ink" : "border-transparent text-voyage-muted hover:text-ink"
          }`}
        >
          Itineraries
        </button>
        <button
          onClick={() => setTab("suggestions")}
          className={`relative px-4 py-2.5 text-[0.72rem] font-semibold tracking-[0.1em] uppercase border-b-2 transition-all ${
            tab === "suggestions" ? "border-ink text-ink" : "border-transparent text-voyage-muted hover:text-ink"
          }`}
        >
          {t("adminSuggestions.tab")}
          {newSuggestionsCount > 0 && (
            <span className="absolute -top-1 -right-1 w-5 h-5 bg-destructive text-voyage-white text-[0.6rem] font-bold rounded-full flex items-center justify-center">
              {newSuggestionsCount}
            </span>
          )}
        </button>
      </div>

      {tab === "suggestions" ? (
        <div>
          <div className="mb-6">
            <h1 className="font-serif text-3xl font-bold mb-1">{t("adminSuggestions.title")}</h1>
            <p className="text-[0.85rem] text-voyage-muted">{t("adminSuggestions.desc")}</p>
          </div>
          {suggestionsLoading ? (
            <div className="p-8 text-center text-sm text-voyage-muted">Loading…</div>
          ) : suggestions.length === 0 ? (
            <div className="border border-parchment-3 rounded-md bg-voyage-white p-12 text-center text-sm text-voyage-muted">
              {t("adminSuggestions.empty")}
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {suggestions.map((s) => {
                const statusColors: Record<string, string> = {
                  new: "bg-gold/10 text-gold border-gold/30",
                  reviewed: "bg-sage/10 text-sage border-sage/30",
                  archived: "bg-ink/[0.06] text-voyage-muted border-parchment-3",
                };
                const statusLabel =
                  s.status === "reviewed" ? t("adminSuggestions.statusReviewed")
                  : s.status === "archived" ? t("adminSuggestions.statusArchived")
                  : t("adminSuggestions.statusNew");
                return (
                  <div key={s.id} className="bg-voyage-white border border-parchment-3 rounded-lg p-5">
                    <div className="flex justify-between items-start mb-2 flex-wrap gap-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-serif text-lg font-bold text-ink">{s.destination}</span>
                        <span className={`text-[0.6rem] uppercase tracking-wider px-2 py-0.5 rounded border ${statusColors[s.status] || statusColors.new}`}>
                          {statusLabel}
                        </span>
                      </div>
                      <div className="text-[0.72rem] text-voyage-muted">
                        {new Date(s.created_at).toLocaleString()}
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3 text-[0.82rem]">
                      <div>
                        <span className="text-voyage-muted text-[0.65rem] uppercase tracking-wider block">{t("adminSuggestions.experience")}</span>
                        <span className="text-ink">{s.experience_type || "—"}</span>
                      </div>
                      <div className="md:col-span-2">
                        <span className="text-voyage-muted text-[0.65rem] uppercase tracking-wider block">{t("adminSuggestions.email")}</span>
                        <a href={`mailto:${s.email}`} className="text-ink hover:text-gold transition-colors">{s.email}</a>
                      </div>
                    </div>
                    {s.details && (
                      <div className="bg-parchment rounded-sm p-3 mb-3 text-[0.82rem] text-ink-2 whitespace-pre-wrap">
                        {s.details}
                      </div>
                    )}
                    <div className="flex gap-2 flex-wrap">
                      {s.status === "new" && (
                        <Button size="sm" variant="outline" onClick={() => updateSuggestionStatus(s.id, "reviewed")}>
                          {t("adminSuggestions.markReviewed")}
                        </Button>
                      )}
                      {s.status !== "archived" && (
                        <Button size="sm" variant="ghost" onClick={() => updateSuggestionStatus(s.id, "archived")}>
                          {t("adminSuggestions.archive")}
                        </Button>
                      )}
                      <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive" onClick={() => deleteSuggestion(s.id)}>
                        Delete
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : (
      <>
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
                    {r.audited_at && (
                      <span className="text-[0.6rem] uppercase tracking-wider bg-sage/10 text-sage px-2 py-0.5 rounded inline-flex items-center gap-1">
                        <ClipboardCheck className="w-3 h-3" /> Audited
                      </span>
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
                  const active = state.experienceType.includes(t);
                  return (
                    <button
                      key={t}
                      type="button"
                      onClick={() =>
                        setState({
                          ...state,
                          experienceType: active
                            ? state.experienceType.filter((x) => x !== t)
                            : [...state.experienceType, t],
                        })
                      }
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
            <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <Label>Short description (EN)</Label>
                <Textarea rows={3} value={state.summary} onChange={(e) => setState({ ...state, summary: e.target.value })} />
              </div>
              <div>
                <Label>Short description (PT)</Label>
                <Textarea rows={3} value={state.summaryPt} onChange={(e) => setState({ ...state, summaryPt: e.target.value })} />
              </div>
              <div>
                <Label>Short description (NO)</Label>
                <Textarea rows={3} value={state.summaryNo} onChange={(e) => setState({ ...state, summaryNo: e.target.value })} />
              </div>
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
                  <Button type="button" variant="ghost" size="sm" onClick={() => setState({ ...state, heroImageUrl: "", heroImageCredit: "", heroImageCaption: "" })}>Remove</Button>
                )}
              </div>
              {state.heroImageUrl && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2">
                  <div>
                    <Label className="text-[0.7rem] text-voyage-muted">Photo credit (optional)</Label>
                    <Input
                      value={state.heroImageCredit}
                      onChange={(e) => setState({ ...state, heroImageCredit: e.target.value })}
                      placeholder="© Visit Norway / Per Kvarting"
                    />
                  </div>
                  <div>
                    <Label className="text-[0.7rem] text-voyage-muted">Caption / description (optional)</Label>
                    <Input
                      value={state.heroImageCaption}
                      onChange={(e) => setState({ ...state, heroImageCaption: e.target.value })}
                      placeholder="Sunrise over Nærøyfjord, one of Norway's most dramatic fjord landscapes"
                    />
                  </div>
                </div>
              )}
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

          {/* AUDIT */}
          <div className="mt-6 p-4 border border-parchment-3 rounded bg-voyage-white">
            <div className="flex items-center justify-between flex-wrap gap-2 mb-2">
              <div>
                <div className="font-serif text-lg font-bold flex items-center gap-2">
                  <ClipboardCheck className="w-4 h-4" /> Audit Itinerary
                </div>
                <p className="text-[0.78rem] text-voyage-muted">
                  Senior luxury travel advisor review. Step 1: get the audit report. Step 2: apply improvements.
                </p>
              </div>
              <div className="flex gap-2 flex-wrap">
                <Button variant="outline" size="sm" onClick={runAudit} disabled={auditing || applyingAudit}>
                  {auditing ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <ClipboardCheck className="w-4 h-4 mr-2" />}
                  {state.auditItems.length ? "Re-audit" : "Run Audit"}
                </Button>
                <Button
                  size="sm"
                  onClick={applyAudit}
                  disabled={
                    !state.auditItems.some((i) => i.selected) ||
                    applyingAudit ||
                    auditing ||
                    state.previousContent !== null
                  }
                  className="bg-ink text-voyage-white hover:bg-gold hover:text-ink"
                >
                  {applyingAudit ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <RefreshCcw className="w-4 h-4 mr-2" />}
                  Apply Selected ({state.auditItems.filter((i) => i.selected).length})
                </Button>
                {state.previousContent !== null && (
                  <Button variant="outline" size="sm" onClick={keepOriginalAudit} disabled={applyingAudit}>
                    <Undo2 className="w-4 h-4 mr-2" /> Keep Original
                  </Button>
                )}
              </div>
            </div>
            {state.auditItems.length ? (
              <div className="mt-2">
                <AuditChecklist
                  items={state.auditItems}
                  onToggle={toggleAuditItem}
                  onSelectAll={selectAllAudit}
                  onDeselectAll={deselectAllAudit}
                />
              </div>
            ) : (
              <p className="text-[0.78rem] text-voyage-muted italic">No audit yet — run it before publishing.</p>
            )}
            {state.auditedAt && (
              <p className="text-[0.7rem] text-voyage-muted mt-2">Last audited: {new Date(state.auditedAt).toLocaleString()}</p>
            )}
          </div>

          {/* HOTELS */}
          <div className="mt-6 p-4 border border-parchment-3 rounded bg-voyage-white">
            <div className="flex items-center justify-between flex-wrap gap-2 mb-3">
              <div>
                <div className="font-serif text-lg font-bold flex items-center gap-2">
                  <HotelIcon className="w-4 h-4" /> Hotel Recommendations
                </div>
                <p className="text-[0.78rem] text-voyage-muted">
                  Add hotels per destination or day. Appear in the published PDF and subpage if visible.
                </p>
              </div>
              <Button variant="outline" size="sm" onClick={addHotel}>
                <Plus className="w-4 h-4 mr-1" /> Add Hotel
              </Button>
            </div>

            {state.hotels.length === 0 && (
              <p className="text-[0.8rem] text-voyage-muted italic">No hotels yet — at least one is required to publish.</p>
            )}

            <div className="space-y-4">
              {state.hotels.map((h, i) => (
                <div key={h.id} className="border border-parchment-3 rounded p-3 bg-parchment/30">
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="text-[0.7rem] uppercase tracking-wider text-voyage-muted">Hotel #{i + 1}</div>
                    <div className="flex items-center gap-2">
                      <label className="flex items-center gap-1.5 text-[0.75rem] cursor-pointer">
                        <input
                          type="checkbox"
                          checked={h.visible}
                          onChange={(e) => updateHotel(h.id, { visible: e.target.checked })}
                        />
                        Show in PDF & subpage
                      </label>
                      <Button variant="ghost" size="sm" onClick={() => removeHotel(h.id)} className="text-destructive hover:text-destructive">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                    <div>
                      <Label className="text-[0.75rem]">Hotel name</Label>
                      <Input value={h.name} onChange={(e) => updateHotel(h.id, { name: e.target.value })} />
                    </div>
                    <div>
                      <Label className="text-[0.75rem]">Location / destination</Label>
                      <Input value={h.location} onChange={(e) => updateHotel(h.id, { location: e.target.value })} placeholder="e.g. Bergen · Day 2" />
                    </div>
                  </div>

                  <div className="mb-3">
                    <Label className="text-[0.75rem]">Short description</Label>
                    <Textarea
                      rows={2}
                      value={h.description}
                      onChange={(e) => updateHotel(h.id, { description: e.target.value })}
                      placeholder="2-3 sentences about character and atmosphere"
                    />
                  </div>

                  <div className="mb-3">
                    <Label className="text-[0.75rem]">Exclusive perks (one per line)</Label>
                    <Textarea
                      rows={3}
                      value={h.perks.join("\n")}
                      onChange={(e) => updateHotel(h.id, { perks: e.target.value.split("\n").map((p) => p.trim()).filter(Boolean) })}
                      placeholder={"Complimentary breakfast\nEarly check-in\nRoom upgrade subject to availability"}
                    />
                  </div>

                  <div>
                    <Label className="text-[0.75rem]">Photos (up to 3)</Label>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-1">
                      {[0, 1, 2].map((slot) => {
                        const photo = h.photos[slot];
                        return (
                          <div key={slot} className="space-y-1.5">
                            <div className="aspect-[4/3] rounded border border-parchment-3 bg-voyage-white overflow-hidden relative group">
                              {photo ? (
                                <>
                                  <img src={photo.url} alt={photo.caption || ""} className="w-full h-full object-cover" />
                                  <button
                                    type="button"
                                    onClick={() => updateHotel(h.id, { photos: h.photos.filter((_, k) => k !== slot) })}
                                    className="absolute top-1 right-1 bg-black/60 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                  >
                                    <XIcon className="w-3 h-3" />
                                  </button>
                                </>
                              ) : (
                                <label className="w-full h-full flex flex-col items-center justify-center text-voyage-muted text-[0.7rem] cursor-pointer hover:bg-parchment/50">
                                  <Upload className="w-4 h-4 mb-1" />
                                  Add photo
                                  <input
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={(e) => e.target.files?.[0] && uploadHotelPhoto(h.id, e.target.files[0])}
                                  />
                                </label>
                              )}
                            </div>
                            {photo && (
                              <>
                                <Input
                                  className="h-7 text-[0.72rem]"
                                  placeholder="Photo credit (optional)"
                                  value={photo.credit || ""}
                                  onChange={(e) => updateHotelPhoto(h.id, slot, { credit: e.target.value })}
                                />
                                <Input
                                  className="h-7 text-[0.72rem]"
                                  placeholder="Caption / description (optional)"
                                  value={photo.caption || ""}
                                  onChange={(e) => updateHotelPhoto(h.id, slot, { caption: e.target.value })}
                                />
                              </>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* CHECKLIST */}
          <div className="mt-6 p-4 border border-parchment-3 rounded bg-parchment/30">
            <div className="font-serif text-lg font-bold mb-2">Pre-publish checklist</div>
            <ul className="space-y-1.5">
              {checklist.map((c) => (
                <li key={c.key} className="flex items-center gap-2 text-[0.85rem]">
                  {c.ok ? (
                    <CheckCircle2 className="w-4 h-4 text-sage" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-destructive" />
                  )}
                  <span className={c.ok ? "text-ink-2" : "text-destructive font-medium"}>{c.label}</span>
                </li>
              ))}
            </ul>
            {!canPublish && (
              <p className="text-[0.75rem] text-destructive mt-2">
                Complete all items above to enable publishing.
              </p>
            )}
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
              <Button
                onClick={() => save(true)}
                disabled={saving || !canPublish}
                className="bg-ink text-voyage-white hover:bg-gold hover:text-ink disabled:opacity-50 disabled:cursor-not-allowed"
                title={!canPublish ? "Complete the pre-publish checklist first" : ""}
              >
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
      </>
      )}
    </div>
  );
};

export default CatalogShopManager;
