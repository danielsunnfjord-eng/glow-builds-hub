import TurndownService from "turndown";

export function cleanMarkdown(md: string): string {
  return md
    .replace(/\\([#*_~`>|\-\[\](){}+.!])/g, "$1")
    .replace(/\\\\/g, "\\")
    .replace(/(?<!\w)__(?!\w)/g, "")
    .replace(/(?<=\s)_(\S[^_]*\S)_(?=\s|[.,;:!?]|$)/g, "<em>$1</em>");
}

export function markdownToHtml(md: string): string {
  if (!md) return "";
  let cleaned = cleanMarkdown(md);
  let html = cleaned
    .replace(/!\[([^\]]*)\]\(([^)]+)\)\n\*Photo:\s*([^*]*)\*/g, '<figure><img src="$2" alt="$1"><figcaption>Photo: $3</figcaption></figure>')
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
    if (!img) return "";
    const alt = img.getAttribute("alt") || "";
    const src = img.getAttribute("src") || "";
    const credit = cap?.textContent?.replace(/^Photo:\s*/, "") || "";
    return credit
      ? `\n\n![${alt}](${src})\n*Photo: ${credit}*\n`
      : `\n\n![${alt}](${src})\n`;
  },
});

export function htmlToMarkdown(html: string): string {
  return turndownService.turndown(html);
}
