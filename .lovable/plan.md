# Fix duplicated Day 1–4 in the generated itinerary

## Root cause

The duplication in your Google Doc TOC (Day 1–4 appearing twice) is not coming from the audit‑apply step or the Google Doc sync — it's baked into `state.content` from the very first "Generate with AI" run, then faithfully mirrored to the Doc.

In `supabase/functions/generate-catalog-itinerary/index.ts` the full‑itinerary mode is generated in two sequential Anthropic calls (`streamSequentialCalls`, lines 286–356):

- Call 1 prompt: "write the intro and the FIRST HALF of the days, stop cleanly at the end of a day".
- Call 2 prompt: "Continue the itinerary. Do not repeat the intro or any days already written. Start at the next `## Day N — Theme`."

But each call is dispatched with a fresh `messages: [{ role: 'user', content: userPrompts[i] }]` — pass 2 receives **no assistant turn** carrying what pass 1 produced. Claude has zero memory of "what was already written", so it cannot honour "do not repeat" and the easiest thing for it to do is start again at Day 1. Result: two copies of Day 1–4 concatenated in the stream, which is what you see in the TOC.

The earlier audit‑apply and Google Doc fixes were correct — they just weren't the cause of this particular duplication.

## Plan

Only one file changes: `supabase/functions/generate-catalog-itinerary/index.ts`.

1. **Give pass 2 the actual context from pass 1.** Capture pass 1's streamed assistant text in `streamSequentialCalls` and prepend it as an `assistant` message on pass 2 (Anthropic's standard continuation pattern), so Claude can see exactly which days already exist and continue from the next one.

   ```text
   messages: [
     { role: 'user',      content: userPrompts[0] },
     { role: 'assistant', content: <text streamed in pass 1> },
     { role: 'user',      content: userPrompts[1] },
   ]
   ```

2. **Tighten the continuation prompt** to reference the prior assistant turn explicitly: "Below in the previous assistant turn are the intro and the first days already written. Continue from the next `## Day N — Theme`. Do not repeat any day heading that already appears above."

3. **Add a safety filter on pass 2's stream** that drops any `## Day N — …` heading whose `N` already appeared in pass 1, and everything under it until the next non‑duplicate `## Day` heading. This is a belt‑and‑braces guard for the rare case Claude still echoes a day; it's a single regex check on each emitted line, no behavioural change when the model behaves.

4. **No changes** to:
   - `src/lib/auditApply.ts` (recent sanitizer is correct).
   - `supabase/functions/audit-itinerary-claude/index.ts`.
   - `supabase/functions/gdrive-sync-itinerary/index.ts` (create + `docsReplaceBody` paths are correct; logging stays).
   - `src/components/voyage/CatalogShopManager.tsx` (save/sync ownership fix stays).

5. **Deploy** the `generate-catalog-itinerary` edge function and ask you to:
   - Generate a fresh itinerary on a test draft.
   - Confirm the editor's TOC shows Day 1–4 only once.
   - Push to Google Doc and confirm the Doc TOC matches.

Existing drafts that already contain doubled content will still need a regeneration (or manual cleanup) — the fix prevents new duplications, it does not retroactively dedupe stored content.

## Technical detail

- `streamSequentialCalls(opts)` will accumulate pass‑i text in a local string while it forwards chunks to the client, then pass that string into the next iteration's `messages` array as a prior `assistant` turn. No change to the streaming protocol the client reads.
- The safety filter operates on the buffered SSE line layer (where we already split on `\n`), tracking which `## Day N` headings have been emitted; if pass 2 emits a heading whose `N` is already in the set, we suppress emission of that line plus subsequent lines until the next acceptable `## Day` heading or the next `# ` heading.
- `mode: 'section'` (single‑pass regenerate) is unaffected.
