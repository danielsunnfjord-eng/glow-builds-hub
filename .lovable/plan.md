## Fix: cover page truncates long descriptions

### Cause
The cover page in `src/components/voyage/PdfPreview.tsx` locks every section to a fixed height so it always fits on one A4 page. The description block is:

- `height: 60mm`
- `-webkit-line-clamp: 6`
- `font-size: clamp(13px, 1.4vw, 17px)`, `line-height: 1.7`

The Zona Sul tagline is ~8–9 lines at that size, so line 7 onward gets clipped (which is what the screenshot shows). The rest of the page (title, meta, footer bar) is fine — only the description is being cut.

### Fix (single file: `src/components/voyage/PdfPreview.tsx`)

Rebalance the A4 budget to give the description more room, and raise its clamp. Total must still equal 297mm so the cover stays a single page.

New budget:

```text
logo         30mm   (unchanged)
hero         82mm   (was 95)
photo credit  9mm   (unchanged)
body        171mm   (was 158)
  eyebrow    12mm
  title      32mm   (was 36)
  desc       88mm   (was 60)
  meta       39mm   (was 45)
footer bar    5mm   (unchanged)
------------------
total       297mm
```

Description CSS changes:

- `height: 88mm`
- `-webkit-line-clamp: 10` (up from 6)
- `font-size: clamp(12px, 1.25vw, 15px)`, `line-height: 1.55` (tighter, so more of the same tagline fits)

Title height drops to 32mm and font stays at 30px — Zona Sul's title already fits on one line, and shorter titles won't be affected.

Hero drops to 82mm — still the dominant visual, just a touch less tall.

No changes to the edge function PDF (`supabase/functions/generate-catalog-pdf/index.ts`) — its description block already sizes to remaining space and isn't what's shown in the screenshot.

### Files touched
- `src/components/voyage/PdfPreview.tsx` — CSS only, no logic changes.

### Verification
Open the Zona Sul itinerary in the catalogue editor → PDF preview. The full description should now be visible without a trailing fade/clip, and the meta row + teal footer bar stay pinned at the bottom of the page.