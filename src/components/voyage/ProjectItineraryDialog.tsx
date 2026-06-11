import { useEffect, useRef, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import ItineraryEditor from "./ItineraryEditor";
import PdfPreview from "./PdfPreview";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, FileText, ImagePlus, X, ShieldCheck, Undo2, Sparkles } from "lucide-react";

const SUPABASE_URL = "https://jgpratgrdorvkruonzgr.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpncHJhdGdyZG9ydmtydW9uemdyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ4OTYzMzQsImV4cCI6MjA5MDQ3MjMzNH0.08GsMrM1nSbzIpkPxQ-19HXVyNTiQGvV_TKkowEf4cs";

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
  cover_tagline?: string | null;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  project: Project | null;
  onSaved?: () => void;
}

const ProjectItineraryDialog = ({ open, onOpenChange, project, onSaved }: Props) => {
  const [content, setContent] = useState("");
  const [notes, setNotes] = useState("");
  const [heroUrl, setHeroUrl] = useState<string | null>(null);
  const [tagline, setTagline] = useState("");
  const [uploadingHero, setUploadingHero] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showPdf, setShowPdf] = useState(false);
  const [auditing, setAuditing] = useState(false);
  const [applying, setApplying] = useState(false);
  const [auditReport, setAuditReport] = useState<string | null>(null);
  const [previousContent, setPreviousContent] = useState<string | null>(null);
  const heroInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    setContent(project?.itinerary_content || "");
    setNotes(project?.internal_notes || "");
    setHeroUrl(project?.hero_image_url || null);
    setTagline(project?.cover_tagline || "");
    setAuditReport(null);
    setPreviousContent(null);
  }, [open, project]);

  const runAudit = async () => {
    if (!content.trim()) {
      toast.error("Itinerary is empty");
      return;
    }
    setAuditing(true);
    try {
      const { data, error } = await supabase.functions.invoke("audit-itinerary-claude", {
        body: { content, mode: "audit" },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      const audit = (data?.audit || "").trim();
      if (!audit) throw new Error("No audit returned");
      setAuditReport(audit);
      toast.success("Audit complete — review and apply improvements if you like.");
    } catch (e: any) {
      toast.error(e?.message || "Audit failed");
    } finally {
      setAuditing(false);
    }
  };

  const applyImprovements = async () => {
    if (!content.trim() || !auditReport) return;
    setApplying(true);
    const original = content;
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch(
        `${SUPABASE_URL}/functions/v1/audit-itinerary-claude`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            apikey: SUPABASE_ANON_KEY,
            Authorization: `Bearer ${session?.access_token || SUPABASE_ANON_KEY}`,
          },
          body: JSON.stringify({
            content: original,
            mode: "rewrite",
            audit: auditReport,
            start_date: project?.start_date,
            end_date: project?.end_date,
            trip_duration: project?.trip_duration,
          }),
        },
      );
      if (!res.ok || !res.body) {
        const errText = await res.text().catch(() => "");
        throw new Error(`Rewrite failed: ${errText || res.status}`);
      }
      setPreviousContent(original);
      setContent("");
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let acc = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        acc += decoder.decode(value, { stream: true });
        setContent(acc);
      }
      toast.success("Improvements applied — review and save.");
    } catch (e: any) {
      toast.error(e?.message || "Failed to apply improvements");
      setContent(original);
    } finally {
      setApplying(false);
    }
  };

  const keepOriginal = () => {
    if (previousContent === null) return;
    setContent(previousContent);
    setAuditReport(null);
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
          cover_tagline: tagline || null,
        } as any)
        .eq("id", project.id);
      if (error) throw error;
      toast.success("Itinerary saved");
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
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent
          className="fixed left-1/2 top-2 bottom-2 max-w-6xl w-[96vw] h-auto max-h-none translate-y-0 !flex flex-col overflow-hidden p-5 gap-3"
          onPointerDownOutside={(e) => { if (showPdf) e.preventDefault(); }}
          onInteractOutside={(e) => { if (showPdf) e.preventDefault(); }}
          onEscapeKeyDown={(e) => { if (showPdf) e.preventDefault(); }}
        >
          <DialogHeader className="shrink-0">
            <DialogTitle className="font-serif text-xl">
              {project?.client_name} {project?.destination ? `· ${project.destination}` : ""}
            </DialogTitle>
            <DialogDescription>
              {[project?.trip_duration, project?.start_date, project?.end_date].filter(Boolean).join(" · ") || "Edit the itinerary, cover, and internal notes."}
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-3 gap-4 flex-1 min-h-0 overflow-hidden">
            <div className="col-span-2 flex min-h-0 flex-col overflow-hidden">
              <div className="text-[0.65rem] font-semibold tracking-[0.1em] uppercase text-voyage-muted mb-1.5">Itinerary (WYSIWYG)</div>
              {auditReport && (
                <div className="mb-2 rounded-md border border-gold/60 bg-gold/10 p-3 max-h-48 overflow-y-auto">
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="text-[0.65rem] font-semibold tracking-[0.1em] uppercase text-ink inline-flex items-center gap-1.5">
                      <ShieldCheck className="w-3.5 h-3.5" /> Audit Report
                    </div>
                    {previousContent !== null && (
                      <button
                        onClick={keepOriginal}
                        className="text-[0.65rem] uppercase tracking-wider text-ink hover:text-gold inline-flex items-center gap-1"
                      >
                        <Undo2 className="w-3 h-3" /> Keep Original
                      </button>
                    )}
                  </div>
                  <pre className="whitespace-pre-wrap font-sans text-[0.78rem] text-ink leading-relaxed">{auditReport}</pre>
                </div>
              )}
              <div className="flex-1 min-h-0 overflow-hidden border border-parchment-3 rounded-md bg-voyage-white">
                <ItineraryEditor content={content} onContentChange={setContent} />
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
              {auditReport && previousContent === null && (
                <button
                  onClick={applyImprovements}
                  disabled={applying}
                  className="px-4 py-2 rounded-sm border border-gold bg-gold/10 text-[0.72rem] font-medium tracking-[0.08em] uppercase text-ink hover:bg-gold hover:text-ink transition-all inline-flex items-center gap-2 disabled:opacity-50"
                >
                  {applying ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                  {applying ? "Rewriting…" : "Apply Improvements"}
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
                onClick={() => onOpenChange(false)}
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
                cover_tagline: tagline,
              }}
              onClose={() => setShowPdf(false)}
              onExport={doPrint}
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ProjectItineraryDialog;
