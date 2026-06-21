import { itemsToPromptText, type AuditItem } from "@/lib/auditParser";

// One improvement per call now: each call only rewrites the affected
// section(s), so it is cheap and well within timeout limits.
export const AUDIT_APPLY_BATCH_SIZE = 1;

export const chunkAuditItems = <T,>(items: T[], size = AUDIT_APPLY_BATCH_SIZE): T[][] => {
  const chunks: T[][] = [];
  for (let i = 0; i < items.length; i += size) chunks.push(items.slice(i, i + size));
  return chunks;
};

export const buildAuditBatchPrompt = (items: AuditItem[]) =>
  `Apply ONLY the following selected improvements. Leave everything else unchanged.\n\n${itemsToPromptText(items)}`;

// -------- Sectional rewrite helpers --------

const HEADING_RE = /^(#{1,3})\s+.+/;

export interface MdSection {
  id: string;
  heading: string; // full heading line ("## Where to Stay") or "" for preamble
  body: string;    // verbatim body markdown after the heading line
}

export function splitMarkdownSections(md: string): MdSection[] {
  const lines = (md || "").split("\n");
  const out: MdSection[] = [];
  let current: MdSection = { id: "s0", heading: "", body: "" };
  let bodyLines: string[] = [];
  let index = 0;
  const flush = () => {
    current.body = bodyLines.join("\n");
    out.push(current);
    bodyLines = [];
  };
  for (const line of lines) {
    if (HEADING_RE.test(line)) {
      flush();
      index += 1;
      current = { id: `s${index}`, heading: line, body: "" };
    } else {
      bodyLines.push(line);
    }
  }
  flush();
  return out;
}

export function mergeMarkdownSections(
  sections: MdSection[],
  updates: Array<{ id: string; body: string }>,
): string {
  const map = new Map(updates.map((u) => [String(u.id), String(u.body ?? "")]));
  return sections
    .map((s) => {
      const newBody = map.has(s.id) ? map.get(s.id)! : s.body;
      return s.heading ? (newBody ? `${s.heading}\n${newBody}` : s.heading) : newBody;
    })
    .join("\n");
}

export interface ApplyImprovementResult {
  newContent: string;
  changedHeading: string | null;
  changedSectionIds: string[];
}

/**
 * Apply ONE improvement by sending Claude only the relevant section context
 * (full document split into labeled sections; Claude returns only the
 * rewritten sections as JSON, capped at 2000 output tokens).
 */
export async function applyImprovementSectional(args: {
  url: string;
  headers: HeadersInit;
  signal?: AbortSignal;
  content: string;
  improvement: AuditItem;
  extras?: Record<string, unknown>;
}): Promise<ApplyImprovementResult> {
  const sections = splitMarkdownSections(args.content);
  const res = await fetch(args.url, {
    method: "POST",
    headers: args.headers,
    signal: args.signal,
    body: JSON.stringify({
      mode: "rewrite_sections",
      sections: sections.map((s) => ({ id: s.id, heading: s.heading, body: s.body })),
      improvement: { title: args.improvement.title, why: args.improvement.why },
      ...(args.extras || {}),
    }),
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => "");
    throw new Error(errText || `Apply failed (${res.status})`);
  }

  const data = await res.json().catch(() => null) as { sections?: Array<{ id: string; body: string }> } | null;
  const updates = Array.isArray(data?.sections) ? data!.sections : [];

  if (!updates.length) {
    // No section flagged for change — treat as a successful no-op so the
    // overall flow continues and the item is marked applied.
    return { newContent: args.content, changedHeading: null, changedSectionIds: [] };
  }

  // Only honor IDs that exist in the original document.
  const validIds = new Set(sections.map((s) => s.id));
  const sectionById = new Map(sections.map((s) => [s.id, s]));

  const safeUpdates = updates
    .map((u) => ({ id: String(u?.id ?? ""), body: String(u?.body ?? "") }))
    .filter((u) => validIds.has(u.id))
    .map((u) => ({ id: u.id, body: sanitizeReturnedSectionBody(u.body, sectionById.get(u.id)!) }))
    .filter((u) => u.body !== null) as Array<{ id: string; body: string }>;

  if (!safeUpdates.length) {
    return { newContent: args.content, changedHeading: null, changedSectionIds: [] };
  }

  const merged = mergeMarkdownSections(sections, safeUpdates);
  const firstHeadingLine = sections.find((s) => s.id === safeUpdates[0].id)?.heading || "";
  const changedHeading = firstHeadingLine.replace(/^#+\s*/, "").trim() || null;
  return { newContent: merged, changedHeading, changedSectionIds: safeUpdates.map((u) => u.id) };
}

/**
 * Sanitize a section body returned by the audit AI:
 * - Strip the section's own heading if Claude included it back.
 * - Reject bodies that contain ADDITIONAL headings (other days/sections) —
 *   merging those would duplicate content like "Day 1, 2, 3" twice in the
 *   final Google Doc.
 */
function sanitizeReturnedSectionBody(rawBody: string, section: MdSection): string | null {
  let body = (rawBody ?? "").replace(/\r\n/g, "\n");

  // Strip leading copy of the section's own heading line if present.
  if (section.heading) {
    const ownHeading = section.heading.trim();
    const lines = body.split("\n");
    while (lines.length && lines[0].trim() === "") lines.shift();
    if (lines.length && lines[0].trim() === ownHeading) {
      lines.shift();
      if (lines.length && lines[0].trim() === "") lines.shift();
    }
    body = lines.join("\n");
  }

  // Strip any markdown heading lines that survived — they would create extra
  // Day/Morning/Afternoon/Evening sections on top of the originals.
  const headingLineRe = /^\s*#{1,6}\s+.+$/;
  const filtered = body
    .split("\n")
    .filter((ln) => {
      if (!headingLineRe.test(ln)) return true;
      // eslint-disable-next-line no-console
      console.warn("[auditApply] stripped stray heading from returned section", {
        sectionId: section.id,
        line: ln.slice(0, 120),
      });
      return false;
    })
    .join("\n")
    .trim();

  return filtered;
}


// Legacy streaming reader — kept for any code paths that still stream a full
// rewrite (e.g. fallback / older flows). New apply flow no longer uses it.
export const readRewriteStream = async (res: Response, emptyMessage: string) => {
  if (!res.ok || !res.body) {
    const errText = await res.text().catch(() => "");
    throw new Error(errText || `Rewrite failed (${res.status})`);
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let text = "";
  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    text += decoder.decode(value, { stream: true });
  }
  text += decoder.decode();

  if (text.includes("[Error from upstream")) throw new Error(text.trim());
  const trimmed = text.trim();
  if (!trimmed) throw new Error(emptyMessage);
  return trimmed;
};
