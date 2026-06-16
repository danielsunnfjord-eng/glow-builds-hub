import { useState, useEffect, useRef } from "react";
import { Editor } from "@tiptap/react";
import { DOMSerializer } from "@tiptap/pm/model";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "react-i18next";
import AiPreviewPanel from "./AiPreviewPanel";
import { htmlToMarkdown, markdownToHtml } from "./markdownHelpers";

const AI_ACTIONS = [
  { key: "rewrite", icon: "✏️", labelKey: "aiEdit.rewrite" },
  { key: "improve", icon: "✨", labelKey: "aiEdit.improve" },
  { key: "humanize", icon: "🫶", labelKey: "aiEdit.humanize" },
  { key: "shorten", icon: "📐", labelKey: "aiEdit.shorten" },
  { key: "elaborate", icon: "📝", labelKey: "aiEdit.elaborate" },
  { key: "format", icon: "📋", labelKey: "aiEdit.format" },
  { key: "professional", icon: "💎", labelKey: "aiEdit.professional" },
] as const;

const TRANSLATE_ACTIONS = [
  { key: "translate_en", icon: "🇬🇧", label: "English" },
  { key: "translate_no", icon: "🇳🇴", label: "Norsk" },
  { key: "translate_pt", icon: "🇧🇷", label: "Português" },
] as const;

interface AiEditMenuProps {
  editor: Editor;
}

const AiEditMenu = ({ editor }: AiEditMenuProps) => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [visible, setVisible] = useState(false);
  const [loading, setLoading] = useState<string | null>(null);
  const [showTranslate, setShowTranslate] = useState(false);
  const [customPrompt, setCustomPrompt] = useState("");
  const [showCustom, setShowCustom] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const interactingRef = useRef(false);

  // Preview state
  const [preview, setPreview] = useState<{ original: string; result: string; from: number; to: number } | null>(null);

  useEffect(() => {
    const checkSelection = () => {
      const { from, to } = editor.state.selection;
      const hasSelection = from !== to;
      setVisible(hasSelection);
      if (!hasSelection) {
        setShowTranslate(false);
        setShowCustom(false);
      }
    };

    const handleBlur = () => {
      setTimeout(() => {
        if (!interactingRef.current) {
          setVisible(false);
        }
      }, 300);
    };

    editor.on("selectionUpdate", checkSelection);
    editor.on("blur", handleBlur);
    editor.on("focus", checkSelection);

    return () => {
      editor.off("selectionUpdate", checkSelection);
      editor.off("blur", handleBlur);
      editor.off("focus", checkSelection);
    };
  }, [editor]);

  // Extract the current selection as markdown so headings/lists/emphasis survive the round-trip.
  const getSelectedMarkdown = (): string => {
    const { from, to, empty } = editor.state.selection;
    if (empty) return "";
    try {
      const slice = editor.state.doc.slice(from, to);
      const serializer = DOMSerializer.fromSchema(editor.schema);
      const fragment = serializer.serializeFragment(slice.content);
      const container = document.createElement("div");
      container.appendChild(fragment);
      return htmlToMarkdown(container.innerHTML);
    } catch (err) {
      console.error("getSelectedMarkdown failed, falling back to text", err);
      return editor.state.doc.textBetween(from, to, "\n\n");
    }
  };

  const runAction = async (action: string, prompt?: string) => {
    const text = getSelectedMarkdown();
    if (!text.trim()) return;

    const { from, to } = editor.state.selection;
    setLoading(action);
    setPreview({ original: text, result: "", from, to });

    try {
      const body: any = { text, action };
      if (prompt) body.customPrompt = prompt;

      const { data, error } = await supabase.functions.invoke("ai-text-transform", { body });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      const result = data.result;
      if (result) {
        setPreview({ original: text, result, from, to });
      } else {
        setPreview(null);
      }
    } catch (err: any) {
      console.error("AI transform error:", err);
      toast({
        title: t("aiEdit.failed") || "AI transform failed",
        description: err.message,
        variant: "destructive",
      });
      setPreview(null);
    } finally {
      setLoading(null);
      setShowCustom(false);
      setCustomPrompt("");
    }
  };

  const acceptPreview = () => {
    if (!preview?.result) return;
    // Convert markdown back to HTML so TipTap reinstates headings, lists, emphasis, paragraph breaks.
    const html = markdownToHtml(preview.result);
    const docSize = editor.state.doc.content.size;
    const isWholeDoc = preview.from <= 1 && preview.to >= docSize - 1;

    if (isWholeDoc) {
      // Replace the entire document so block-level nodes (headings, lists)
      // aren't flattened into the surrounding paragraph context.
      editor.commands.setContent(html, { emitUpdate: true });
    } else {
      // Range replace — pass the range to insertContentAt so ProseMirror
      // splits the parent block correctly and preserves block-level nodes.
      editor
        .chain()
        .focus()
        .insertContentAt({ from: preview.from, to: preview.to }, html)
        .run();
    }



    toast({ title: `${t("aiEdit.applied") || "AI applied"} ✓` });
    setPreview(null);
  };

  const rejectPreview = () => {
    setPreview(null);
    editor.commands.focus();
  };

  if (!visible && !preview) return null;

  return (
    <div
      ref={menuRef}
      className="sticky bottom-2 z-40 mx-auto w-fit"
      onMouseDown={() => { interactingRef.current = true; }}
      onMouseUp={() => { setTimeout(() => { interactingRef.current = false; }, 100); }}
    >
      {/* Preview panel */}
      {(preview || loading) && (
        <AiPreviewPanel
          original={preview?.original || ""}
          preview={preview?.result || ""}
          onAccept={acceptPreview}
          onReject={rejectPreview}
          loading={!!loading}
        />
      )}

      <div className="bg-ink/95 backdrop-blur-sm rounded-lg shadow-xl border border-gold/20 px-2 py-1.5 flex items-center gap-1 flex-wrap max-w-[500px]">
        <span className="text-gold text-[0.65rem] font-semibold px-1.5 select-none">AI</span>
        <div className="w-px h-4 bg-white/20" />

        {AI_ACTIONS.map(({ key, icon, labelKey }) => (
          <button
            key={key}
            type="button"
            disabled={!!loading || !!preview}
            onClick={() => runAction(key)}
            title={t(labelKey) || key}
            className={`px-2 py-1 rounded text-[0.65rem] font-medium transition-all ${
              loading === key
                ? "bg-gold/30 text-gold animate-pulse"
                : "text-white/80 hover:bg-white/10 hover:text-white"
            } disabled:opacity-40`}
          >
            {loading === key ? "⏳" : icon} {t(labelKey) || key}
          </button>
        ))}

        <div className="w-px h-4 bg-white/20" />

        <div className="relative">
          <button
            type="button"
            disabled={!!loading || !!preview}
            onClick={() => { setShowTranslate(!showTranslate); setShowCustom(false); }}
            className="px-2 py-1 rounded text-[0.65rem] font-medium text-white/80 hover:bg-white/10 hover:text-white disabled:opacity-40 transition-all"
            title={t("aiEdit.translate") || "Translate"}
          >
            🌐 {t("aiEdit.translate") || "Translate"}
          </button>
          {showTranslate && (
            <div className="absolute bottom-full left-0 mb-1 bg-ink/95 border border-gold/20 rounded-md shadow-lg p-1 min-w-[120px]">
              {TRANSLATE_ACTIONS.map(({ key, icon, label }) => (
                <button
                  key={key}
                  type="button"
                  disabled={!!loading}
                  onClick={() => { runAction(key); setShowTranslate(false); }}
                  className={`w-full text-left px-2 py-1 rounded text-[0.65rem] font-medium transition-all ${
                    loading === key
                      ? "bg-gold/30 text-gold animate-pulse"
                      : "text-white/80 hover:bg-white/10 hover:text-white"
                  }`}
                >
                  {icon} {label}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="w-px h-4 bg-white/20" />

        <button
          type="button"
          disabled={!!loading || !!preview}
          onClick={() => { setShowCustom(!showCustom); setShowTranslate(false); }}
          className="px-2 py-1 rounded text-[0.65rem] font-medium text-white/80 hover:bg-white/10 hover:text-white disabled:opacity-40 transition-all"
          title={t("aiEdit.custom") || "Custom prompt"}
        >
          💬
        </button>

        {showCustom && (
          <div className="absolute bottom-full right-0 mb-1 bg-ink/95 border border-gold/20 rounded-lg shadow-lg p-2 w-[280px]">
            <textarea
              value={customPrompt}
              onChange={(e) => setCustomPrompt(e.target.value)}
              placeholder={t("aiEdit.customPlaceholder") || "Tell AI what to do with the selected text..."}
              className="w-full bg-white/10 text-white text-[0.7rem] rounded px-2 py-1.5 border border-white/20 focus:border-gold focus:outline-none resize-none h-16 placeholder:text-white/40"
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  if (customPrompt.trim()) runAction("custom", customPrompt);
                }
              }}
            />
            <button
              type="button"
              disabled={!!loading || !customPrompt.trim()}
              onClick={() => runAction("custom", customPrompt)}
              className="mt-1 w-full px-2 py-1 rounded bg-gold text-ink text-[0.65rem] font-semibold hover:bg-gold/80 disabled:opacity-40 transition-all"
            >
              {loading === "custom" ? "⏳ ..." : `✨ ${t("aiEdit.apply") || "Apply"}`}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default AiEditMenu;
