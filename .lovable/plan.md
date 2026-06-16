## Root causes

### 1. Heading button changes "the whole text"
TipTap's `toggleHeading` is a **block-level** transform: it converts the entire paragraph node containing the cursor/selection, regardless of how many characters are highlighted. That alone is expected, but the real problem in our editor is that **AI-generated content often arrives as one giant paragraph** because `markdownToHtml` only splits paragraphs on double newlines (`\n\n`), and AI output (and the recent `ai-text-transform` strip-markdown pass) collapses paragraph boundaries to single `\n`. Result: the "whole document" is one `<p>` block, so toggling H2 turns *everything* into an H2.

### 2. AI polish wipes headers, lists, paragraphs
In `AiEditMenu.tsx`, the selection is extracted with `editor.state.doc.textBetween(from, to, " ")` — **plain text only, no markup**. The `ai-text-transform` edge function's system prompt then explicitly tells the model: *"Do NOT use markdown syntax (no ##, no **, no -...)"* and a post-processing pass strips any markdown the model produces anyway. The plain-text result is reinserted via `insertContentAt`, which drops every heading/list/bold in the selection.

## Fix plan

### A. Preserve formatting through the AI round-trip
- `AiEditMenu.tsx`
  - Extract the selected slice as **HTML** (`editor.view.dom`-scoped serializer, or `editor.state.doc.cut(from,to)` → ProseMirror `DOMSerializer`), then convert to **markdown** via the existing `htmlToMarkdown` helper.
  - Send that markdown to the edge function.
  - Convert the returned markdown back to HTML via `markdownToHtml` and insert with `insertContentAt(from, html, { parseOptions: { preserveWhitespace: 'full' } })` (or `editor.commands.insertContent(html)` after `deleteRange`).
  - Update `AiPreviewPanel` to render the original/preview as HTML (or at least preserve line breaks) so the user previews the formatted result, not a flattened string.
- `supabase/functions/ai-text-transform/index.ts`
  - Replace the "no markdown" rules with: *"Preserve the input's markdown structure exactly — keep all `#`/`##`/`###` headings, `**bold**`, `*italic*`, bullet/numbered lists, blockquotes and blank-line paragraph breaks. Only rewrite the prose inside those structures."*
  - Remove the post-processing strip block (`replace(/^#+\s*/gm, "")`, `**…**` stripping, `*…*` stripping, `^[-*]\s+` → `• `) so headings and emphasis survive.
  - Keep `translate_*` actions on the same "preserve structure" rule.

### B. Make heading toggle behave intuitively
TipTap cannot turn a *substring* of a paragraph into a heading (headings are whole blocks). Two complementary improvements:
1. **Ensure paragraph breaks survive the markdown round-trip.** In `markdownHelpers.ts`, normalize incoming content so single `\n` between sentence groups doesn't get glued into one `<p>`. Concretely: in `markdownToHtml`, after image/heading replacements, treat any line that follows a blank line or another block as a new paragraph; and in `cleanMarkdown`, collapse triple+ newlines to `\n\n` but never collapse `\n\n` down to `\n`. Also harden the AI-output formatter (`ai-text-transform`) to keep the blank lines between paragraphs (see fix A) so polished output stays multi-paragraph.
2. **Toolbar feedback for headings.** In `Toolbar.tsx`, when the user clicks H1/H2/H3 with a *partial* selection inside a paragraph, first expand the selection to the full block (using `editor.commands.selectParentNode()` equivalent: `setTextSelection` to the block's start/end via `$from.before()` / `$from.after()`), so the visible behavior matches the result and there's no surprise. Add a small `title` tooltip clarifying "Applies to the current paragraph."

### C. Verification
- Build + load the catalogue itinerary editor in a Playwright session.
- Paste a multi-paragraph markdown sample, confirm paragraphs render as separate `<p>` blocks.
- Click H2 with cursor inside paragraph 2 → only paragraph 2 becomes heading.
- Select a region containing one `## Heading`, two paragraphs and a bullet list → run AI "Improve" → confirm headings/list/paragraphs survive in the preview and after Accept.
- Re-open the dialog and confirm round-tripped markdown still parses to the same structure.

## Files to change

- `src/components/voyage/editor/AiEditMenu.tsx` — selection as HTML→markdown, insert HTML back, preview as HTML.
- `src/components/voyage/editor/AiPreviewPanel.tsx` — render HTML preview.
- `src/components/voyage/editor/markdownHelpers.ts` — preserve paragraph breaks more robustly.
- `src/components/voyage/editor/Toolbar.tsx` — auto-expand selection to the parent block when toggling headings; tooltip wording.
- `supabase/functions/ai-text-transform/index.ts` — new system prompt that preserves markdown; remove markdown-stripping post-processor.

No schema, RLS, secrets, or auth changes.