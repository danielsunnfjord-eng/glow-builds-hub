import { useTranslation } from "react-i18next";
import { markdownToHtml } from "./markdownHelpers";


interface AiPreviewPanelProps {
  original: string;
  preview: string;
  onAccept: () => void;
  onReject: () => void;
  loading?: boolean;
}

const AiPreviewPanel = ({ original, preview, onAccept, onReject, loading }: AiPreviewPanelProps) => {
  const { t } = useTranslation();

  if (loading) {
    return (
      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-ink/95 backdrop-blur-sm border border-gold/20 rounded-lg shadow-2xl p-4 w-[420px] max-h-[300px] z-50">
        <div className="flex items-center gap-2 text-gold text-sm animate-pulse">
          <span>⏳</span>
          <span>{t("aiEdit.generating") || "Generating preview..."}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-ink/95 backdrop-blur-sm border border-gold/20 rounded-lg shadow-2xl p-3 w-[420px] max-h-[350px] z-50 flex flex-col gap-2">
      <div className="text-gold text-[0.7rem] font-semibold flex items-center gap-1.5">
        <span>✨</span>
        <span>{t("aiEdit.previewTitle") || "AI Preview"}</span>
      </div>

      <div className="flex gap-2 max-h-[220px] overflow-hidden">
        {/* Original */}
        <div className="flex-1 min-w-0">
          <div className="text-white/40 text-[0.6rem] font-medium mb-1 uppercase tracking-wider">
            {t("aiEdit.original") || "Original"}
          </div>
          <div
            className="fjw-ai-preview bg-white/5 rounded-sm p-2 text-white/60 text-[0.68rem] leading-relaxed overflow-y-auto max-h-[180px] border border-white/10"
            dangerouslySetInnerHTML={{ __html: markdownToHtml(original) }}
          />
        </div>

        {/* Arrow */}
        <div className="flex items-center text-gold/60 text-sm shrink-0">→</div>

        {/* Preview */}
        <div className="flex-1 min-w-0">
          <div className="text-gold/80 text-[0.6rem] font-medium mb-1 uppercase tracking-wider">
            {t("aiEdit.suggested") || "Suggested"}
          </div>
          <div
            className="fjw-ai-preview bg-gold/5 rounded-sm p-2 text-white text-[0.68rem] leading-relaxed overflow-y-auto max-h-[180px] border border-gold/20"
            dangerouslySetInnerHTML={{ __html: markdownToHtml(preview) }}
          />
        </div>
      </div>

      <div className="flex gap-2 pt-1">
        <button
          type="button"
          onClick={onReject}
          className="flex-1 px-3 py-1.5 rounded-sm text-[0.65rem] font-medium text-white/70 bg-white/10 hover:bg-white/20 transition-all"
        >
          ✕ {t("aiEdit.reject") || "Reject"}
        </button>
        <button
          type="button"
          onClick={onAccept}
          className="flex-1 px-3 py-1.5 rounded-sm text-[0.65rem] font-semibold text-ink bg-gold hover:bg-gold/80 transition-all"
        >
          ✓ {t("aiEdit.accept") || "Accept"}
        </button>
      </div>
    </div>
  );
};

export default AiPreviewPanel;
