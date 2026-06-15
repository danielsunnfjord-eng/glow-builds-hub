import { itemsToPromptText, type AuditItem } from "@/lib/auditParser";

export const AUDIT_APPLY_BATCH_SIZE = 2;

export const chunkAuditItems = <T,>(items: T[], size = AUDIT_APPLY_BATCH_SIZE): T[][] => {
  const chunks: T[][] = [];
  for (let i = 0; i < items.length; i += size) chunks.push(items.slice(i, i + size));
  return chunks;
};

export const buildAuditBatchPrompt = (items: AuditItem[]) =>
  `Apply ONLY the following selected improvements. Leave everything else unchanged.\n\n${itemsToPromptText(items)}`;

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