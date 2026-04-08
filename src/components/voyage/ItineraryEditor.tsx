import { useEditor, EditorContent, Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import ImageResize from "tiptap-extension-resize-image";
import Underline from "@tiptap/extension-underline";
import TextAlign from "@tiptap/extension-text-align";
import Placeholder from "@tiptap/extension-placeholder";
import { useCallback, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import TurndownService from "turndown";

// --- Markdown ↔ HTML helpers ---
function cleanMarkdown(md: string): string {
  return md
    // Remove backslash escapes before markdown characters
    .replace(/\\([#*_~`>|\-\[\](){}+.!])/g, "$1")
    // Remove stray backslashes
    .replace(/\\\\/g, "\\")
    // Clean up double/triple underscores used incorrectly (e.g. __ text __)
    .replace(/(?<!\w)__(?!\w)/g, "")
    // Clean up stray single underscores at word boundaries used as emphasis markers
    .replace(/(?<=\s)_(\S[^_]*\S)_(?=\s|[.,;:!?]|$)/g, "<em>$1</em>");
}

function markdownToHtml(md: string): string {
  if (!md) return "";
  // Pre-clean the markdown of escape artifacts
  let cleaned = cleanMarkdown(md);
  let html = cleaned
    // Images with credit
    .replace(/!\[([^\]]*)\]\(([^)]+)\)\n\*Photo:\s*([^*]*)\*/g, '<figure><img src="$2" alt="$1"><figcaption>Photo: $3</figcaption></figure>')
    // Images
    .replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1">')
    // Headers (support optional leading whitespace and trailing whitespace)
    .replace(/^#{4}\s+(.+?)\s*$/gm, "<h4>$1</h4>")
    .replace(/^#{3}\s+(.+?)\s*$/gm, "<h3>$1</h3>")
    .replace(/^#{2}\s+(.+?)\s*$/gm, "<h2>$1</h2>")
    .replace(/^#{1}\s+(.+?)\s*$/gm, "<h1>$1</h1>")
    // Bold & italic
    .replace(/\*\*\*(.+?)\*\*\*/g, "<strong><em>$1</em></strong>")
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/(?<!\*)\*([^*\n]+?)\*(?!\*)/g, "<em>$1</em>")
    // Horizontal rule
    .replace(/^---$/gm, "<hr>")
    // Unordered list items
    .replace(/^[-*] (.+)$/gm, "<li>$1</li>")
    // Ordered list items
    .replace(/^\d+\.\s(.+)$/gm, "<li>$1</li>")
    // Blockquote
    .replace(/^> (.+)$/gm, "<blockquote><p>$1</p></blockquote>");

  // Wrap consecutive <li> in <ul>
  html = html.replace(/(<li>.*?<\/li>\n?)+/gs, (match) => `<ul>${match}</ul>`);

  // Paragraphs: wrap remaining lines
  html = html
    .split("\n\n")
    .map((block) => {
      const trimmed = block.trim();
      if (!trimmed) return "";
      if (
        trimmed.startsWith("<h") ||
        trimmed.startsWith("<ul") ||
        trimmed.startsWith("<ol") ||
        trimmed.startsWith("<hr") ||
        trimmed.startsWith("<blockquote") ||
        trimmed.startsWith("<figure") ||
        trimmed.startsWith("<img")
      )
        return trimmed;
      return `<p>${trimmed.replace(/\n/g, "<br>")}</p>`;
    })
    .join("");

  return html;
}

const turndownService = new TurndownService({
  headingStyle: "atx",
  hr: "---",
  bulletListMarker: "-",
});

turndownService.addRule("figure", {
  filter: "figure",
  replacement: (_content, node) => {
    const el = node as HTMLElement;
    const img = el.querySelector("img");
    const cap = el.querySelector("figcaption");
    if (!img) return "";
    const alt = img.getAttribute("alt") || "";
    const src = img.getAttribute("src") || "";
    const credit = cap?.textContent?.replace(/^Photo:\s*/, "") || "";
    return credit
      ? `\n\n![${alt}](${src})\n*Photo: ${credit}*\n`
      : `\n\n![${alt}](${src})\n`;
  },
});

function htmlToMarkdown(html: string): string {
  return turndownService.turndown(html);
}

// --- Toolbar ---
const ToolbarButton = ({
  active,
  onClick,
  children,
  title,
  disabled,
}: {
  active?: boolean;
  onClick: () => void;
  children: React.ReactNode;
  title?: string;
  disabled?: boolean;
}) => (
  <button
    type="button"
    onClick={onClick}
    disabled={disabled}
    title={title}
    className={`px-2 py-1 rounded-sm text-[0.72rem] font-medium transition-colors ${
      active
        ? "bg-gold text-ink"
        : "text-voyage-muted hover:bg-parchment-2 hover:text-ink"
    } disabled:opacity-30`}
  >
    {children}
  </button>
);

const ToolbarSep = () => <div className="w-px h-5 bg-parchment-3 mx-0.5" />;

const Toolbar = ({ editor }: { editor: Editor }) => {
  const { t } = useTranslation();

  return (
    <div className="flex items-center gap-0.5 flex-wrap px-3 py-1.5 border-b border-parchment-3 bg-parchment/60">
      <ToolbarButton
        active={editor.isActive("heading", { level: 1 })}
        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
        title="Heading 1"
      >
        H1
      </ToolbarButton>
      <ToolbarButton
        active={editor.isActive("heading", { level: 2 })}
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        title="Heading 2"
      >
        H2
      </ToolbarButton>
      <ToolbarButton
        active={editor.isActive("heading", { level: 3 })}
        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
        title="Heading 3"
      >
        H3
      </ToolbarButton>

      <ToolbarSep />

      <ToolbarButton
        active={editor.isActive("bold")}
        onClick={() => editor.chain().focus().toggleBold().run()}
        title={`${t("aa.bold") || "Bold"} (Ctrl+B)`}
      >
        <strong>B</strong>
      </ToolbarButton>
      <ToolbarButton
        active={editor.isActive("italic")}
        onClick={() => editor.chain().focus().toggleItalic().run()}
        title={`${t("aa.italic") || "Italic"} (Ctrl+I)`}
      >
        <em>I</em>
      </ToolbarButton>
      <ToolbarButton
        active={editor.isActive("underline")}
        onClick={() => editor.chain().focus().toggleUnderline().run()}
        title={`${t("aa.underline") || "Underline"} (Ctrl+U)`}
      >
        <span className="underline">U</span>
      </ToolbarButton>
      <ToolbarButton
        active={editor.isActive("strike")}
        onClick={() => editor.chain().focus().toggleStrike().run()}
        title="Strikethrough"
      >
        <span className="line-through">S</span>
      </ToolbarButton>

      <ToolbarSep />

      <ToolbarButton
        active={editor.isActive("bulletList")}
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        title={t("aa.bulletList") || "Bullet list"}
      >
        ≡
      </ToolbarButton>
      <ToolbarButton
        active={editor.isActive("orderedList")}
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        title={t("aa.orderedList") || "Numbered list"}
      >
        1.
      </ToolbarButton>

      <ToolbarSep />

      <ToolbarButton
        active={editor.isActive({ textAlign: "left" })}
        onClick={() => editor.chain().focus().setTextAlign("left").run()}
        title={t("aa.alignLeft") || "Align left"}
      >
        ⫷
      </ToolbarButton>
      <ToolbarButton
        active={editor.isActive({ textAlign: "center" })}
        onClick={() => editor.chain().focus().setTextAlign("center").run()}
        title={t("aa.alignCenter") || "Center"}
      >
        ⫿
      </ToolbarButton>
      <ToolbarButton
        active={editor.isActive({ textAlign: "right" })}
        onClick={() => editor.chain().focus().setTextAlign("right").run()}
        title={t("aa.alignRight") || "Align right"}
      >
        ⫸
      </ToolbarButton>

      <ToolbarSep />

      <ToolbarButton
        active={editor.isActive("blockquote")}
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
        title={t("aa.quote") || "Quote"}
      >
        ❝
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().setHorizontalRule().run()}
        title={t("aa.divider") || "Divider"}
      >
        ―
      </ToolbarButton>

      <ToolbarSep />

      <ToolbarButton
        onClick={() => editor.chain().focus().undo().run()}
        disabled={!editor.can().undo()}
        title={`${t("aa.undo")} (Ctrl+Z)`}
      >
        ↩
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().redo().run()}
        disabled={!editor.can().redo()}
        title={`${t("aa.redo")} (Ctrl+Y)`}
      >
        ↪
      </ToolbarButton>
    </div>
  );
};

// --- Main Editor ---
interface ItineraryEditorProps {
  content: string; // markdown
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
      ImageResize.configure({
        inline: false,
      }),
      Underline,
      TextAlign.configure({
        types: ["heading", "paragraph"],
      }),
      Placeholder.configure({
        placeholder: placeholder || "Start writing your itinerary...",
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

  // Sync external content changes (e.g. from AI chat) into the editor
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

  // Expose insertImage method via a callback on the editor instance
  useEffect(() => {
    if (!editor) return;
    (editor as any).__insertImage = (url: string, alt: string) => {
      (editor.chain().focus() as any).setImage({ src: url, alt }).run();
    };
  }, [editor]);

  if (!editor) return null;

  return (
    <div className="border border-parchment-3 rounded-md overflow-hidden bg-voyage-white">
      <Toolbar editor={editor} />
      <EditorContent editor={editor} />
    </div>
  );
};

export { markdownToHtml, htmlToMarkdown };
export type { ItineraryEditorProps };
export default ItineraryEditor;
