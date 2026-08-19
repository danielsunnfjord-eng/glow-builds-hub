/**
 * Browser-only extraction of an uploaded itinerary PDF into Markdown.
 *
 * Keeps: heading levels (from font size), paragraphs, bullet lists, clickable
 * links (from PDF link annotations) and embedded images (rendered from the page
 * and uploaded to storage by the caller).
 *
 * Import this module lazily (inside an event handler) — pdfjs is browser-only.
 */

export type ExtractProgress = (message: string) => void;

export interface ExtractOptions {
  onProgress?: ExtractProgress;
  /** Uploads an image and returns its public URL (or null to skip it). */
  uploadImage?: (blob: Blob, index: number) => Promise<string | null>;
  /** Skip images smaller than this (PDF points). */
  minImageSize?: number;
}

export interface ExtractResult {
  markdown: string;
  pages: number;
  images: number;
  links: number;
}

interface Piece {
  text: string;
  x: number;
  y: number;
  size: number;
  url: string | null;
}

const escapeMd = (s: string) => s.replace(/([*_`])/g, "\\$1");

const median = (nums: number[]) => {
  if (!nums.length) return 0;
  const s = [...nums].sort((a, b) => a - b);
  return s[Math.floor(s.length / 2)];
};

export async function extractPdfToMarkdown(
  source: string | ArrayBuffer,
  options: ExtractOptions = {},
): Promise<ExtractResult> {
  const { onProgress, uploadImage, minImageSize = 90 } = options;

  const pdfjs = await import("pdfjs-dist");
  const workerUrl = (await import("pdfjs-dist/build/pdf.worker.min.mjs?url")).default;
  pdfjs.GlobalWorkerOptions.workerSrc = workerUrl;

  const doc = await pdfjs.getDocument(
    typeof source === "string" ? { url: source } : { data: source },
  ).promise;

  const out: string[] = [];
  let imageCount = 0;
  let linkCount = 0;

  for (let pageNo = 1; pageNo <= doc.numPages; pageNo++) {
    onProgress?.(`Reading page ${pageNo}/${doc.numPages}…`);
    const page = await doc.getPage(pageNo);
    const viewport = page.getViewport({ scale: 1 });

    // ---- links -------------------------------------------------------
    const annotations = await page.getAnnotations({ intent: "display" }).catch(() => []);
    const links = (annotations as Array<Record<string, unknown>>)
      .filter((a) => a["subtype"] === "Link" && typeof a["url"] === "string")
      .map((a) => ({ url: a["url"] as string, rect: a["rect"] as number[] }));

    const urlAt = (x: number, y: number) => {
      for (const l of links) {
        const [x1, y1, x2, y2] = l.rect;
        if (x >= Math.min(x1, x2) - 1 && x <= Math.max(x1, x2) + 1 && y >= Math.min(y1, y2) - 2 && y <= Math.max(y1, y2) + 2) {
          return l.url;
        }
      }
      return null;
    };

    // ---- text --------------------------------------------------------
    const textContent = await page.getTextContent();
    const pieces: Piece[] = [];
    for (const item of textContent.items as Array<Record<string, unknown>>) {
      const str = (item["str"] as string) ?? "";
      if (!str.trim()) continue;
      const tr = item["transform"] as number[];
      const x = tr[4];
      const y = tr[5];
      const size = Math.abs(tr[3]) || Math.abs(tr[0]) || 10;
      pieces.push({ text: str, x, y, size, url: urlAt(x, y) });
    }

    const bodySize = median(pieces.map((p) => p.size)) || 10;

    // group into lines by y (tolerance relative to font size)
    const lines: { y: number; size: number; pieces: Piece[] }[] = [];
    for (const p of [...pieces].sort((a, b) => b.y - a.y || a.x - b.x)) {
      const line = lines.find((l) => Math.abs(l.y - p.y) <= Math.max(2, p.size * 0.4));
      if (line) {
        line.pieces.push(p);
        line.size = Math.max(line.size, p.size);
      } else {
        lines.push({ y: p.y, size: p.size, pieces: [p] });
      }
    }
    for (const l of lines) l.pieces.sort((a, b) => a.x - b.x);

    // ---- images ------------------------------------------------------
    const placements: { x: number; y: number; w: number; h: number }[] = [];
    if (uploadImage) {
      try {
        const ops = await page.getOperatorList();
        const OPS = pdfjs.OPS as Record<string, number>;
        let ctm = [1, 0, 0, 1, 0, 0];
        const stack: number[][] = [];
        const mul = (a: number[], b: number[]) => [
          a[0] * b[0] + a[2] * b[1],
          a[1] * b[0] + a[3] * b[1],
          a[0] * b[2] + a[2] * b[3],
          a[1] * b[2] + a[3] * b[3],
          a[0] * b[4] + a[2] * b[5] + a[4],
          a[1] * b[4] + a[3] * b[5] + a[5],
        ];
        for (let i = 0; i < ops.fnArray.length; i++) {
          const fn = ops.fnArray[i];
          if (fn === OPS["save"]) stack.push([...ctm]);
          else if (fn === OPS["restore"]) ctm = stack.pop() || ctm;
          else if (fn === OPS["transform"]) ctm = mul(ctm, ops.argsArray[i] as number[]);
          else if (
            fn === OPS["paintImageXObject"] ||
            fn === OPS["paintJpegXObject"] ||
            fn === OPS["paintInlineImageXObject"]
          ) {
            const w = Math.abs(ctm[0]) || Math.abs(ctm[1]);
            const h = Math.abs(ctm[3]) || Math.abs(ctm[2]);
            if (w >= minImageSize && h >= minImageSize) {
              placements.push({ x: ctm[4], y: ctm[5], w, h });
            }
          }
        }
      } catch {
        /* image detection is best-effort */
      }
    }

    const imageMarkers: { y: number; markdown: string }[] = [];
    if (uploadImage && placements.length) {
      onProgress?.(`Extracting ${placements.length} image(s) from page ${pageNo}…`);
      const scale = 2;
      const rendered = page.getViewport({ scale });
      const canvas = document.createElement("canvas");
      canvas.width = Math.ceil(rendered.width);
      canvas.height = Math.ceil(rendered.height);
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        await page.render({ canvas, canvasContext: ctx, viewport: rendered } as never).promise;
        for (const pl of placements) {
          const sx = Math.max(0, pl.x * scale);
          const sy = Math.max(0, (viewport.height - pl.y - pl.h) * scale);
          const sw = Math.min(canvas.width - sx, pl.w * scale);
          const sh = Math.min(canvas.height - sy, pl.h * scale);
          if (sw < 20 || sh < 20) continue;
          const crop = document.createElement("canvas");
          crop.width = Math.round(sw);
          crop.height = Math.round(sh);
          const cctx = crop.getContext("2d");
          if (!cctx) continue;
          cctx.drawImage(canvas, sx, sy, sw, sh, 0, 0, crop.width, crop.height);
          const blob: Blob | null = await new Promise((resolve) =>
            crop.toBlob((b) => resolve(b), "image/jpeg", 0.85),
          );
          if (!blob) continue;
          const url = await uploadImage(blob, imageCount);
          if (!url) continue;
          imageCount += 1;
          imageMarkers.push({ y: pl.y + pl.h, markdown: `![](${url})` });
        }
      }
    }

    // ---- assemble page markdown --------------------------------------
    type Node = { y: number; md: string };
    const nodes: Node[] = imageMarkers.map((m) => ({ y: m.y, md: m.markdown }));

    for (const line of lines) {
      let text = "";
      let currentUrl: string | null = null;
      let buffer = "";
      const flush = () => {
        if (!buffer) return;
        text += currentUrl ? `[${escapeMd(buffer.trim())}](${currentUrl})` : escapeMd(buffer);
        if (currentUrl) linkCount += 1;
        buffer = "";
      };
      let prev: Piece | null = null;
      for (const p of line.pieces) {
        const gap = prev ? p.x - (prev.x + prev.text.length * prev.size * 0.5) : 0;
        const sep = prev && gap > prev.size * 0.3 && !/\s$/.test(buffer + text) ? " " : "";
        if (p.url !== currentUrl) {
          flush();
          currentUrl = p.url;
        }
        buffer += sep + p.text;
        prev = p;
      }
      flush();

      let md = text.replace(/\s+/g, " ").trim();
      if (!md) continue;

      const bullet = /^[•‣▪·o]\s+|^[-–—]\s+/.test(md);
      if (bullet) {
        md = `- ${md.replace(/^[•‣▪·o]\s+|^[-–—]\s+/, "")}`;
      } else if (line.size >= bodySize * 1.45) {
        md = `## ${md}`;
      } else if (line.size >= bodySize * 1.18) {
        md = `### ${md}`;
      }
      nodes.push({ y: line.y, md });
    }

    nodes.sort((a, b) => b.y - a.y);

    // merge wrapped paragraph lines back together
    const pageLines: string[] = [];
    for (const node of nodes) {
      const last = pageLines[pageLines.length - 1];
      const isBlock = /^(#|-\s|!\[)/.test(node.md);
      const lastIsBlock = last ? /^(#|-\s|!\[)/.test(last) : true;
      if (last && !isBlock && !lastIsBlock && !/[.!?:;]$/.test(last)) {
        pageLines[pageLines.length - 1] = `${last} ${node.md}`;
      } else {
        pageLines.push(node.md);
      }
    }

    if (pageLines.length) out.push(pageLines.join("\n\n"));
    page.cleanup();
  }

  const markdown = out
    .join("\n\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  return { markdown, pages: doc.numPages, images: imageCount, links: linkCount };
}
