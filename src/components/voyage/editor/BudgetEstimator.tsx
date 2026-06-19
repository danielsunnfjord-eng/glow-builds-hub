import { useEffect, useMemo, useState } from "react";
import { Editor } from "@tiptap/react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, Plus, Trash2, RefreshCcw, Coins } from "lucide-react";
import { htmlToMarkdown } from "./markdownHelpers";

export type BudgetLine = { low: number; high: number; note?: string };
export type BudgetData = {
  currency: string;
  per_day: Record<string, BudgetLine>;
  total_per_day?: { low: number; high: number };
  total_per_person?: { low: number; high: number };
  duration_days?: number;
  notes?: string;
  cover_label?: string;
};

const CURRENCY_SYMBOL: Record<string, string> = { EUR: "€", NOK: "kr", USD: "$", BRL: "R$" };
// Approximate FX (used only for display conversion of EUR baseline).
const FX_FROM_EUR: Record<string, number> = { EUR: 1, NOK: 11.5, USD: 1.08, BRL: 5.8 };

function convert(value: number, fromCcy: string, toCcy: string): number {
  if (fromCcy === toCcy) return value;
  const eur = value / (FX_FROM_EUR[fromCcy] ?? 1);
  return eur * (FX_FROM_EUR[toCcy] ?? 1);
}

function fmt(value: number, ccy: string): string {
  const sym = CURRENCY_SYMBOL[ccy] || "";
  const rounded = Math.round(value);
  return ccy === "NOK" ? `${rounded} ${sym}` : `${sym}${rounded}`;
}

function titleCase(s: string): string {
  return s.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function recomputeTotals(b: BudgetData): BudgetData {
  const entries = Object.values(b.per_day || {});
  const low = entries.reduce((s, l) => s + (Number(l?.low) || 0), 0);
  const high = entries.reduce((s, l) => s + (Number(l?.high) || 0), 0);
  const days = Number(b.duration_days) || 0;
  return {
    ...b,
    total_per_day: { low, high },
    total_per_person: { low: low * days, high: high * days },
  };
}

interface BudgetEstimatorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editor: Editor;
  destination?: string | null;
  tripDuration?: string | null;
  initialBudget?: BudgetData | null;
  initialCoverLabel?: string | null;
  onSaved?: (budget: BudgetData | null, coverLabel: string | null) => void;
}

const BudgetEstimator = ({
  open, onOpenChange, editor, destination, tripDuration,
  initialBudget, initialCoverLabel, onSaved,
}: BudgetEstimatorProps) => {
  const [budget, setBudget] = useState<BudgetData | null>(initialBudget || null);
  const [coverLabel, setCoverLabel] = useState<string>(initialCoverLabel || initialBudget?.cover_label || "");
  const [displayCcy, setDisplayCcy] = useState<string>(initialBudget?.currency || "EUR");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    setBudget(initialBudget || null);
    setCoverLabel(initialCoverLabel || initialBudget?.cover_label || "");
    setDisplayCcy(initialBudget?.currency || "EUR");
  }, [open, initialBudget, initialCoverLabel]);

  const baseCcy = budget?.currency || "EUR";

  const generate = async () => {
    setLoading(true);
    try {
      const content = htmlToMarkdown(editor.getHTML()).trim();
      if (content.length < 20) {
        toast.error("Itinerary is empty — write some content first.");
        return;
      }
      const { data, error } = await supabase.functions.invoke("estimate-itinerary-budget", {
        body: { content, destination, trip_duration: tripDuration },
      });
      if (error) throw error;
      if (!data?.budget) throw new Error(data?.error || "No budget returned");
      const next = recomputeTotals(data.budget as BudgetData);
      setBudget(next);
      setDisplayCcy(next.currency || "EUR");
      const lbl = next.cover_label?.trim() || autoCoverLabel(next);
      setCoverLabel(lbl);
      toast.success("Budget estimate ready");
    } catch (e: any) {
      toast.error(e?.message || "Failed to generate budget");
    } finally {
      setLoading(false);
    }
  };

  const autoCoverLabel = (b: BudgetData): string => {
    const low = b.total_per_person?.low || 0;
    return `From ${fmt(low, b.currency || "EUR")} per person`;
  };

  const updateLine = (key: string, field: keyof BudgetLine, value: string) => {
    if (!budget) return;
    const num = field === "note" ? value : Number(value || 0);
    const next = {
      ...budget,
      per_day: {
        ...budget.per_day,
        [key]: { ...budget.per_day[key], [field]: num as any },
      },
    };
    setBudget(recomputeTotals(next));
  };

  const removeLine = (key: string) => {
    if (!budget) return;
    const { [key]: _drop, ...rest } = budget.per_day;
    setBudget(recomputeTotals({ ...budget, per_day: rest }));
  };

  const addLine = () => {
    if (!budget) return;
    const name = window.prompt("Category name (e.g. 'tips_gratuities')")?.trim();
    if (!name) return;
    const key = name.toLowerCase().replace(/\s+/g, "_");
    setBudget(recomputeTotals({
      ...budget,
      per_day: { ...budget.per_day, [key]: { low: 0, high: 0, note: "" } },
    }));
  };

  const updateDays = (val: string) => {
    if (!budget) return;
    setBudget(recomputeTotals({ ...budget, duration_days: Number(val || 0) }));
  };

  const buildTableHtml = (): string => {
    if (!budget) return "";
    const rows = Object.entries(budget.per_day).map(([k, l]) => {
      const lo = convert(l.low || 0, baseCcy, displayCcy);
      const hi = convert(l.high || 0, baseCcy, displayCcy);
      return `<tr>
  <td style="padding:8px 12px;border-bottom:1px solid #E6DCC6;font-family:'Cormorant Garamond',serif;font-size:13px;color:#1E2D3D;">${titleCase(k)}</td>
  <td style="padding:8px 12px;border-bottom:1px solid #E6DCC6;text-align:right;font-family:'Montserrat',sans-serif;font-size:12px;color:#3D6B74;">${fmt(lo, displayCcy)} – ${fmt(hi, displayCcy)}</td>
  <td style="padding:8px 12px;border-bottom:1px solid #E6DCC6;font-family:'Montserrat',sans-serif;font-size:11px;color:#6c7a82;font-style:italic;">${(l.note || "").replace(/</g, "&lt;")}</td>
</tr>`;
    }).join("");
    const days = budget.duration_days || 0;
    const tpdLo = convert(budget.total_per_day?.low || 0, baseCcy, displayCcy);
    const tpdHi = convert(budget.total_per_day?.high || 0, baseCcy, displayCcy);
    const tppLo = convert(budget.total_per_person?.low || 0, baseCcy, displayCcy);
    const tppHi = convert(budget.total_per_person?.high || 0, baseCcy, displayCcy);
    return `<table class="fjw-budget-table" style="width:100%;border-collapse:collapse;margin:18px 0;border:1px solid #B8975A;">
  <thead>
    <tr style="background:#3D6B74;color:#fff;">
      <th style="padding:10px 12px;text-align:left;font-family:'Jost','Montserrat',sans-serif;font-size:11px;letter-spacing:0.18em;text-transform:uppercase;font-weight:500;">Category</th>
      <th style="padding:10px 12px;text-align:right;font-family:'Jost','Montserrat',sans-serif;font-size:11px;letter-spacing:0.18em;text-transform:uppercase;font-weight:500;">Per day (${displayCcy})</th>
      <th style="padding:10px 12px;text-align:left;font-family:'Jost','Montserrat',sans-serif;font-size:11px;letter-spacing:0.18em;text-transform:uppercase;font-weight:500;">Note</th>
    </tr>
  </thead>
  <tbody>${rows}
    <tr style="background:#FAF6EC;">
      <td style="padding:10px 12px;font-family:'Cormorant Garamond',serif;font-size:14px;color:#1E2D3D;font-weight:600;">Total per day</td>
      <td style="padding:10px 12px;text-align:right;font-family:'Montserrat',sans-serif;font-size:13px;color:#1E2D3D;font-weight:600;">${fmt(tpdLo, displayCcy)} – ${fmt(tpdHi, displayCcy)}</td>
      <td style="padding:10px 12px;font-family:'Montserrat',sans-serif;font-size:11px;color:#6c7a82;">${days} day${days === 1 ? "" : "s"}</td>
    </tr>
    <tr style="background:#B8975A;color:#fff;">
      <td style="padding:12px;font-family:'Playfair Display','Cormorant Garamond',serif;font-size:16px;font-weight:600;">Estimated total per person</td>
      <td colspan="2" style="padding:12px;text-align:right;font-family:'Playfair Display','Cormorant Garamond',serif;font-size:18px;font-weight:600;">${fmt(tppLo, displayCcy)} – ${fmt(tppHi, displayCcy)}</td>
    </tr>
  </tbody>
</table>${budget.notes ? `<p class="fjw-budget-note" style="font-size:11px;color:#6c7a82;font-style:italic;margin-top:-8px;">${budget.notes.replace(/</g, "&lt;")}</p>` : ""}`;
  };

  const handleInsert = () => {
    if (!budget) return;
    const html = buildTableHtml();
    const endPos = editor.state.doc.content.size;
    (editor.chain().focus() as any)
      .setTextSelection(endPos)
      .createParagraphNear()
      .insertContent(`<h2>Estimated Budget</h2>${html}`)
      .run();
    const lbl = coverLabel.trim() || autoCoverLabel(budget);
    onSaved?.(budget, lbl);
    toast.success("Budget table inserted");
    onOpenChange(false);
  };

  const handleSaveOnly = () => {
    if (!budget) return;
    const lbl = coverLabel.trim() || autoCoverLabel(budget);
    onSaved?.(budget, lbl);
    toast.success("Budget saved");
    onOpenChange(false);
  };

  const entries = useMemo(() => budget ? Object.entries(budget.per_day || {}) : [], [budget]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Coins className="w-4 h-4 text-[#B8975A]" /> Estimated Budget Maker
          </DialogTitle>
        </DialogHeader>

        {!budget ? (
          <div className="py-8 text-center">
            <p className="text-sm text-voyage-muted mb-4">
              Generate a realistic per-person budget for this itinerary using AI.
            </p>
            <Button onClick={generate} disabled={loading}>
              {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Coins className="w-4 h-4 mr-2" />}
              Generate Budget Estimate
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-end gap-3 flex-wrap">
              <div>
                <Label className="text-xs">Display currency</Label>
                <Select value={displayCcy} onValueChange={setDisplayCcy}>
                  <SelectTrigger className="w-28"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {["EUR", "NOK", "USD", "BRL"].map((c) => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-[10px] text-voyage-muted mt-1">Base: {baseCcy}</p>
              </div>
              <div>
                <Label className="text-xs">Duration (days)</Label>
                <Input
                  type="number"
                  className="w-24"
                  value={budget.duration_days || 0}
                  onChange={(e) => updateDays(e.target.value)}
                />
              </div>
              <Button variant="outline" size="sm" onClick={generate} disabled={loading}>
                {loading ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : <RefreshCcw className="w-3 h-3 mr-1" />}
                Regenerate
              </Button>
              <Button variant="outline" size="sm" onClick={addLine}>
                <Plus className="w-3 h-3 mr-1" /> Add category
              </Button>
            </div>

            <div className="border border-parchment-3 rounded overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-[#3D6B74] text-white text-xs uppercase tracking-wider">
                  <tr>
                    <th className="px-3 py-2 text-left">Category</th>
                    <th className="px-3 py-2 text-right">Low ({baseCcy})</th>
                    <th className="px-3 py-2 text-right">High ({baseCcy})</th>
                    <th className="px-3 py-2 text-left">Note</th>
                    <th className="w-8"></th>
                  </tr>
                </thead>
                <tbody>
                  {entries.map(([key, line]) => (
                    <tr key={key} className="border-t border-parchment-3">
                      <td className="px-3 py-1.5 font-medium">{titleCase(key)}</td>
                      <td className="px-2 py-1">
                        <Input
                          type="number"
                          value={line.low ?? 0}
                          onChange={(e) => updateLine(key, "low", e.target.value)}
                          className="h-8 text-right"
                        />
                      </td>
                      <td className="px-2 py-1">
                        <Input
                          type="number"
                          value={line.high ?? 0}
                          onChange={(e) => updateLine(key, "high", e.target.value)}
                          className="h-8 text-right"
                        />
                      </td>
                      <td className="px-2 py-1">
                        <Input
                          value={line.note ?? ""}
                          onChange={(e) => updateLine(key, "note", e.target.value)}
                          className="h-8"
                          placeholder="Optional note"
                        />
                      </td>
                      <td className="px-1">
                        <Button variant="ghost" size="sm" onClick={() => removeLine(key)}>
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-parchment/40 border-t border-parchment-3">
                    <td className="px-3 py-2 font-semibold">Per day total</td>
                    <td className="px-3 py-2 text-right font-semibold">
                      {fmt(convert(budget.total_per_day?.low || 0, baseCcy, displayCcy), displayCcy)}
                    </td>
                    <td className="px-3 py-2 text-right font-semibold">
                      {fmt(convert(budget.total_per_day?.high || 0, baseCcy, displayCcy), displayCcy)}
                    </td>
                    <td colSpan={2}></td>
                  </tr>
                  <tr className="bg-[#B8975A]/15 border-t border-parchment-3">
                    <td className="px-3 py-2 font-semibold text-[#1E2D3D]">Total per person</td>
                    <td colSpan={2} className="px-3 py-2 text-right font-bold text-[#1E2D3D]">
                      {fmt(convert(budget.total_per_person?.low || 0, baseCcy, displayCcy), displayCcy)}
                      {" – "}
                      {fmt(convert(budget.total_per_person?.high || 0, baseCcy, displayCcy), displayCcy)}
                    </td>
                    <td colSpan={2}></td>
                  </tr>
                </tfoot>
              </table>
            </div>

            <div>
              <Label className="text-xs">Cover page label (editable)</Label>
              <Input
                value={coverLabel}
                onChange={(e) => setCoverLabel(e.target.value)}
                placeholder="e.g. From €450 per person"
              />
              <p className="text-[10px] text-voyage-muted mt-1">
                Shown on the itinerary cover beside Duration / Region / Season.
              </p>
            </div>

            {budget.notes && (
              <p className="text-xs text-voyage-muted italic">{budget.notes}</p>
            )}
          </div>
        )}

        <DialogFooter className="gap-2 flex-wrap">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Close</Button>
          {budget && (
            <>
              <Button variant="outline" onClick={handleSaveOnly}>Save (cover only)</Button>
              <Button onClick={handleInsert}>Insert Budget Table</Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default BudgetEstimator;
