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
import { useEffect, useRef, forwardRef, useImperativeHandle } from "react";
import Toolbar from "./editor/Toolbar";
import AiEditMenu from "./editor/AiEditMenu";
import { markdownToHtml, htmlToMarkdown } from "./editor/markdownHelpers";

interface ItineraryEditorProps {
  content: string;
  onContentChange: (markdown: string) => void;
  placeholder?: string;
}

export interface ItineraryEditorHandle {
  insertImage: (url: string, alt?: string) => void;
}

const ItineraryEditor = forwardRef<ItineraryEditorHandle, ItineraryEditorProps>(
  ({ content, onContentChange, placeholder }, ref) => {
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
            "fjw-editor-wysiwyg max-w-none p-10 min-h-[420px] focus:outline-none",
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
        const html = markdownToHtml(content);
        editor.commands.setContent(html, { emitUpdate: false });
      }
    }, [content, editor]);

    if (!editor) return null;

    return (
      <div className="bg-voyage-white flex h-full min-h-0 flex-col relative">
        <div className="shrink-0 z-30 border-b border-parchment-3">
          <Toolbar editor={editor} />
        </div>
        <div className="overflow-y-auto flex-1 min-h-0 relative">
          <EditorContent editor={editor} />
          <AiEditMenu editor={editor} />
        </div>
      </div>
    );
  }
);

ItineraryEditor.displayName = "ItineraryEditor";

export { markdownToHtml, htmlToMarkdown };
export type { ItineraryEditorProps };
export default ItineraryEditor;
