import { lazy } from "react";
import type { ComponentType } from "react";

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
      const mod = await factory();
      // Success clears the guard so a *later* failure can still recover.
      sessionStorage.removeItem("chunk-reloaded");
      return mod;
    } catch (err) {
      if (!sessionStorage.getItem("chunk-reloaded")) {
        sessionStorage.setItem("chunk-reloaded", "1");
        window.location.reload();
        return new Promise<never>(() => {});
      }
      throw err;
    }
  });
