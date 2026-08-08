import { useState, useRef, useEffect } from "react";
import ToolbarButton from "./ToolbarButton";

const TEXT_COLORS = [
  { label: "Default", value: "" },
  { label: "Black", value: "#1a1a1a" },
  { label: "Dark Gray", value: "#4a4a4a" },
  { label: "Gray", value: "#8a8a8a" },
  { label: "Red", value: "#dc2626" },
  { label: "Orange", value: "#ea580c" },
  { label: "Amber", value: "#d97706" },
  { label: "Green", value: "#16a34a" },
  { label: "Teal", value: "#0d9488" },
  { label: "Blue", value: "#2563eb" },
  { label: "Indigo", value: "#4f46e5" },
  { label: "Purple", value: "#9333ea" },
  { label: "Pink", value: "#db2777" },
  { label: "Gold", value: "#b8860b" },
];

const HIGHLIGHT_COLORS = [
  { label: "None", value: "" },
  { label: "Yellow", value: "#fef08a" },
  { label: "Green", value: "#bbf7d0" },
  { label: "Blue", value: "#bfdbfe" },
  { label: "Pink", value: "#fbcfe8" },
  { label: "Orange", value: "#fed7aa" },
  { label: "Purple", value: "#e9d5ff" },
  { label: "Red", value: "#fecaca" },
  { label: "Teal", value: "#99f6e4" },
];

interface ColorPickerProps {
  type: "text" | "highlight";
  currentColor: string;
  onColorSelect: (color: string) => void;
  title: string;
}

const ColorPicker = ({ type, currentColor, onColorSelect, title }: ColorPickerProps) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const colors = type === "text" ? TEXT_COLORS : HIGHLIGHT_COLORS;

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    if (open) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <ToolbarButton
        active={!!currentColor}
        onClick={() => setOpen(!open)}
        title={title}
      >
        {type === "text" ? (
          <span className="flex flex-col items-center leading-none">
            <span className="text-[0.7rem] font-bold">A</span>
            <span
              className="w-3.5 h-1 rounded-xs mt-0.5"
              style={{ backgroundColor: currentColor || "#1a1a1a" }}
            />
          </span>
        ) : (
          <span className="flex flex-col items-center leading-none">
            <span
              className="text-[0.7rem] font-bold px-0.5 rounded-xs"
              style={{ backgroundColor: currentColor || "#fef08a" }}
            >
              ab
            </span>
          </span>
        )}
      </ToolbarButton>

      {open && (
        <div className="absolute top-full left-0 mt-1 z-50 bg-voyage-white border border-parchment-3 rounded-md shadow-lg p-2 w-[160px]">
          <div className="grid grid-cols-5 gap-1">
            {colors.map((c) => (
              <button
                key={c.value || "none"}
                type="button"
                title={c.label}
                onClick={() => {
                  onColorSelect(c.value);
                  setOpen(false);
                }}
                className={`w-6 h-6 rounded-xs border transition-all hover:scale-110 ${
                  currentColor === c.value ? "border-gold ring-1 ring-gold" : "border-parchment-3"
                } ${!c.value ? "bg-voyage-white relative" : ""}`}
                style={c.value ? (type === "text" ? { color: c.value, backgroundColor: c.value } : { backgroundColor: c.value }) : undefined}
              >
                {!c.value && <span className="absolute inset-0 flex items-center justify-center text-[0.55rem] text-voyage-muted">∅</span>}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ColorPicker;
