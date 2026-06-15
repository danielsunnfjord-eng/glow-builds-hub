/**
 * Helpers for the "Apply Selected Improvements" UX:
 *   - find the first heading whose section changed
 *   - briefly highlight + scroll the live editor to that section
 *
 * The editor renders its ProseMirror DOM with the class `fjw-editor-wysiwyg`.
 * Both editors (CatalogShop and ProjectItinerary) keep that class so we can
 * scope the lookup to the visible editor instance.
 */

export type ApplyItemStatus = "pending" | "applying" | "applied" | "failed";

export const findFirstChangedHeadingText = (oldMd: string, newMd: string): string | null => {
  const oldLines = (oldMd || "").split("\n");
  const newLines = (newMd || "").split("\n");
  const max = Math.max(oldLines.length, newLines.length);
  let lastHeading: string | null = null;
  for (let i = 0; i < max; i++) {
    const n = newLines[i] ?? "";
    const o = oldLines[i] ?? "";
    const m = n.match(/^#{1,4}\s+(.+?)\s*$/);
    if (m) lastHeading = m[1].trim();
    if (n !== o) return lastHeading;
  }
  return null;
};

const FLASH_CLASS = "fjw-audit-flash";

export const flashEditorHighlight = (headingText: string | null) => {
  // Defer one frame so the editor has rendered the new content first.
  window.setTimeout(() => {
    const editors = Array.from(
      document.querySelectorAll(".fjw-editor-wysiwyg"),
    ) as HTMLElement[];
    if (!editors.length) return;
    const editor = editors[editors.length - 1]; // most recently mounted / visible
    let target: HTMLElement | null = null;
    if (headingText) {
      const needle = headingText.slice(0, 80).toLowerCase();
      const headings = Array.from(editor.querySelectorAll("h1, h2, h3, h4")) as HTMLElement[];
      target = headings.find((h) => (h.textContent || "").trim().toLowerCase().startsWith(needle)) || null;
    }
    const el = target || editor;
    try {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    } catch {
      el.scrollIntoView();
    }
    el.classList.remove(FLASH_CLASS);
    // force reflow so the animation restarts even when re-triggered quickly
    void el.offsetWidth;
    el.classList.add(FLASH_CLASS);
    window.setTimeout(() => el.classList.remove(FLASH_CLASS), 4200);
  }, 80);
};

export const scrollEditorIntoView = () => flashEditorHighlight(null);
