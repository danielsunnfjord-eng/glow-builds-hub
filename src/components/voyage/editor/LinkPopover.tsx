import { useState, useRef, useEffect } from "react";
import ToolbarButton from "./ToolbarButton";

interface LinkPopoverProps {
  isActive: boolean;
  currentHref: string;
  onSetLink: (url: string) => void;
  onUnsetLink: () => void;
  title: string;
  onOpenChange?: (open: boolean) => void;
}

const LinkPopover = ({ isActive, currentHref, onSetLink, onUnsetLink, title, onOpenChange }: LinkPopoverProps) => {
  const [open, setOpen] = useState(false);
  const [url, setUrl] = useState("");
  const ref = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const setOpenWithNotify = (next: boolean) => {
    setOpen(next);
    onOpenChange?.(next);
  };

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpenWithNotify(false);
    };
    if (open) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  useEffect(() => {
    if (open) {
      setUrl(currentHref || "");
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open, currentHref]);

  return (
    <div className="relative" ref={ref}>
      <ToolbarButton active={isActive} onClick={() => setOpenWithNotify(!open)} title={title}>
        🔗
      </ToolbarButton>

      {open && (
        <div className="absolute top-full left-0 mt-1 z-50 bg-voyage-white border border-parchment-3 rounded-md shadow-lg p-2 w-[240px]">
          <input
            ref={inputRef}
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://..."
            className="w-full text-xs border border-parchment-3 rounded px-2 py-1 mb-1.5 focus:outline-none focus:border-gold"
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                onSetLink(url);
                setOpenWithNotify(false);
              } else if (e.key === "Escape") {
                setOpenWithNotify(false);
              }
            }}
          />
          <div className="flex gap-1">
            <button
              type="button"
              onClick={() => { onSetLink(url); setOpenWithNotify(false); }}
              className="flex-1 text-[0.65rem] bg-gold text-ink rounded px-2 py-1 hover:bg-gold/80"
            >
              Apply
            </button>
            {isActive && (
              <button
                type="button"
                onClick={() => { onUnsetLink(); setOpenWithNotify(false); }}
                className="text-[0.65rem] border border-parchment-3 text-voyage-muted rounded px-2 py-1 hover:bg-parchment"
              >
                Remove
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default LinkPopover;
