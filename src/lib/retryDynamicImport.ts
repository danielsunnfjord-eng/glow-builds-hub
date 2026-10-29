export function isModuleLoadError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);
  return /importing a module script failed|failed to fetch dynamically imported module|error loading dynamically imported module|loading chunk .* failed/i.test(message);
}

/** Retry transient module failures; never hide actual component/programming errors. */
export async function retryDynamicImport<T>(factory: () => Promise<T>): Promise<T> {
  try {
    return await factory();
  } catch (error) {
    if (!isModuleLoadError(error)) throw error;
    await new Promise((resolve) => setTimeout(resolve, 500));
    return factory();
  }
}

/** Per-module, time-bounded reload guard; blocked storage must not cause a second crash. */
export function reloadFailedModule(key: string): boolean {
  if (typeof window === "undefined") return false;
  try {
    const storageKey = `chunk-reloaded:${key}`;
    const lastReload = Number(window.sessionStorage.getItem(storageKey));
    if (lastReload && Date.now() - lastReload < 60_000) return false;
    window.sessionStorage.setItem(storageKey, String(Date.now()));
    window.location.reload();
    return true;
  } catch {
    return false;
  }
}