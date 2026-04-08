import { useState, useRef, lazy, Suspense } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "react-i18next";
import LanguageSelector from "@/components/voyage/LanguageSelector";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import AdvisorAssistant from "@/components/voyage/AdvisorAssistant";

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
  itinerary_pdf_path: string | null;
  created_at: string;
  updated_at: string;
}

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
  const { t, i18n } = useTranslation();
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyProject);
  const [filter, setFilter] = useState<ItineraryStatus | "all">("all");
  const [activeTab, setActiveTab] = useState<"projects" | "assistant">("projects");
  const [sendDialogOpen, setSendDialogOpen] = useState(false);
  const [sendProject, setSendProject] = useState<ClientProject | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState("welcome");
  const [isSending, setIsSending] = useState(false);
  const [uploadingId, setUploadingId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [pendingUploadProjectId, setPendingUploadProjectId] = useState<string | null>(null);

  const STATUS_LABELS: Record<ItineraryStatus, string> = {
    new: t("admin.new"),
    in_progress: t("admin.in_progress"),
    delivered: t("admin.delivered"),
    revision: t("admin.revision"),
  };

  const PAYMENT_LABELS: Record<PaymentStatus, string> = {
    pending: t("admin.pending"),
    paid: t("admin.paid"),
    refunded: t("admin.refunded"),
  };

  const EMAIL_TEMPLATES = [
    { id: "welcome", label: t("admin.tplWelcome"), description: t("admin.tplWelcomeDesc") },
    { id: "final", label: t("admin.tplFinal"), description: t("admin.tplFinalDesc") },
    { id: "revision", label: t("admin.tplRevision"), description: t("admin.tplRevisionDesc") },
  ];

  const { data: projects = [], isLoading } = useQuery({
    queryKey: ["client_projects"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("client_projects")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data as any[]).map((d) => ({
        ...d,
        itinerary_pdf_path: d.itinerary_pdf_path ?? null,
      })) as ClientProject[];
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
      toast({ title: editingId ? t("admin.updateProject") : t("admin.createProject") });
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
      toast({ title: t("admin.delete") });
    },
  });

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !pendingUploadProjectId) return;
    if (file.type !== "application/pdf") {
      toast({ title: "Only PDF files are allowed", variant: "destructive" });
      return;
    }
    setUploadingId(pendingUploadProjectId);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");
      const filePath = `${user.id}/${pendingUploadProjectId}/${file.name}`;
      const project = projects.find((p) => p.id === pendingUploadProjectId);
      if (project?.itinerary_pdf_path) {
        await supabase.storage.from("itineraries").remove([project.itinerary_pdf_path]);
      }
      const { error: uploadError } = await supabase.storage.from("itineraries").upload(filePath, file, { upsert: true });
      if (uploadError) throw uploadError;
      const { error: updateError } = await supabase.from("client_projects").update({ itinerary_pdf_path: filePath } as any).eq("id", pendingUploadProjectId);
      if (updateError) throw updateError;
      queryClient.invalidateQueries({ queryKey: ["client_projects"] });
      toast({ title: "Itinerary PDF uploaded" });
    } catch (err: any) {
      toast({ title: "Upload failed", description: err.message, variant: "destructive" });
    } finally {
      setUploadingId(null);
      setPendingUploadProjectId(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const triggerUpload = (projectId: string) => {
    setPendingUploadProjectId(projectId);
    fileInputRef.current?.click();
  };

  const getPdfUrl = (path: string) => {
    const { data } = supabase.storage.from("itineraries").getPublicUrl(path);
    return data.publicUrl;
  };

  const handleSendEmail = async () => {
    if (!sendProject || !sendProject.client_email || !sendProject.itinerary_pdf_path) return;
    setIsSending(true);
    try {
      const pdfUrl = getPdfUrl(sendProject.itinerary_pdf_path);
      const { data, error } = await supabase.functions.invoke("send-itinerary-email", {
        body: {
          recipientEmail: sendProject.client_email,
          clientName: sendProject.client_name,
          destination: sendProject.destination || "",
          templateName: selectedTemplate,
          pdfUrl,
        },
      });
      if (error) throw error;
      toast({ title: "Email sent!", description: `Itinerary sent to ${sendProject.client_email}` });
      setSendDialogOpen(false);
    } catch (err: any) {
      toast({ title: "Failed to send", description: err.message, variant: "destructive" });
    } finally {
      setIsSending(false);
    }
  };

  const openSendDialog = (p: ClientProject) => {
    setSendProject(p);
    setSelectedTemplate("welcome");
    setSendDialogOpen(true);
  };

  const openNew = () => { setEditingId(null); setForm(emptyProject); setDialogOpen(true); };
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

  const now = new Date();
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay() + (now.getDay() === 0 ? -6 : 1));
  startOfWeek.setHours(0, 0, 0, 0);
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfYear = new Date(now.getFullYear(), 0, 1);

  const sumPrices = (list: ClientProject[]) => list.reduce((sum, p) => sum + (p.price || 0), 0);
  const paidProjects = projects.filter((p) => p.payment_status === "paid");
  const earningsTotal = sumPrices(paidProjects);
  const earningsYear = sumPrices(paidProjects.filter((p) => new Date(p.created_at) >= startOfYear));
  const earningsMonth = sumPrices(paidProjects.filter((p) => new Date(p.created_at) >= startOfMonth));
  const earningsWeek = sumPrices(paidProjects.filter((p) => new Date(p.created_at) >= startOfWeek));

  const inputClass = "w-full px-3 py-2.5 rounded-sm bg-parchment border border-parchment-3 text-ink text-[0.85rem] focus:outline-none focus:border-gold transition-colors";
  const selectClass = inputClass;

  const TABLE_HEADERS = [
    t("admin.client"), t("admin.destination"), t("admin.group"), t("admin.price"),
    t("admin.itinerary"), t("admin.payment"), t("admin.pdf"), t("admin.actions"),
  ];

  return (
    <>
      <div className="min-h-screen bg-parchment">
        <input type="file" accept=".pdf" ref={fileInputRef} onChange={handleFileUpload} className="hidden" />

        <nav className="bg-ink px-10 py-4 flex justify-between items-center border-b border-voyage-white/[0.08] max-md:px-6 max-md:flex-wrap max-md:gap-3">
          <div>
            <span className="font-serif text-lg font-bold text-voyage-white">
              Fjord <span className="text-gold italic">&</span> Waves Tours
            </span>
            <small className="block text-[0.62rem] tracking-[0.1em] uppercase text-voyage-white/35 mt-0.5">{t("admin.projectTracker")}</small>
          </div>
          <div className="flex gap-2 items-center">
            <LanguageSelector variant="dark" />
            <button onClick={() => navigate("/")} className="px-4 py-2 rounded-sm border border-voyage-white/10 text-voyage-white/45 text-[0.72rem] font-medium tracking-[0.08em] uppercase hover:border-voyage-white/30 hover:text-voyage-white transition-all">
              {t("admin.site")}
            </button>
            <button onClick={async () => { await supabase.auth.signOut(); navigate("/login"); }} className="px-4 py-2 rounded-sm border border-destructive/30 text-destructive text-[0.72rem] font-medium tracking-[0.08em] uppercase hover:bg-destructive/10 transition-all">
              {t("admin.logout")}
            </button>
          </div>
        </nav>

        <div className="bg-voyage-white border-b border-parchment-3 px-10 max-md:px-6">
          <div className="max-w-[1200px] mx-auto flex gap-1">
            <button onClick={() => setActiveTab("projects")} className={`px-5 py-3 text-[0.72rem] font-semibold tracking-[0.08em] uppercase border-b-2 transition-all ${activeTab === "projects" ? "border-gold text-ink" : "border-transparent text-voyage-muted hover:text-ink"}`}>
              {t("admin.projects")}
            </button>
            <button onClick={() => setActiveTab("assistant")} className={`px-5 py-3 text-[0.72rem] font-semibold tracking-[0.08em] uppercase border-b-2 transition-all ${activeTab === "assistant" ? "border-gold text-ink" : "border-transparent text-voyage-muted hover:text-ink"}`}>
              {t("admin.assistant")}
            </button>
          </div>
        </div>

        <div className="p-10 max-w-[1200px] mx-auto max-md:p-6">
          {activeTab === "assistant" ? (
            <div>
              <div className="mb-8">
                <h1 className="font-serif text-3xl font-bold mb-1">{t("admin.assistantTitle")}</h1>
                <p className="text-[0.85rem] text-voyage-muted">{t("admin.assistantDesc")}</p>
              </div>
              <AdvisorAssistant projects={projects as any} />
            </div>
          ) : (
          <>
          <div className="flex justify-between items-start mb-8 max-md:flex-col max-md:gap-4">
            <div>
              <h1 className="font-serif text-3xl font-bold mb-1">{t("admin.clientProjects")}</h1>
              <p className="text-[0.85rem] text-voyage-muted">{t("admin.clientProjectsDesc")}</p>
            </div>
            <button onClick={openNew} className="px-5 py-2.5 rounded-sm bg-gold text-ink text-[0.72rem] font-semibold tracking-[0.1em] uppercase hover:bg-gold-2 transition-colors">
              {t("admin.newProject")}
            </button>
          </div>

          <div className="grid grid-cols-4 max-md:grid-cols-2 gap-4 mb-8">
            {[
              { label: t("admin.totalProjects"), val: stats.total },
              { label: t("admin.inProgress"), val: stats.active },
              { label: t("admin.delivered"), val: stats.delivered },
              { label: t("admin.pendingPayment"), val: stats.pending_payment },
            ].map((s) => (
              <div key={s.label} className="bg-voyage-white border border-parchment-3 rounded-lg p-5">
                <div className="text-[0.68rem] font-semibold tracking-[0.1em] uppercase text-voyage-muted mb-1">{s.label}</div>
                <div className="font-serif text-2xl font-bold text-ink">{s.val}</div>
              </div>
            ))}
          </div>

          <div className="mb-8">
            <h2 className="text-[0.72rem] font-semibold tracking-[0.12em] uppercase text-voyage-muted mb-3">{t("admin.earningsOverview")}</h2>
            <div className="grid grid-cols-4 max-md:grid-cols-2 gap-4">
              {[
                { label: t("admin.thisWeek"), val: earningsWeek },
                { label: t("admin.thisMonth"), val: earningsMonth },
                { label: `${now.getFullYear()}`, val: earningsYear },
                { label: t("admin.allTime"), val: earningsTotal },
              ].map((e) => (
                <div key={e.label} className="bg-voyage-white border border-parchment-3 rounded-lg p-5">
                  <div className="text-[0.68rem] font-semibold tracking-[0.1em] uppercase text-voyage-muted mb-1">{e.label}</div>
                  <div className="font-serif text-2xl font-bold text-sage">€{e.val.toLocaleString("en", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-2 mb-6 flex-wrap">
            {(["all", "new", "in_progress", "delivered", "revision"] as const).map((f) => (
              <button key={f} onClick={() => setFilter(f)} className={`px-3.5 py-1.5 rounded-full text-[0.68rem] font-medium tracking-[0.06em] uppercase border transition-all ${filter === f ? "bg-ink text-voyage-white border-ink" : "bg-voyage-white text-voyage-muted border-parchment-3 hover:border-ink"}`}>
                {f === "all" ? t("admin.all") : STATUS_LABELS[f]}
              </button>
            ))}
          </div>

          {isLoading ? (
            <p className="text-voyage-muted text-sm">{t("admin.loading")}</p>
          ) : filtered.length === 0 ? (
            <div className="bg-voyage-white border border-parchment-3 rounded-lg p-12 text-center">
              <p className="text-voyage-muted text-sm">{t("admin.noProjects")}</p>
            </div>
          ) : (
            <div className="bg-voyage-white border border-parchment-3 rounded-lg overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr>
                    {TABLE_HEADERS.map((h) => (
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
                      <td className="px-4 py-3.5 border-b border-parchment-3 text-[0.82rem] font-semibold text-ink">{p.price ? `${t("admin.currencySymbol")}${t("admin.currencySymbol") === "kr" ? " " : ""}${p.price}` : "—"}</td>
                      <td className="px-4 py-3.5 border-b border-parchment-3"><Badge label={STATUS_LABELS[p.itinerary_status]} style={statusStyle[p.itinerary_status]} /></td>
                      <td className="px-4 py-3.5 border-b border-parchment-3"><Badge label={PAYMENT_LABELS[p.payment_status]} style={paymentStyle[p.payment_status]} /></td>
                      <td className="px-4 py-3.5 border-b border-parchment-3">
                        <div className="flex items-center gap-2">
                          {p.itinerary_pdf_path ? (
                            <>
                              <a href={getPdfUrl(p.itinerary_pdf_path)} target="_blank" rel="noopener noreferrer" className="text-[0.68rem] text-gold hover:text-gold-2 underline">{t("admin.view")}</a>
                              <button onClick={() => triggerUpload(p.id)} disabled={uploadingId === p.id} className="text-[0.68rem] text-voyage-muted hover:text-ink transition-colors">
                                {uploadingId === p.id ? "..." : t("admin.replace")}
                              </button>
                            </>
                          ) : (
                            <button onClick={() => triggerUpload(p.id)} disabled={uploadingId === p.id} className="px-2.5 py-1 rounded-sm border border-dashed border-gold/40 text-[0.68rem] font-medium text-gold hover:border-gold hover:bg-gold/5 transition-all">
                              {uploadingId === p.id ? t("admin.uploading") : t("admin.upload")}
                            </button>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3.5 border-b border-parchment-3">
                        <div className="flex gap-2">
                          <button onClick={() => openEdit(p)} className="px-2.5 py-1 rounded-sm border border-parchment-3 text-[0.68rem] font-medium text-voyage-muted hover:border-gold hover:text-gold transition-all">{t("admin.edit")}</button>
                          {p.itinerary_pdf_path && p.client_email && (
                            <button onClick={() => openSendDialog(p)} className="px-2.5 py-1 rounded-sm border border-sage/30 text-[0.68rem] font-medium text-sage hover:border-sage hover:bg-sage/5 transition-all">{t("admin.send")}</button>
                          )}
                          <button onClick={() => { if (confirm(t("admin.deleteConfirm"))) deleteMutation.mutate(p.id); }} className="px-2.5 py-1 rounded-sm border border-parchment-3 text-[0.68rem] font-medium text-voyage-muted hover:border-destructive hover:text-destructive transition-all">{t("admin.delete")}</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          </>
          )}
        </div>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-serif text-xl">{editingId ? t("admin.editProject") : t("admin.newProjectTitle")}</DialogTitle>
            <DialogDescription>{t("admin.formDesc")}</DialogDescription>
          </DialogHeader>
          <form onSubmit={(e) => { e.preventDefault(); saveMutation.mutate(); }} className="flex flex-col gap-3 mt-2">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[0.7rem] font-medium text-voyage-muted uppercase tracking-wider mb-1 block">{t("admin.clientName")}</label>
                <input required value={form.client_name} onChange={(e) => setForm({ ...form, client_name: e.target.value })} className={inputClass} />
              </div>
              <div>
                <label className="text-[0.7rem] font-medium text-voyage-muted uppercase tracking-wider mb-1 block">{t("admin.emailLabel")}</label>
                <input type="email" value={form.client_email} onChange={(e) => setForm({ ...form, client_email: e.target.value })} className={inputClass} />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="text-[0.7rem] font-medium text-voyage-muted uppercase tracking-wider mb-1 block">{t("admin.groupSize")}</label>
                <input type="number" min={1} value={form.group_size} onChange={(e) => setForm({ ...form, group_size: Number(e.target.value) })} className={inputClass} />
              </div>
              <div>
                <label className="text-[0.7rem] font-medium text-voyage-muted uppercase tracking-wider mb-1 block">{t("admin.duration")}</label>
                <input value={form.trip_duration} onChange={(e) => setForm({ ...form, trip_duration: e.target.value })} placeholder="e.g. 7 days" className={inputClass} />
              </div>
              <div>
                <label className="text-[0.7rem] font-medium text-voyage-muted uppercase tracking-wider mb-1 block">{t("admin.priceLabel")}</label>
                {(() => {
                  const lang = i18n.language;
                  const isPt = lang === "pt";
                  const isNo = lang === "no";
                  const sym = isPt ? "R$" : isNo ? "kr" : "€";
                  const presets = isPt
                    ? [200, 300, 500, 750]
                    : isNo
                    ? [2600, 3150, 4000, 4900]
                    : [225, 275, 300, 425];
                  const labels = [
                    t("pricingData.r1group") + " / " + t("pricingData.r1dur"),
                    t("pricingData.r2group") + " / " + t("pricingData.r2dur"),
                    t("pricingData.r3group") + " / " + t("pricingData.r3dur"),
                    t("pricingData.r4group") + " / " + t("pricingData.r4dur"),
                  ];
                  return (
                    <div className="space-y-1.5">
                      <select
                        value={presets.includes(Number(form.price)) ? form.price : "custom"}
                        onChange={(e) => {
                          if (e.target.value === "custom") {
                            setForm({ ...form, price: "" });
                          } else {
                            setForm({ ...form, price: e.target.value });
                          }
                        }}
                        className={inputClass}
                      >
                        <option value="">{t("admin.selectPrice")}</option>
                        {presets.map((p, i) => (
                          <option key={p} value={p}>
                            {sym} {p.toLocaleString()} — {labels[i]}
                          </option>
                        ))}
                        <option value="custom">{t("admin.customPrice")}</option>
                      </select>
                      {(!presets.includes(Number(form.price)) || form.price === "") && (
                        <input
                          type="number"
                          min={0}
                          step="0.01"
                          value={presets.includes(Number(form.price)) ? "" : form.price}
                          onChange={(e) => setForm({ ...form, price: e.target.value })}
                          placeholder={t("admin.customPricePlaceholder")}
                          className={inputClass}
                        />
                      )}
                    </div>
                  );
                })()}
              </div>
            </div>
            <div>
              <label className="text-[0.7rem] font-medium text-voyage-muted uppercase tracking-wider mb-1 block">{t("admin.destinationLabel")}</label>
              <input value={form.destination} onChange={(e) => setForm({ ...form, destination: e.target.value })} className={inputClass} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[0.7rem] font-medium text-voyage-muted uppercase tracking-wider mb-1 block">{t("admin.itineraryStatus")}</label>
                <select value={form.itinerary_status} onChange={(e) => setForm({ ...form, itinerary_status: e.target.value as ItineraryStatus })} className={selectClass}>
                  {Object.entries(STATUS_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </div>
              <div>
                <label className="text-[0.7rem] font-medium text-voyage-muted uppercase tracking-wider mb-1 block">{t("admin.paymentStatus")}</label>
                <select value={form.payment_status} onChange={(e) => setForm({ ...form, payment_status: e.target.value as PaymentStatus })} className={selectClass}>
                  {Object.entries(PAYMENT_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label className="text-[0.7rem] font-medium text-voyage-muted uppercase tracking-wider mb-1 block">{t("admin.notes")}</label>
              <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={3} className={inputClass} />
            </div>
            <button type="submit" disabled={saveMutation.isPending} className="mt-2 px-6 py-3 rounded-sm bg-gold text-ink font-semibold text-[0.78rem] tracking-[0.1em] uppercase hover:bg-gold-2 transition-colors disabled:opacity-60">
              {saveMutation.isPending ? t("admin.saving") : editingId ? t("admin.updateProject") : t("admin.createProject")}
            </button>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={sendDialogOpen} onOpenChange={setSendDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-serif text-xl">{t("admin.sendItinerary")}</DialogTitle>
            <DialogDescription>
              {t("admin.sendItineraryDesc")} <strong>{sendProject?.client_name}</strong> {t("admin.at")}{" "}
              <strong>{sendProject?.client_email}</strong>
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-4 mt-2">
            <div>
              <label className="text-[0.7rem] font-medium text-voyage-muted uppercase tracking-wider mb-2 block">{t("admin.chooseTemplate")}</label>
              <div className="flex flex-col gap-2">
                {EMAIL_TEMPLATES.map((tpl) => (
                  <button key={tpl.id} onClick={() => setSelectedTemplate(tpl.id)} className={`text-left p-3 rounded-sm border transition-all ${selectedTemplate === tpl.id ? "border-gold bg-gold/5" : "border-parchment-3 hover:border-gold/40"}`}>
                    <div className="text-[0.82rem] font-medium text-ink">{tpl.label}</div>
                    <div className="text-[0.72rem] text-voyage-muted mt-0.5">{tpl.description}</div>
                  </button>
                ))}
              </div>
            </div>
            {sendProject?.itinerary_pdf_path && (
              <div className="flex items-center gap-2 px-3 py-2 bg-parchment rounded-sm border border-parchment-3">
                <span className="text-[0.78rem]">📎</span>
                <span className="text-[0.78rem] text-ink truncate">{sendProject.itinerary_pdf_path.split("/").pop()}</span>
                <a href={getPdfUrl(sendProject.itinerary_pdf_path)} target="_blank" rel="noopener noreferrer" className="ml-auto text-[0.68rem] text-gold hover:text-gold-2 underline">{t("admin.preview")}</a>
              </div>
            )}
            <button onClick={handleSendEmail} disabled={isSending} className="px-6 py-3 rounded-sm bg-sage text-voyage-white font-semibold text-[0.78rem] tracking-[0.1em] uppercase hover:bg-sage/90 transition-colors disabled:opacity-60">
              {isSending ? t("admin.sendingEmail") : t("admin.sendEmail")}
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default AdminDashboard;
