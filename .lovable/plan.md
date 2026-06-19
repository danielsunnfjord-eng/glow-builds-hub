# Word/Docs-style editor canvas

Before I rip out the current paginated canvas I need to confirm scope, because parts of the spec conflict with earlier instructions and with how TipTap actually works.

## What I can do safely (purely visual, no risk to save/PDF round-trip)

1. **Canvas background** → change editor shell from cream `#e8e0d0` to warm gray `#e8e4de`.
2. **Page card look** → strip the current "long A4 sheet with repeating background guides" and restyle the sheet as a single white card with `box-shadow: 0 2px 8px rgba(0,0,0,0.12), 0 0 0 0.5px rgba(0,0,0,0.08)` and `border-radius: 2px`.
3. **Margin guides** → faint dashed blue rectangle (`1px dashed rgba(100,140,200,0.25)`) at `inset: 48px 56px`, `position: absolute; pointer-events: none`.
4. **Page break label** → restyle `.fjw-page-break` so it visually breaks out of the white card into the gray canvas as a full-width row: horizontal line + centered uppercase `Page break — Page N starts here` (11px muted). I can number them via CSS counters.
5. **Sticky toolbar** → already sticky; I'll confirm `top: 0; z-index: 10` and that nothing above it scrolls.
6. **Status bar** → add a thin bar under the canvas with `A4 · page-accurate view` left, `Page X of Y` right (reusing existing page counter).

## What I need to flag before doing

7. **"Each page is a distinct white card, max-width 640px, content auto-flows to next page"** — TipTap/ProseMirror is a single contenteditable document. There is no built-in way to split content into multiple DOM cards while keeping it one editable document. Real pagination requires either (a) a heavy custom ProseMirror plugin that measures and inserts page boundaries on every keystroke, or (b) showing one tall sheet that *looks* paginated via guides (what you have today).

   What I can deliver without rewriting the editor: one white card per **manual** page break — i.e. the document is split into cards at every `Ctrl/Cmd+Enter` page break, with the "Page break — Page N" label between them. Automatic overflow into a new card as the user types would require the custom plugin and is a multi-day effort with real risk to the save/round-trip work we just stabilised.

   Also: `max-width: 640px` is narrower than A4 (`794px` at 96dpi). I'll use **794px** (true A4 width) so edit ≈ PDF. If you truly want 640px, the editor will no longer match PDF layout.

8. **"PDF export must not use `window.print()`; use react-to-print or @react-pdf/renderer"** conflicts with **"Do not modify any existing PDF output design."** The current PDF pipeline is Paged.js + `window.print()` and was just stabilised (cover-page blank-page fix, spacer round-trip fix). Swapping to `@react-pdf/renderer` is a full rewrite of `PdfPreview.tsx` and would lose Paged.js features (running headers, page numbering, cover layout). `react-to-print` is closer to current behaviour but still changes the export path.

   My recommendation: **leave PDF export alone**. The drift problem you reported earlier was the markdown round-trip (now fixed), not the print pipeline.

## Proposed scope to implement now

Items **1–6** plus the **manual-page-break card splitting** from item 7 (no auto-overflow, A4 width 794px, PDF export untouched).

Reply with one of:
- **"Go"** — I implement the proposed scope above.
- **"640px width"** — same, but force 640px (editor will visually diverge from PDF).
- **"Auto pagination too"** — I additionally build the ProseMirror auto-paginate plugin (large, risky).
- **"Replace PDF export"** — I additionally swap Paged.js/window.print for react-to-print or @react-pdf.
