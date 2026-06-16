import { Editor } from "@tiptap/react";
import { useTranslation } from "react-i18next";
import { useRef } from "react";
import ToolbarButton, { ToolbarSep } from "./ToolbarButton";
import ColorPicker from "./ColorPicker";
import LinkPopover from "./LinkPopover";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ImagePlus } from "lucide-react";



const Toolbar = ({ editor }: { editor: Editor }) => {
  const { t } = useTranslation();
  const fileRef = useRef<HTMLInputElement>(null);
  const savedSelection = useRef<{ from: number; to: number } | null>(null);

  const currentTextColor = editor.getAttributes("textStyle").color || "";
  const currentHighlight = editor.getAttributes("highlight").color || "";
  const linkHref = editor.getAttributes("link").href || "";

  const handleImagePick = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error("Image must be smaller than 10MB");
      return;
    }
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");
      const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "-");
      const path = `${user.id}/editor/${Date.now()}-${safeName}`;
      const { error } = await supabase.storage
        .from("itinerary-images")
        .upload(path, file, { contentType: file.type });
      if (error) throw error;
      const { data } = supabase.storage.from("itinerary-images").getPublicUrl(path);
      const caption = (window.prompt("Optional caption / description (e.g. 'Sunrise over Nærøyfjord'):", "") || "").trim();
      const credit = (window.prompt("Optional photo credit (e.g. '© Visit Norway / Per Kvarting'):", "") || "").trim();
      const safeCap = caption.replace(/</g, "&lt;").replace(/"/g, "&quot;");
      const safeCred = credit.replace(/</g, "&lt;").replace(/"/g, "&quot;");
      // Insert image (TipTap image extension)
      (editor.chain().focus() as any).setImage({ src: data.publicUrl, alt: caption || "Image" }).run();
      if (caption || credit) {
        const lines: string[] = [];
        if (caption) lines.push(`<p class="fjw-img-caption"><em>${safeCap}</em></p>`);
        if (credit) lines.push(`<p class="fjw-img-credit"><small>${safeCred}</small></p>`);
        editor.chain().focus().createParagraphNear().insertContent(lines.join("")).run();
      }
      toast.success("Image inserted");
    } catch (err: any) {
      toast.error(err?.message || "Upload failed");
    }
    if (fileRef.current) fileRef.current.value = "";
  };

  // Headings are block-level in TipTap: toggling them transforms the entire
  // current block. Expand the selection to the parent block first so the user
  // visibly sees what's about to change (no more "I selected one word but the
  // whole paragraph turned into a heading" surprise).
  const toggleHeadingBlock = (level: 1 | 2 | 3) => {
    const { state } = editor;
    const { $from, $to } = state.selection;
    const start = $from.start($from.depth);
    const end = $to.end($to.depth);
    editor
      .chain()
      .focus()
      .setTextSelection({ from: start, to: end })
      .toggleHeading({ level })
      .run();
  };

  return (
    <div className="flex items-center gap-0.5 flex-wrap px-3 py-1.5 border-b border-parchment-3 bg-parchment/60">

      {/* Headings */}
      <ToolbarButton
        active={editor.isActive("heading", { level: 1 })}
        onClick={() => toggleHeadingBlock(1)}
        title="Heading 1 (applies to the current paragraph)"
      >H1</ToolbarButton>
      <ToolbarButton
        active={editor.isActive("heading", { level: 2 })}
        onClick={() => toggleHeadingBlock(2)}
        title="Heading 2 (applies to the current paragraph)"
      >H2</ToolbarButton>
      <ToolbarButton
        active={editor.isActive("heading", { level: 3 })}
        onClick={() => toggleHeadingBlock(3)}
        title="Heading 3 (applies to the current paragraph)"
      >H3</ToolbarButton>

      <ToolbarSep />

      {/* Text formatting */}
      <ToolbarButton
        active={editor.isActive("bold")}
        onClick={() => editor.chain().focus().toggleBold().run()}
        title={`${t("aa.bold") || "Bold"} (Ctrl+B)`}
      ><strong>B</strong></ToolbarButton>
      <ToolbarButton
        active={editor.isActive("italic")}
        onClick={() => editor.chain().focus().toggleItalic().run()}
        title={`${t("aa.italic") || "Italic"} (Ctrl+I)`}
      ><em>I</em></ToolbarButton>
      <ToolbarButton
        active={editor.isActive("underline")}
        onClick={() => editor.chain().focus().toggleUnderline().run()}
        title={`${t("aa.underline") || "Underline"} (Ctrl+U)`}
      ><span className="underline">U</span></ToolbarButton>
      <ToolbarButton
        active={editor.isActive("strike")}
        onClick={() => editor.chain().focus().toggleStrike().run()}
        title="Strikethrough"
      ><span className="line-through">S</span></ToolbarButton>

      <ToolbarSep />

      {/* Colors */}
      <ColorPicker
        type="text"
        currentColor={currentTextColor}
        onColorSelect={(color) => {
          if (color) {
            editor.chain().focus().setColor(color).run();
          } else {
            editor.chain().focus().unsetColor().run();
          }
        }}
        title="Text color"
      />
      <ColorPicker
        type="highlight"
        currentColor={currentHighlight}
        onColorSelect={(color) => {
          if (color) {
            editor.chain().focus().toggleHighlight({ color }).run();
          } else {
            editor.chain().focus().unsetHighlight().run();
          }
        }}
        title="Highlight"
      />

      <ToolbarSep />

      {/* Link */}
      <LinkPopover
        isActive={editor.isActive("link")}
        currentHref={linkHref}
        onSetLink={(url) => {
          if (url) {
            editor.chain().focus().extendMarkRange("link").setLink({ href: url, target: "_blank" }).run();
          }
        }}
        onUnsetLink={() => editor.chain().focus().unsetLink().run()}
        title="Link"
      />

      <ToolbarSep />

      {/* Lists */}
      <ToolbarButton
        active={editor.isActive("bulletList")}
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        title={t("aa.bulletList") || "Bullet list"}
      >≡</ToolbarButton>
      <ToolbarButton
        active={editor.isActive("orderedList")}
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        title={t("aa.orderedList") || "Numbered list"}
      >1.</ToolbarButton>

      <ToolbarSep />

      {/* Alignment */}
      <ToolbarButton
        active={editor.isActive({ textAlign: "left" })}
        onClick={() => editor.chain().focus().setTextAlign("left").run()}
        title={t("aa.alignLeft") || "Align left"}
      >⫷</ToolbarButton>
      <ToolbarButton
        active={editor.isActive({ textAlign: "center" })}
        onClick={() => editor.chain().focus().setTextAlign("center").run()}
        title={t("aa.alignCenter") || "Center"}
      >⫿</ToolbarButton>
      <ToolbarButton
        active={editor.isActive({ textAlign: "right" })}
        onClick={() => editor.chain().focus().setTextAlign("right").run()}
        title={t("aa.alignRight") || "Align right"}
      >⫸</ToolbarButton>

      <ToolbarSep />

      {/* Block elements */}
      <ToolbarButton
        active={editor.isActive("blockquote")}
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
        title={t("aa.quote") || "Quote"}
      >❝</ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().setHorizontalRule().run()}
        title={t("aa.divider") || "Divider"}
      >―</ToolbarButton>

      <ToolbarSep />

      {/* Table */}
      <ToolbarButton
        onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}
        title="Insert table"
      >⊞</ToolbarButton>
      {editor.isActive("table") && (
        <>
          <ToolbarButton
            onClick={() => editor.chain().focus().addColumnAfter().run()}
            title="Add column"
          >+Col</ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().addRowAfter().run()}
            title="Add row"
          >+Row</ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().deleteColumn().run()}
            title="Delete column"
          >−Col</ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().deleteRow().run()}
            title="Delete row"
          >−Row</ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().deleteTable().run()}
            title="Delete table"
          >🗑</ToolbarButton>
        </>
      )}

      <ToolbarSep />

      {/* Image upload */}
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        onChange={handleImagePick}
        className="hidden"
      />
      <ToolbarButton
        onClick={() => fileRef.current?.click()}
        title="Insert image"
        className="inline-flex items-center gap-1"
      >
        <ImagePlus className="w-3.5 h-3.5" />
      </ToolbarButton>

      <ToolbarSep />



      {/* Undo/Redo */}
      <ToolbarButton
        onClick={() => editor.chain().focus().undo().run()}
        disabled={!editor.can().undo()}
        title={`${t("aa.undo")} (Ctrl+Z)`}
      >↩</ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().redo().run()}
        disabled={!editor.can().redo()}
        title={`${t("aa.redo")} (Ctrl+Y)`}
      >↪</ToolbarButton>
    </div>
  );
};

export default Toolbar;
