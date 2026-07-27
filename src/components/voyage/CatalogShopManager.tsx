import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import {
  Sparkles, Loader2, Upload, Eye, ClipboardCheck, RefreshCcw,
  Plus, Trash2, X as XIcon, CheckCircle2, AlertCircle, Hotel as HotelIcon, ArrowUp, ArrowDown,
  FileText, ExternalLink, Coins, ChevronDown, ShieldCheck, Copy as CopyIcon, ArrowDownToLine,
} from "lucide-react";
import AuditChecklist from "./AuditChecklist";
import VerificationTable from "./VerificationTable";
import EditorErrorBoundary from "./EditorErrorBoundary";
import PdfPreview from "./PdfPreview";
import BudgetEstimator from "./editor/BudgetEstimator";
import TravelerPersonasPanel, { PERSONA_ORIGINS, PERSONA_DESTINATIONS } from "@/components/admin/TravelerPersonasPanel";
import {
  parseAuditItems,
  serializeAuditItems,
  type SelectableAuditItem,
} from "@/lib/auditParser";
import { applyImprovementSectional, chunkAuditItems } from "@/lib/auditApply";
import { findFirstChangedHeadingText, flashEditorHighlight, scrollEditorIntoView, type ApplyItemStatus } from "@/lib/auditHighlight";
import { normalizePhotos, type PhotoMeta } from "@/lib/photoMeta";
import { sanitizeDocHtml } from "@/lib/sanitizeDocHtml";

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
  title_pt: string | null;
  title_no: string | null;
  destination: string | null;
  duration: string | null;
  price_eur: number;
  hero_image_url: string | null;
  hero_image_credit: string | null;
  hero_image_caption: string | null;
  is_published: boolean;
  updated_at: string;
  view_count: number;
  summary_en: string;
  summary_pt: string | null;
  summary_no: string | null;
  cover_intro_en?: string | null;
  cover_intro_pt?: string | null;
  cover_intro_no?: string | null;
  description_en: string;
  itinerary_content_en: string | null;
  itinerary_content_pt: string | null;
  itinerary_content_no: string | null;
  experience_type: string[] | null;
  season: string[] | null;

  hotels: any[] | null;
  audit_report: string | null;
  audited_at: string | null;
  gdoc_id?: string | null;
  gdoc_url?: string | null;
  gdoc_last_synced_at?: string | null;
  body_pdf_url?: string | null;
  subpage_checklist?: string[] | null;
  subpage_day_overview?: { label: string; description: string }[] | null;
  subpage_expectations?: { title: string; description: string }[] | null;
  stripe_product_id_sandbox?: string | null;
  stripe_product_id_live?: string | null;
  stripe_synced_at?: string | null;
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
  "Beach", "Romantic", "Family", "Wellness", "Luxury", "Wildlife", "Road Trip",
  "Photography", "Nightlife", "Festivals & Events", "Hiking", "Scenic Railways",
  "Cruises", "History", "Shopping", "Surfing", "Local Experiences", "Winter Activities",
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
  season: string[];

  duration: string;
  language: Lang;
  brief: string;
  summary: string;
  summaryPt: string;
  summaryNo: string;
  coverIntroEn: string;
  coverIntroPt: string;
  coverIntroNo: string;
  content: string;
  priceEur: string;
  priceUsd: string;
  priceBrl: string;
  priceNok: string;
  heroImageUrl: string;
  heroImageCredit: string;
  heroImageCaption: string;
  isPublished: boolean;
  hotels: HotelRec[];
  bodyPdfUrl: string;
  auditReport: string;
  auditItems: SelectableAuditItem[];
  auditedAt: string | null;
  previousContent: string | null;
  subpageChecklist: string[];
  subpageDayOverview: { label: string; description: string }[];
  subpageExpectations: { title: string; description: string }[];
  subpageMapUrl: string;
  clientOrigin: string;
  destinationMarket: string;
}


type AuditActionState = {
  status: "idle" | "running" | "error";
  message: string;
  detail?: string;
};

type FailedAuditBatch = {
  batchNumber: number;
  totalBatches: number;
  items: SelectableAuditItem[];
  message: string;
};

type ApplySummary = {
  appliedIds: string[];
  failedItems: SelectableAuditItem[];
  totalItems: number;
};

const CATALOG_AUDIT_TIMEOUT_MS = 120_000;

const blankEditor: EditorState = {
  id: null,
  title: "",
  destination: "",
  experienceType: [],
  season: [],
  duration: "",

  language: "en",
  brief: "",
  summary: "",
  summaryPt: "",
  summaryNo: "",
  coverIntroEn: "",
  coverIntroPt: "",
  coverIntroNo: "",
  content: "",
  priceEur: "0",
  priceUsd: "0",
  priceBrl: "0",
  priceNok: "0",
  heroImageUrl: "",
  heroImageCredit: "",
  heroImageCaption: "",
  isPublished: false,
  hotels: [],
  bodyPdfUrl: "",
  auditReport: "",
  auditItems: [],
  auditedAt: null,
  previousContent: null,
  subpageChecklist: [],
  subpageDayOverview: [],
  subpageExpectations: [],
  subpageMapUrl: "",
  clientOrigin: "",
  destinationMarket: "",
};


const catalogDraftPayload = (editorState: EditorState, sectionPrompt: string) => ({
  version: 1,
  state: editorState,
  sectionPrompt,
});

const catalogDraftSignature = (editorState: EditorState, sectionPrompt: string) =>
  JSON.stringify(catalogDraftPayload(editorState, sectionPrompt));

const hasCatalogDraftContent = (editorState: EditorState, sectionPrompt: string) =>
  Boolean(
    editorState.title.trim() ||
    editorState.destination.trim() ||
    editorState.duration.trim() ||
    editorState.brief.trim() ||
    editorState.summary.trim() ||
    editorState.summaryPt.trim() ||
    editorState.summaryNo.trim() ||
    editorState.content.trim() ||
    editorState.heroImageUrl.trim() ||
    editorState.hotels.length ||
    sectionPrompt.trim(),
);

type AiAssistantAction = "improve" | "shorten" | "elaborate" | "humanize";

const AiWritingAssistantPanel = () => {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [busy, setBusy] = useState<AiAssistantAction | null>(null);

  const run = async (action: AiAssistantAction, label: string) => {
    const text = input.trim();
    if (!text) {
      toast.error("Paste some text first");
      return;
    }
    setBusy(action);
    setOutput("");
    try {
      const { data, error } = await supabase.functions.invoke("ai-text-transform", {
        body: { text, action },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      const result = (data?.result as string) || "";
      setOutput(result);
      toast.success(`${label} complete`);
    } catch (e: any) {
      console.error("AI assistant error:", e);
      toast.error(e?.message || "AI request failed");
    } finally {
      setBusy(null);
    }
  };

  const copyResult = async () => {
    if (!output) return;
    try {
      await navigator.clipboard.writeText(output);
      toast.success("Copied to clipboard");
    } catch {
      toast.error("Copy failed");
    }
  };

  const actions: { key: AiAssistantAction; label: string }[] = [
    { key: "improve", label: "Polish" },
    { key: "shorten", label: "Shorten" },
    { key: "elaborate", label: "Elaborate" },
    { key: "humanize", label: "Humanize" },
  ];

  return (
    <div className="rounded border border-parchment-3 bg-voyage-white p-4 space-y-3">
      <div className="flex items-center gap-2">
        <Sparkles className="w-4 h-4 text-gold" />
        <div className="font-medium text-ink text-[0.92rem]">AI Writing Assistant</div>
        <span className="text-[0.7rem] text-voyage-muted">Standalone — does not affect the itinerary</span>
      </div>
      <Textarea
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="Paste any text here…"
        rows={6}
        className="text-[0.85rem]"
      />
      <div className="flex flex-wrap gap-2">
        {actions.map((a) => (
          <Button
            key={a.key}
            type="button"
            size="sm"
            variant="outline"
            onClick={() => run(a.key, a.label)}
            disabled={busy !== null || !input.trim()}
          >
            {busy === a.key ? <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5 mr-1.5" />}
            {a.label}
          </Button>
        ))}
      </div>
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label className="text-[0.78rem] text-voyage-muted">Result</Label>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={copyResult}
            disabled={!output}
          >
            <CopyIcon className="w-3.5 h-3.5 mr-1.5" /> Copy
          </Button>
        </div>
        <Textarea
          value={output}
          onChange={(e) => setOutput(e.target.value)}
          placeholder="AI result will appear here…"
          rows={8}
          className="text-[0.85rem] bg-parchment/30"
        />
      </div>
    </div>
  );
};

const CatalogShopManager = () => {
  const qc = useQueryClient();
  const { t } = useTranslation();
  const [tab, setTab] = useState<"itineraries" | "suggestions">("itineraries");
  const [search, setSearch] = useState("");
  const [editorOpen, setEditorOpen] = useState(false);
  const [state, setState] = useState<EditorState>(blankEditor);
  const [budget, setBudget] = useState<import("./editor/BudgetEstimator").BudgetData | null>(null);
  const [budgetCoverLabel, setBudgetCoverLabel] = useState<string | null>(null);
  const [budgetOpen, setBudgetOpen] = useState(false);
  const [bodySnapshotOpen, setBodySnapshotOpen] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [sectionPrompt, setSectionPrompt] = useState("");
  const [regenerating, setRegenerating] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const [previewRow, setPreviewRow] = useState<CatalogRow | null>(null);
  const [previewLang, setPreviewLang] = useState<Lang>("en");
  const [auditing, setAuditing] = useState(false);
  const [applyingAudit, setApplyingAudit] = useState(false);
  const [syncingStripeId, setSyncingStripeId] = useState<string | null>(null);
  const [auditAction, setAuditAction] = useState<AuditActionState>({ status: "idle", message: "" });
  const [failedAuditBatch, setFailedAuditBatch] = useState<FailedAuditBatch | null>(null);
  const [itemStatuses, setItemStatuses] = useState<Record<string, ApplyItemStatus>>({});
  const [applySummary, setApplySummary] = useState<ApplySummary | null>(null);
  const [closeConfirmOpen, setCloseConfirmOpen] = useState(false);
  const [lastPersistedSignature, setLastPersistedSignature] = useState(() => catalogDraftSignature(blankEditor, ""));
  const [lastAutoSavedAt, setLastAutoSavedAt] = useState<string | null>(null);
  const [autoSaveStatus, setAutoSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [autoSaveError, setAutoSaveError] = useState("");
  const [restoredNotice, setRestoredNotice] = useState("");
  const autoSaveIntervalRef = useRef<number | null>(null);
  const latestStateRef = useRef(state);
  const latestSectionPromptRef = useRef(sectionPrompt);
  const latestEditorOpenRef = useRef(editorOpen);
  const [gdocInfo, setGdocInfo] = useState<{ id: string | null; url: string | null; lastSyncedAt: string | null }>({ id: null, url: null, lastSyncedAt: null });
  const [gdocSyncing, setGdocSyncing] = useState(false);
  const [gdocError, setGdocError] = useState<string | null>(null);
  const [gdocConflict, setGdocConflict] = useState<{ docModifiedTime: string; lastSyncedAt: string | null; url: string | null; acknowledged: boolean } | null>(null);
  const [gdocChecking, setGdocChecking] = useState(false);
  const [gdocPulling, setGdocPulling] = useState(false);
  const [pullConfirmOpen, setPullConfirmOpen] = useState(false);
  // Finalise & Preview PDF: pulls the Google Doc as HTML, sanitises it, and
  // opens the PDF preview. Read-only — Doc content is never persisted to the
  // app database; it only feeds Paged.js for the preview.
  const [finalising, setFinalising] = useState(false);
  const [finalisedHtml, setFinalisedHtml] = useState<string | null>(null);
  const [docMissingError, setDocMissingError] = useState<string | null>(null);

  const finaliseAndPreview = async () => {
    if (!state.id) { toast.error("Save the itinerary first."); return; }
    if (!gdocInfo.id) {
      toast.error("Create the Google Doc first (use the Save button to push initial content).");
      return;
    }
    setFinalising(true);
    setDocMissingError(null);
    try {
      const { data, error } = await supabase.functions.invoke("gdrive-sync-itinerary", {
        body: { itinerary_id: state.id, action: "export-html" },
      });
      if (error) throw error;
      if ((data as any)?.error) throw new Error((data as any).error);
      const rawHtml: string = (data as any).html ?? "";
      const clean = sanitizeDocHtml(rawHtml);
      setFinalisedHtml(clean);
      if ((data as any).doc_modified_time) {
        setGdocInfo((prev) => ({ ...prev, lastSyncedAt: (data as any).doc_modified_time }));
      }
    } catch (e: any) {
      const msg = e?.message || "Could not fetch Google Doc content.";
      setDocMissingError(msg);
      toast.error(msg);
    } finally {
      setFinalising(false);
    }
  };


  const saveSnapshot = async (itineraryId: string, label: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    const payload = catalogDraftPayload(
      { ...latestStateRef.current, id: itineraryId },
      latestSectionPromptRef.current,
    );
    const { error } = await supabase
      .from("catalog_itinerary_snapshots" as any)
      .insert({
        itinerary_id: itineraryId,
        label,
        draft: payload as any,
        created_by: user?.id ?? null,
      } as any);
    if (error) throw error;
  };

  const pullFromGoogleDoc = async (itineraryId: string) => {
    setGdocPulling(true);
    setGdocError(null);
    try {
      // 1. Safety snapshot of current editor state BEFORE replacing anything.
      const snapshotLabel = `Before Google Doc import — ${new Date().toLocaleString()}`;
      await saveSnapshot(itineraryId, snapshotLabel);

      // 2. Fetch HTML from the Google Doc (preserves <a href> links which the
      //    markdown export sometimes drops).
      const { data, error } = await supabase.functions.invoke("gdrive-sync-itinerary", {
        body: { itinerary_id: itineraryId, action: "export-html", language: state.language },
      });
      if (error) throw error;
      if ((data as any)?.error) throw new Error((data as any).error);
      const rawHtml: string = (data as any).html ?? "";

      // 3. Sanitize the exported HTML: strip Google's inline styles, wrapper
      //    <span>/<div>, boilerplate, and image tags (Google image URLs require
      //    auth and 403 in the customer PDF — images stay app-managed).
      const sanitizedHtml = sanitizeDocHtml(rawHtml);
      const linkCount = (sanitizedHtml.match(/<a\s+href=/gi) || []).length;
      const imagesSkipped = (rawHtml.match(/<img\b/gi) || []).length;

      // 4. Convert to markdown so it round-trips with the rest of the editor
      //    content pipeline (preview, resync, PDF).
      const { htmlToMarkdown } = await import("./editor/markdownHelpers");
      const md = htmlToMarkdown(sanitizedHtml);

      // 5. Replace editor content. Other fields (title, hotels, cover, etc.)
      //    remain app-managed; the Google Doc only mirrors narrative copy.
      setState((s) => ({ ...s, content: md, previousContent: s.content }));

      // 6. Persist a draft immediately so the import survives reloads.
      await persistCatalogDraft(true);

      // 7. Update sync metadata and clear the conflict banner.
      setGdocInfo((prev) => ({
        ...prev,
        id: (data as any).gdoc_id ?? prev.id,
        url: (data as any).gdoc_url ?? prev.url,
        lastSyncedAt: (data as any).doc_modified_time ?? new Date().toISOString(),
      }));
      setGdocConflict(null);
      toast.success("Google Doc changes imported successfully", {
        description: `${linkCount} link${linkCount === 1 ? "" : "s"} preserved · ${imagesSkipped} image${imagesSkipped === 1 ? "" : "s"} skipped · backup snapshot "${snapshotLabel}" saved.`,
      });
    } catch (e: any) {
      setGdocError(e?.message || "Google Doc import failed");
      toast.error(e?.message || "Google Doc import failed");
    } finally {
      setGdocPulling(false);
      setPullConfirmOpen(false);
    }
  };



  const checkGoogleDocFreshness = async (itineraryId: string) => {
    setGdocChecking(true);
    try {
      const { data, error } = await supabase.functions.invoke("gdrive-sync-itinerary", {
        body: { itinerary_id: itineraryId, action: "check" },
      });
      if (error) throw error;
      if ((data as any)?.error) throw new Error((data as any).error);
      const d = data as any;
      if (d?.gdoc_url) {
        setGdocInfo((prev) => ({ ...prev, url: d.gdoc_url, id: d.gdoc_id ?? prev.id }));
      }
      if (d?.conflict && d?.doc_modified_time) {
        setGdocConflict({
          docModifiedTime: d.doc_modified_time,
          lastSyncedAt: d.last_synced_at ?? null,
          url: d.gdoc_url ?? null,
          acknowledged: false,
        });
      } else {
        setGdocConflict(null);
      }
    } catch (e: any) {
      // Non-blocking: a failed freshness check should not prevent editing.
      console.warn("Google Doc freshness check failed", e);
    } finally {
      setGdocChecking(false);
    }
  };

  const syncToGoogleDoc = async (itineraryId: string, opts?: { notify?: boolean }) => {
    setGdocSyncing(true);
    setGdocError(null);
    try {
      const { data, error } = await supabase.functions.invoke("gdrive-sync-itinerary", {
        body: { itinerary_id: itineraryId, action: "sync", language: state.language },
      });
      if (error) throw error;
      if ((data as any)?.error) throw new Error((data as any).error);
      setGdocInfo({
        id: (data as any).gdoc_id ?? null,
        url: (data as any).gdoc_url ?? null,
        lastSyncedAt: (data as any).synced_at ?? new Date().toISOString(),
      });
      setGdocConflict(null);
      if (opts?.notify) {
        toast.success("Google Doc resynced with latest editor content.");
      }
    } catch (e: any) {
      setGdocError(e?.message || "Google Drive sync failed");
      if (opts?.notify) toast.error(e?.message || "Google Drive sync failed");
    } finally {
      setGdocSyncing(false);
    }
  };


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
        .select("id, slug, title_en, title_pt, title_no, destination, duration, price_eur, price_usd, price_brl, price_nok, hero_image_url, hero_image_credit, hero_image_caption, is_published, updated_at, view_count, summary_en, summary_pt, summary_no, cover_intro_en, cover_intro_pt, cover_intro_no, description_en, itinerary_content_en, itinerary_content_pt, itinerary_content_no, experience_type, season, hotels, audit_report, audited_at, gdoc_id, gdoc_url, gdoc_last_synced_at, body_pdf_url, pdf_path, subpage_checklist, subpage_day_overview, subpage_expectations, stripe_product_id_sandbox, stripe_product_id_live, stripe_synced_at")
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

  const readFunctionError = async (res: Response) => {
    const raw = await res.text().catch(() => "");
    if (!raw) return `Request failed (${res.status})`;
    try {
      const parsed = JSON.parse(raw);
      return parsed?.error || parsed?.message || raw;
    } catch {
      return raw;
    }
  };

  const getFunctionHeaders = async () => {
    const { data: sess } = await supabase.auth.getSession();
    const token = sess?.session?.access_token;
    return {
      "Content-Type": "application/json",
      apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
  };

  const isAuditBusy = auditing || applyingAudit;
  const currentDraftSignature = useMemo(() => catalogDraftSignature(state, sectionPrompt), [state, sectionPrompt]);
  const hasUnsavedChanges = currentDraftSignature !== lastPersistedSignature;

  useEffect(() => {
    latestStateRef.current = state;
    latestSectionPromptRef.current = sectionPrompt;
    latestEditorOpenRef.current = editorOpen;
  }, [state, sectionPrompt, editorOpen]);

  // Budget per catalog row (persisted in localStorage)
  useEffect(() => {
    import("@/lib/itineraryBudgetStore").then(({ loadBudget }) => {
      const id = state.id || null;
      const { budget, coverLabel } = loadBudget(id);
      setBudget(budget);
      setBudgetCoverLabel(coverLabel);
    });
  }, [state.id]);

  const handleBudgetSaved = useCallback(
    (b: import("./editor/BudgetEstimator").BudgetData | null, lbl: string | null) => {
      setBudget(b);
      setBudgetCoverLabel(lbl);
      import("@/lib/itineraryBudgetStore").then(({ saveBudget }) => {
        saveBudget(state.id || null, { budget: b, coverLabel: lbl });
      });
      // Persist cover-label to the DB so it feeds both the PDF cover and the subpage.
      if (state.id) {
        supabase
          .from("catalog_itineraries")
          .update({ estimated_trip_budget: lbl } as any)
          .eq("id", state.id)
          .then(({ error }) => {
            if (error) console.error("Failed to persist estimated_trip_budget", error);
          });
      }
    },
    [state.id],
  );

  const loadCatalogDraft = async (itineraryId: string) => {
    const { data, error } = await supabase
      .from("catalog_itinerary_drafts")
      .select("draft, updated_at")
      .eq("itinerary_id", itineraryId)
      .maybeSingle();
    if (error || !data?.draft) return null;
    return data as unknown as { draft: { state?: Partial<EditorState>; sectionPrompt?: string }; updated_at: string };
  };

  const persistCatalogDraft = useCallback(async (silent = true) => {
    const draftState = latestStateRef.current;
    const draftSectionPrompt = latestSectionPromptRef.current;
    if (!latestEditorOpenRef.current || isAuditBusy || !hasCatalogDraftContent(draftState, draftSectionPrompt)) return;
    setAutoSaveStatus("saving");
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const slugBase = slugify(draftState.title || draftState.destination || "untitled-catalogue-itinerary");
      let itineraryId = draftState.id;
      if (!itineraryId) {
        const title = draftState.title.trim() || "Untitled catalogue itinerary";
        const { data, error } = await supabase
          .from("catalog_itineraries")
          .insert({
            title_en: title,
            slug: `${slugBase}-${Date.now().toString(36)}`,
            summary_en: draftState.summary || "",
            description_en: "",
            what_you_get_en: "",
            is_published: false,
            price_eur: Number(draftState.priceEur) || 0,
            price_usd: Number(draftState.priceUsd) || 0,
            price_brl: Number(draftState.priceBrl) || 0,
            price_nok: Number(draftState.priceNok) || 0,
            primary_language: draftState.language,
          } as any)
          .select("id")
          .single();
        if (error) throw error;
        itineraryId = data.id;
        setState((s) => ({ ...s, id: data.id, title }));
      } else {
        // Keep primary_language in sync if the user changes the dropdown
        // before hitting Save — auto-save shouldn't leave a stale 'en'.
        await supabase
          .from("catalog_itineraries")
          .update({ primary_language: draftState.language } as any)
          .eq("id", itineraryId);
      }
      const signature = catalogDraftSignature({ ...draftState, id: itineraryId }, draftSectionPrompt);
      const { error } = await supabase
        .from("catalog_itinerary_drafts")
        .upsert({
          itinerary_id: itineraryId,
          language: draftState.language,
          draft: catalogDraftPayload({ ...draftState, id: itineraryId }, draftSectionPrompt) as any,
          updated_by: user?.id || null,
        } as any, { onConflict: "itinerary_id" });
      if (error) throw error;
      const now = new Date().toISOString();
      setLastPersistedSignature(signature);
      setLastAutoSavedAt(now);
      setAutoSaveStatus("saved");
      setAutoSaveError("");
      if (!silent) toast.success("Draft auto-saved");
    } catch (e: any) {
      setAutoSaveStatus("error");
      setAutoSaveError(e?.message || "Auto-save failed");
      if (!silent) toast.error(e?.message || "Auto-save failed");
    }
  }, [isAuditBusy]);

  const requestEditorClose = () => {
    if (isAuditBusy || saving || generating || regenerating || uploading) {
      toast.info("Please wait for the current action to finish before closing the editor.");
      return;
    }
    if (hasUnsavedChanges) {
      setCloseConfirmOpen(true);
      return;
    }
    setEditorOpen(false);
  };

  const closeEditorAnyway = () => {
    setCloseConfirmOpen(false);
    setEditorOpen(false);
  };

  useEffect(() => {
    if (!editorOpen) return;
    autoSaveIntervalRef.current = window.setInterval(() => {
      persistCatalogDraft(true);
    }, 30_000);
    return () => {
      if (autoSaveIntervalRef.current) window.clearInterval(autoSaveIntervalRef.current);
      autoSaveIntervalRef.current = null;
    };
  }, [editorOpen, persistCatalogDraft]);

  const openCreate = () => {
    setState(blankEditor);
    setSectionPrompt("");
    setAuditAction({ status: "idle", message: "" });
    setFailedAuditBatch(null);
    setItemStatuses({});
    setApplySummary(null);
    setLastPersistedSignature(catalogDraftSignature(blankEditor, ""));
    setLastAutoSavedAt(null);
    setAutoSaveStatus("idle");
    setAutoSaveError("");
    setRestoredNotice("");
    setCloseConfirmOpen(false);
    setGdocInfo({ id: null, url: null, lastSyncedAt: null });
    setGdocError(null);
    setGdocConflict(null);
    setEditorOpen(true);
  };

  const openEdit = async (r: CatalogRow) => {
    const primaryLang = (r as any).primary_language as Lang | undefined;
    const lang: Lang =
      primaryLang === "pt" || primaryLang === "no" || primaryLang === "en"
        ? primaryLang
        : (r.itinerary_content_no ? "no" : r.itinerary_content_pt ? "pt" : "en");
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
    const baseState: EditorState = {
      id: r.id,
      title: r.title_en || "",
      destination: r.destination || "",
      experienceType: Array.isArray(r.experience_type) ? r.experience_type : r.experience_type ? [r.experience_type] : [],
      season: Array.isArray(r.season) ? r.season : r.season ? [r.season] : [],
      duration: r.duration || "",

      language: lang,
      brief: "",
      summary: r.summary_en || "",
      summaryPt: r.summary_pt || "",
      summaryNo: r.summary_no || "",
      coverIntroEn: (r as any).cover_intro_en || "",
      coverIntroPt: (r as any).cover_intro_pt || "",
      coverIntroNo: (r as any).cover_intro_no || "",
      content,
      priceEur: String(r.price_eur ?? 0),
      priceUsd: String((r as any).price_usd ?? 0),
      priceBrl: String((r as any).price_brl ?? 0),
      priceNok: String((r as any).price_nok ?? 0),
      heroImageUrl: r.hero_image_url || "",
      heroImageCredit: (r as any).hero_image_credit || "",
      heroImageCaption: (r as any).hero_image_caption || "",
      isPublished: r.is_published,
      hotels,
      bodyPdfUrl: (r as any).body_pdf_url || "",
      auditReport: r.audit_report || "",
      auditItems: parseAuditItems(r.audit_report).map((i) => ({ ...i, selected: true })),
      auditedAt: r.audited_at || null,
      previousContent: null,
      subpageChecklist: Array.isArray((r as any).subpage_checklist)
        ? ((r as any).subpage_checklist as any[]).map((s) => String(s ?? "")).filter((s) => s.trim().length > 0)
        : [],
      subpageDayOverview: Array.isArray((r as any).subpage_day_overview)
        ? ((r as any).subpage_day_overview as any[])
            .map((d) => ({
              label: String(d?.label ?? ""),
              description: String(d?.description ?? ""),
            }))
        : [],
      subpageExpectations: Array.isArray((r as any).subpage_expectations)
        ? ((r as any).subpage_expectations as any[])
            .map((e) => ({
              title: String(e?.title ?? ""),
              description: String(e?.description ?? ""),
            }))
        : [],
      subpageMapUrl: String((r as any).subpage_map_url || ""),
      clientOrigin: "",
      destinationMarket: r.destination ? String(r.destination).toLowerCase() : "",
    };

    let nextState = baseState;
    let nextSectionPrompt = "";
    let restoredAt: string | null = null;
    try {
      const savedDraft = await loadCatalogDraft(r.id);
      if (savedDraft?.draft?.state) {
        nextState = { ...baseState, ...savedDraft.draft.state, id: r.id } as EditorState;
        nextSectionPrompt = savedDraft.draft.sectionPrompt || "";
        restoredAt = savedDraft.updated_at;
      }
    } catch {
      // Recovery should never block opening the editor.
    }
    setState(nextState);
    setSectionPrompt(nextSectionPrompt);
    setAuditAction({ status: "idle", message: "" });
    setFailedAuditBatch(null);
    setItemStatuses({});
    setApplySummary(null);
    setLastPersistedSignature(catalogDraftSignature(nextState, nextSectionPrompt));
    setLastAutoSavedAt(restoredAt);
    setAutoSaveStatus(restoredAt ? "saved" : "idle");
    setAutoSaveError("");
    setRestoredNotice(restoredAt ? `Draft restored from ${new Date(restoredAt).toLocaleString()}` : "");
    setCloseConfirmOpen(false);
    setGdocInfo({
      id: (r as any).gdoc_id ?? null,
      url: (r as any).gdoc_url ?? null,
      lastSyncedAt: (r as any).gdoc_last_synced_at ?? null,
    });
    setGdocError(null);
    setGdocConflict(null);
    setEditorOpen(true);
    // Fire-and-forget freshness check: warn if the Google Doc has newer edits than our last sync.
    if ((r as any).gdoc_id) {
      void checkGoogleDocFreshness(r.id);
    }
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

  const runAutoMetadata = async (itineraryText: string) => {
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
        mode: "metadata",
        title: state.title,
        destination: state.destination,
        experience_type: state.experienceType.join(", "),
        duration: state.duration,
        brief: state.brief,
        language: state.language,
        existing_content: itineraryText,
      }),
    });
    if (!res.ok) {
      const errText = await res.text().catch(() => "");
      throw new Error(errText || `Metadata generation failed (${res.status})`);
    }
    const data = await res.json();
    const checklist = Array.isArray(data.subpage_checklist)
      ? (data.subpage_checklist as any[]).map((s) => String(s ?? "").trim()).filter((s) => s.length > 0)
      : [];
    const dayOverview = Array.isArray(data.subpage_day_overview)
      ? (data.subpage_day_overview as any[])
          .map((d) => ({
            label: String(d?.label ?? "").trim(),
            description: String(d?.description ?? "").trim(),
          }))
          .filter((d) => d.label.length > 0 || d.description.length > 0)
      : [];
    const expectations = Array.isArray(data.subpage_expectations)
      ? (data.subpage_expectations as any[])
          .map((e) => ({
            title: String(e?.title ?? "").trim(),
            description: String(e?.description ?? "").trim(),
          }))
          .filter((e) => e.title.length > 0 || e.description.length > 0)
      : [];
    setState((s) => ({
      ...s,
      coverIntroEn: data.cover_intro_en || s.coverIntroEn,
      coverIntroPt: data.cover_intro_pt || s.coverIntroPt,
      coverIntroNo: data.cover_intro_no || s.coverIntroNo,
      summary: data.summary_en || s.summary,
      summaryPt: data.summary_pt || s.summaryPt,
      summaryNo: data.summary_no || s.summaryNo,
      subpageChecklist: checklist.length > 0 ? checklist : s.subpageChecklist,
      subpageDayOverview: dayOverview.length > 0 ? dayOverview : s.subpageDayOverview,
      subpageExpectations: expectations.length > 0 ? expectations : s.subpageExpectations,
    }));
    if (state.id) {
      await supabase
        .from("catalog_itineraries")
        .update({
          subpage_checklist: checklist,
          subpage_day_overview: dayOverview,
          subpage_expectations: expectations,
        })
        .eq("id", state.id);
    }
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
        client_origin: state.clientOrigin || undefined,
        destination_market: state.destinationMarket || undefined,
        mode: "full",
      });
      if (!text) throw new Error("No content returned");
      setState((s) => ({ ...s, content: text }));
      toast.success("Itinerary generated. Writing cover intro & short descriptions…");
      // Push regenerated body into DB + Google Doc. The sync function is
      // self-healing: if the Doc or folder was deleted manually in Drive it
      // recreates them and updates gdoc_id/gdrive_folder_id automatically.
      if (state.id) {
        const contentField =
          state.language === "pt" ? "itinerary_content_pt"
          : state.language === "no" ? "itinerary_content_no"
          : "itinerary_content_en";
        try {
          await supabase
            .from("catalog_itineraries")
            .update({ [contentField]: text } as any)
            .eq("id", state.id);
          await syncToGoogleDoc(state.id);
          toast.success(gdocInfo.id ? "Google Doc updated." : "Google Doc created and content pushed.");
        } catch (syncErr: any) {
          toast.error(syncErr?.message || "Could not sync to Google Doc");
        }
      }
      runAutoMetadata(text)
        .then(() => toast.success("Cover intro & short descriptions filled in for EN · PT · NO"))
        .catch((err) => toast.error(err?.message || "Could not generate cover intro / summaries"));
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
    const currentContent = state.content;
    setAuditing(true);
    setAuditAction({ status: "running", message: "Auditing itinerary… Your current draft is being kept in the editor." });
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), CATALOG_AUDIT_TIMEOUT_MS);
    try {
      const res = await fetch(`https://${import.meta.env.VITE_SUPABASE_PROJECT_ID}.functions.supabase.co/audit-itinerary-claude`, {
        method: "POST",
        headers: await getFunctionHeaders(),
        signal: controller.signal,
        body: JSON.stringify({ content: currentContent, mode: "audit", language: state.language }),
      });
      if (!res.ok) throw new Error(await readFunctionError(res));
      const data = await res.json().catch(() => null);
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
      setAuditAction({ status: "idle", message: "" });
      toast.success("Audit complete — pick which improvements to apply.");
    } catch (e: any) {
      const message = e?.name === "AbortError" ? "Audit timed out. Your draft was preserved — please retry." : e?.message || "Audit failed. Your draft was preserved.";
      setAuditAction({ status: "error", message, detail: "No editor content was changed." });
      toast.error(message);
    } finally {
      window.clearTimeout(timeout);
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

  const runApplyBatches = async (
    itemsToApply: SelectableAuditItem[],
    startingContent: string,
    opts: { resetStatuses: boolean },
  ) => {
    const batches = chunkAuditItems(itemsToApply, 1);
    let workingContent = startingContent;
    const url = `https://${import.meta.env.VITE_SUPABASE_PROJECT_ID}.functions.supabase.co/audit-itinerary-claude`;
    const appliedIds: string[] = [];
    const failedItems: SelectableAuditItem[] = [];

    setItemStatuses((prev) => {
      const next: Record<string, ApplyItemStatus> = opts.resetStatuses ? {} : { ...prev };
      for (const it of itemsToApply) next[it.id] = "pending";
      return next;
    });

    for (let i = 0; i < batches.length; i++) {
      const batch = batches[i];
      const item = batch[0];
      setItemStatuses((prev) => {
        const next = { ...prev };
        for (const it of batch) next[it.id] = "applying";
        return next;
      });
      setAuditAction({
        status: "running",
        message: `Applying improvement ${i + 1} of ${batches.length}…`,
        detail: i > 0
          ? `${i} improvement${i === 1 ? "" : "s"} already applied — only the affected sections were rewritten.`
          : "Only the affected section(s) are being rewritten — your draft stays visible.",
      });
      const controller = new AbortController();
      const timeout = window.setTimeout(() => controller.abort(), CATALOG_AUDIT_TIMEOUT_MS);
      try {
        const headers = await getFunctionHeaders();
        const result = await applyImprovementSectional({
          url,
          headers,
          signal: controller.signal,
          content: workingContent,
          improvement: item,
          extras: { language: state.language },
        });
        const previousContent = workingContent;
        workingContent = result.newContent;
        const batchIds = new Set(batch.map((b) => b.id));
        setState((s) => ({
          ...s,
          previousContent: s.previousContent ?? startingContent,
          content: result.newContent,
          auditItems: s.auditItems.map((it) => (batchIds.has(it.id) ? { ...it, selected: false } : it)),
        }));
        setItemStatuses((prev) => {
          const next = { ...prev };
          for (const it of batch) next[it.id] = "applied";
          return next;
        });
        for (const it of batch) appliedIds.push(it.id);
        flashEditorHighlight(result.changedHeading ?? findFirstChangedHeadingText(previousContent, result.newContent));
      } catch (e: any) {
        const message = e?.name === "AbortError"
          ? `Improvement ${i + 1} timed out. Successfully applied improvements were preserved.`
          : e?.message || `Improvement ${i + 1} failed.`;
        setItemStatuses((prev) => {
          const next = { ...prev };
          for (const it of batch) next[it.id] = "failed";
          return next;
        });
        setFailedAuditBatch({ batchNumber: i + 1, totalBatches: batches.length, items: batch, message });
        setAuditAction({
          status: "error",
          message: `Improvement ${i + 1} of ${batches.length} failed.`,
          detail: `${message} Retry this item to continue without losing applied changes.`,
        });
        for (const it of batch) failedItems.push(it);
        toast.error(`Improvement ${i + 1} of ${batches.length} failed — applied changes were preserved.`);
        return { appliedIds, failedItems, stoppedEarly: true };
      } finally {
        window.clearTimeout(timeout);
      }
    }
    return { appliedIds, failedItems, stoppedEarly: false };
  };

  const persistAuditedContentAndSync = async (auditedContent: string) => {
    if (!state.id) return;
    const contentField =
      state.language === "no" ? "itinerary_content_no"
      : state.language === "pt" ? "itinerary_content_pt"
      : "itinerary_content_en";
    try {
      const { error } = await supabase
        .from("catalog_itineraries")
        .update({ [contentField]: auditedContent } as any)
        .eq("id", state.id);
      if (error) throw error;
      setLastPersistedSignature(catalogDraftSignature({ ...state, content: auditedContent }, sectionPrompt));
      setLastAutoSavedAt(new Date().toISOString());
      setAutoSaveStatus("saved");
      await syncToGoogleDoc(state.id);
    } catch (e: any) {
      toast.error(e?.message || "Failed to save audited content to Google Doc.");
    }
  };

  const applyAudit = async () => {
    const selected = state.auditItems.filter((i) => i.selected);
    if (!selected.length || !state.content.trim()) {
      toast.error("Select at least one improvement to apply.");
      return;
    }
    setApplyingAudit(true);
    setFailedAuditBatch(null);
    setApplySummary(null);
    const original = state.content;
    try {
      const result = await runApplyBatches(selected, original, { resetStatuses: true });
      if (!result.stoppedEarly) {
        setAuditAction({ status: "idle", message: "" });
        setApplySummary({ appliedIds: result.appliedIds, failedItems: [], totalItems: selected.length });
        toast.success(`${result.appliedIds.length} of ${selected.length} improvements applied.`);
        // Persist audited editor content to DB and push to Google Doc.
        setState((s) => {
          void persistAuditedContentAndSync(s.content);
          return s;
        });
      } else {
        setApplySummary({
          appliedIds: result.appliedIds,
          failedItems: result.failedItems,
          totalItems: selected.length,
        });
      }
    } catch (e: any) {
      const message = e?.message || "Failed to apply improvements. Your draft was preserved.";
      setAuditAction({ status: "error", message, detail: "The editor content was not cleared or closed." });
      toast.error(message);
    } finally {
      setApplyingAudit(false);
    }
  };


  const retryFailedAuditBatch = async () => {
    if (!failedAuditBatch || !state.content.trim()) return;
    setApplyingAudit(true);
    try {
      const result = await runApplyBatches(failedAuditBatch.items, state.content, { resetStatuses: false });
      if (!result.stoppedEarly) {
        setFailedAuditBatch(null);
        setAuditAction({ status: "idle", message: "" });
        setApplySummary((prev) => prev ? {
          ...prev,
          appliedIds: [...prev.appliedIds, ...result.appliedIds],
          failedItems: prev.failedItems.filter((f) => !result.appliedIds.includes(f.id)),
        } : null);
        toast.success("Failed items applied successfully.");
      }
    } finally {
      setApplyingAudit(false);
    }
  };

  const retryFailedItems = async () => {
    if (!applySummary?.failedItems.length || !state.content.trim()) return;
    setApplyingAudit(true);
    setFailedAuditBatch(null);
    const toRetry = applySummary.failedItems;
    try {
      const result = await runApplyBatches(toRetry, state.content, { resetStatuses: false });
      if (!result.stoppedEarly) {
        setAuditAction({ status: "idle", message: "" });
        setApplySummary((prev) => prev ? {
          ...prev,
          appliedIds: [...prev.appliedIds, ...result.appliedIds],
          failedItems: [],
        } : null);
        toast.success("Previously failed improvements applied.");
      } else {
        setApplySummary((prev) => prev ? {
          ...prev,
          appliedIds: [...prev.appliedIds, ...result.appliedIds],
          failedItems: result.failedItems,
        } : null);
      }
    } finally {
      setApplyingAudit(false);
    }
  };

  const viewUpdatedItinerary = () => {
    setApplySummary(null);
    setAuditAction({ status: "idle", message: "" });
    if (gdocInfo.url) {
      window.open(gdocInfo.url, "_blank", "noopener,noreferrer");
    } else {
      toast.info("Google Doc link not ready yet — give the sync a moment and try again.");
      scrollEditorIntoView();
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
      setState((s) => ({ ...s, heroImageUrl: data.publicUrl, heroImageCredit: "", heroImageCaption: "" }));
      toast.success("Cover uploaded");
    } catch (e: any) {
      toast.error(e?.message || "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const [bodyPdfUploading, setBodyPdfUploading] = useState(false);

  const uploadBodyPdf = async (file: File) => {
    if (file.type !== "application/pdf") {
      toast.error("Please upload a PDF file.");
      return;
    }
    setBodyPdfUploading(true);
    try {
      const path = `body-pdfs/${crypto.randomUUID()}.pdf`;
      const { error } = await supabase.storage.from("catalog-images").upload(path, file, {
        cacheControl: "3600", upsert: false, contentType: "application/pdf",
      });
      if (error) throw error;
      const { data } = supabase.storage.from("catalog-images").getPublicUrl(path);
      setState((s) => ({ ...s, bodyPdfUrl: data.publicUrl }));
      toast.success("Body PDF uploaded");
    } catch (e: any) {
      toast.error(e?.message || "PDF upload failed");
    } finally {
      setBodyPdfUploading(false);
    }
  };

  const removeBodyPdf = () => setState((s) => ({ ...s, bodyPdfUrl: "" }));

  const [previewMergedOpen, setPreviewMergedOpen] = useState(false);

  const uploadHotelPhoto = async (hotelId: string, slot: number, file: File) => {
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
        hotels: s.hotels.map((h) => {
          if (h.id !== hotelId) return h;
          const next = [...h.photos];
          while (next.length <= slot) next.push({ url: "", credit: "", caption: "" });
          next[slot] = { url: data.publicUrl, credit: next[slot]?.credit || "", caption: next[slot]?.caption || "" };
          return { ...h, photos: next.slice(0, 3) };
        }),
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

  const moveHotel = (id: string, direction: -1 | 1) =>
    setState((s) => {
      const idx = s.hotels.findIndex((h) => h.id === id);
      if (idx < 0) return s;
      const newIdx = idx + direction;
      if (newIdx < 0 || newIdx >= s.hotels.length) return s;
      const next = [...s.hotels];
      [next[idx], next[newIdx]] = [next[newIdx], next[idx]];
      return { ...s, hotels: next };
    });

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
    {
      key: "price",
      label: "Prices set for EUR, USD, BRL and NOK (distinct real values)",
      ok:
        Number(s.priceEur) > 0 &&
        Number(s.priceUsd) > 0 && Number(s.priceUsd) !== Number(s.priceEur) &&
        Number(s.priceBrl) > 0 && Number(s.priceBrl) !== Number(s.priceEur) &&
        Number(s.priceNok) > 0 && Number(s.priceNok) !== Number(s.priceEur),
    },
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
        cover_intro_en: state.coverIntroEn || null,
        cover_intro_pt: state.coverIntroPt || null,
        cover_intro_no: state.coverIntroNo || null,
        destination: state.destination || null,
        duration: state.duration || null,
        experience_type: state.experienceType.length ? state.experienceType : null,
        season: state.season.length ? state.season : null,
        price_eur: Number(state.priceEur) || 0,
        price_usd: Number(state.priceUsd) || 0,
        price_brl: Number(state.priceBrl) || 0,
        price_nok: Number(state.priceNok) || 0,

        hero_image_url: state.heroImageUrl || null,
        hero_image_credit: state.heroImageCredit || null,
        hero_image_caption: state.heroImageCaption || null,
        is_published: publish !== undefined ? publish : state.isPublished,
        slug,
        hotels: state.hotels,
        body_pdf_url: state.bodyPdfUrl || null,
        audit_report: state.auditReport || null,
        audited_at: state.auditedAt,
        subpage_checklist: state.subpageChecklist.filter((s) => s.trim().length > 0),
        subpage_day_overview: state.subpageDayOverview
          .map((d) => ({ label: (d.label || "").trim(), description: (d.description || "").trim() }))
          .filter((d) => d.label.length > 0 || d.description.length > 0),
        subpage_expectations: state.subpageExpectations
          .map((e) => ({ title: (e.title || "").trim(), description: (e.description || "").trim() }))
          .filter((e) => e.title.length > 0 || e.description.length > 0),
        subpage_map_url: state.subpageMapUrl.trim() || null,
        estimated_trip_budget: budgetCoverLabel,
        primary_language: state.language,
      };

      // IMPORTANT: Body copy lives in Google Docs. Normal editor saves must
      // NEVER write itinerary_content_* or push to the Google Doc — doing so
      // would overwrite edits made directly in Google Docs with stale editor
      // state. Body content is only written by:
      //   - the audit-apply flow (persistAuditedContentAndSync), and
      //   - the explicit "Create Google Doc from existing draft" / pull flows.
      // For brand-new itineraries with no Google Doc yet, we still seed the
      // first body copy from the editor so the initial Google Doc can be
      // created from it.
      const hasGoogleDoc = !!gdocInfo.id;
      if (!hasGoogleDoc) {
        payload[contentField] = state.content;
      }

      let savedId = state.id;
      if (state.id) {
        const { error } = await supabase.from("catalog_itineraries").update(payload).eq("id", state.id);
        if (error) throw error;
      } else {
        const { data, error } = await supabase.from("catalog_itineraries").insert(payload).select("id").single();
        if (error) throw error;
        savedId = data.id;
        setState((s) => ({ ...s, id: data.id }));
      }
      // Do NOT auto-sync to Google Doc here. Sync only happens via the
      // explicit "Create Google Doc" button or the audit-apply flow.

      setLastPersistedSignature(catalogDraftSignature(state, sectionPrompt));
      setLastAutoSavedAt(new Date().toISOString());
      setAutoSaveStatus("saved");
      toast.success(state.id ? "Saved" : "Created");
      qc.invalidateQueries({ queryKey: ["catalog-shop-list"] });
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

  const syncToStripe = async (r: CatalogRow) => {
    if (!r.is_published) {
      toast.error("Publish the itinerary before syncing to Stripe.");
      return;
    }
    setSyncingStripeId(r.id);
    try {
      const [sandboxRes, liveRes] = await Promise.allSettled([
        supabase.functions.invoke("sync-catalog-stripe-products", {
          body: { itinerary_id: r.id, environment: "sandbox" },
        }),
        supabase.functions.invoke("sync-catalog-stripe-products", {
          body: { itinerary_id: r.id, environment: "live" },
        }),
      ]);

      const summarize = (
        res: PromiseSettledResult<{ data: any; error: any }>,
        env: string,
      ): { ok: boolean; msg: string } => {
        if (res.status === "rejected") {
          return { ok: false, msg: `${env}: ${String(res.reason?.message ?? res.reason)}` };
        }
        const { data, error } = res.value;
        if (error) return { ok: false, msg: `${env}: ${error.message}` };
        const action = data?.results?.[0]?.action ?? "synced";
        return { ok: true, msg: `${env}: ${action}` };
      };

      const sandbox = summarize(sandboxRes, "sandbox");
      const live = summarize(liveRes, "live");

      if (sandbox.ok && live.ok) {
        toast.success(`Stripe synced — ${sandbox.msg}, ${live.msg}`);
      } else if (sandbox.ok) {
        toast.success(`Stripe sandbox synced (${sandbox.msg}). Live skipped: ${live.msg}`);
      } else if (live.ok) {
        toast.success(`Stripe live synced (${live.msg}). Sandbox failed: ${sandbox.msg}`);
      } else {
        toast.error(`Stripe sync failed — ${sandbox.msg}; ${live.msg}`);
      }
      qc.invalidateQueries({ queryKey: ["catalog-shop-list"] });
    } catch (e: any) {
      toast.error(`Stripe sync failed: ${e?.message ?? e}`);
    } finally {
      setSyncingStripeId(null);
    }
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
      <TravelerPersonasPanel />
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
                    {(r.stripe_product_id_sandbox || r.stripe_product_id_live) ? (
                      <span
                        className="text-[0.6rem] uppercase tracking-wider bg-ocean/10 text-ocean px-2 py-0.5 rounded"
                        title={r.stripe_synced_at ? `Last synced ${new Date(r.stripe_synced_at).toLocaleString()}` : "Synced to Stripe"}
                      >
                        Stripe ✓
                      </span>
                    ) : (
                      <span
                        className="text-[0.6rem] uppercase tracking-wider bg-parchment-2 text-voyage-muted px-2 py-0.5 rounded"
                        title="Not yet synced to Stripe. Stripe will auto-create the product on first checkout if not synced manually."
                      >
                        Stripe ○
                      </span>
                    )}
                    {(r as any).pdf_path ? (
                      <span
                        className="text-[0.6rem] uppercase tracking-wider bg-gold/15 text-gold px-2 py-0.5 rounded"
                        title="PDF attached to store — customers can download after purchase."
                      >
                        PDF ✓
                      </span>
                    ) : (
                      <span
                        className="text-[0.6rem] uppercase tracking-wider bg-parchment-2 text-voyage-muted px-2 py-0.5 rounded"
                        title="No PDF attached. Open PDF Preview and click 'Attach to Store'."
                      >
                        PDF ○
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
                  <Button size="sm" variant="ghost" onClick={() => {
                    const initial: Lang = r.itinerary_content_en ? "en" : r.itinerary_content_pt ? "pt" : r.itinerary_content_no ? "no" : "en";
                    setPreviewLang(initial);
                    setPreviewRow(r);
                  }} title="Preview PDF">
                    <Eye className="w-4 h-4 mr-1" /> Preview PDF
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => openEdit(r)}>Edit</Button>
                  <Button size="sm" variant={r.is_published ? "outline" : "default"} onClick={() => togglePublish(r)}>
                    {r.is_published ? "Unpublish" : "Publish"}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => syncToStripe(r)}
                    disabled={!r.is_published || syncingStripeId === r.id}
                    title={!r.is_published ? "Publish the itinerary before syncing to Stripe." : "Push product name, description, image, and tax code to Stripe (sandbox + live)."}
                  >
                    {syncingStripeId === r.id ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : null}
                    Sync to Stripe
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => remove(r)} className="text-destructive hover:text-destructive">Delete</Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Dialog
        open={editorOpen}
        onOpenChange={(open) => {
          if (open) {
            setEditorOpen(true);
            return;
          }
          // Block ALL programmatic / outside close attempts during an audit run
          // or other long-running operation. The editor can only be closed via
          // the explicit Cancel / Close-Anyway buttons.
          if (isAuditBusy || saving || generating || regenerating || uploading) {
            toast.info("Please wait for the current action to finish before closing the editor.");
            return;
          }
          requestEditorClose();
        }}
      >
        <DialogContent
          className="max-w-5xl max-h-[92vh] overflow-y-auto"
          onPointerDownOutside={(e) => {
            // Radix portals (Select dropdowns, tooltips, sonner toasts, image
            // cropper, the close-confirm AlertDialog itself, etc.) all register
            // as "outside" the Dialog. Just block the close — never pop the
            // discard-confirm modal from background pointer events, or normal
            // editing actions (opening the Language select, dismissing a
            // toast) would unexpectedly prompt the user and close the editor.
            e.preventDefault();
          }}
          onInteractOutside={(e) => e.preventDefault()}
          onEscapeKeyDown={(e) => {
            e.preventDefault();
            if (isAuditBusy) {
              toast.info("Please wait for the audit action to finish before closing the editor.");
              return;
            }
            requestEditorClose();
          }}
        >
          <DialogHeader>
            <DialogTitle>{state.id ? "Edit itinerary" : "Create new itinerary"}</DialogTitle>
            <DialogDescription>
              Fill in the cover page fields. Body content is edited in Google Docs and rendered into the PDF on Finalise.
            </DialogDescription>
            <div className="mt-2 space-y-1 text-[0.75rem]">
              {restoredNotice && <div className="rounded border border-gold/40 bg-gold/10 px-3 py-2 text-ink">{restoredNotice}</div>}

              <div className="text-voyage-muted">
                {autoSaveStatus === "saving" && "Auto-saving draft…"}
                {autoSaveStatus === "saved" && lastAutoSavedAt && `Draft auto-saved ${new Date(lastAutoSavedAt).toLocaleTimeString()}`}
                {autoSaveStatus === "error" && `Auto-save failed: ${autoSaveError}`}
                {autoSaveStatus === "idle" && "Auto-save runs every 30 seconds while editing."}
                {hasUnsavedChanges && autoSaveStatus !== "saving" && " · Unsaved changes"}
              </div>
            </div>
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
              <div className="flex flex-wrap gap-2 mt-1.5 p-2 rounded-md border border-input bg-background min-h-10">
                {SEASONS.map((s) => {
                  const active = state.season.includes(s);
                  return (
                    <button
                      key={s}
                      type="button"
                      onClick={() =>
                        setState({
                          ...state,
                          season: active
                            ? state.season.filter((x) => x !== s)
                            : [...state.season, s],
                        })
                      }
                      className={`px-2.5 py-1 rounded-full text-xs border transition-colors ${
                        active
                          ? "bg-primary text-primary-foreground border-primary"
                          : "bg-background text-foreground border-input hover:bg-muted"
                      }`}
                    >
                      {s}
                    </button>
                  );
                })}
              </div>
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
            <div>
              <Label>Price (USD)</Label>
              <Input type="number" min="0" step="1" value={state.priceUsd} onChange={(e) => setState({ ...state, priceUsd: e.target.value })} />
              {(Number(state.priceUsd) === 0 || (Number(state.priceEur) > 0 && Number(state.priceUsd) === Number(state.priceEur))) && (
                <p className="text-xs text-amber-600 mt-1">Placeholder — set the real USD price</p>
              )}
            </div>
            <div>
              <Label>Price (BRL)</Label>
              <Input type="number" min="0" step="1" value={state.priceBrl} onChange={(e) => setState({ ...state, priceBrl: e.target.value })} />
              {(Number(state.priceBrl) === 0 || (Number(state.priceEur) > 0 && Number(state.priceBrl) === Number(state.priceEur))) && (
                <p className="text-xs text-amber-600 mt-1">Placeholder — set the real BRL price</p>
              )}
            </div>
            <div>
              <Label>Price (NOK)</Label>
              <Input type="number" min="0" step="1" value={state.priceNok} onChange={(e) => setState({ ...state, priceNok: e.target.value })} />
              {(Number(state.priceNok) === 0 || (Number(state.priceEur) > 0 && Number(state.priceNok) === Number(state.priceEur))) && (
                <p className="text-xs text-amber-600 mt-1">Placeholder — set the real NOK price</p>
              )}
            </div>
            <div className="md:col-span-2">
              <Label>Short brief / notes for AI</Label>
              <Textarea rows={2} value={state.brief} onChange={(e) => setState({ ...state, brief: e.target.value })} placeholder="Any specific angle, audience, must-include experiences…" />
            </div>
            <div>
              <Label>Client origin (persona)</Label>
              <Select
                value={state.clientOrigin || "__none"}
                onValueChange={(v) => setState({ ...state, clientOrigin: v === "__none" ? "" : v })}
              >
                <SelectTrigger><SelectValue placeholder="Auto / none" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none">Auto / none</SelectItem>
                  {PERSONA_ORIGINS.map((o) => (
                    <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-[0.68rem] text-voyage-muted mt-1">Where the traveler is coming from. Injected into AI framing.</p>
            </div>
            <div>
              <Label>Destination market (persona)</Label>
              <Select
                value={state.destinationMarket || "__none"}
                onValueChange={(v) => setState({ ...state, destinationMarket: v === "__none" ? "" : v })}
              >
                <SelectTrigger><SelectValue placeholder="Auto / none" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none">Auto / none</SelectItem>
                  {PERSONA_DESTINATIONS.map((d) => (
                    <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-[0.68rem] text-voyage-muted mt-1">Falls back to Global → destination if no exact match.</p>
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
              <Label>What you get (subpage checklist)</Label>
              <p className="text-[0.7rem] text-voyage-muted mb-2">
                One bullet per row. Shown on the catalogue subpage's "What you get" sidebar. Leave empty to use the default list.
              </p>
              <div className="space-y-2">
                {state.subpageChecklist.map((item, idx) => (
                  <div key={idx} className="flex gap-2">
                    <Input
                      value={item}
                      onChange={(e) => {
                        const next = [...state.subpageChecklist];
                        next[idx] = e.target.value;
                        setState({ ...state, subpageChecklist: next });
                      }}
                      placeholder="e.g. Hidden fjord viewpoints with arrival timing"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        setState({
                          ...state,
                          subpageChecklist: state.subpageChecklist.filter((_, i) => i !== idx),
                        })
                      }
                    >
                      Remove
                    </Button>
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setState({ ...state, subpageChecklist: [...state.subpageChecklist, ""] })
                  }
                >
                  + Add item
                </Button>
              </div>
            </div>
            <div className="md:col-span-2">
              <Label>Day overview (subpage)</Label>
              <p className="text-[0.7rem] text-voyage-muted mb-2">
                Add one row per day. Shown on the catalogue subpage below "What to expect". Leave empty to hide the section.
              </p>
              <div className="space-y-3">
                {state.subpageDayOverview.map((day, idx) => (
                  <div key={idx} className="space-y-2 p-3 rounded border border-ink/[0.08] bg-voyage-white">
                    <div className="flex gap-2 items-start">
                      <Input
                        value={day.label}
                        onChange={(e) => {
                          const next = [...state.subpageDayOverview];
                          next[idx] = { ...next[idx], label: e.target.value };
                          setState({ ...state, subpageDayOverview: next });
                        }}
                        placeholder='e.g. Day 1 — Bergen - Voss - Flåm Railway'
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          setState({
                            ...state,
                            subpageDayOverview: state.subpageDayOverview.filter((_, i) => i !== idx),
                          })
                        }
                      >
                        Remove
                      </Button>
                    </div>
                    <Textarea
                      rows={2}
                      value={day.description}
                      onChange={(e) => {
                        const next = [...state.subpageDayOverview];
                        next[idx] = { ...next[idx], description: e.target.value };
                        setState({ ...state, subpageDayOverview: next });
                      }}
                      placeholder="Short description (1–2 sentences)"
                    />
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setState({
                      ...state,
                      subpageDayOverview: [...state.subpageDayOverview, { label: "", description: "" }],
                    })
                  }
                >
                  + Add day
                </Button>
              </div>
            </div>
            <div className="md:col-span-2">
              <Label>What to expect (subpage cards)</Label>
              <p className="text-[0.7rem] text-voyage-muted mb-2">
                Add one card per expectation. Shown on the catalogue subpage. Leave empty to fall back to default cards.
              </p>
              <div className="space-y-3">
                {state.subpageExpectations.map((ex, idx) => (
                  <div key={idx} className="space-y-2 p-3 rounded border border-ink/[0.08] bg-voyage-white">
                    <div className="flex gap-2 items-start">
                      <Input
                        value={ex.title}
                        onChange={(e) => {
                          const next = [...state.subpageExpectations];
                          next[idx] = { ...next[idx], title: e.target.value };
                          setState({ ...state, subpageExpectations: next });
                        }}
                        placeholder='e.g. Unhurried mornings'
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          setState({
                            ...state,
                            subpageExpectations: state.subpageExpectations.filter((_, i) => i !== idx),
                          })
                        }
                      >
                        Remove
                      </Button>
                    </div>
                    <Textarea
                      rows={2}
                      value={ex.description}
                      onChange={(e) => {
                        const next = [...state.subpageExpectations];
                        next[idx] = { ...next[idx], description: e.target.value };
                        setState({ ...state, subpageExpectations: next });
                      }}
                      placeholder="Short description (1–2 sentences)"
                    />
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setState({
                      ...state,
                      subpageExpectations: [...state.subpageExpectations, { title: "", description: "" }],
                    })
                  }
                >
                  + Add card
                </Button>
              </div>
            </div>
            <div className="md:col-span-2">
              <Label>Route map URL (subpage)</Label>
              <p className="text-[0.7rem] text-voyage-muted mb-2">
                Paste a Google Maps embed URL. Shown on the catalogue subpage as an embedded route map. Leave empty to hide the section.
              </p>
              <Input
                value={state.subpageMapUrl}
                onChange={(e) => setState({ ...state, subpageMapUrl: e.target.value })}
                placeholder="https://www.google.com/maps/embed?pb=…"
              />
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

          {/* SECTION 2 — BODY CONTENT (Google Docs) */}
          <div className="mt-2 p-4 border border-parchment-3 rounded bg-voyage-white">
            <div className="flex items-start justify-between flex-wrap gap-3 mb-3">
              <div>
                <div className="font-serif text-lg font-bold flex items-center gap-2">
                  <FileText className="w-4 h-4" /> Body content
                </div>
                <p className="text-[0.78rem] text-voyage-muted">
                  Body copy lives in Google Docs. Edit there freely. The app pulls fresh content each time you preview the PDF — fonts and colours are always set by the brand stylesheet.
                </p>
              </div>
              <Button
                onClick={runGenerate}
                disabled={generating}
                variant="outline"
                size="sm"
                title={gdocInfo.id ? "Regenerate AI content (will overwrite the Doc on next save)" : "Generate initial AI content"}
              >
                {generating ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Sparkles className="w-4 h-4 mr-2" />}
                {gdocInfo.id ? "Regenerate with AI" : "Generate with AI"}
              </Button>
            </div>

            {/* Audit Itinerary toolbar + checklist */}
            <div className="mt-3 mb-3">
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={runAudit}
                  disabled={auditing || applyingAudit || !state.content.trim()}
                  className="px-4 py-2 rounded-sm border border-ink/25 text-[0.72rem] font-medium tracking-[0.08em] uppercase text-ink hover:border-ink hover:bg-ink hover:text-voyage-white transition-all inline-flex items-center gap-2 disabled:opacity-50"
                  title={!state.content.trim() ? "Generate or import body content first" : "Run an AI audit on the current draft"}
                >
                  {auditing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ShieldCheck className="w-3.5 h-3.5" />}
                  {auditing ? "Auditing…" : "Audit Itinerary"}
                </button>
                {state.auditItems.length > 0 && (
                  <button
                    type="button"
                    onClick={applyAudit}
                    disabled={applyingAudit || failedAuditBatch !== null || !state.auditItems.some((i) => i.selected)}
                    className="px-4 py-2 rounded-sm border border-gold bg-gold/10 text-[0.72rem] font-medium tracking-[0.08em] uppercase text-ink hover:bg-gold hover:text-ink transition-all inline-flex items-center gap-2 disabled:opacity-50"
                  >
                    {applyingAudit ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                    {applyingAudit ? "Rewriting…" : `Apply Selected (${state.auditItems.filter((i) => i.selected).length})`}
                  </button>
                )}
                {failedAuditBatch && (
                  <button
                    type="button"
                    onClick={retryFailedAuditBatch}
                    disabled={applyingAudit}
                    className="px-4 py-2 rounded-sm border border-gold bg-gold/10 text-[0.72rem] font-medium tracking-[0.08em] uppercase text-ink hover:bg-gold hover:text-ink transition-all inline-flex items-center gap-2 disabled:opacity-50"
                  >
                    {applyingAudit ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCcw className="w-3.5 h-3.5" />}
                    Retry batch {failedAuditBatch.batchNumber}
                  </button>
                )}
                {state.previousContent !== null && (
                  <button
                    type="button"
                    onClick={keepOriginalAudit}
                    disabled={applyingAudit}
                    className="px-4 py-2 rounded-sm border border-ink/25 text-[0.72rem] font-medium tracking-[0.08em] uppercase text-ink hover:border-ink hover:bg-ink hover:text-voyage-white transition-all inline-flex items-center gap-2 disabled:opacity-50"
                  >
                    Keep original
                  </button>
                )}
              </div>

              {state.auditItems.length > 0 && (
                <div className="mt-3">
                  <AuditChecklist
                    items={state.auditItems}
                    onToggle={toggleAuditItem}
                    onSelectAll={selectAllAudit}
                    onDeselectAll={deselectAllAudit}
                    canKeepOriginal={state.previousContent !== null}
                    onKeepOriginal={keepOriginalAudit}
                    compact
                    statuses={itemStatuses}
                  />
                </div>
              )}

              {auditAction.status !== "idle" && (
                <div className={`mt-3 rounded border px-3 py-2 text-[0.78rem] ${auditAction.status === "error" ? "border-destructive/30 bg-destructive/10 text-destructive" : "border-gold/40 bg-gold/10 text-ink"}`}>
                  <div className="flex items-center gap-2 font-medium">
                    {auditAction.status === "running" ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <AlertCircle className="w-3.5 h-3.5" />}
                    {auditAction.message}
                  </div>
                  {auditAction.detail && <div className="mt-1 opacity-80">{auditAction.detail}</div>}
                </div>
              )}

              {applySummary && (
                <div className={`mt-3 rounded-md border px-3 py-2 text-[0.78rem] ${applySummary.failedItems.length ? "border-destructive/40 bg-destructive/5" : "border-sage/40 bg-sage/10"}`}>
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <div className="font-medium text-ink inline-flex items-center gap-1.5">
                      {applySummary.failedItems.length
                        ? <AlertCircle className="w-4 h-4 text-destructive" />
                        : <CheckCircle2 className="w-4 h-4 text-sage" />}
                      {applySummary.appliedIds.length} of {applySummary.totalItems} improvements applied{applySummary.failedItems.length ? " — some failed" : " successfully"}
                    </div>
                    <div className="flex gap-2 flex-wrap">
                      {applySummary.failedItems.length > 0 && (
                        <button
                          type="button"
                          onClick={retryFailedItems}
                          disabled={applyingAudit}
                          className="px-3 py-1.5 rounded-sm border border-destructive/40 text-[0.7rem] font-medium uppercase tracking-wider text-destructive hover:bg-destructive hover:text-voyage-white transition-colors inline-flex items-center gap-1.5 disabled:opacity-50"
                        >
                          {applyingAudit ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCcw className="w-3 h-3" />}
                          Retry {applySummary.failedItems.length} failed
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={viewUpdatedItinerary}
                        className="px-3 py-1.5 rounded-sm bg-ink text-voyage-white text-[0.7rem] font-medium uppercase tracking-wider hover:bg-gold hover:text-ink transition-colors inline-flex items-center gap-1.5"
                      >
                        <Eye className="w-3 h-3" /> View Updated Itinerary
                      </button>
                    </div>
                  </div>
                  {applySummary.failedItems.length > 0 && (
                    <ul className="mt-2 list-disc pl-5 text-[0.72rem] text-ink-2 space-y-0.5">
                      {applySummary.failedItems.map((f) => (
                        <li key={f.id}><span className="font-medium">{f.title}</span></li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </div>

            <AiWritingAssistantPanel />

            <VerificationTable content={state.content} destination={state.destination} />


            {gdocInfo.id && gdocInfo.url ? (
              <div className="rounded border border-parchment-3 bg-parchment/30 p-3 flex flex-wrap items-center gap-3 justify-between">
                <div className="text-[0.85rem]">
                  <div className="flex items-center gap-1.5 font-medium text-ink">
                    📄 Google Doc linked
                  </div>
                  <div className="text-[0.72rem] text-voyage-muted">
                    Edit the body content in Google Docs, then pull it back here — the PDF preview will reapply the brand styling automatically.
                  </div>
                  <div className="text-[0.7rem] text-voyage-muted mt-1">
                    <strong>Resync</strong> pushes the editor → Doc. <strong>Pull</strong> imports the Doc → editor (formatting is normalised; brand styling is reapplied by the PDF preview).
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setPullConfirmOpen(true)}
                    disabled={gdocPulling || gdocSyncing || !state.id}
                    title="Import the current Google Doc content into the editor. Brand styling is reapplied by the PDF preview."
                  >
                    {gdocPulling ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" /> : <ArrowDownToLine className="w-3.5 h-3.5 mr-1.5" />}
                    {gdocPulling ? "Pulling…" : "Pull from Google Doc"}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => state.id && syncToGoogleDoc(state.id, { notify: true })}
                    disabled={gdocSyncing || gdocPulling || !state.id}
                    title="Push the current editor/database content to the linked Google Doc"
                  >
                    {gdocSyncing ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" /> : <RefreshCcw className="w-3.5 h-3.5 mr-1.5" />}
                    {gdocSyncing ? "Resyncing…" : "Resync now"}
                  </Button>
                  <a
                    href={gdocInfo.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 rounded border border-parchment-3 bg-voyage-white px-3 py-1.5 text-[0.78rem] text-ink hover:bg-parchment"
                  >
                    Open in Google Docs <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            ) : state.id ? (
              <div className="rounded border border-dashed border-parchment-3 bg-parchment/20 p-3 text-[0.82rem] text-voyage-muted">
                <div className="mb-2">
                  No Google Doc linked yet.
                  {state.content.trim()
                    ? " This itinerary has draft body content from the previous editor — push it to a new Google Doc to start editing there."
                    : " Generate AI content above, then save to create the linked Doc."}
                </div>
                {state.content.trim() && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => syncToGoogleDoc(state.id!)}
                    disabled={gdocSyncing}
                  >
                    {gdocSyncing ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <FileText className="w-4 h-4 mr-2" />}
                    Create Google Doc from existing draft
                  </Button>
                )}
              </div>
            ) : (
              <div className="rounded border border-dashed border-parchment-3 bg-parchment/20 p-3 text-[0.82rem] text-voyage-muted">
                Save the itinerary first to create its linked Google Doc.
              </div>
            )}

            {/* Body PDF upload + Preview PDF. The uploaded PDF is merged
                between the fixed cover page and the fixed hotels + back pages. */}
            <div className="mt-4 rounded border border-parchment-3 bg-voyage-white p-3">
              <div className="flex items-center justify-between flex-wrap gap-2 mb-2">
                <div>
                  <div className="font-medium text-ink text-[0.92rem] flex items-center gap-2">
                    <FileText className="w-4 h-4" /> Body content PDF
                  </div>
                  <div className="text-[0.74rem] text-voyage-muted">
                    Export the finalised body content from Google Docs as PDF and upload it here. It will be inserted between the cover page and the hotels / back page.
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <label className="inline-flex items-center gap-1.5 rounded border border-parchment-3 bg-voyage-white px-3 py-1.5 text-[0.78rem] text-ink hover:bg-parchment cursor-pointer">
                    {bodyPdfUploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
                    {state.bodyPdfUrl ? "Replace PDF" : "Upload PDF"}
                    <input
                      type="file"
                      accept="application/pdf"
                      className="hidden"
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) void uploadBodyPdf(f);
                        e.target.value = "";
                      }}
                    />
                  </label>
                  <Button
                    size="sm"
                    onClick={() => setPreviewMergedOpen(true)}
                    disabled={!state.bodyPdfUrl}
                    className="bg-ink text-voyage-white hover:bg-gold hover:text-ink"
                    title={!state.bodyPdfUrl ? "Upload a body content PDF first" : ""}
                  >
                    <Eye className="w-4 h-4 mr-2" /> Preview PDF
                  </Button>
                </div>
              </div>
              {state.bodyPdfUrl ? (
                <div className="flex items-center justify-between gap-2 text-[0.78rem]">
                  <a
                    href={state.bodyPdfUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-ink underline truncate"
                  >
                    Current PDF — open in new tab
                  </a>
                  <button
                    type="button"
                    onClick={removeBodyPdf}
                    className="inline-flex items-center gap-1 text-destructive hover:underline"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Remove
                  </button>
                </div>
              ) : (
                <div className="text-[0.78rem] text-voyage-muted italic">No body PDF uploaded yet.</div>
              )}
            </div>
          </div>




          {/* HOTELS */}
          <div className="mt-6 p-4 border border-parchment-3 rounded bg-voyage-white">
            <div className="flex items-center justify-between flex-wrap gap-2 mb-3">
              <div>
                <div className="font-serif text-lg font-bold flex items-center gap-2">
                  <HotelIcon className="w-4 h-4" /> Hotel Recommendations
                </div>
                <p className="text-[0.78rem] text-voyage-muted">
                  Add as many hotels as you need — name, location, description and up to 3 images each. They flow across as many hotel pages as required in the PDF.
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={addHotel}
              >
                <Plus className="w-4 h-4 mr-1" /> Add Hotel ({state.hotels.length})
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
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => moveHotel(h.id, -1)}
                        disabled={i === 0}
                        title="Move up"
                      >
                        <ArrowUp className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => moveHotel(h.id, 1)}
                        disabled={i === state.hotels.length - 1}
                        title="Move down"
                      >
                        <ArrowDown className="w-4 h-4" />
                      </Button>
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
                    <Label className="text-[0.75rem]">Images (up to 3 — at least 1 required)</Label>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-1">
                      {[0, 1, 2].map((slot) => {
                        const photo = h.photos[slot];
                        return (
                          <div key={slot} className="space-y-1.5">
                            <div className="text-[0.7rem] text-voyage-muted">Image {slot + 1}{slot === 0 ? " (required)" : " (optional)"}</div>
                            <div className="aspect-[4/3] rounded border border-parchment-3 bg-voyage-white overflow-hidden relative group">
                              {photo?.url ? (
                                <>
                                  <img src={photo.url} alt={photo.caption || ""} className="w-full h-full object-cover" />
                                  <button
                                    type="button"
                                    onClick={() => updateHotel(h.id, { photos: h.photos.filter((_, i) => i !== slot) })}
                                    className="absolute top-1 right-1 bg-black/60 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                  >
                                    <XIcon className="w-3 h-3" />
                                  </button>
                                </>
                              ) : (
                                <label className="w-full h-full flex flex-col items-center justify-center text-voyage-muted text-[0.7rem] cursor-pointer hover:bg-parchment/50">
                                  <Upload className="w-4 h-4 mb-1" />
                                  Add image
                                  <input
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={(e) => e.target.files?.[0] && uploadHotelPhoto(h.id, slot, e.target.files[0])}
                                  />
                                </label>
                              )}
                            </div>
                            {photo?.url && (
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

          {/* BUDGET ESTIMATOR — AI-generated per-person budget, drives the cover label. */}
          <div className="mt-6 p-4 border border-parchment-3 rounded bg-voyage-white">
            <div className="flex items-start justify-between flex-wrap gap-3">
              <div>
                <div className="font-serif text-lg font-bold flex items-center gap-2">
                  <Coins className="w-4 h-4 text-[#B8975A]" /> Budget estimate
                </div>
                <p className="text-[0.78rem] text-voyage-muted">
                  Generate an AI-assisted per-person budget. The cover-page label is rendered into the PDF;
                  the full table can be copied as HTML and pasted into the Google Doc.
                </p>
                {budgetCoverLabel && (
                  <p className="text-[0.78rem] text-ink mt-1">
                    Cover label: <span className="font-medium">{budgetCoverLabel}</span>
                  </p>
                )}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setBudgetOpen(true)}
                disabled={!state.content.trim()}
                title={!state.content.trim() ? "Generate or import body content first" : ""}
              >
                <Coins className="w-4 h-4 mr-2" />
                {budget ? "Edit budget" : "Create budget estimate"}
              </Button>
            </div>
          </div>

          <BudgetEstimator
            open={budgetOpen}
            onOpenChange={setBudgetOpen}
            sourceContent={state.content}
            destination={state.destination}
            tripDuration={state.duration}
            initialBudget={budget}
            initialCoverLabel={budgetCoverLabel}
            language={state.language}
            onSaved={handleBudgetSaved}
          />



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
              <Button variant="outline" onClick={requestEditorClose} disabled={isAuditBusy}>Cancel</Button>
              <Button variant="outline" onClick={() => save(false)} disabled={saving || isAuditBusy}>
                {saving && <Loader2 className="w-4 h-4 animate-spin mr-2" />}Save as Draft
              </Button>
              <Button
                onClick={() => save(true)}
                disabled={saving || isAuditBusy || !canPublish}
                className="bg-ink text-voyage-white hover:bg-gold hover:text-ink disabled:opacity-50 disabled:cursor-not-allowed"
                title={!canPublish ? "Complete the pre-publish checklist first" : ""}
              >
                {saving && <Loader2 className="w-4 h-4 animate-spin mr-2" />}Save & Publish
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={closeConfirmOpen} onOpenChange={setCloseConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>You have unsaved changes.</AlertDialogTitle>
            <AlertDialogDescription>
              You have unsaved changes. Are you sure you want to close?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep Editing</AlertDialogCancel>
            <AlertDialogAction onClick={closeEditorAnyway}>Close Anyway</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={pullConfirmOpen} onOpenChange={(o) => !gdocPulling && setPullConfirmOpen(o)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Pull content from Google Doc?</AlertDialogTitle>
            <AlertDialogDescription>
              This replaces the editor's body content ({state.language.toUpperCase()}) with the current Google Doc.
              Any formatting done in Docs is normalised — the PDF preview reapplies the brand styling.
              A safety snapshot of the current editor is saved first so you can roll back.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={gdocPulling}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                if (state.id) pullFromGoogleDoc(state.id);
              }}
              disabled={gdocPulling || !state.id}
            >
              {gdocPulling ? "Pulling…" : "Pull from Google Doc"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Preview PDF: opens the assembled PDF (cover + uploaded body PDF + hotels + back page). */}
      {previewMergedOpen && state.bodyPdfUrl && (
        <PdfPreview
          content=""
          bodyPdfUrl={state.bodyPdfUrl}
          language={state.language}
          project={{
            client_name: state.title,
            title: state.title,
            destination: state.destination || null,
            trip_duration: state.duration || null,
            hero_image_url: state.heroImageUrl || null,
            hero_image_credit: state.heroImageCredit || null,
            hero_image_caption: state.heroImageCaption || null,
            cover_tagline:
              (state.language === "no" ? state.coverIntroNo : state.language === "pt" ? state.coverIntroPt : state.coverIntroEn) ||
              (state.language === "no" ? state.summaryNo : state.language === "pt" ? state.summaryPt : state.summary) ||
              null,
            season: state.season,
            estimated_trip_budget: budgetCoverLabel,
          }}
          hotels={state.hotels}
          onClose={() => setPreviewMergedOpen(false)}
          onExport={() => {}}
          attachToCatalogId={state.id || undefined}
        />

      )}




      {previewRow && (() => {
        const contentByLang: Record<Lang, string | null | undefined> = {
          en: previewRow.itinerary_content_en,
          pt: previewRow.itinerary_content_pt,
          no: previewRow.itinerary_content_no,
        };
        const titleByLang: Record<Lang, string | null | undefined> = {
          en: previewRow.title_en,
          pt: previewRow.title_pt,
          no: previewRow.title_no,
        };
        const summaryByLang: Record<Lang, string | null | undefined> = {
          en: previewRow.summary_en,
          pt: previewRow.summary_pt,
          no: previewRow.summary_no,
        };
        const coverIntroByLang: Record<Lang, string | null | undefined> = {
          en: previewRow.cover_intro_en,
          pt: previewRow.cover_intro_pt,
          no: previewRow.cover_intro_no,
        };
        const pickedContent =
          contentByLang[previewLang] || contentByLang.en || contentByLang.pt || contentByLang.no || "";
        const pickedTitle =
          titleByLang[previewLang] || titleByLang.en || titleByLang.pt || titleByLang.no || "";
        const pickedSummary =
          summaryByLang[previewLang] || summaryByLang.en || summaryByLang.pt || summaryByLang.no || "";
        const pickedCoverIntro =
          coverIntroByLang[previewLang] || coverIntroByLang.en || coverIntroByLang.pt || coverIntroByLang.no || "";
        const available: Lang[] = (["en", "pt", "no"] as Lang[]).filter((l) => !!contentByLang[l]);
        return (
          <>
            {available.length > 1 && (
              <div className="fixed top-4 right-4 z-[70] flex gap-1 bg-voyage-white border border-parchment-3 rounded shadow-md p-1 fjw-no-print">
                {available.map((l) => (
                  <button
                    key={l}
                    onClick={() => setPreviewLang(l)}
                    className={`px-2 py-1 text-[0.7rem] uppercase tracking-wider rounded ${previewLang === l ? "bg-ink text-voyage-white" : "text-voyage-muted hover:text-ink"}`}
                  >
                    {l}
                  </button>
                ))}
              </div>
            )}
            <PdfPreview
              content={pickedContent}
              bodyPdfUrl={(previewRow as any).body_pdf_url || null}
              language={previewLang}
              project={{
                client_name: pickedTitle,
                title: pickedTitle,
                destination: previewRow.destination,
                trip_duration: previewRow.duration,
                hero_image_url: previewRow.hero_image_url,
                hero_image_credit: previewRow.hero_image_credit,
                hero_image_caption: previewRow.hero_image_caption,
                cover_tagline: pickedCoverIntro || pickedSummary || null,
                season: previewRow.season,
                estimated_trip_budget: (previewRow as any).estimated_trip_budget ?? (() => {
                  try {
                    const raw = window.localStorage.getItem("fjw-budget-v1:" + previewRow.id);
                    return raw ? (JSON.parse(raw)?.coverLabel ?? null) : null;
                  } catch { return null; }
                })(),
              }}
              hotels={Array.isArray(previewRow.hotels) ? (previewRow.hotels as any[]) : []}
              onClose={() => setPreviewRow(null)}
              onExport={() => window.print()}
              attachToCatalogId={previewRow.id}
            />

          </>
        );
      })()}
      </>
      )}
    </div>
  );
};

export default CatalogShopManager;
