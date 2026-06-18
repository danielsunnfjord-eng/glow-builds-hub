## Problem

Both the cover and back pages use the same `logo-badge-hd.png` (1024×1024 px). However, the cover page applies aggressive CSS image-rendering settings that make the logo look pixelated:

```css
.fjw-cover-logo-img {
  image-rendering: -webkit-optimize-contrast;
  image-rendering: crisp-edges;
}
```

The back page does **not** set any `image-rendering` property, so the browser uses its default smooth scaling — which is why it looks better.

## Plan

1. **Remove the `image-rendering` declarations** from `.fjw-cover-logo-img` in `PdfPreview.tsx` so the browser scales the logo smoothly, matching the back page behavior.
2. **Verify** with a quick TypeScript check (`bunx tsc --noEmit`) to ensure no syntax errors are introduced.

This is a one-line CSS change that will make the cover page logo render at the same quality as the back page.