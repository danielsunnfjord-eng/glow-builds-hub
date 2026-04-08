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
import { useEffect, useRef } from "react";
import Toolbar from "./editor/Toolbar";
import { markdownToHtml, htmlToMarkdown } from "./editor/markdownHelpers";

interface ItineraryEditorProps {
  content: string;
  onContentChange: (markdown: string) => void;
  placeholder?: string;
}

const ItineraryEditor = ({ content, onContentChange, placeholder }: ItineraryEditorProps) => {
  const isInternalUpdate = useRef(false);
  const lastExternalContent = useRef(content);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3, 4] },
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
    ],
    content: markdownToHtml(content),
    editorProps: {
      attributes: {
        class:
          "prose prose-sm max-w-none p-4 min-h-[360px] focus:outline-none prose-headings:font-serif prose-headings:text-ink prose-h1:text-xl prose-h1:border-b prose-h1:border-gold/30 prose-h1:pb-2 prose-h2:text-gold prose-h2:text-base prose-p:text-ink-2 prose-strong:text-ink prose-li:text-ink-2 prose-hr:border-parchment-3 prose-img:rounded-lg prose-img:shadow-md prose-blockquote:border-l-gold prose-blockquote:text-voyage-muted",
      },
    },
    onUpdate: ({ editor }) => {
      isInternalUpdate.current = true;
      const html = editor.getHTML();
      const md = htmlToMarkdown(html);
      onContentChange(md);
    },
  });

  useEffect(() => {
    if (!editor) return;
    if (isInternalUpdate.current) {
      isInternalUpdate.current = false;
      return;
    }
    if (content !== lastExternalContent.current) {
      lastExternalContent.current = content;
      const html = markdownToHtml(content);
      editor.commands.setContent(html, { emitUpdate: false });
    }
  }, [content, editor]);

  useEffect(() => {
    if (!editor) return;
    (editor as any).__insertImage = (url: string, alt: string) => {
      (editor.chain().focus() as any).setImage({ src: url, alt }).run();
    };
  }, [editor]);

  if (!editor) return null;

  return (
    <div className="border border-parchment-3 rounded-md overflow-hidden bg-voyage-white">
      <div className="sticky top-0 z-30">
        <Toolbar editor={editor} />
      </div>
      <EditorContent editor={editor} />
    </div>
  );
};

export { markdownToHtml, htmlToMarkdown };
export type { ItineraryEditorProps };
export default ItineraryEditor;
