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
    .replace(/^#{4}\s+(.+?)\s*$/gm, "<h4>$1</h4>")
    .replace(/^#{3}\s+(.+?)\s*$/gm, "<h3>$1</h3>")
    .replace(/^#{2}\s+(.+?)\s*$/gm, "<h2>$1</h2>")
    .replace(/^#{1}\s+(.+?)\s*$/gm, "<h1>$1</h1>")
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
        trimmed.startsWith("<table")
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

export function htmlToMarkdown(html: string): string {
  return turndownService.turndown(html);
}
