import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

type ItineraryStatus = "new" | "in_progress" | "delivered" | "revision";
type PaymentStatus = "pending" | "paid" | "refunded";

interface ClientProject {
  id: string;
  user_id: string;
  client_name: string;
  client_email: string | null;
  group_size: number;
  destination: string | null;
  trip_duration: string | null;
  price: number | null;
  itinerary_status: ItineraryStatus;
  payment_status: PaymentStatus;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

const STATUS_LABELS: Record<ItineraryStatus, string> = {
  new: "New",
  in_progress: "In Progress",
  delivered: "Delivered",
  revision: "Revision",
};

const PAYMENT_LABELS: Record<PaymentStatus, string> = {
  pending: "Pending",
  paid: "Paid",
  refunded: "Refunded",
};

const statusStyle: Record<ItineraryStatus, string> = {
  new: "bg-gold/10 text-gold border-gold/30",
  in_progress: "bg-sage/10 text-sage border-sage/30",
  delivered: "bg-ink/[0.06] text-ink border-parchment-3",
  revision: "bg-destructive/10 text-destructive border-destructive/30",
};

const paymentStyle: Record<PaymentStatus, string> = {
  pending: "bg-gold/10 text-gold border-gold/30",
  paid: "bg-sage/10 text-sage border-sage/30",
  refunded: "bg-destructive/10 text-destructive border-destructive/30",
};

const Badge = ({ label, style }: { label: string; style: string }) => (
  <span className={`inline-block px-2.5 py-1 rounded-full text-[0.62rem] font-semibold tracking-[0.08em] uppercase border ${style}`}>
    {label}
  </span>
);

const emptyProject = {
  client_name: "",
  client_email: "",
  group_size: 1,
  destination: "",
  trip_duration: "",
  price: "",
  itinerary_status: "new" as ItineraryStatus,
  payment_status: "pending" as PaymentStatus,
  notes: "",
};

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyProject);
  const [filter, setFilter] = useState<ItineraryStatus | "all">("all");

  const { data: projects = [], isLoading } = useQuery({
    queryKey: ["client_projects"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("client_projects")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as ClientProject[];
    },
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const payload = {
        client_name: form.client_name,
        client_email: form.client_email || null,
        group_size: form.group_size,
        destination: form.destination || null,
        trip_duration: form.trip_duration || null,
        price: form.price ? Number(form.price) : null,
        itinerary_status: form.itinerary_status,
        payment_status: form.payment_status,
        notes: form.notes || null,
        user_id: user.id,
      };

      if (editingId) {
        const { error } = await supabase.from("client_projects").update(payload).eq("id", editingId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("client_projects").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["client_projects"] });
      setDialogOpen(false);
      setEditingId(null);
      setForm(emptyProject);
      toast({ title: editingId ? "Project updated" : "Project created" });
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("client_projects").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["client_projects"] });
      toast({ title: "Project deleted" });
    },
  });

  const openNew = () => {
    setEditingId(null);
    setForm(emptyProject);
    setDialogOpen(true);
  };

  const openEdit = (p: ClientProject) => {
    setEditingId(p.id);
    setForm({
      client_name: p.client_name,
      client_email: p.client_email || "",
      group_size: p.group_size,
      destination: p.destination || "",
      trip_duration: p.trip_duration || "",
      price: p.price?.toString() || "",
      itinerary_status: p.itinerary_status,
      payment_status: p.payment_status,
      notes: p.notes || "",
    });
    setDialogOpen(true);
  };

  const filtered = filter === "all" ? projects : projects.filter((p) => p.itinerary_status === filter);

  const stats = {
    total: projects.length,
    active: projects.filter((p) => p.itinerary_status === "in_progress").length,
    delivered: projects.filter((p) => p.itinerary_status === "delivered").length,
    pending_payment: projects.filter((p) => p.payment_status === "pending").length,
  };

  const inputClass = "w-full px-3 py-2.5 rounded-sm bg-parchment border border-parchment-3 text-ink text-[0.85rem] focus:outline-none focus:border-gold transition-colors";
  const selectClass = inputClass;

  return (
    <>
      <div className="min-h-screen bg-parchment">
        {/* Nav */}
        <nav className="bg-ink px-10 py-4 flex justify-between items-center border-b border-voyage-white/[0.08] max-md:px-6 max-md:flex-wrap max-md:gap-3">
          <div>
            <span className="font-serif text-lg font-bold text-voyage-white">
              Fjord <span className="text-gold italic">&</span> Waves Tours
            </span>
            <small className="block text-[0.62rem] tracking-[0.1em] uppercase text-voyage-white/35 mt-0.5">Project Tracker</small>
          </div>
          <div className="flex gap-2 items-center">
            <button onClick={() => navigate("/")} className="px-4 py-2 rounded-sm border border-voyage-white/10 text-voyage-white/45 text-[0.72rem] font-medium tracking-[0.08em] uppercase hover:border-voyage-white/30 hover:text-voyage-white transition-all">
              ← Site
            </button>
            <button onClick={async () => { await supabase.auth.signOut(); navigate("/login"); }} className="px-4 py-2 rounded-sm border border-destructive/30 text-destructive text-[0.72rem] font-medium tracking-[0.08em] uppercase hover:bg-destructive/10 transition-all">
              Logout
            </button>
          </div>
        </nav>

        <div className="p-10 max-w-[1200px] mx-auto max-md:p-6">
          {/* Header */}
          <div className="flex justify-between items-start mb-8 max-md:flex-col max-md:gap-4">
            <div>
              <h1 className="font-serif text-3xl font-bold mb-1">Client Projects</h1>
              <p className="text-[0.85rem] text-voyage-muted">Track itineraries, payments and client details.</p>
            </div>
            <button onClick={openNew} className="px-5 py-2.5 rounded-sm bg-gold text-ink text-[0.72rem] font-semibold tracking-[0.1em] uppercase hover:bg-gold-2 transition-colors">
              + New Project
            </button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-4 max-md:grid-cols-2 gap-4 mb-8">
            {[
              { label: "Total Projects", val: stats.total },
              { label: "In Progress", val: stats.active },
              { label: "Delivered", val: stats.delivered },
              { label: "Pending Payment", val: stats.pending_payment },
            ].map((s) => (
              <div key={s.label} className="bg-voyage-white border border-parchment-3 rounded-lg p-5">
                <div className="text-[0.68rem] font-semibold tracking-[0.1em] uppercase text-voyage-muted mb-1">{s.label}</div>
                <div className="font-serif text-2xl font-bold text-ink">{s.val}</div>
              </div>
            ))}
          </div>

          {/* Filters */}
          <div className="flex gap-2 mb-6 flex-wrap">
            {(["all", "new", "in_progress", "delivered", "revision"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3.5 py-1.5 rounded-full text-[0.68rem] font-medium tracking-[0.06em] uppercase border transition-all ${
                  filter === f ? "bg-ink text-voyage-white border-ink" : "bg-voyage-white text-voyage-muted border-parchment-3 hover:border-ink"
                }`}
              >
                {f === "all" ? "All" : STATUS_LABELS[f]}
              </button>
            ))}
          </div>

          {/* Table */}
          {isLoading ? (
            <p className="text-voyage-muted text-sm">Loading...</p>
          ) : filtered.length === 0 ? (
            <div className="bg-voyage-white border border-parchment-3 rounded-lg p-12 text-center">
              <p className="text-voyage-muted text-sm">No projects yet. Click "+ New Project" to get started.</p>
            </div>
          ) : (
            <div className="bg-voyage-white border border-parchment-3 rounded-lg overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr>
                    {["Client", "Destination", "Group", "Duration", "Price", "Itinerary", "Payment", "Actions"].map((h) => (
                      <th key={h} className="px-4 py-3 text-left text-[0.65rem] font-semibold tracking-[0.1em] uppercase text-voyage-muted bg-parchment border-b border-parchment-3">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((p) => (
                    <tr key={p.id} className="hover:bg-parchment/50 transition-colors">
                      <td className="px-4 py-3.5 border-b border-parchment-3">
                        <div className="text-[0.85rem] font-medium text-ink">{p.client_name}</div>
                        {p.client_email && <div className="text-[0.72rem] text-voyage-muted">{p.client_email}</div>}
                      </td>
                      <td className="px-4 py-3.5 border-b border-parchment-3 text-[0.82rem] text-ink-2">{p.destination || "—"}</td>
                      <td className="px-4 py-3.5 border-b border-parchment-3 text-[0.82rem] text-ink-2">{p.group_size}</td>
                      <td className="px-4 py-3.5 border-b border-parchment-3 text-[0.82rem] text-ink-2">{p.trip_duration || "—"}</td>
                      <td className="px-4 py-3.5 border-b border-parchment-3 text-[0.82rem] font-semibold text-ink">{p.price ? `€${p.price}` : "—"}</td>
                      <td className="px-4 py-3.5 border-b border-parchment-3"><Badge label={STATUS_LABELS[p.itinerary_status]} style={statusStyle[p.itinerary_status]} /></td>
                      <td className="px-4 py-3.5 border-b border-parchment-3"><Badge label={PAYMENT_LABELS[p.payment_status]} style={paymentStyle[p.payment_status]} /></td>
                      <td className="px-4 py-3.5 border-b border-parchment-3">
                        <div className="flex gap-2">
                          <button onClick={() => openEdit(p)} className="px-2.5 py-1 rounded-sm border border-parchment-3 text-[0.68rem] font-medium text-voyage-muted hover:border-gold hover:text-gold transition-all">Edit</button>
                          <button onClick={() => { if (confirm("Delete this project?")) deleteMutation.mutate(p.id); }} className="px-2.5 py-1 rounded-sm border border-parchment-3 text-[0.68rem] font-medium text-voyage-muted hover:border-destructive hover:text-destructive transition-all">Delete</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-serif text-xl">{editingId ? "Edit Project" : "New Project"}</DialogTitle>
            <DialogDescription>Fill in the client and itinerary details.</DialogDescription>
          </DialogHeader>
          <form
            onSubmit={(e) => { e.preventDefault(); saveMutation.mutate(); }}
            className="flex flex-col gap-3 mt-2"
          >
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[0.7rem] font-medium text-voyage-muted uppercase tracking-wider mb-1 block">Client Name *</label>
                <input required value={form.client_name} onChange={(e) => setForm({ ...form, client_name: e.target.value })} className={inputClass} />
              </div>
              <div>
                <label className="text-[0.7rem] font-medium text-voyage-muted uppercase tracking-wider mb-1 block">Email</label>
                <input type="email" value={form.client_email} onChange={(e) => setForm({ ...form, client_email: e.target.value })} className={inputClass} />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="text-[0.7rem] font-medium text-voyage-muted uppercase tracking-wider mb-1 block">Group Size</label>
                <input type="number" min={1} value={form.group_size} onChange={(e) => setForm({ ...form, group_size: Number(e.target.value) })} className={inputClass} />
              </div>
              <div>
                <label className="text-[0.7rem] font-medium text-voyage-muted uppercase tracking-wider mb-1 block">Duration</label>
                <input value={form.trip_duration} onChange={(e) => setForm({ ...form, trip_duration: e.target.value })} placeholder="e.g. 7 days" className={inputClass} />
              </div>
              <div>
                <label className="text-[0.7rem] font-medium text-voyage-muted uppercase tracking-wider mb-1 block">Price (€)</label>
                <input type="number" min={0} step="0.01" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} className={inputClass} />
              </div>
            </div>
            <div>
              <label className="text-[0.7rem] font-medium text-voyage-muted uppercase tracking-wider mb-1 block">Destination</label>
              <input value={form.destination} onChange={(e) => setForm({ ...form, destination: e.target.value })} className={inputClass} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[0.7rem] font-medium text-voyage-muted uppercase tracking-wider mb-1 block">Itinerary Status</label>
                <select value={form.itinerary_status} onChange={(e) => setForm({ ...form, itinerary_status: e.target.value as ItineraryStatus })} className={selectClass}>
                  {Object.entries(STATUS_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </div>
              <div>
                <label className="text-[0.7rem] font-medium text-voyage-muted uppercase tracking-wider mb-1 block">Payment Status</label>
                <select value={form.payment_status} onChange={(e) => setForm({ ...form, payment_status: e.target.value as PaymentStatus })} className={selectClass}>
                  {Object.entries(PAYMENT_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label className="text-[0.7rem] font-medium text-voyage-muted uppercase tracking-wider mb-1 block">Notes</label>
              <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={3} className={inputClass} />
            </div>
            <button type="submit" disabled={saveMutation.isPending} className="mt-2 px-6 py-3 rounded-sm bg-gold text-ink font-semibold text-[0.78rem] tracking-[0.1em] uppercase hover:bg-gold-2 transition-colors disabled:opacity-60">
              {saveMutation.isPending ? "Saving..." : editingId ? "Update Project" : "Create Project"}
            </button>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default AdminDashboard;
