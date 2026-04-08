import React from "react";

interface ToolbarButtonProps {
  active?: boolean;
  onClick: () => void;
  children: React.ReactNode;
  title?: string;
  disabled?: boolean;
  className?: string;
}

const ToolbarButton = ({ active, onClick, children, title, disabled, className }: ToolbarButtonProps) => (
  <button
    type="button"
    onClick={onClick}
    disabled={disabled}
    title={title}
    className={`px-2 py-1 rounded-sm text-[0.72rem] font-medium transition-colors ${
      active
        ? "bg-gold text-ink"
        : "text-voyage-muted hover:bg-parchment-2 hover:text-ink"
    } disabled:opacity-30 ${className || ""}`}
  >
    {children}
  </button>
);

export const ToolbarSep = () => <div className="w-px h-5 bg-parchment-3 mx-0.5" />;

export default ToolbarButton;
