import { useEffect, useState, useCallback, useMemo, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface BankImage {
  url: string;
  path: string;       // full storage path (user_id/city/file)
  name: string;       // filename
  city: string;       // city slug
  size?: number;
  createdAt?: string;
}

const slugify = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60) || "uncategorized";

const ImageBank = () => {
  const { toast } = useToast();
  const [userId, setUserId] = useState<string | null>(null);
  const [images, setImages] = useState<BankImage[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [activeCity, setActiveCity] = useState<string>("all");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [preview, setPreview] = useState<BankImage | null>(null);
  const [uploadCity, setUploadCity] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [dragOverCity, setDragOverCity] = useState<string | null>(null);
  const [draggingPaths, setDraggingPaths] = useState<string[]>([]);
  const [isMoving, setIsMoving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load all images for this user, walking the city subfolders
  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setUserId(user.id);

      // 1) list folders under user_id/
      const { data: folders, error: folderErr } = await supabase.storage
        .from("itinerary-images")
        .list(user.id, { limit: 200, sortBy: { column: "name", order: "asc" } });
      if (folderErr) throw folderErr;

      const all: BankImage[] = [];

      // Files saved at the root of the user folder (legacy uploads)
      const rootFiles = (folders || []).filter((f) => f.name && f.metadata && (f.metadata as any).size != null);
      for (const f of rootFiles) {
        const path = `${user.id}/${f.name}`;
        const { data: pub } = supabase.storage.from("itinerary-images").getPublicUrl(path);
        all.push({
          url: pub.publicUrl,
          path,
          name: f.name,
          city: "uncategorized",
          size: (f.metadata as any)?.size,
          createdAt: (f as any).created_at,
        });
      }

      // City subfolders
      const cityFolders = (folders || []).filter((f) => f.name && (!f.metadata || (f.metadata as any).size == null));
      for (const folder of cityFolders) {
        const prefix = `${user.id}/${folder.name}`;
        const { data: files, error: fErr } = await supabase.storage
          .from("itinerary-images")
          .list(prefix, { limit: 1000, sortBy: { column: "created_at", order: "desc" } });
        if (fErr) continue;
        for (const f of files || []) {
          if (!f.name || f.name.startsWith(".")) continue;
          const path = `${prefix}/${f.name}`;
          const { data: pub } = supabase.storage.from("itinerary-images").getPublicUrl(path);
          all.push({
            url: pub.publicUrl,
            path,
            name: f.name,
            city: folder.name,
            size: (f.metadata as any)?.size,
            createdAt: (f as any).created_at,
          });
        }
      }

      // newest first
      all.sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || ""));
      setImages(all);
    } catch (err: any) {
      toast({ title: "Failed to load images", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  const cities = useMemo(() => {
    const map = new Map<string, number>();
    images.forEach((i) => map.set(i.city, (map.get(i.city) || 0) + 1));
    return Array.from(map.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  }, [images]);

  const filtered = useMemo(() => {
    return images.filter((i) => {
      if (activeCity !== "all" && i.city !== activeCity) return false;
      if (search) {
        const q = search.toLowerCase();
        if (!i.name.toLowerCase().includes(q) && !i.city.toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }, [images, activeCity, search]);

  const toggleSelect = (path: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(path) ? next.delete(path) : next.add(path);
      return next;
    });
  };

  const copyUrl = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      toast({ title: "🔗 URL copied" });
    } catch {
      toast({ title: "Could not copy", variant: "destructive" });
    }
  };

  const copyMarkdown = async (img: BankImage) => {
    try {
      const cityLabel = img.city.replace(/-/g, " ");
      await navigator.clipboard.writeText(`![${cityLabel}](${img.url})`);
      toast({ title: "📋 Markdown copied", description: "Paste into the itinerary editor." });
    } catch {
      toast({ title: "Could not copy", variant: "destructive" });
    }
  };

  const deleteImage = async (img: BankImage) => {
    if (!confirm(`Delete "${img.name}" from ${img.city}?\nThis cannot be undone.`)) return;
    try {
      const { error } = await supabase.storage.from("itinerary-images").remove([img.path]);
      if (error) throw error;
      setImages((prev) => prev.filter((i) => i.path !== img.path));
      setSelected((prev) => {
        const next = new Set(prev);
        next.delete(img.path);
        return next;
      });
      if (preview?.path === img.path) setPreview(null);
      toast({ title: "🗑 Image deleted" });
    } catch (err: any) {
      toast({ title: "Delete failed", description: err.message, variant: "destructive" });
    }
  };

  const deleteSelected = async () => {
    if (selected.size === 0) return;
    if (!confirm(`Delete ${selected.size} image${selected.size > 1 ? "s" : ""}? This cannot be undone.`)) return;
    try {
      const paths = Array.from(selected);
      const { error } = await supabase.storage.from("itinerary-images").remove(paths);
      if (error) throw error;
      setImages((prev) => prev.filter((i) => !selected.has(i.path)));
      setSelected(new Set());
      toast({ title: `🗑 Deleted ${paths.length} images` });
    } catch (err: any) {
      toast({ title: "Bulk delete failed", description: err.message, variant: "destructive" });
    }
  };

  const moveImage = async (img: BankImage, targetCityRaw: string) => {
    const targetCity = slugify(targetCityRaw);
    if (!targetCity || targetCity === img.city || !userId) return;
    try {
      // download
      const blob = await fetch(img.url).then((r) => r.blob());
      const newPath = `${userId}/${targetCity}/${Date.now()}-${img.name.replace(/^\d+-/, "")}`;
      const { error: upErr } = await supabase.storage
        .from("itinerary-images")
        .upload(newPath, blob, { contentType: blob.type });
      if (upErr) throw upErr;
      const { error: rmErr } = await supabase.storage
        .from("itinerary-images")
        .remove([img.path]);
      if (rmErr) throw rmErr;
      toast({ title: `📁 Moved to ${targetCity}` });
      loadAll();
    } catch (err: any) {
      toast({ title: "Move failed", description: err.message, variant: "destructive" });
    }
  };

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0 || !userId) return;
    const folder = slugify(uploadCity || (activeCity !== "all" ? activeCity : "uncategorized"));
    setIsUploading(true);
    let success = 0;
    try {
      for (const file of Array.from(files)) {
        if (!file.type.startsWith("image/")) continue;
        if (file.size > 10 * 1024 * 1024) {
          toast({ title: `Skipped ${file.name}`, description: "Larger than 10MB", variant: "destructive" });
          continue;
        }
        const safe = file.name.replace(/[^a-zA-Z0-9._-]/g, "-");
        const path = `${userId}/${folder}/${Date.now()}-${safe}`;
        const { error } = await supabase.storage
          .from("itinerary-images")
          .upload(path, file, { contentType: file.type });
        if (!error) success++;
      }
      toast({ title: `📤 Uploaded ${success} image${success !== 1 ? "s" : ""} → ${folder}` });
      loadAll();
    } catch (err: any) {
      toast({ title: "Upload failed", description: err.message, variant: "destructive" });
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const formatSize = (bytes?: number) => {
    if (!bytes) return "";
    if (bytes < 1024) return `${bytes}B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)}KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
  };

  return (
    <div className="flex flex-col gap-5">
      {/* Toolbar */}
      <div className="bg-voyage-white border border-parchment-3 rounded-lg p-4 flex flex-wrap items-center gap-3">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by filename or city…"
          className="flex-1 min-w-[220px] px-3 py-2 rounded-sm bg-parchment border border-parchment-3 text-ink text-[0.82rem] focus:outline-none focus:border-gold"
        />

        <div className="flex items-center gap-2">
          <input
            type="text"
            value={uploadCity}
            onChange={(e) => setUploadCity(e.target.value)}
            placeholder={activeCity !== "all" ? activeCity : "City folder…"}
            className="px-3 py-2 rounded-sm bg-parchment border border-parchment-3 text-ink text-[0.78rem] w-[150px] focus:outline-none focus:border-gold"
            title="Where to save the upload (defaults to the active city)"
          />
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(e) => handleFiles(e.target.files)}
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="px-4 py-2 rounded-sm bg-gold text-ink text-[0.7rem] font-semibold tracking-[0.08em] uppercase hover:bg-gold-2 transition-colors disabled:opacity-40"
          >
            {isUploading ? "⏳ Uploading…" : "📤 Upload"}
          </button>
        </div>

        <button
          onClick={loadAll}
          disabled={loading}
          className="px-3 py-2 rounded-sm border border-parchment-3 text-voyage-muted text-[0.7rem] hover:border-ink hover:text-ink transition-colors"
        >
          {loading ? "⏳" : "↻ Refresh"}
        </button>

        {selected.size > 0 && (
          <button
            onClick={deleteSelected}
            className="px-4 py-2 rounded-sm bg-destructive text-voyage-white text-[0.7rem] font-semibold tracking-[0.08em] uppercase hover:bg-destructive/90"
          >
            🗑 Delete {selected.size}
          </button>
        )}
      </div>

      {/* Cities sidebar + grid */}
      <div className="grid grid-cols-[200px_1fr] max-md:grid-cols-1 gap-5">
        <aside className="bg-voyage-white border border-parchment-3 rounded-lg p-3 self-start max-h-[70vh] overflow-y-auto">
          <p className="text-[0.62rem] font-semibold text-voyage-muted uppercase tracking-[0.12em] mb-2 px-2">Cities</p>
          <button
            onClick={() => setActiveCity("all")}
            className={`w-full text-left px-3 py-1.5 rounded-md text-[0.78rem] mb-0.5 transition-all ${
              activeCity === "all" ? "bg-gold/15 text-ink font-semibold" : "text-voyage-muted hover:bg-parchment hover:text-ink"
            }`}
          >
            🗂 All <span className="text-[0.65rem] opacity-60">({images.length})</span>
          </button>
          {cities.length === 0 && !loading && (
            <p className="text-[0.7rem] text-voyage-muted italic px-2 mt-2">No images yet.</p>
          )}
          {cities.map(([city, count]) => (
            <button
              key={city}
              onClick={() => setActiveCity(city)}
              className={`w-full text-left px-3 py-1.5 rounded-md text-[0.78rem] mb-0.5 transition-all capitalize ${
                activeCity === city ? "bg-gold/15 text-ink font-semibold" : "text-voyage-muted hover:bg-parchment hover:text-ink"
              }`}
            >
              📍 {city.replace(/-/g, " ")} <span className="text-[0.65rem] opacity-60">({count})</span>
            </button>
          ))}
        </aside>

        <main>
          {loading && images.length === 0 ? (
            <div className="bg-voyage-white border border-parchment-3 rounded-lg p-12 text-center text-voyage-muted text-sm">
              ⏳ Loading image bank…
            </div>
          ) : filtered.length === 0 ? (
            <div className="bg-voyage-white border border-parchment-3 rounded-lg p-12 text-center">
              <div className="text-4xl mb-2 opacity-30">🖼️</div>
              <p className="text-voyage-muted text-sm">
                {search ? "No images match your search." : "No images in this folder yet."}
              </p>
              <p className="text-voyage-muted text-[0.72rem] mt-1">
                Upload above, or use the Advisor Assistant to add images to a project.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {filtered.map((img) => {
                const isSelected = selected.has(img.path);
                return (
                  <div
                    key={img.path}
                    className={`group relative bg-voyage-white border rounded-lg overflow-hidden transition-all ${
                      isSelected ? "border-gold ring-2 ring-gold/30" : "border-parchment-3 hover:border-gold/60"
                    }`}
                  >
                    <button
                      onClick={() => setPreview(img)}
                      className="block w-full aspect-[4/3] overflow-hidden bg-parchment"
                    >
                      <img
                        src={img.url}
                        alt={img.name}
                        loading="lazy"
                        className="w-full h-full object-cover transition-transform group-hover:scale-105"
                      />
                    </button>

                    {/* Select checkbox */}
                    <label
                      className={`absolute top-2 left-2 w-5 h-5 rounded bg-voyage-white/90 border border-parchment-3 flex items-center justify-center cursor-pointer transition-opacity ${
                        isSelected ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleSelect(img.path)}
                        className="accent-gold"
                      />
                    </label>

                    {/* City badge */}
                    <span className="absolute top-2 right-2 px-2 py-0.5 bg-ink/70 backdrop-blur-sm text-voyage-white text-[0.6rem] font-semibold rounded-full uppercase tracking-wide capitalize">
                      {img.city.replace(/-/g, " ")}
                    </span>

                    {/* Footer */}
                    <div className="p-2 border-t border-parchment-3">
                      <p className="text-[0.7rem] text-ink truncate font-medium" title={img.name}>
                        {img.name.replace(/^\d+-/, "")}
                      </p>
                      <p className="text-[0.6rem] text-voyage-muted">{formatSize(img.size)}</p>
                      <div className="flex gap-1 mt-1.5">
                        <button
                          onClick={() => copyUrl(img.url)}
                          className="flex-1 px-1.5 py-1 rounded text-[0.6rem] font-semibold border border-parchment-3 text-voyage-muted hover:border-gold hover:text-gold transition-colors"
                          title="Copy URL"
                        >
                          🔗
                        </button>
                        <button
                          onClick={() => copyMarkdown(img)}
                          className="flex-1 px-1.5 py-1 rounded text-[0.6rem] font-semibold border border-parchment-3 text-voyage-muted hover:border-gold hover:text-gold transition-colors"
                          title="Copy as Markdown"
                        >
                          📋
                        </button>
                        <button
                          onClick={() => {
                            const target = prompt(`Move "${img.name}" to which city?`, img.city);
                            if (target) moveImage(img, target);
                          }}
                          className="flex-1 px-1.5 py-1 rounded text-[0.6rem] font-semibold border border-parchment-3 text-voyage-muted hover:border-gold hover:text-gold transition-colors"
                          title="Move to another city"
                        >
                          📁
                        </button>
                        <button
                          onClick={() => deleteImage(img)}
                          className="flex-1 px-1.5 py-1 rounded text-[0.6rem] font-semibold border border-parchment-3 text-voyage-muted hover:border-destructive hover:text-destructive transition-colors"
                          title="Delete"
                        >
                          🗑
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </main>
      </div>

      {/* Preview modal */}
      {preview && (
        <div
          className="fixed inset-0 z-50 bg-ink/85 backdrop-blur-sm flex items-center justify-center p-6"
          onClick={() => setPreview(null)}
        >
          <div
            className="bg-voyage-white rounded-lg max-w-5xl w-full max-h-[90vh] overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-parchment-3">
              <div className="min-w-0">
                <p className="text-[0.78rem] font-semibold text-ink truncate">{preview.name.replace(/^\d+-/, "")}</p>
                <p className="text-[0.65rem] text-voyage-muted capitalize">📍 {preview.city.replace(/-/g, " ")} · {formatSize(preview.size)}</p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => copyUrl(preview.url)}
                  className="px-3 py-1.5 rounded-sm border border-parchment-3 text-[0.68rem] font-semibold tracking-[0.08em] uppercase hover:border-gold hover:text-gold"
                >
                  🔗 URL
                </button>
                <button
                  onClick={() => copyMarkdown(preview)}
                  className="px-3 py-1.5 rounded-sm border border-parchment-3 text-[0.68rem] font-semibold tracking-[0.08em] uppercase hover:border-gold hover:text-gold"
                >
                  📋 Markdown
                </button>
                <a
                  href={preview.url}
                  download={preview.name}
                  target="_blank"
                  rel="noreferrer"
                  className="px-3 py-1.5 rounded-sm border border-parchment-3 text-[0.68rem] font-semibold tracking-[0.08em] uppercase hover:border-gold hover:text-gold"
                >
                  ⤓ Download
                </a>
                <button
                  onClick={() => setPreview(null)}
                  className="px-3 py-1.5 rounded-sm bg-ink text-voyage-white text-[0.68rem] font-semibold tracking-[0.08em] uppercase hover:bg-ink/85"
                >
                  ✕ Close
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-auto bg-parchment flex items-center justify-center">
              <img src={preview.url} alt={preview.name} className="max-w-full max-h-[78vh] object-contain" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ImageBank;
