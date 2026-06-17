import { Node, mergeAttributes } from "@tiptap/core";

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    pageBreak: {
      insertPageBreak: () => ReturnType;
    };
  }
}

/**
 * Manual A4 page break.
 * - Renders in the editor as a labelled horizontal divider.
 * - Serializes to <div class="fjw-page-break" data-page-break></div> in HTML.
 * - Round-trips through markdown via the `<!--pagebreak-->` comment token
 *   (handled in markdownHelpers.ts).
 */
export const PageBreak = Node.create({
  name: "pageBreak",
  group: "block",
  atom: true,
  selectable: true,
  draggable: false,

  parseHTML() {
    return [
      { tag: "div.fjw-page-break" },
      { tag: "div[data-page-break]" },
      { tag: "hr.fjw-page-break" },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "div",
      mergeAttributes(HTMLAttributes, {
        class: "fjw-page-break",
        "data-page-break": "true",
        "aria-label": "Page Break",
      }),
    ];
  },

  addCommands() {
    return {
      insertPageBreak:
        () =>
        ({ chain }) =>
          chain().focus().insertContent({ type: this.name }).run(),
    };
  },

  addKeyboardShortcuts() {
    return {
      "Mod-Enter": () => this.editor.commands.insertPageBreak(),
    };
  },
});

export default PageBreak;
