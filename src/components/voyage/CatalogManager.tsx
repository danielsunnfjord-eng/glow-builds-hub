import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "@/lib/router-compat";
import { Eye, EyeOff, ExternalLink, Trash2, Edit3 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

interface Row {
  id: string;
  title: string;
  slug: string | null;
  is_published: boolean;
  destination: string | null;
  duration_label: string | null;
  price_eur: number;
  hero_image_url: string | null;
  view_count: number;
  updated_at: string;
  status: string;
}

const slugify = (s: string) =>
  s.toLowerCase().trim().replace(/[^\w\s-]/g, "").replace(/\s+/g, "-").replace(/-+/g, "-").slice(0, 80);

const CatalogManager = ({ onEdit }: { onEdit?: (id: string) => void }) => {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");

  const { data: rows = [], isLoading } = useQuery({
    queryKey: ["catalog-manager-list"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("route_maker_itineraries")
        .select("id, title, slug, is_published, destination, duration_label, price_eur, hero_image_url, view_count, updated_at, status")
        .order("updated_at", { ascending: false });
      if (error) throw error;
      return data as unknown as Row[];
    },
  });

  const filtered = rows.filter((r) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return [r.title, r.slug, r.destination].filter(Boolean).join(" ").toLowerCase().includes(q);
  });

  const togglePublish = async (r: Row) => {
    if (!r.is_published) {
      if (!r.slug) {
        const newSlug = slugify(r.title);
        if (!newSlug) {
          toast.error("Set a title before publishing.");
          return;
        }
        await supabase.from("route_maker_itineraries").update({ slug: newSlug }).eq("id", r.id);
      }
    }
    const { error } = await supabase
      .from("route_maker_itineraries")
      .update({ is_published: !r.is_published })
      .eq("id", r.id);
    if (error) return toast.error(error.message);
    toast.success(r.is_published ? "Unpublished" : "Published");
    qc.invalidateQueries({ queryKey: ["catalog-manager-list"] });
  };

  const remove = async (r: Row) => {
    if (!confirm(`Delete "${r.title}"? This cannot be undone.`)) return;
    const { error } = await supabase.from("route_maker_itineraries").delete().eq("id", r.id);
    if (error) return toast.error(error.message);
    toast.success("Deleted");
    qc.invalidateQueries({ queryKey: ["catalog-manager-list"] });
  };

  const published = rows.filter((r) => r.is_published).length;

  return (
    <div>
      <div className="mb-8 flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="font-serif text-3xl font-bold mb-1">Routes catalogue</h1>
          <p className="text-[0.85rem] text-voyage-muted">
            Manage which Route Maker itineraries appear on the public <code className="text-xs bg-parchment px-1.5 py-0.5 rounded-sm">/routes</code> catalogue.
            {rows.length > 0 && <> {published} of {rows.length} published.</>}
          </p>
        </div>
        <Link to="/routes" target="_blank" className="inline-flex items-center gap-1.5 text-[0.72rem] uppercase tracking-[0.1em] text-ink hover:text-gold">
          <ExternalLink className="w-3.5 h-3.5" />
          View public catalogue
        </Link>
      </div>

      <div className="mb-4">
        <Input placeholder="Search by title, destination, slug…" value={search} onChange={(e) => setSearch(e.target.value)} className="max-w-md" />
      </div>

      <div className="border border-parchment-3 rounded-md bg-voyage-white overflow-hidden">
        {isLoading && <div className="p-8 text-center text-sm text-voyage-muted">Loading…</div>}
        {!isLoading && filtered.length === 0 && (
          <div className="p-12 text-center text-sm text-voyage-muted">
            No itineraries yet — head to the <strong>Creator</strong> tab to build one.
          </div>
        )}
        {filtered.length > 0 && (
          <div className="divide-y divide-parchment-3">
            {filtered.map((r) => (
              <div key={r.id} className="flex items-center gap-4 p-4 hover:bg-parchment/30">
                <div className="w-20 h-16 rounded-sm bg-parchment-2 flex-shrink-0 overflow-hidden">
                  {r.hero_image_url ? (
                    <img src={r.hero_image_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-fjord/30 to-ocean/30" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <div className="font-medium text-ink truncate">{r.title}</div>
                    {r.is_published ? (
                      <span className="text-[0.65rem] uppercase tracking-wider bg-fjord/15 text-fjord px-2 py-0.5 rounded-sm">Published</span>
                    ) : (
                      <span className="text-[0.65rem] uppercase tracking-wider bg-parchment-2 text-voyage-muted px-2 py-0.5 rounded-sm">Draft</span>
                    )}
                    <span className="text-[0.65rem] uppercase tracking-wider text-voyage-muted">{r.status}</span>
                  </div>
                  <div className="text-[0.75rem] text-voyage-muted mt-0.5 truncate">
                    {[r.destination, r.duration_label].filter(Boolean).join(" · ") || "No metadata"} ·{" "}
                    {r.slug ? <span className="font-mono">/{r.slug}</span> : <em>no slug</em>} ·{" "}
                    {Number(r.price_eur) > 0 ? `€${Number(r.price_eur).toFixed(0)}` : "no price"} ·{" "}
                    {r.view_count} views
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {r.is_published && r.slug && (
                    <Link to={`/routes/${r.slug}`} target="_blank" className="p-2 hover:bg-parchment rounded-sm" title="View public page">
                      <ExternalLink className="w-4 h-4 text-voyage-muted" />
                    </Link>
                  )}
                  {onEdit && (
                    <Button size="sm" variant="ghost" onClick={() => onEdit(r.id)} title="Open in creator">
                      <Edit3 className="w-4 h-4 mr-1" /> Edit
                    </Button>
                  )}
                  <Button size="sm" variant={r.is_published ? "outline" : "default"} onClick={() => togglePublish(r)}>
                    {r.is_published ? <><EyeOff className="w-4 h-4 mr-1" /> Unpublish</> : <><Eye className="w-4 h-4 mr-1" /> Publish</>}
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => remove(r)} className="text-destructive hover:text-destructive">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default CatalogManager;
