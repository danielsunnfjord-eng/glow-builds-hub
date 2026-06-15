import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
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
import ItineraryEditor from "./ItineraryEditor";
import EditorErrorBoundary from "./EditorErrorBoundary";
import PdfPreview from "./PdfPreview";
import AuditChecklist from "./AuditChecklist";
import { parseAuditItems, type SelectableAuditItem } from "@/lib/auditParser";
import { applyImprovementSectional, chunkAuditItems } from "@/lib/auditApply";
import { findFirstChangedHeadingText, flashEditorHighlight, scrollEditorIntoView, type ApplyItemStatus } from "@/lib/auditHighlight";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { AlertCircle, CheckCircle2, Eye, Loader2, FileText, ImagePlus, RefreshCcw, X, ShieldCheck, Undo2, Sparkles } from "lucide-react";

const SUPABASE_URL = "https://jgpratgrdorvkruonzgr.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpncHJhdGdyZG9ydmtydW9uemdyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ4OTYzMzQsImV4cCI6MjA5MDQ3MjMzNH0.08GsMrM1nSbzIpkPxQ-19HXVyNTiQGvV_TKkowEf4cs";
const PROJECT_EDITOR_AUTOSAVE_MS = 30_000;
const PROJECT_AUDIT_TIMEOUT_MS = 120_000;

interface Project {
  id: string;
  client_name: string;
  client_email?: string | null;
  destination?: string | null;
  trip_duration?: string | null;
  start_date?: string | null;
  end_date?: string | null;
  group_size?: number;
  itinerary_content?: string | null;
  internal_notes?: string | null;
  hero_image_url?: string | null;
  hero_image_credit?: string | null;
  hero_image_caption?: string | null;
  cover_tagline?: string | null;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  project: Project | null;
  onSaved?: () => void;
}

type ProjectEditorSnapshot = {
  content: string;
  notes: string;
  heroUrl: string | null;
  heroCredit: string;
  heroCaption: string;
  tagline: string;
  auditItems: SelectableAuditItem[];
  previousContent: string | null;
};

type ApplyStatus = {
  status: "idle" | "running" | "error";
  message: string;
  detail?: string;
};

type FailedApplyBatch = {
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

const projectSnapshotSignature = (snapshot: ProjectEditorSnapshot) => JSON.stringify(snapshot);

const hasProjectSnapshotContent = (snapshot: ProjectEditorSnapshot) =>
  Boolean(
    snapshot.content.trim() ||
    snapshot.notes.trim() ||
    snapshot.heroUrl ||
    snapshot.heroCredit.trim() ||
    snapshot.heroCaption.trim() ||
    snapshot.tagline.trim() ||
    snapshot.auditItems.length,
  );

const ProjectItineraryDialog = ({ open, onOpenChange, project, onSaved }: Props) => {
  const [content, setContent] = useState("");
  const [notes, setNotes] = useState("");
  const [heroUrl, setHeroUrl] = useState<string | null>(null);
  const [heroCredit, setHeroCredit] = useState("");
  const [heroCaption, setHeroCaption] = useState("");
  const [tagline, setTagline] = useState("");
  const [uploadingHero, setUploadingHero] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showPdf, setShowPdf] = useState(false);
  const [auditing, setAuditing] = useState(false);
  const [applying, setApplying] = useState(false);
  const [auditItems, setAuditItems] = useState<SelectableAuditItem[]>([]);
  const [previousContent, setPreviousContent] = useState<string | null>(null);
  const [applyStatus, setApplyStatus] = useState<ApplyStatus>({ status: "idle", message: "" });
  const [failedApplyBatch, setFailedApplyBatch] = useState<FailedApplyBatch | null>(null);
  const [itemStatuses, setItemStatuses] = useState<Record<string, ApplyItemStatus>>({});
  const [applySummary, setApplySummary] = useState<ApplySummary | null>(null);
  const [closeConfirmOpen, setCloseConfirmOpen] = useState(false);
  const [lastPersistedSignature, setLastPersistedSignature] = useState("");
  const [lastAutoSavedAt, setLastAutoSavedAt] = useState<string | null>(null);
  const [autoSaveStatus, setAutoSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [autoSaveError, setAutoSaveError] = useState("");
  const [restoredNotice, setRestoredNotice] = useState("");
  const heroInputRef = useRef<HTMLInputElement>(null);
  const autoSaveIntervalRef = useRef<number | null>(null);
  const latestSnapshotRef = useRef<ProjectEditorSnapshot | null>(null);
  const latestOpenRef = useRef(open);
  const loadedProjectIdRef = useRef<string | null>(null);

  const snapshot = useMemo<ProjectEditorSnapshot>(() => ({
    content,
    notes,
    heroUrl,
    heroCredit,
    heroCaption,
    tagline,
    auditItems,
    previousContent,
  }), [content, notes, heroUrl, heroCredit, heroCaption, tagline, auditItems, previousContent]);
  const currentSignature = useMemo(() => projectSnapshotSignature(snapshot), [snapshot]);
  const hasUnsavedChanges = Boolean(lastPersistedSignature) && currentSignature !== lastPersistedSignature;
  const isBusy = auditing || applying || uploadingHero || saving;

  useEffect(() => {
    latestSnapshotRef.current = snapshot;
    latestOpenRef.current = open;
  }, [snapshot, open]);

  useEffect(() => {
    if (!open || !project) return;
    if (loadedProjectIdRef.current === project.id) return;
    loadedProjectIdRef.current = project.id;
    const baseSnapshot: ProjectEditorSnapshot = {
      content: project.itinerary_content || "",
      notes: project.internal_notes || "",
      heroUrl: project.hero_image_url || null,
      heroCredit: project.hero_image_credit || "",
      heroCaption: project.hero_image_caption || "",
      tagline: project.cover_tagline || "",
      auditItems: [],
      previousContent: null,
    };
    const loadDraft = async () => {
      let next = baseSnapshot;
      let restoredAt: string | null = null;
      try {
        const { data, error } = await supabase
          .from("project_itinerary_editor_drafts" as any)
          .select("draft, updated_at")
          .eq("project_id", project.id)
          .maybeSingle() as any;
        if (!error && data?.draft) {
          next = { ...baseSnapshot, ...(data.draft as Partial<ProjectEditorSnapshot>) };
          restoredAt = data.updated_at;
        }
      } catch {
        // Recovery should never block opening the editor.
      }
      setContent(next.content);
      setNotes(next.notes);
      setHeroUrl(next.heroUrl);
      setHeroCredit(next.heroCredit);
      setHeroCaption(next.heroCaption);
      setTagline(next.tagline);
      setAuditItems(next.auditItems || []);
      setPreviousContent(next.previousContent || null);
      setApplyStatus({ status: "idle", message: "" });
      setFailedApplyBatch(null);
      setItemStatuses({});
      setApplySummary(null);
      setLastPersistedSignature(projectSnapshotSignature(next));
      setLastAutoSavedAt(restoredAt);
      setAutoSaveStatus(restoredAt ? "saved" : "idle");
      setAutoSaveError("");
      setRestoredNotice(restoredAt ? `Draft restored from ${new Date(restoredAt).toLocaleString()}` : "");
      setCloseConfirmOpen(false);
    };
    loadDraft();
  }, [open, project?.id]);

  useEffect(() => {
    if (!open) loadedProjectIdRef.current = null;
  }, [open]);

  const persistProjectDraft = useCallback(async (silent = true) => {
    const current = latestSnapshotRef.current;
    if (!latestOpenRef.current || !project?.id || !current || !hasProjectSnapshotContent(current) || isBusy) return;
    setAutoSaveStatus("saving");
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { error } = await supabase
        .from("project_itinerary_editor_drafts" as any)
        .upsert({
          project_id: project.id,
          draft: current as any,
          updated_by: user?.id || null,
        } as any, { onConflict: "project_id" } as any);
      if (error) throw error;
      const now = new Date().toISOString();
      setLastPersistedSignature(projectSnapshotSignature(current));
      setLastAutoSavedAt(now);
      setAutoSaveStatus("saved");
      setAutoSaveError("");
      if (!silent) toast.success("Draft auto-saved");
    } catch (e: any) {
      setAutoSaveStatus("error");
      setAutoSaveError(e?.message || "Auto-save failed");
      if (!silent) toast.error(e?.message || "Auto-save failed");
    }
  }, [isBusy, project?.id]);

  const requestClose = () => {
    if (isBusy) {
      toast.info("Please wait for the current action to finish before closing the editor.");
      return;
    }
    if (hasUnsavedChanges) {
      setCloseConfirmOpen(true);
      return;
    }
    onOpenChange(false);
  };

  const closeAnyway = () => {
    setCloseConfirmOpen(false);
    onOpenChange(false);
  };

  useEffect(() => {
    if (!open) return;
    autoSaveIntervalRef.current = window.setInterval(() => {
      persistProjectDraft(true);
    }, PROJECT_EDITOR_AUTOSAVE_MS);
    return () => {
      if (autoSaveIntervalRef.current) window.clearInterval(autoSaveIntervalRef.current);
      autoSaveIntervalRef.current = null;
    };
  }, [open, persistProjectDraft]);

  const runAudit = async () => {
    if (!content.trim()) {
      toast.error("Itinerary is empty");
      return;
    }
    setAuditing(true);
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), PROJECT_AUDIT_TIMEOUT_MS);
    try {
      const res = await fetch(`${SUPABASE_URL}/functions/v1/audit-itinerary-claude`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: SUPABASE_ANON_KEY,
          Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token || SUPABASE_ANON_KEY}`,
        },
        signal: controller.signal,
        body: JSON.stringify({ content, mode: "audit" }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error || `Audit failed (${res.status})`);
      if (data?.error) throw new Error(data.error);
      const parsed = parseAuditItems(data?.items?.length ? data.items : data?.audit);
      if (!parsed.length) throw new Error("No audit suggestions returned");
      setAuditItems(parsed.map((i) => ({ ...i, selected: true })));
      setApplyStatus({ status: "idle", message: "" });
      setFailedApplyBatch(null);
      setItemStatuses({});
      setApplySummary(null);
      toast.success("Audit complete — pick the improvements to apply.");
    } catch (e: any) {
      toast.error(e?.name === "AbortError" ? "Audit timed out. Your draft was preserved — please retry." : e?.message || "Audit failed");
    } finally {
      window.clearTimeout(timeout);
      setAuditing(false);
    }
  };

  const toggleItem = (id: string) =>
    setAuditItems((arr) => arr.map((i) => (i.id === id ? { ...i, selected: !i.selected } : i)));
  const selectAll = () => setAuditItems((arr) => arr.map((i) => ({ ...i, selected: true })));
  const deselectAll = () => setAuditItems((arr) => arr.map((i) => ({ ...i, selected: false })));

  const runApplyBatchesProject = async (
    itemsToApply: SelectableAuditItem[],
    startingContent: string,
    opts: { resetStatuses: boolean },
  ) => {
    const batches = chunkAuditItems(itemsToApply, 1);
    let workingContent = startingContent;
    const appliedIds: string[] = [];
    const failedItems: SelectableAuditItem[] = [];
    const { data: { session } } = await supabase.auth.getSession();

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
      setApplyStatus({
        status: "running",
        message: `Applying improvement ${i + 1} of ${batches.length}…`,
        detail: i > 0
          ? `${i} improvement${i === 1 ? "" : "s"} already applied — only the affected sections were rewritten.`
          : "Only the affected section(s) are being rewritten — the editor stays open.",
      });
      const controller = new AbortController();
      const timeout = window.setTimeout(() => controller.abort(), PROJECT_AUDIT_TIMEOUT_MS);
      try {
        const headers: HeadersInit = {
          "Content-Type": "application/json",
          apikey: SUPABASE_ANON_KEY,
          Authorization: `Bearer ${session?.access_token || SUPABASE_ANON_KEY}`,
        };
        const result = await applyImprovementSectional({
          url: `${SUPABASE_URL}/functions/v1/audit-itinerary-claude`,
          headers,
          signal: controller.signal,
          content: workingContent,
          improvement: item,
        });
        const previousBatchContent = workingContent;
        workingContent = result.newContent;
        const batchIds = new Set(batch.map((b) => b.id));
        setPreviousContent((prev) => prev ?? startingContent);
        setContent(result.newContent);
        setAuditItems((items) => items.map((it) => (batchIds.has(it.id) ? { ...it, selected: false } : it)));
        setItemStatuses((prev) => {
          const next = { ...prev };
          for (const it of batch) next[it.id] = "applied";
          return next;
        });
        for (const it of batch) appliedIds.push(it.id);
        flashEditorHighlight(result.changedHeading ?? findFirstChangedHeadingText(previousBatchContent, result.newContent));
      } catch (e: any) {
        const message = e?.name === "AbortError"
          ? `Improvement ${i + 1} timed out. Successfully applied improvements were preserved.`
          : e?.message || `Improvement ${i + 1} failed.`;
        setItemStatuses((prev) => {
          const next = { ...prev };
          for (const it of batch) next[it.id] = "failed";
          return next;
        });
        setFailedApplyBatch({ batchNumber: i + 1, totalBatches: batches.length, items: batch, message });
        setApplyStatus({
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

  const applyImprovements = async () => {
    const selected = auditItems.filter((i) => i.selected);
    if (!content.trim() || !selected.length) {
      toast.error("Select at least one improvement to apply.");
      return;
    }
    setApplying(true);
    setFailedApplyBatch(null);
    setApplySummary(null);
    const original = content;
    try {
      const result = await runApplyBatchesProject(selected, original, { resetStatuses: true });
      if (!result.stoppedEarly) {
        setApplyStatus({ status: "idle", message: "" });
        setApplySummary({ appliedIds: result.appliedIds, failedItems: [], totalItems: selected.length });
        toast.success(`${result.appliedIds.length} of ${selected.length} improvements applied.`);
      } else {
        setApplySummary({ appliedIds: result.appliedIds, failedItems: result.failedItems, totalItems: selected.length });
      }
    } catch (e: any) {
      const message = e?.message || "Failed to apply improvements. Your draft was preserved.";
      setApplyStatus({ status: "error", message, detail: "The editor content was not cleared or closed." });
      toast.error(message);
    } finally {
      setApplying(false);
    }
  };

  const retryFailedBatch = async () => {
    if (!failedApplyBatch || !content.trim()) return;
    setApplying(true);
    try {
      const result = await runApplyBatchesProject(failedApplyBatch.items, content, { resetStatuses: false });
      if (!result.stoppedEarly) {
        setFailedApplyBatch(null);
        setApplyStatus({ status: "idle", message: "" });
        setApplySummary((prev) => prev ? {
          ...prev,
          appliedIds: [...prev.appliedIds, ...result.appliedIds],
          failedItems: prev.failedItems.filter((f) => !result.appliedIds.includes(f.id)),
        } : null);
        toast.success("Failed batch applied. Continue with any remaining selected improvements.");
      }
    } finally {
      setApplying(false);
    }
  };

  const retryFailedItems = async () => {
    if (!applySummary?.failedItems.length || !content.trim()) return;
    setApplying(true);
    setFailedApplyBatch(null);
    const toRetry = applySummary.failedItems;
    try {
      const result = await runApplyBatchesProject(toRetry, content, { resetStatuses: false });
      if (!result.stoppedEarly) {
        setApplyStatus({ status: "idle", message: "" });
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
      setApplying(false);
    }
  };

  const viewUpdatedItinerary = () => {
    setApplySummary(null);
    setApplyStatus({ status: "idle", message: "" });
    scrollEditorIntoView();
  };



  const keepOriginal = () => {
    if (previousContent === null) return;
    setContent(previousContent);
    setPreviousContent(null);
    toast.success("Original itinerary restored");
  };


  const handleSave = async () => {
    if (!project) return;
    setSaving(true);
    try {
      const { error } = await supabase
        .from("client_projects")
        .update({
          itinerary_content: content,
          internal_notes: notes,
          hero_image_url: heroUrl,
          hero_image_credit: heroCredit || null,
          hero_image_caption: heroCaption || null,
          cover_tagline: tagline || null,
        } as any)
        .eq("id", project.id);
      if (error) throw error;
      await supabase
        .from("project_itinerary_editor_drafts" as any)
        .upsert({ project_id: project.id, draft: snapshot as any } as any, { onConflict: "project_id" } as any);
      toast.success("Itinerary saved");
      setLastPersistedSignature(projectSnapshotSignature(snapshot));
      setLastAutoSavedAt(new Date().toISOString());
      setAutoSaveStatus("saved");
      onSaved?.();
    } catch (e: any) {
      toast.error(e?.message || "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const handleHeroPick = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image");
      return;
    }
    if (file.size > 15 * 1024 * 1024) {
      toast.error("Image must be under 15MB");
      return;
    }
    setUploadingHero(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");
      const safe = file.name.replace(/[^a-zA-Z0-9._-]/g, "-");
      const path = `${user.id}/covers/${project?.id || "tmp"}-${Date.now()}-${safe}`;
      const { error } = await supabase.storage
        .from("itinerary-images")
        .upload(path, file, { contentType: file.type });
      if (error) throw error;
      const { data } = supabase.storage.from("itinerary-images").getPublicUrl(path);
      setHeroUrl(data.publicUrl);
      toast.success("Hero image uploaded");
    } catch (err: any) {
      toast.error(err?.message || "Upload failed");
    } finally {
      setUploadingHero(false);
      if (heroInputRef.current) heroInputRef.current.value = "";
    }
  };

  const handleExportPdf = () => setShowPdf(true);
  const doPrint = () => setTimeout(() => window.print(), 300);

  return (
    <>
      <Dialog
        open={open}
        onOpenChange={(nextOpen) => {
          if (nextOpen) { onOpenChange(true); return; }
          if (isBusy) {
            toast.info("Please wait for the current action to finish before closing the editor.");
            return;
          }
          requestClose();
        }}
      >
        <DialogContent
          className="fixed left-1/2 top-2 bottom-2 max-w-6xl w-[96vw] h-auto max-h-none translate-y-0 !flex flex-col overflow-hidden p-5 gap-3"
          onPointerDownOutside={(e) => {
            // Radix portals (Select, tooltips, toasts, image cropper, the
            // close-confirm AlertDialog overlay) all read as "outside" the
            // dialog. Silently block — never trigger the discard-confirm
            // modal from background pointer events during normal editing.
            e.preventDefault();
          }}
          onInteractOutside={(e) => e.preventDefault()}
          onEscapeKeyDown={(e) => {
            e.preventDefault();
            if (isBusy) return;
            requestClose();
          }}
        >
          <DialogHeader className="shrink-0">
            <DialogTitle className="font-serif text-xl">
              {project?.client_name} {project?.destination ? `· ${project.destination}` : ""}
            </DialogTitle>
            <DialogDescription>
              {[project?.trip_duration, project?.start_date, project?.end_date].filter(Boolean).join(" · ") || "Edit the itinerary, cover, and internal notes."}
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

          <div className="grid grid-cols-3 gap-4 flex-1 min-h-0 overflow-hidden">
            <div className="col-span-2 flex min-h-0 flex-col overflow-hidden">
              <div className="text-[0.65rem] font-semibold tracking-[0.1em] uppercase text-voyage-muted mb-1.5">Itinerary (WYSIWYG)</div>
              {auditItems.length > 0 && (
                <div className="mb-2">
                  <AuditChecklist
                    items={auditItems}
                    onToggle={toggleItem}
                    onSelectAll={selectAll}
                    onDeselectAll={deselectAll}
                    canKeepOriginal={previousContent !== null}
                    onKeepOriginal={keepOriginal}
                    compact
                    statuses={itemStatuses}
                  />
                  {applyStatus.status !== "idle" && (
                    <div className={`mt-2 rounded border px-3 py-2 text-[0.78rem] ${applyStatus.status === "error" ? "border-destructive/30 bg-destructive/10 text-destructive" : "border-gold/40 bg-gold/10 text-ink"}`}>
                      <div className="flex items-center gap-2 font-medium">
                        {applyStatus.status === "running" ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <AlertCircle className="w-3.5 h-3.5" />}
                        {applyStatus.message}
                      </div>
                      {applyStatus.detail && <div className="mt-1 opacity-80">{applyStatus.detail}</div>}
                    </div>
                  )}
                  {applySummary && (
                    <div className={`mt-2 rounded-md border px-3 py-2 text-[0.78rem] ${applySummary.failedItems.length ? "border-destructive/40 bg-destructive/5" : "border-sage/40 bg-sage/10"}`}>
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
                              disabled={applying}
                              className="px-3 py-1.5 rounded-sm border border-destructive/40 text-[0.7rem] font-medium uppercase tracking-wider text-destructive hover:bg-destructive hover:text-voyage-white transition-colors inline-flex items-center gap-1.5 disabled:opacity-50"
                            >
                              {applying ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCcw className="w-3 h-3" />}
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
              )}
              <div className="flex-1 min-h-0 overflow-y-auto border border-parchment-3 rounded-md bg-voyage-white">
                <EditorErrorBoundary>
                  <ItineraryEditor content={content} onContentChange={setContent} />
                </EditorErrorBoundary>
              </div>
            </div>


            <div className="flex min-h-0 flex-col gap-3 overflow-y-auto pr-1">
              {/* Hero image */}
              <div>
                <div className="text-[0.65rem] font-semibold tracking-[0.1em] uppercase text-voyage-muted mb-1.5">PDF Cover Hero Image</div>
                <input
                  ref={heroInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleHeroPick}
                  className="hidden"
                />
                {heroUrl ? (
                  <div className="relative group rounded-md overflow-hidden border border-parchment-3">
                    <img src={heroUrl} alt="Hero" className="w-full h-32 object-cover" />
                    <button
                      onClick={() => setHeroUrl(null)}
                      className="absolute top-1 right-1 bg-ink/70 text-voyage-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                      title="Remove"
                    >
                      <X className="w-3 h-3" />
                    </button>
                    <button
                      onClick={() => heroInputRef.current?.click()}
                      disabled={uploadingHero}
                      className="absolute bottom-1 right-1 bg-voyage-white/90 text-ink text-[0.65rem] px-2 py-0.5 rounded uppercase tracking-wider"
                    >
                      Replace
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => heroInputRef.current?.click()}
                    disabled={uploadingHero}
                    className="w-full h-32 border-2 border-dashed border-parchment-3 rounded-md flex flex-col items-center justify-center gap-1 text-voyage-muted hover:border-gold hover:text-ink transition-colors text-[0.7rem]"
                  >
                    {uploadingHero ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <ImagePlus className="w-5 h-5" />
                    )}
                    {uploadingHero ? "Uploading…" : "Upload cover image"}
                  </button>
                )}
                {heroUrl && (
                  <div className="space-y-1.5 mt-2">
                    <input
                      type="text"
                      value={heroCredit}
                      onChange={(e) => setHeroCredit(e.target.value)}
                      placeholder="Photo credit (optional) — e.g. © Visit Norway"
                      className="w-full p-1.5 rounded-md border border-parchment-3 bg-parchment text-ink text-[0.72rem] focus:outline-none focus:border-gold"
                    />
                    <input
                      type="text"
                      value={heroCaption}
                      onChange={(e) => setHeroCaption(e.target.value)}
                      placeholder="Caption / description (optional)"
                      className="w-full p-1.5 rounded-md border border-parchment-3 bg-parchment text-ink text-[0.72rem] focus:outline-none focus:border-gold"
                    />
                  </div>
                )}
              </div>

              {/* Tagline */}
              <div>
                <div className="text-[0.65rem] font-semibold tracking-[0.1em] uppercase text-voyage-muted mb-1.5">Cover Tagline</div>
                <input
                  type="text"
                  value={tagline}
                  onChange={(e) => setTagline(e.target.value)}
                  placeholder="Your Journey, Curated."
                  className="w-full p-2 rounded-md border border-parchment-3 bg-parchment text-ink text-[0.8rem] focus:outline-none focus:border-gold transition-colors"
                />
              </div>

              {/* Internal notes */}
              <div className="flex-1 flex flex-col min-h-[180px]">
                <div className="text-[0.65rem] font-semibold tracking-[0.1em] uppercase text-voyage-muted mb-1.5">Internal notes</div>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Private notes for your team — not visible to the customer."
                  className="flex-1 w-full p-3 rounded-md border border-parchment-3 bg-parchment text-ink text-[0.8rem] focus:outline-none focus:border-gold transition-colors resize-none"
                />
              </div>
            </div>
          </div>

          <div className="flex shrink-0 justify-between gap-2 border-t border-parchment-3 bg-background pt-3">
            <div className="flex gap-2">
              <button
                onClick={handleExportPdf}
                disabled={!content.trim()}
                className="px-4 py-2 rounded-sm border border-ink/25 text-[0.72rem] font-medium tracking-[0.08em] uppercase text-ink hover:border-ink hover:bg-ink hover:text-voyage-white transition-all inline-flex items-center gap-2 disabled:opacity-50"
              >
                <FileText className="w-3.5 h-3.5" /> Export PDF
              </button>
              <button
                onClick={runAudit}
                disabled={auditing || applying || !content.trim()}
                className="px-4 py-2 rounded-sm border border-ink/25 text-[0.72rem] font-medium tracking-[0.08em] uppercase text-ink hover:border-ink hover:bg-ink hover:text-voyage-white transition-all inline-flex items-center gap-2 disabled:opacity-50"
              >
                {auditing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ShieldCheck className="w-3.5 h-3.5" />}
                {auditing ? "Auditing…" : "Audit Itinerary"}
              </button>
              {auditItems.length > 0 && (
                <button
                  onClick={applyImprovements}
                  disabled={applying || failedApplyBatch !== null || !auditItems.some((i) => i.selected)}
                  className="px-4 py-2 rounded-sm border border-gold bg-gold/10 text-[0.72rem] font-medium tracking-[0.08em] uppercase text-ink hover:bg-gold hover:text-ink transition-all inline-flex items-center gap-2 disabled:opacity-50"
                >
                  {applying ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                  {applying ? "Rewriting…" : `Apply Selected (${auditItems.filter((i) => i.selected).length})`}
                </button>
              )}
              {failedApplyBatch && (
                <button
                  onClick={retryFailedBatch}
                  disabled={applying}
                  className="px-4 py-2 rounded-sm border border-gold bg-gold/10 text-[0.72rem] font-medium tracking-[0.08em] uppercase text-ink hover:bg-gold hover:text-ink transition-all inline-flex items-center gap-2 disabled:opacity-50"
                >
                  {applying ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                  Retry batch {failedApplyBatch.batchNumber}
                </button>
              )}
              {previousContent !== null && (
                <button
                  onClick={keepOriginal}
                  disabled={applying}
                  className="px-4 py-2 rounded-sm border border-ink/25 text-[0.72rem] font-medium tracking-[0.08em] uppercase text-ink hover:border-ink hover:bg-ink hover:text-voyage-white transition-all inline-flex items-center gap-2 disabled:opacity-50"
                >
                  <Undo2 className="w-3.5 h-3.5" /> Keep Original
                </button>
              )}
            </div>

            <div className="flex gap-2">
              <button
                onClick={requestClose}
                className="px-4 py-2 rounded-sm border border-parchment-3 text-[0.72rem] font-medium tracking-[0.08em] uppercase text-voyage-muted hover:border-ink hover:text-ink transition-all"
              >
                Close
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-5 py-2 rounded-sm bg-gold text-ink text-[0.72rem] font-semibold tracking-[0.1em] uppercase hover:bg-gold-2 transition-colors disabled:opacity-50 inline-flex items-center gap-2"
              >
                {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                Save Changes
              </button>
            </div>
          </div>

          {showPdf && project && (
            <PdfPreview
              content={content}
              project={{
                ...(project as any),
                hero_image_url: heroUrl,
                hero_image_credit: heroCredit,
                hero_image_caption: heroCaption,
                cover_tagline: tagline,
              }}
              onClose={() => setShowPdf(false)}
              onExport={doPrint}
            />
          )}
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
            <AlertDialogAction onClick={closeAnyway}>Close Anyway</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default ProjectItineraryDialog;
