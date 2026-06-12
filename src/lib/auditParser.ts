export interface AuditItem {
  id: string;
  title: string;
  why: string;
}

export interface SelectableAuditItem extends AuditItem {
  selected: boolean;
}

const uid = () =>
  (typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `a-${Math.random().toString(36).slice(2)}-${Date.now()}`);

/**
 * Accepts:
 *  - a JSON string like {"items":[{"title":"...","why":"..."}]}
 *  - a JSON array string
 *  - a plain markdown bullet list (fallback for legacy audits)
 *  - already parsed value
 * Returns a normalised list of audit items.
 */
export function parseAuditItems(raw: unknown): AuditItem[] {
  if (!raw) return [];
  let value: any = raw;
  if (typeof raw === "string") {
    const trimmed = raw.trim();
    if (!trimmed) return [];
    // try direct JSON
    if (trimmed.startsWith("{") || trimmed.startsWith("[")) {
      try {
        value = JSON.parse(trimmed);
      } catch {
        value = trimmed;
      }
    } else {
      // try to find a JSON block inside markdown
      const match = trimmed.match(/```json\s*([\s\S]*?)```/i) || trimmed.match(/(\[[\s\S]*\]|\{[\s\S]*\})/);
      if (match) {
        try {
          value = JSON.parse(match[1] ?? match[0]);
        } catch {
          value = trimmed;
        }
      } else {
        value = trimmed;
      }
    }
  }

  const arr: any[] = Array.isArray(value)
    ? value
    : Array.isArray(value?.items)
    ? value.items
    : [];

  if (arr.length) {
    return arr
      .map((it: any) => {
        if (typeof it === "string") {
          const [title, ...rest] = it.split(/[—:-]\s+/);
          return {
            id: uid(),
            title: (title || it).trim(),
            why: rest.join(" — ").trim(),
          };
        }
        return {
          id: uid(),
          title: String(it.title || it.suggestion || it.issue || "").trim(),
          why: String(it.why || it.reason || it.explanation || it.detail || "").trim(),
        };
      })
      .filter((i) => i.title);
  }

  // Markdown fallback: split bullet lines
  const lines = String(value)
    .split(/\r?\n/)
    .map((l) => l.replace(/^\s*[-*•]\s*/, "").trim())
    .filter(Boolean);

  return lines.map((line) => {
    const parts = line.split(/\s+[—–-]\s+/);
    const title = (parts.shift() || line).replace(/^\*\*|\*\*$/g, "").trim();
    const why = parts.join(" — ").trim();
    return { id: uid(), title, why };
  });
}

export function itemsToPromptText(items: AuditItem[]): string {
  return items
    .map((it, i) => `${i + 1}. ${it.title}${it.why ? ` — ${it.why}` : ""}`)
    .join("\n");
}

export function serializeAuditItems(items: AuditItem[]): string {
  return JSON.stringify({ items: items.map(({ title, why }) => ({ title, why })) });
}
