import { ShieldCheck, Undo2, CheckCircle2, XCircle, Loader2, Circle } from "lucide-react";
import type { SelectableAuditItem } from "@/lib/auditParser";
import type { ApplyItemStatus } from "@/lib/auditHighlight";

interface Props {
  items: SelectableAuditItem[];
  onToggle: (id: string) => void;
  onSelectAll: () => void;
  onDeselectAll: () => void;
  canKeepOriginal?: boolean;
  onKeepOriginal?: () => void;
  compact?: boolean;
  statuses?: Record<string, ApplyItemStatus>;
}

const StatusBadge = ({ status }: { status?: ApplyItemStatus }) => {
  if (!status || status === "pending") {
    return (
      <span className="inline-flex items-center gap-1 text-[0.62rem] uppercase tracking-wider text-voyage-muted">
        <Circle className="w-3 h-3" /> Pending
      </span>
    );
  }
  if (status === "applying") {
    return (
      <span className="inline-flex items-center gap-1 text-[0.62rem] uppercase tracking-wider text-ink">
        <Loader2 className="w-3 h-3 animate-spin" /> Applying…
      </span>
    );
  }
  if (status === "applied") {
    return (
      <span className="inline-flex items-center gap-1 text-[0.62rem] uppercase tracking-wider text-sage">
        <CheckCircle2 className="w-3 h-3" /> Applied
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 text-[0.62rem] uppercase tracking-wider text-destructive">
      <XCircle className="w-3 h-3" /> Failed
    </span>
  );
};

const AuditChecklist = ({
  items,
  onToggle,
  onSelectAll,
  onDeselectAll,
  canKeepOriginal,
  onKeepOriginal,
  compact,
  statuses,
}: Props) => {
  if (!items.length) return null;
  const selectedCount = items.filter((i) => i.selected).length;
  const hasStatuses = !!statuses && Object.keys(statuses).length > 0;

  return (
    <div className="rounded-md border border-gold/60 bg-gold/10 p-3">
      <div className="flex items-center justify-between gap-2 mb-2 flex-wrap">
        <div className="text-[0.7rem] font-semibold tracking-[0.1em] uppercase text-ink inline-flex items-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5" />
          Audit — {selectedCount}/{items.length} selected
        </div>
        <div className="flex items-center gap-2">
          <button type="button" onClick={onSelectAll} className="text-[0.65rem] uppercase tracking-wider text-ink hover:text-gold">
            Select all
          </button>
          <span className="text-ink/40 text-[0.65rem]">·</span>
          <button type="button" onClick={onDeselectAll} className="text-[0.65rem] uppercase tracking-wider text-ink hover:text-gold">
            Deselect all
          </button>
          {canKeepOriginal && onKeepOriginal && (
            <>
              <span className="text-ink/40 text-[0.65rem]">·</span>
              <button
                type="button"
                onClick={onKeepOriginal}
                className="text-[0.65rem] uppercase tracking-wider text-ink hover:text-gold inline-flex items-center gap-1"
              >
                <Undo2 className="w-3 h-3" /> Keep Original
              </button>
            </>
          )}
        </div>
      </div>
      <ul className={`space-y-1.5 ${compact ? "max-h-56" : "max-h-72"} overflow-y-auto pr-1`}>
        {items.map((it) => {
          const status = statuses?.[it.id];
          return (
            <li key={it.id}>
              <label className="flex items-start gap-2 p-2 rounded-sm bg-voyage-white/70 hover:bg-voyage-white cursor-pointer border border-transparent hover:border-gold/40 transition-colors">
                <input
                  type="checkbox"
                  checked={it.selected}
                  onChange={() => onToggle(it.id)}
                  className="mt-0.5 h-4 w-4 accent-gold cursor-pointer shrink-0"
                />
                <span className="flex-1 text-[0.8rem] leading-snug text-ink">
                  <span className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium">{it.title}</span>
                    {hasStatuses && <StatusBadge status={status} />}
                  </span>
                  {it.why && <span className="block text-[0.72rem] text-voyage-muted mt-0.5">{it.why}</span>}
                </span>
              </label>
            </li>
          );
        })}
      </ul>
    </div>
  );
};

export default AuditChecklist;
