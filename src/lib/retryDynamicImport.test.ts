import { describe, expect, it, vi } from "vitest";
import { isModuleLoadError, retryDynamicImport } from "./retryDynamicImport";

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
});