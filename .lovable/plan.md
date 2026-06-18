## Root cause

The cover `<section>` in `PdfPreview.tsx` has both:

```css
.fjw-cover-page {
  height: 297mm;          /* fills full A4 page */
  break-after: page;       /* forces another page break AFTER */
  page-break-after: always;
}
```

Combined with Paged.js's named page (`page: cover`), the page-break is redundant. The cover already occupies a full 297mm page, then `break-after: page` forces an **extra** empty page before the itinerary section starts. Same root cause likely applies to `.fjw-back-page` if it ever appears before other content.

## Fix

Remove the `break-after: page` and `page-break-after: always` declarations from `.fjw-cover-page` (lines 107–108). The transition between the `cover` named page and the default page used by `.fjw-itinerary-section` already triggers a new page in Paged.js — no manual break needed.

Verify by:
1. Opening the PDF preview — confirm itinerary content begins on page 2, no blank page in between.
2. Using the in-app Print button — confirm the printed/exported PDF has no blank page after the cover.