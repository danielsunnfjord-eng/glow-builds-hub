## Goal
Make Module 1 (project itinerary) and Module 2 (catalogue itinerary) editors render as scrollable A4 "pages" matching the printed PDF, with manual page breaks, live page numbers, and a native Print button.

## Important caveat (please read before I build)
True content-aware pagination in TipTap (auto-splitting a paragraph across two A4 pages mid-sentence) requires a custom ProseMirror layout engine and is brittle. I will deliver a **visually paginated A4 view** that is correct for the vast majority of cases:

- The editor canvas is a single 210mm-wide A4 column with the exact PDF margins, fonts, sizes, and line-height (so it looks identical to the printed page).
- Page boundaries are drawn as a repeating horizontal guide every 297mm so you can clearly see where the page break will fall as you type.
- Manual page breaks (toolbar button + `Ctrl/Cmd+Enter`) insert a hard A4 page boundary that is honoured both on screen and in the PDF/print output.
- "Page X of Y" is computed live from the editor's pixel height plus any manual breaks.
- Printing uses the browser's native dialog with `@page { size: A4 }` and `page-break-before: always` on each manual break.

If you need true automatic mid-paragraph splitting (Word-style "content reflows across pages as you type"), that is a much larger effort — say the word and I'll scope it as a follow-up.

## Changes

### 1. A4 editor canvas (`ItineraryEditor.tsx` + `index.css`)
- Wrap `<EditorContent>` in a centered 210mm-wide "page sheet" with PDF margins (`22mm 22mm 26mm`), white background, shadow, and a faint grey gutter around it (mimicking Word page view).
- Add a CSS repeating linear-gradient at 297mm intervals to draw a dashed page-break guide line across the sheet.
- Toolbar stays sticky at the top (already sticky — keep as-is).
- Font/size/line-height tokens already shared via `.fjw-editor-wysiwyg` / `.pdf-preview-content` in `index.css`; verify parity and tighten any mismatches (heading sizes, paragraph margins).

### 2. Manual page break
- Register a tiny custom TipTap node `pageBreak` that:
  - Renders in the editor as a labeled horizontal divider (`— Page Break —`).
  - Serializes to HTML as `<div class="fjw-page-break"></div>`.
  - Markdown round-trip: `<!-- pagebreak -->` token in `markdownHelpers.ts` ↔ the node.
- Add a toolbar button (⤵ icon, tooltip "Insert page break — Ctrl+Enter") and a keyboard shortcut.
- PDF preview and print CSS treat `.fjw-page-break` as `page-break-before: always` and visually start a new A4 sheet.

### 3. Live "Page X of Y"
- A small overlay pill at the bottom-right of the editor: `Page {current} of {total}`.
- Total = `ceil(editorHeightPx / pageHeightPx) + manualBreaks`.
- Current = computed from scroll position relative to the editor container.

### 4. Print button
- New `🖨 Print` button next to `📄 Export PDF` in `PdfPreview.tsx` header. Calls `window.print()`.
- Print stylesheet (already present `@page { size: A4; margin: 0 }`) extended so:
  - `.fjw-page-break` forces `page-break-before: always`.
  - Editor canvas hides chrome (toolbar, page-number pill, gutter background) when printing.

### 5. PDF preview parity
- `PdfPreview.tsx` already renders A4 sheets; add handling for `.fjw-page-break` inside the content HTML so a manual break splits the content sheet into multiple A4 sheets in the preview.

## Files touched
- `src/components/voyage/ItineraryEditor.tsx` — A4 canvas wrapper, page-number overlay, register PageBreak node.
- `src/components/voyage/editor/Toolbar.tsx` — page-break button + shortcut wiring.
- `src/components/voyage/editor/PageBreak.ts` *(new)* — custom TipTap node.
- `src/components/voyage/editor/markdownHelpers.ts` — round-trip the `<!-- pagebreak -->` token.
- `src/components/voyage/PdfPreview.tsx` — Print button; split content by `.fjw-page-break` into multiple sheets.
- `src/index.css` — A4 sheet styles, page-guide background, page-break print rules, page-number pill.
- `src/i18n/locales/{en,no,pt}.ts` — labels for "Page Break", "Print", "Page X of Y".

## Out of scope (will not change)
- Automatic mid-paragraph content reflow across pages.
- Any business logic, AI prompts, hotel/Stripe/email flows.
- The Catalogue PDF edge function (`generate-catalog-pdf`) — it already renders A4; I'll only ensure it respects `.fjw-page-break` if present.

Shall I proceed with this scope?
