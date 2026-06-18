import TurndownService from "turndown";

export function cleanMarkdown(md: string): string {
  return md
    // Collapse runs of 3+ newlines into a clean paragraph break, but NEVER
    // collapse `\n\n` into a single `\n` — paragraph boundaries must survive.
    .replace(/\r\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/\\([#*_~`>|\-\[\](){}+.!])/g, "$1")
    .replace(/\\\\/g, "\\")
    .replace(/(?<!\w)__(?!\w)/g, "")
    .replace(/(?<=\s)_(\S[^_]*\S)_(?=\s|[.,;:!?]|$)/g, "<em>$1</em>");
}

export function markdownToHtml(md: string): string {
  if (!md) return "";
  let cleaned = cleanMarkdown(md);
  // Manual page-break token (round-tripped via Turndown rule below).
  cleaned = cleaned.replace(/<!--\s*pagebreak\s*-->/gi, '<div class="fjw-page-break" data-page-break="true"></div>');
  let html = cleaned
    // Image with markdown title attribute = photo credit. Caption taken from alt.
    .replace(/!\[([^\]]*)\]\(([^)\s]+)\s+"([^"]*)"\)/g, (_m, alt, src, credit) => {
      const cap = alt ? `<figcaption class="fjw-img-caption">${alt}</figcaption>` : "";
      const cr = credit ? `<div class="fjw-img-credit">${credit}</div>` : "";
      return `<figure class="fjw-figure"><img src="${src}" alt="${alt}" title="${credit}">${cap}${cr}</figure>`;
    })
    // Legacy: image followed by "*Photo: …*" line on next line
    .replace(/!\[([^\]]*)\]\(([^)]+)\)\n\*Photo:\s*([^*]*)\*/g, '<figure class="fjw-figure"><img src="$2" alt="$1"><figcaption class="fjw-img-caption">$1</figcaption><div class="fjw-img-credit">$3</div></figure>')
    .replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1">')
    // Markdown links [text](url) — render as real <a> so they're clickable in the PDF.
    // Negative lookbehind for `!` prevents matching the image syntax above.
    .replace(/(^|[^!])\[([^\]]+)\]\(([^)\s]+)(?:\s+"([^"]*)")?\)/g, (_m, pre, text, href, title) => {
      const safeHref = href.replace(/"/g, "&quot;");
      const titleAttr = title ? ` title="${title.replace(/"/g, "&quot;")}"` : "";
      return `${pre}<a href="${safeHref}" target="_blank" rel="noopener noreferrer"${titleAttr}>${text}</a>`;
    })
    // Bare URLs (http/https) not already inside an <a> or markdown link → autolink
    .replace(/(^|[\s(])(https?:\/\/[^\s<)]+)/g, '$1<a href="$2" target="_blank" rel="noopener noreferrer">$2</a>')
    .replace(/^#{4}[^\S\n]+(.+?)[^\S\n]*$/gm, "<h4>$1</h4>")
    .replace(/^#{3}[^\S\n]+(.+?)[^\S\n]*$/gm, "<h3>$1</h3>")
    .replace(/^#{2}[^\S\n]+(.+?)[^\S\n]*$/gm, "<h2>$1</h2>")
    .replace(/^#{1}[^\S\n]+(.+?)[^\S\n]*$/gm, "<h1>$1</h1>")
    .replace(/\*\*\*(.+?)\*\*\*/g, "<strong><em>$1</em></strong>")
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/(?<!\*)\*([^*\n]+?)\*(?!\*)/g, "<em>$1</em>")
    .replace(/^---$/gm, "<hr>")
    .replace(/^[-*] (.+)$/gm, "<li>$1</li>")
    .replace(/^\d+\.\s(.+)$/gm, "<li>$1</li>")
    .replace(/^> (.+)$/gm, "<blockquote><p>$1</p></blockquote>");

  html = html.replace(/(<li>.*?<\/li>\n?)+/gs, (match) => `<ul>${match}</ul>`);

  html = html
    .split("\n\n")
    .map((block) => {
      // Don't trim whitespace-only blocks away — a block that is just a
      // non-breaking space is an intentional spacer paragraph.
      const isSpacer = /^[\s\u00A0]+$/.test(block) && /\u00A0/.test(block);
      if (isSpacer) return "<p>\u00A0</p>";
      const trimmed = block.trim();
      if (!trimmed) return "";
      if (
        trimmed.startsWith("<h") ||
        trimmed.startsWith("<ul") ||
        trimmed.startsWith("<ol") ||
        trimmed.startsWith("<hr") ||
        trimmed.startsWith("<blockquote") ||
        trimmed.startsWith("<figure") ||
        trimmed.startsWith("<img") ||
        trimmed.startsWith("<table") ||
        trimmed.startsWith("<div")
      )
        return trimmed;
      return `<p>${trimmed.replace(/\n/g, "<br>")}</p>`;
    })
    .join("");

  return html;
}

const turndownService = new TurndownService({
  headingStyle: "atx",
  hr: "---",
  bulletListMarker: "-",
  blankReplacement: (_content, node) => {
    if (node.nodeName !== "P") return "\n\n";
    const el = node as HTMLElement;
    if (el.querySelector("img,figure")) return "\n\n";
    return "\n\n\u00A0\n\n";
  },
});

turndownService.addRule("figure", {
  filter: "figure",
  replacement: (_content, node) => {
    const el = node as HTMLElement;
    const img = el.querySelector("img");
    const cap = el.querySelector("figcaption");
    const creditEl = el.querySelector(".fjw-img-credit");
    if (!img) return "";
    const alt = (cap?.textContent?.trim() || img.getAttribute("alt") || "").replace(/"/g, "'");
    const src = img.getAttribute("src") || "";
    const credit = (creditEl?.textContent?.trim() || img.getAttribute("title") || "").replace(/"/g, "'");
    return credit
      ? `\n\n![${alt}](${src} "${credit}")\n`
      : `\n\n![${alt}](${src})\n`;
  },
});

// Plain <img> with title attribute → preserve credit via markdown title syntax
turndownService.addRule("imageWithTitle", {
  filter: (node) => node.nodeName === "IMG" && !!(node as HTMLElement).getAttribute("title"),
  replacement: (_content, node) => {
    const el = node as HTMLElement;
    const alt = (el.getAttribute("alt") || "").replace(/"/g, "'");
    const src = el.getAttribute("src") || "";
    const title = (el.getAttribute("title") || "").replace(/"/g, "'");
    return `\n\n![${alt}](${src} "${title}")\n`;
  },
});

// Manual page break (<div class="fjw-page-break">) → markdown comment token.
turndownService.addRule("pageBreak", {
  filter: (node) =>
    node.nodeName === "DIV" &&
    ((node as HTMLElement).classList?.contains("fjw-page-break") ||
      (node as HTMLElement).getAttribute?.("data-page-break") === "true"),
  replacement: () => "\n\n<!--pagebreak-->\n\n",
});

// Empty paragraph (spacer used to position content vertically) →
// preserve as a non-breaking-space block so it survives the markdown round trip.
turndownService.addRule("emptyParagraph", {
  filter: (node) => {
    if (node.nodeName !== "P") return false;
    const el = node as HTMLElement;
    if (el.querySelector("img,figure")) return false;
    const text = (el.textContent || "").replace(/\u00A0/g, "").trim();
    return text.length === 0;
  },
  replacement: () => "\n\n\u00A0\n\n",
});

export function htmlToMarkdown(html: string): string {
  return turndownService.turndown(html);
}
