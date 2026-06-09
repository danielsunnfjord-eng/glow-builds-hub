import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import ItineraryEditor from "./ItineraryEditor";
import PdfPreview from "./PdfPreview";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, FileText } from "lucide-react";

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
  const [saving, setSaving] = useState(false);
  const [showPdf, setShowPdf] = useState(false);

  useEffect(() => {
    if (!open) return;
    setContent(project?.itinerary_content || "");
    setNotes(project?.internal_notes || "");
  }, [open, project]);

  const handleSave = async () => {
    if (!project) return;
    setSaving(true);
    try {
      const { error } = await supabase
        .from("client_projects")
        .update({ itinerary_content: content, internal_notes: notes } as any)
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

  const handleExportPdf = () => {
    // Reuse the existing window.print pathway: open preview, user clicks export.
    setShowPdf(true);
  };

  const doPrint = () => {
    setTimeout(() => window.print(), 300);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-6xl w-[96vw] max-h-[94vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="font-serif text-xl">
              {project?.client_name} {project?.destination ? `· ${project.destination}` : ""}
            </DialogTitle>
            <DialogDescription>
              {[project?.trip_duration, project?.start_date, project?.end_date].filter(Boolean).join(" · ") || "Edit the itinerary and internal notes. PDF export uses the trip itinerary content."}
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-3 gap-4 flex-1 overflow-hidden">
            <div className="col-span-2 flex flex-col overflow-hidden">
              <div className="text-[0.65rem] font-semibold tracking-[0.1em] uppercase text-voyage-muted mb-1.5">Itinerary</div>
              <div className="flex-1 overflow-auto border border-parchment-3 rounded-md bg-voyage-white">
                <ItineraryEditor content={content} onContentChange={setContent} />
              </div>
            </div>
            <div className="flex flex-col overflow-hidden">
              <div className="text-[0.65rem] font-semibold tracking-[0.1em] uppercase text-voyage-muted mb-1.5">Internal notes</div>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Private notes for your team — not visible to the customer."
                className="flex-1 w-full p-3 rounded-md border border-parchment-3 bg-parchment text-ink text-[0.85rem] focus:outline-none focus:border-gold transition-colors resize-none"
              />
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
        </DialogContent>
      </Dialog>

      {showPdf && project && (
        <PdfPreview
          content={content}
          project={project as any}
          onClose={() => setShowPdf(false)}
          onExport={doPrint}
        />
      )}
    </>
  );
};

export default ProjectItineraryDialog;
