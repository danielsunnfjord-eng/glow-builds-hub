import { lazy } from "react";
import type { ComponentType } from "react";
import { isModuleLoadError, reloadFailedModule, retryDynamicImport } from "./retryDynamicImport";

// Retry a dynamic import once, then hard-reload if the chunk failed to load.
// This happens after a new deploy while the browser still holds the old
// index.html, or when the dev server runs a program reload while the page is
// fetching a lazily-imported module. Without this guard a failed dynamic
// import rejects with "Importing a module script failed." and, for imports
// rendered outside a route error boundary (root-level lazy widgets), React
// unmounts the whole tree and shows a blank screen.
export const lazyWithRetry = <T extends ComponentType<any>>(
  factory: () => Promise<{ default: T }>,
) =>
  lazy(async () => {
    if (typeof window === "undefined") return factory();
    try {
      return await retryDynamicImport(factory);
    } catch (err) {
      // Each import has its own guard. Another successful widget cannot clear
      // it and cause endless reloads while this module is still unavailable.
      if (isModuleLoadError(err) && reloadFailedModule(factory.toString())) {
        return new Promise<never>(() => {});
      }
      throw err;
    }
  });
