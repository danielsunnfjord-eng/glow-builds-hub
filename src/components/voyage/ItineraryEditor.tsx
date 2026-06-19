import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import ImageResize from "tiptap-extension-resize-image";
import Underline from "@tiptap/extension-underline";
import TextAlign from "@tiptap/extension-text-align";
import Placeholder from "@tiptap/extension-placeholder";
import { Color } from "@tiptap/extension-color";
import { TextStyle } from "@tiptap/extension-text-style";
import Highlight from "@tiptap/extension-highlight";
import { Table } from "@tiptap/extension-table";
import TableRow from "@tiptap/extension-table-row";
import TableCell from "@tiptap/extension-table-cell";
import TableHeader from "@tiptap/extension-table-header";
import Link from "@tiptap/extension-link";
import { useEffect, useRef, forwardRef, useImperativeHandle, useState, useLayoutEffect } from "react";
import Toolbar from "./editor/Toolbar";
import AiEditMenu from "./editor/AiEditMenu";
import { PageBreak } from "./editor/PageBreak";
import { markdownToHtml, htmlToMarkdown } from "./editor/markdownHelpers";

interface ItineraryEditorProps {
  content: string;
  onContentChange: (markdown: string) => void;
  placeholder?: string;
  destination?: string | null;
}

export interface ItineraryEditorHandle {
  insertImage: (url: string, alt?: string) => void;
}

const ItineraryEditor = forwardRef<ItineraryEditorHandle, ItineraryEditorProps>(
  ({ content, onContentChange, placeholder, destination }, ref) => {
    const isInternalUpdate = useRef(false);
    const lastExternalContent = useRef(content);
    const sheetRef = useRef<HTMLDivElement>(null);
    const [pageInfo, setPageInfo] = useState<{ current: number; total: number }>({ current: 1, total: 1 });

    const editor = useEditor({
      extensions: [
        StarterKit.configure({
          heading: { levels: [1, 2, 3, 4] },
          link: false,
          underline: false,
        }),
        ImageResize.configure({ inline: false }),
        Underline,
        TextAlign.configure({ types: ["heading", "paragraph"] }),
        Placeholder.configure({
          placeholder: placeholder || "Start writing your itinerary...",
        }),
        TextStyle,
        Color,
        Highlight.configure({ multicolor: true }),
        Table.configure({ resizable: true }),
        TableRow,
        TableCell,
        TableHeader,
        Link.configure({
          openOnClick: false,
          HTMLAttributes: { class: "text-blue-600 underline cursor-pointer" },
        }),
        PageBreak,
      ],
      content: markdownToHtml(content),
      editorProps: {
        attributes: {
          class:
            "fjw-editor-wysiwyg max-w-none focus:outline-none",
        },
      },

      onUpdate: ({ editor }) => {
        isInternalUpdate.current = true;
        const html = editor.getHTML();
        const md = htmlToMarkdown(html);
        onContentChange(md);
      },
    });

    useImperativeHandle(ref, () => ({
      insertImage: (url: string, alt = "Image") => {
        if (!editor) return;
        (editor.chain().focus() as any).setImage({ src: url, alt }).run();
      },
    }), [editor]);

    useEffect(() => {
      if (!editor) return;
      if (isInternalUpdate.current) {
        isInternalUpdate.current = false;
        return;
      }
      if (content !== lastExternalContent.current) {
        lastExternalContent.current = content;
        try {
          const html = markdownToHtml(content);
          editor.commands.setContent(html, { emitUpdate: false });
        } catch (err) {
          console.error("[ItineraryEditor] setContent failed, falling back to plain text", err);
          try {
            editor.commands.setContent(content || "", { emitUpdate: false });
          } catch (err2) {
            console.error("[ItineraryEditor] plain-text fallback also failed", err2);
          }
        }
      }
    }, [content, editor]);

    // Compute "Page X of Y" from the rendered editor height vs A4 height (1123px @ 96dpi),
    // accounting for manual page breaks.
    useLayoutEffect(() => {
      if (!editor || !sheetRef.current) return;
      const PAGE_PX = 1123; // 297mm at 96dpi
      const calc = () => {
        const sheet = sheetRef.current;
        if (!sheet) return;
        const editorEl = sheet.querySelector(".fjw-editor-wysiwyg") as HTMLElement | null;
        if (!editorEl) return;
        const manualBreaks = editorEl.querySelectorAll(".fjw-page-break").length;
        const total = Math.max(1, Math.ceil(editorEl.scrollHeight / PAGE_PX) + manualBreaks);
        // Current page: based on the nearest scrolling ancestor.
        let scrollEl: HTMLElement | Window = window;
        let parent: HTMLElement | null = sheet.parentElement;
        while (parent) {
          const oy = getComputedStyle(parent).overflowY;
          if (oy === "auto" || oy === "scroll") { scrollEl = parent; break; }
          parent = parent.parentElement;
        }
        const sheetRect = sheet.getBoundingClientRect();
        const containerRect = scrollEl === window
          ? { top: 0, height: window.innerHeight }
          : (scrollEl as HTMLElement).getBoundingClientRect();
        const offsetIntoSheet = Math.max(0, containerRect.top - sheetRect.top);
        const current = Math.min(total, Math.max(1, Math.floor(offsetIntoSheet / PAGE_PX) + 1));
        setPageInfo((prev) => (prev.current === current && prev.total === total ? prev : { current, total }));
      };
      calc();
      const ro = new ResizeObserver(calc);
      ro.observe(sheetRef.current);
      let scrollTarget: HTMLElement | Window = window;
      let parent: HTMLElement | null = sheetRef.current.parentElement;
      while (parent) {
        const oy = getComputedStyle(parent).overflowY;
        if (oy === "auto" || oy === "scroll") { scrollTarget = parent; break; }
        parent = parent.parentElement;
      }
      scrollTarget.addEventListener("scroll", calc, { passive: true });
      window.addEventListener("resize", calc);
      editor.on("update", calc);
      return () => {
        ro.disconnect();
        scrollTarget.removeEventListener("scroll", calc as any);
        window.removeEventListener("resize", calc);
        editor.off("update", calc);
      };
    }, [editor]);

    if (!editor) return null;

    return (
      <div className="relative fjw-editor-shell">
        <div className="sticky top-0 z-30 border-b border-parchment-3 bg-voyage-white shadow-sm fjw-no-print">
          <Toolbar editor={editor} />
        </div>
        <div className="relative py-6 px-4 flex justify-center">
          <div ref={sheetRef} className="fjw-a4-sheet" data-page-sheet>
            <EditorContent editor={editor} />
            <AiEditMenu editor={editor} />
            <div className="fjw-page-guides fjw-no-print" aria-hidden>
              {Array.from({ length: Math.max(0, pageInfo.total - 1) }).map((_, i) => (
                <div
                  key={i}
                  className="fjw-page-guide"
                  style={{ top: `${(i + 1) * 1123}px` }}
                >
                  <span>Page {i + 1} ends · Page {i + 2} starts</span>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="fjw-editor-statusbar fjw-no-print">
          <span>A4 · page-accurate view</span>
          <span>Page {pageInfo.current} of {pageInfo.total}</span>
        </div>
      </div>
    );
  }
);

ItineraryEditor.displayName = "ItineraryEditor";

export { markdownToHtml, htmlToMarkdown };
export type { ItineraryEditorProps };
export default ItineraryEditor;
