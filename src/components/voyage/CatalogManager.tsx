import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import AiAssistantPanel from "./AiAssistantPanel";
import TranslateBar from "./TranslateBar";

interface CatalogItem {
  id: string;
  slug: string;
  title_en: string;
  title_pt: string | null;
  title_no: string | null;
  summary_en: string;
  summary_pt: string | null;
  summary_no: string | null;
  description_en: string;
  description_pt: string | null;
  description_no: string | null;
  what_you_get_en: string;
  what_you_get_pt: string | null;
  what_you_get_no: string | null;
  destination: string | null;
  duration: string | null;
  group_size_label: string | null;
  estimated_trip_budget: string | null;
  hero_image_url: string | null;
  gallery_images: string[];
  price_eur: number;
  pdf_path: string | null;
  is_published: boolean;
  sort_order: number;
  view_count?: number;
}

const emptyItem: Partial<CatalogItem> = {
  slug: "",
  title_en: "",
  title_pt: "",
  title_no: "",
  summary_en: "",
  summary_pt: "",
  summary_no: "",
  description_en: "",
  description_pt: "",
  description_no: "",
  what_you_get_en: "",
  what_you_get_pt: "",
  what_you_get_no: "",
  destination: "",
  duration: "",
  group_size_label: "",
  estimated_trip_budget: "",
  hero_image_url: "",
  gallery_images: [],
  price_eur: 0,
  pdf_path: "",
  is_published: false,
  sort_order: 0,
};

const input =
  "w-full px-3 py-2.5 rounded-sm bg-parchment border border-parchment-3 text-ink text-[0.85rem] focus:outline-none focus:border-gold transition-colors";
const label = "block text-[0.7rem] uppercase tracking-[0.1em] text-voyage-muted mb-1";

const CatalogManager = () => {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [editing, setEditing] = useState<Partial<CatalogItem> | null>(null);
  const [editLang, setEditLang] = useState<"en" | "pt" | "no">("en");
  const [uploadingHero, setUploadingHero] = useState(false);
  const [uploadingGallery, setUploadingGallery] = useState(false);
  const [uploadingPdf, setUploadingPdf] = useState(false);
  const [previewSlug, setPreviewSlug] = useState<string | null>(null);
  const [previewMode, setPreviewMode] = useState<"catalog" | "detail">("catalog");

  const { data: items = [] } = useQuery({
    queryKey: ["catalog-admin"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("catalog_itineraries")
        .select("*")
        .order("sort_order", { ascending: true })
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data || []) as CatalogItem[];
    },
  });

  const { data: purchases = [] } = useQuery({
    queryKey: ["catalog-purchases"],
    queryFn: async () => {
      const { data } = await supabase
        .from("catalog_purchases")
        .select("id, customer_email, amount_total, currency, status, created_at, itinerary_id, catalog_itineraries(title_en)")
        .order("created_at", { ascending: false })
        .limit(50);
      return data || [];
    },
  });

  const { data: salesMap = {} } = useQuery({
    queryKey: ["catalog-sales-counts-admin"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_catalog_sales_counts");
      if (error) throw error;
      const map: Record<string, number> = {};
      (data ?? []).forEach((r: any) => {
        map[r.itinerary_id] = Number(r.sales_count) || 0;
      });
      return map;
    },
  });

  const togglePublishMutation = useMutation({
    mutationFn: async ({ id, is_published }: { id: string; is_published: boolean }) => {
      const { error } = await supabase
        .from("catalog_itineraries")
        .update({ is_published })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["catalog-admin"] });
      toast({ title: "Updated" });
    },
    onError: (e) => toast({ title: "Error", description: String(e), variant: "destructive" }),
  });

  const saveMutation = useMutation({
    mutationFn: async (item: Partial<CatalogItem>) => {
      const payload = {
        slug: item.slug,
        title_en: item.title_en,
        title_pt: item.title_pt || null,
        title_no: item.title_no || null,
        summary_en: item.summary_en || "",
        summary_pt: item.summary_pt || null,
        summary_no: item.summary_no || null,
        description_en: item.description_en || "",
        description_pt: item.description_pt || null,
        description_no: item.description_no || null,
        what_you_get_en: item.what_you_get_en || "",
        what_you_get_pt: item.what_you_get_pt || null,
        what_you_get_no: item.what_you_get_no || null,
        destination: item.destination || null,
        duration: item.duration || null,
        group_size_label: item.group_size_label || null,
        estimated_trip_budget: item.estimated_trip_budget || null,
        hero_image_url: item.hero_image_url || null,
        gallery_images: item.gallery_images || [],
        price_eur: Number(item.price_eur) || 0,
        pdf_path: item.pdf_path || null,
        is_published: item.is_published ?? false,
        sort_order: Number(item.sort_order) || 0,
      };
      if (item.id) {
        const { error } = await supabase
          .from("catalog_itineraries")
          .update(payload)
          .eq("id", item.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("catalog_itineraries")
          .insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["catalog-admin"] });
      setEditing(null);
      toast({ title: "Saved" });
    },
    onError: (e) => toast({ title: "Error", description: String(e), variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("catalog_itineraries").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["catalog-admin"] });
      toast({ title: "Deleted" });
    },
  });

  const uploadImage = async (file: File): Promise<string> => {
    const ext = file.name.split(".").pop();
    const path = `${crypto.randomUUID()}.${ext}`;
    const { error } = await supabase.storage
      .from("catalog-images")
      .upload(path, file, { contentType: file.type });
    if (error) throw error;
    const { data } = supabase.storage.from("catalog-images").getPublicUrl(path);
    return data.publicUrl;
  };

  const onHeroUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !editing) return;
    setUploadingHero(true);
    try {
      const url = await uploadImage(file);
      setEditing({ ...editing, hero_image_url: url });
    } catch (err) {
      toast({ title: "Upload failed", description: String(err), variant: "destructive" });
    } finally {
      setUploadingHero(false);
      e.target.value = "";
    }
  };

  const onGalleryUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length || !editing) return;
    setUploadingGallery(true);
    try {
      const urls = await Promise.all(files.map(uploadImage));
      setEditing({
        ...editing,
        gallery_images: [...(editing.gallery_images || []), ...urls],
      });
    } catch (err) {
      toast({ title: "Upload failed", description: String(err), variant: "destructive" });
    } finally {
      setUploadingGallery(false);
      e.target.value = "";
    }
  };

  const onPdfUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !editing) return;
    setUploadingPdf(true);
    try {
      const path = `${crypto.randomUUID()}.pdf`;
      const { error } = await supabase.storage
        .from("catalog-pdfs")
        .upload(path, file, { contentType: "application/pdf" });
      if (error) throw error;
      setEditing({ ...editing, pdf_path: path });
      toast({ title: "PDF uploaded" });
    } catch (err) {
      toast({ title: "Upload failed", description: String(err), variant: "destructive" });
    } finally {
      setUploadingPdf(false);
      e.target.value = "";
    }
  };

  return (
    <div>
      <div className="mb-8 flex justify-between items-end gap-4">
        <div>
          <h1 className="font-serif text-3xl font-bold mb-1">Itinerary Catalog</h1>
          <p className="text-[0.85rem] text-voyage-muted">
            Pre-designed PDF itineraries clients can buy and download instantly.
          </p>
        </div>
        <button
          onClick={() => setEditing({ ...emptyItem })}
          className="px-5 py-2.5 rounded-sm bg-ink text-voyage-white text-[0.72rem] font-medium tracking-[0.1em] uppercase hover:bg-gold hover:text-ink transition-colors"
        >
          + New Itinerary
        </button>
      </div>

      {/* List */}
      <div className="bg-voyage-white border border-parchment-3 rounded-lg overflow-hidden mb-10">
        <table className="w-full text-[0.85rem]">
          <thead className="bg-parchment border-b border-parchment-3 text-left text-[0.65rem] uppercase tracking-[0.1em] text-voyage-muted">
            <tr>
              <th className="p-3">Title</th>
              <th className="p-3">Slug</th>
              <th className="p-3">Price</th>
              <th className="p-3">PDF</th>
              <th className="p-3">Published</th>
              <th className="p-3"></th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 && (
              <tr>
                <td colSpan={6} className="p-6 text-center text-voyage-muted">
                  No itineraries yet. Create your first one.
                </td>
              </tr>
            )}
            {items.map((it) => (
              <tr key={it.id} className="border-b border-parchment-3 last:border-0">
                <td className="p-3 font-medium">{it.title_en}</td>
                <td className="p-3 text-voyage-muted font-mono text-[0.78rem]">{it.slug}</td>
                <td className="p-3">€{Number(it.price_eur).toFixed(0)}</td>
                <td className="p-3">{it.pdf_path ? "✓" : "—"}</td>
                <td className="p-3">
                  {it.is_published ? (
                    <span className="text-sage">● Live</span>
                  ) : (
                    <span className="text-voyage-muted">○ Draft</span>
                  )}
                </td>
                <td className="p-3 text-right whitespace-nowrap">
                  <button
                    onClick={() => setEditing(it)}
                    className="text-[0.78rem] text-gold hover:underline mr-3"
                  >
                    Edit
                  </button>
                  <a
                    href={`/itineraries-shop/${it.slug}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[0.78rem] text-voyage-muted hover:text-ink mr-3"
                  >
                    View
                  </a>
                  <button
                    onClick={() => {
                      if (confirm(`Delete "${it.title_en}"?`)) deleteMutation.mutate(it.id);
                    }}
                    className="text-[0.78rem] text-destructive hover:underline"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Recent purchases */}
      <div className="bg-voyage-white border border-parchment-3 rounded-lg overflow-hidden">
        <div className="p-4 border-b border-parchment-3">
          <h2 className="font-serif font-semibold text-ink">Recent Purchases</h2>
        </div>
        <table className="w-full text-[0.85rem]">
          <thead className="bg-parchment text-left text-[0.65rem] uppercase tracking-[0.1em] text-voyage-muted">
            <tr>
              <th className="p-3">Date</th>
              <th className="p-3">Itinerary</th>
              <th className="p-3">Customer</th>
              <th className="p-3">Amount</th>
              <th className="p-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {purchases.length === 0 && (
              <tr>
                <td colSpan={5} className="p-6 text-center text-voyage-muted">No purchases yet.</td>
              </tr>
            )}
            {purchases.map((p: any) => (
              <tr key={p.id} className="border-b border-parchment-3 last:border-0">
                <td className="p-3 text-voyage-muted">{new Date(p.created_at).toLocaleDateString()}</td>
                <td className="p-3">{p.catalog_itineraries?.title_en ?? "—"}</td>
                <td className="p-3">{p.customer_email}</td>
                <td className="p-3">€{Number(p.amount_total).toFixed(2)}</td>
                <td className="p-3">
                  <span className={p.status === "paid" ? "text-sage" : "text-voyage-muted"}>
                    {p.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Editor modal */}
      {editing && (
        <div className="fixed inset-0 z-50 bg-ink/60 flex items-center justify-center p-4">
          <div className="bg-parchment rounded-lg max-w-4xl w-full max-h-[92vh] overflow-auto">
            <div className="sticky top-0 bg-parchment border-b border-parchment-3 px-6 py-4 flex justify-between items-center z-10">
              <h2 className="font-serif text-xl font-bold">
                {editing.id ? "Edit" : "New"} Itinerary
              </h2>
              <div className="flex gap-2">
                <button
                  onClick={() => setEditing(null)}
                  className="px-4 py-2 text-[0.72rem] uppercase tracking-[0.1em] text-voyage-muted hover:text-ink"
                >
                  Cancel
                </button>
                <button
                  onClick={() => saveMutation.mutate(editing)}
                  disabled={saveMutation.isPending}
                  className="px-5 py-2 rounded-sm bg-ink text-voyage-white text-[0.72rem] font-medium tracking-[0.1em] uppercase hover:bg-gold hover:text-ink disabled:opacity-50"
                >
                  {saveMutation.isPending ? "Saving…" : "Save"}
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              <AiAssistantPanel editing={editing} setEditing={setEditing} />

              {/* Basics */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={label}>Slug (URL)</label>
                  <input
                    className={input}
                    value={editing.slug || ""}
                    onChange={(e) => setEditing({ ...editing, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-") })}
                    placeholder="norway-fjord-week"
                  />
                </div>
                <div>
                  <label className={label}>Price (EUR)</label>
                  <input
                    type="number"
                    className={input}
                    value={editing.price_eur ?? 0}
                    onChange={(e) => setEditing({ ...editing, price_eur: Number(e.target.value) })}
                  />
                </div>
              </div>

              <TranslateBar editing={editing} setEditing={setEditing} editLang={editLang} setEditLang={setEditLang} />

              {(() => {
                const L = editLang;
                const langLabel = L === "en" ? "English" : L === "pt" ? "Português" : "Norsk";
                const otherLangs = (["en", "pt", "no"] as const).filter((c) => c !== L);
                const filledOther = otherLangs.filter((c) => (editing[`title_${c}`] || editing[`summary_${c}`] || editing[`description_${c}`] || editing[`what_you_get_${c}`]));
                return (
                  <>
                    <div className="space-y-4">
                      <div>
                        <label className={label}>Title ({langLabel}) *</label>
                        <input className={input} value={editing[`title_${L}`] || ""} onChange={(e) => setEditing({ ...editing, [`title_${L}`]: e.target.value })} />
                      </div>
                      <div>
                        <label className={label}>Summary ({langLabel})</label>
                        <textarea className={input + " min-h-[80px]"} value={editing[`summary_${L}`] || ""} onChange={(e) => setEditing({ ...editing, [`summary_${L}`]: e.target.value })} />
                      </div>
                      <div>
                        <label className={label}>Description ({langLabel})</label>
                        <textarea className={input + " min-h-[200px]"} value={editing[`description_${L}`] || ""} onChange={(e) => setEditing({ ...editing, [`description_${L}`]: e.target.value })} />
                      </div>
                      <div>
                        <label className={label}>What you get ({langLabel} — one per line)</label>
                        <textarea className={input + " min-h-[140px]"} value={editing[`what_you_get_${L}`] || ""} onChange={(e) => setEditing({ ...editing, [`what_you_get_${L}`]: e.target.value })} />
                      </div>
                    </div>
                    {filledOther.length > 0 && (
                      <div className="text-[0.7rem] text-sage">
                        ✓ Translations already filled for: {filledOther.map((c) => c.toUpperCase()).join(", ")}
                      </div>
                    )}
                  </>
                );
              })()}

              {/* Trip metadata */}
              <div className="grid grid-cols-4 gap-4">
                <div>
                  <label className={label}>Destination</label>
                  <input className={input} value={editing.destination || ""} onChange={(e) => setEditing({ ...editing, destination: e.target.value })} />
                </div>
                <div>
                  <label className={label}>Duration</label>
                  <input className={input} value={editing.duration || ""} onChange={(e) => setEditing({ ...editing, duration: e.target.value })} placeholder="7 days" />
                </div>
                <div>
                  <label className={label}>Ideal for</label>
                  <input className={input} value={editing.group_size_label || ""} onChange={(e) => setEditing({ ...editing, group_size_label: e.target.value })} placeholder="2 travellers" />
                </div>
                <div>
                  <label className={label}>Est. trip budget</label>
                  <input className={input} value={editing.estimated_trip_budget || ""} onChange={(e) => setEditing({ ...editing, estimated_trip_budget: e.target.value })} placeholder="€2,500/person" />
                </div>
              </div>

              {/* Hero image */}
              <div>
                <label className={label}>Hero image</label>
                <div className="flex gap-3 items-start">
                  {editing.hero_image_url && (
                    <img src={editing.hero_image_url} alt="" className="w-32 h-20 object-cover rounded" />
                  )}
                  <div className="flex-1">
                    <input className={input} value={editing.hero_image_url || ""} onChange={(e) => setEditing({ ...editing, hero_image_url: e.target.value })} placeholder="Paste URL or upload" />
                    <input type="file" accept="image/*" onChange={onHeroUpload} className="text-[0.78rem] mt-2" disabled={uploadingHero} />
                    {uploadingHero && <span className="text-[0.7rem] text-voyage-muted ml-2">Uploading…</span>}
                  </div>
                </div>
              </div>

              {/* Gallery */}
              <div>
                <label className={label}>Gallery images</label>
                <div className="grid grid-cols-4 gap-2 mb-2">
                  {(editing.gallery_images || []).map((url, i) => (
                    <div key={i} className="relative group">
                      <img src={url} alt="" className="w-full aspect-square object-cover rounded" />
                      <button
                        onClick={() => setEditing({ ...editing, gallery_images: editing.gallery_images!.filter((_, j) => j !== i) })}
                        className="absolute top-1 right-1 bg-destructive text-voyage-white w-5 h-5 rounded-full text-xs opacity-0 group-hover:opacity-100"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
                <input type="file" accept="image/*" multiple onChange={onGalleryUpload} className="text-[0.78rem]" disabled={uploadingGallery} />
                {uploadingGallery && <span className="text-[0.7rem] text-voyage-muted ml-2">Uploading…</span>}
              </div>

              {/* PDF */}
              <div>
                <label className={label}>Itinerary PDF (private — shown only after purchase)</label>
                <div className="flex gap-3 items-center">
                  {editing.pdf_path && (
                    <span className="text-[0.78rem] text-sage">✓ {editing.pdf_path}</span>
                  )}
                  <input type="file" accept=".pdf" onChange={onPdfUpload} className="text-[0.78rem]" disabled={uploadingPdf} />
                  {uploadingPdf && <span className="text-[0.7rem] text-voyage-muted">Uploading…</span>}
                </div>
              </div>

              {/* Publish */}
              <div className="flex items-center gap-3 pt-4 border-t border-parchment-3">
                <input
                  id="pub"
                  type="checkbox"
                  checked={!!editing.is_published}
                  onChange={(e) => setEditing({ ...editing, is_published: e.target.checked })}
                />
                <label htmlFor="pub" className="text-[0.85rem] text-ink font-medium">
                  Publish (visible to customers)
                </label>
                <span className="ml-auto text-[0.72rem] text-voyage-muted">Sort order:</span>
                <input
                  type="number"
                  className={input + " w-20"}
                  value={editing.sort_order ?? 0}
                  onChange={(e) => setEditing({ ...editing, sort_order: Number(e.target.value) })}
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CatalogManager;
