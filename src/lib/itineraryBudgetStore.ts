import type { BudgetData } from "@/components/voyage/editor/BudgetEstimator";

const KEY_PREFIX = "fjw-budget-v1:";

export type StoredBudget = {
  budget: BudgetData | null;
  coverLabel: string | null;
};

export function loadBudget(id: string | null | undefined): StoredBudget {
  if (!id || typeof window === "undefined") return { budget: null, coverLabel: null };
  try {
    const raw = window.localStorage.getItem(KEY_PREFIX + id);
    if (!raw) return { budget: null, coverLabel: null };
    const parsed = JSON.parse(raw);
    return {
      budget: parsed?.budget ?? null,
      coverLabel: parsed?.coverLabel ?? null,
    };
  } catch {
    return { budget: null, coverLabel: null };
  }
}

export function saveBudget(id: string | null | undefined, value: StoredBudget): void {
  if (!id || typeof window === "undefined") return;
  try {
    if (!value.budget && !value.coverLabel) {
      window.localStorage.removeItem(KEY_PREFIX + id);
    } else {
      window.localStorage.setItem(KEY_PREFIX + id, JSON.stringify(value));
    }
  } catch {
    // ignore
  }
}
