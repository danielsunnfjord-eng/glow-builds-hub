// Shared helpers for image metadata (credit + caption) across the app.

export interface PhotoMeta {
  url: string;
  credit?: string;
  caption?: string;
}

// Hotels previously stored photos as `string[]`. Normalize to PhotoMeta[].
export function normalizePhoto(p: unknown): PhotoMeta | null {
  if (!p) return null;
  if (typeof p === "string") return { url: p, credit: "", caption: "" };
  if (typeof p === "object") {
    const obj = p as Record<string, unknown>;
    const url = typeof obj.url === "string" ? obj.url : "";
    if (!url) return null;
    return {
      url,
      credit: typeof obj.credit === "string" ? obj.credit : "",
      caption: typeof obj.caption === "string" ? obj.caption : "",
    };
  }
  return null;
}

export function normalizePhotos(arr: unknown): PhotoMeta[] {
  if (!Array.isArray(arr)) return [];
  return arr.map(normalizePhoto).filter((p): p is PhotoMeta => !!p);
}
