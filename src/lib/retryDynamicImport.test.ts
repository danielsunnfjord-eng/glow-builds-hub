import { afterEach, describe, expect, it, vi } from "vitest";
import { isModuleLoadError, reloadFailedModule, retryDynamicImport } from "./retryDynamicImport";

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("dynamic module recovery", () => {
  it("retries Safari's module loading failure and returns the recovered module", async () => {
    const module = { default: "loaded" };
    const factory = vi.fn().mockRejectedValueOnce(new TypeError("Importing a module script failed.")).mockResolvedValueOnce(module);
    expect(await retryDynamicImport(factory)).toBe(module);
    expect(factory).toHaveBeenCalledTimes(2);
  });
  it("does not retry programming errors", async () => {
    const factory = vi.fn().mockRejectedValue(new Error("Invalid component"));
    await expect(retryDynamicImport(factory)).rejects.toThrow("Invalid component");
    expect(factory).toHaveBeenCalledTimes(1);
  });
  it("propagates persistent module failures to the boundary", async () => {
    const factory = vi.fn().mockRejectedValue(new TypeError("Importing a module script failed."));
    await expect(retryDynamicImport(factory)).rejects.toThrow("Importing a module script failed.");
    expect(factory).toHaveBeenCalledTimes(2);
  });
  it("recognizes Chromium and Firefox module failures", () => {
    expect(isModuleLoadError(new TypeError("Failed to fetch dynamically imported module: /module.js"))).toBe(true);
    expect(isModuleLoadError(new TypeError("error loading dynamically imported module"))).toBe(true);
  });
  it("reloads a failed page only once within the recovery window", () => {
    const values = new Map<string, string>();
    const reload = vi.fn();
    vi.stubGlobal("window", {
      location: { reload },
      sessionStorage: {
        getItem: (key: string) => values.get(key) ?? null,
        setItem: (key: string, value: string) => values.set(key, value),
      },
    });
    vi.spyOn(Date, "now").mockReturnValue(100_000);
    expect(reloadFailedModule("router")).toBe(true);
    expect(reloadFailedModule("router")).toBe(false);
    expect(reload).toHaveBeenCalledTimes(1);
  });
  it("keeps the error screen usable when browser storage is blocked", () => {
    const reload = vi.fn();
    vi.stubGlobal("window", {
      location: { reload },
      sessionStorage: { getItem: () => { throw new Error("Storage blocked"); } },
    });
    expect(reloadFailedModule("router")).toBe(false);
    expect(reload).not.toHaveBeenCalled();
  });
});