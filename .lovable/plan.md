## Diagnosis
The Google Docs update function already clears and rewrites the document body. The remaining duplication is happening before the sync: audit-apply is using a sectional rewrite flow that asks the AI to return only changed section bodies. If the AI returns a section body that includes copied headings/days or extra surrounding content, the merge step stores that duplicated content in `itinerary_content_*`, and Google Docs faithfully writes the doubled final text.

## Plan
1. **Modify only the audit apply path**
   - Update `src/lib/auditApply.ts` so section replacements are sanitized before merging.
   - Strip duplicated heading lines from returned section bodies.
   - Reject/trim responses that contain multiple day headings or unrelated sections instead of blindly merging them.

2. **Strengthen the audit rewrite prompt**
   - Update `supabase/functions/audit-itinerary-claude/index.ts` for `mode: "rewrite_sections"` so the AI is explicitly forbidden from returning the section heading, neighboring day sections, or the full itinerary.
   - Require returned `body` to be only the replacement body for the exact section ID.

3. **Add safety logging for future diagnosis**
   - Log when a returned audit section is sanitized or skipped because it looks like a full/neighboring itinerary section.
   - Keep logs limited to metadata/section IDs, not full itinerary body copy.

4. **Do not change protected areas**
   - Do not change Google Doc create path.
   - Do not change the editor UI layout.
   - Do not change normal save behavior.
   - Do not change `CatalogShopManager.tsx` unless needed only to call the safer audit helper.

## Expected result
When you generate body content, run audit, apply suggestions, and create/open the Google Doc, the document will contain the final rewritten itinerary once, with audit changes replacing the original text rather than adding duplicate Day/Morning/Afternoon/Evening sections.