// Sanitise raw Google Docs HTML down to a strict structural allow-list.
// All inline styles, fonts, colours, classes, spans, and Google wrapper divs
// are dropped. The PDF body inherits its typography from the app stylesheet.
const ALLOWED = new Set([
  "H1", "H2", "H3", "P", "UL", "OL", "LI", "STRONG", "EM", "B", "I", "A", "BR", "BLOCKQUOTE",
]);
const TAG_MAP: Record<string, string> = { B: "STRONG", I: "EM" };

const escapeAttr = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const escapeText = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

function serialize(node: Node): string {
  if (node.nodeType === Node.TEXT_NODE) return escapeText(node.textContent || "");
  if (node.nodeType !== Node.ELEMENT_NODE) return "";
  const el = node as Element;
  const rawTag = el.tagName.toUpperCase();
  const tag = TAG_MAP[rawTag] || rawTag;
  const inner = Array.from(el.childNodes).map(serialize).join("");
  if (!ALLOWED.has(tag)) {
    // Drop the tag, keep the children. Strips spans, divs, tables, images,
    // Google's wrapper divs, etc., without losing the text inside.
    return inner;
  }
  if (tag === "BR") return "<br>";
  if (tag === "A") {
    const href = el.getAttribute("href") || "";
    // Google wraps external links in a redirect; strip and keep target.
    let cleanHref = href;
    try {
      const u = new URL(href, "https://docs.google.com");
      if (u.hostname.endsWith("google.com") && u.pathname.startsWith("/url")) {
        cleanHref = u.searchParams.get("q") || href;
      }
    } catch { /* leave as-is */ }
    if (!/^(https?:|mailto:|tel:)/i.test(cleanHref)) return inner;
    return `<a href="${escapeAttr(cleanHref)}" target="_blank" rel="noopener noreferrer">${inner}</a>`;
  }
  const lower = tag.toLowerCase();
  return `<${lower}>${inner}</${lower}>`;
}

export function sanitizeDocHtml(raw: string): string {
  if (!raw) return "";
  const doc = new DOMParser().parseFromString(raw, "text/html");
  // Drop Google's <style> noise entirely.
  doc.querySelectorAll("style, script, meta, link, title").forEach((n) => n.remove());
  const out = Array.from(doc.body.childNodes).map(serialize).join("");
  // Collapse empty paragraphs Google emits between every block.
  return out
    .replace(/<p>\s*(?:<br\s*\/?>)?\s*<\/p>/gi, "")
    .replace(/(\s)+/g, " ")
    .trim();
}
