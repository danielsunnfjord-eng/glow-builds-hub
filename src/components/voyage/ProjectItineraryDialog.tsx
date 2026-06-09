import { useEffect, useRef, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import ItineraryEditor from "./ItineraryEditor";
import PdfPreview from "./PdfPreview";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, FileText, ImagePlus, X } from "lucide-react";

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
  const heroInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    setContent(project?.itinerary_content || "");
    setNotes(project?.internal_notes || "");
    setHeroUrl(project?.hero_image_url || null);
    setTagline(project?.cover_tagline || "");
  }, [open, project]);

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
          className="relative max-w-6xl w-[96vw] h-[94vh] max-h-[94vh] !flex flex-col overflow-hidden"
          onPointerDownOutside={(e) => { if (showPdf) e.preventDefault(); }}
          onInteractOutside={(e) => { if (showPdf) e.preventDefault(); }}
          onEscapeKeyDown={(e) => { if (showPdf) e.preventDefault(); }}
        >
          <DialogHeader>
            <DialogTitle className="font-serif text-xl">
              {project?.client_name} {project?.destination ? `· ${project.destination}` : ""}
            </DialogTitle>
            <DialogDescription>
              {[project?.trip_duration, project?.start_date, project?.end_date].filter(Boolean).join(" · ") || "Edit the itinerary, cover, and internal notes."}
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-3 gap-4 flex-1 overflow-hidden">
            <div className="col-span-2 flex flex-col overflow-hidden">
              <div className="text-[0.65rem] font-semibold tracking-[0.1em] uppercase text-voyage-muted mb-1.5">Itinerary (WYSIWYG)</div>
              <div className="flex-1 overflow-auto border border-parchment-3 rounded-md bg-voyage-white">
                <ItineraryEditor content={content} onContentChange={setContent} />
              </div>
            </div>

            <div className="flex flex-col gap-3 overflow-auto">
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

          <div className="flex justify-between gap-2 pt-3">
            <button
              onClick={handleExportPdf}
              disabled={!content.trim()}
              className="px-4 py-2 rounded-sm border border-ink/25 text-[0.72rem] font-medium tracking-[0.08em] uppercase text-ink hover:border-ink hover:bg-ink hover:text-voyage-white transition-all inline-flex items-center gap-2 disabled:opacity-50"
            >
              <FileText className="w-3.5 h-3.5" /> Export PDF
            </button>
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
