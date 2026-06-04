import { useState, useRef, lazy, Suspense } from "react";
import logo from "@/assets/logo-horizontal.png";
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
import CatalogManager from "@/components/voyage/CatalogManager";
import RouteMaker from "@/components/voyage/routeMaker/RouteMaker";

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
  currency: string;
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
  adults: 1,
  children: 0,
  children_ages: [] as number[],
  destination: "",
  departure: "",
  trip_duration: "",
  start_date: "",
  end_date: "",
  price: "",
  currency: "EUR",
  estimated_budget: "",
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
  const [activeTab, setActiveTab] = useState<"projects" | "requests" | "assistant" | "routes" | "creator">("requests");
  const [creatorOpenId, setCreatorOpenId] = useState<string | null>(null);
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

  const { data: tripRequests = [], isLoading: requestsLoading } = useQuery({
    queryKey: ["trip_requests"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("trip_requests" as any)
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as any[];
    },
  });

  const updateRequestStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase.from("trip_requests" as any).update({ status } as any).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["trip_requests"] }),
  });

  const deleteRequest = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("trip_requests" as any).delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["trip_requests"] });
      toast({ title: t("admin.delete") });
    },
  });

  const convertRequestToProject = (req: any) => {
    setEditingId(null);
    const adults = req.adults || req.group_size || 1;
    const childrenCount = req.children_count || 0;
    const childrenAges = req.children_ages || [];
    setForm({
      client_name: req.client_name || "",
      client_email: req.client_email || "",
      group_size: adults + childrenCount,
      adults,
      children: childrenCount,
      children_ages: childrenAges,
      destination: req.destination || "",
      departure: req.departure || "",
      trip_duration: req.trip_duration || "",
      start_date: req.start_date || "",
      end_date: req.end_date || "",
      price: "",
      currency: "EUR",
      estimated_budget: req.estimated_budget || "",
      itinerary_status: "new" as ItineraryStatus,
      payment_status: "pending" as PaymentStatus,
      notes: [
        req.notes || "",
        req.interests?.length ? `Interests: ${req.interests.join(", ")}` : "",
        req.accommodation_type ? `Accommodation: ${req.accommodation_type}` : "",
        req.travel_pace ? `Pace: ${req.travel_pace}` : "",
        req.mobility_notes ? `Mobility: ${req.mobility_notes}` : "",
        req.dietary_restrictions ? `Dietary: ${req.dietary_restrictions}` : "",
        req.must_have_experiences ? `Must-have: ${req.must_have_experiences}` : "",
        req.visited_before ? "Has visited before" : "",
        childrenCount > 0 ? `Children ages: ${childrenAges.join(", ")}` : "",
      ].filter(Boolean).join("\n"),
    });
    updateRequestStatus.mutate({ id: req.id, status: "converted" });
    setDialogOpen(true);
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");
      const payload: any = {
        client_name: form.client_name,
        client_email: form.client_email || null,
        group_size: form.adults + form.children,
        destination: form.destination || null,
        departure: form.departure || null,
        trip_duration: form.trip_duration || null,
        start_date: form.start_date || null,
        end_date: form.end_date || null,
        price: form.price ? Number(form.price) : null,
        currency: form.currency,
        estimated_budget: form.estimated_budget || null,
        itinerary_status: form.itinerary_status,
        payment_status: form.payment_status,
        notes: (() => {
          let n = (form.notes || "").replace(/\n?Children ages:.*$/m, "").trim();
          if (form.children > 0) {
            n = (n ? n + "\n" : "") + `Children ages: ${form.children_ages.join(", ")}`;
          }
          return n || null;
        })(),
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

  const getPdfUrl = async (path: string) => {
    const { data, error } = await supabase.storage.from("itineraries").createSignedUrl(path, 60 * 60);
    if (error || !data) return "";
    return data.signedUrl;
  };

  const openPdf = async (path: string) => {
    const url = await getPdfUrl(path);
    if (url) window.open(url, "_blank", "noopener,noreferrer");
  };

  const handleSendEmail = async () => {
    if (!sendProject || !sendProject.client_email || !sendProject.itinerary_pdf_path) return;
    setIsSending(true);
    try {
      const pdfUrl = await getPdfUrl(sendProject.itinerary_pdf_path);
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
      adults: p.group_size,
      children: 0,
      children_ages: [],
      destination: p.destination || "",
      departure: (p as any).departure || "",
      trip_duration: p.trip_duration || "",
      start_date: (p as any).start_date || "",
      end_date: (p as any).end_date || "",
      price: p.price?.toString() || "",
      currency: p.currency || "EUR",
      estimated_budget: (p as any).estimated_budget || "",
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

  const CURRENCY_SYMBOLS: Record<string, string> = { EUR: "€", NOK: "kr ", BRL: "R$ " };
  const formatPrice = (p: ClientProject) => {
    if (!p.price) return "—";
    const sym = CURRENCY_SYMBOLS[p.currency] || "€";
    return `${sym}${p.price.toLocaleString("en", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
  };

  const sumByCurrency = (list: ClientProject[]) => {
    const totals: Record<string, number> = {};
    list.forEach((p) => {
      if (p.price) {
        const cur = p.currency || "EUR";
        totals[cur] = (totals[cur] || 0) + p.price;
      }
    });
    return totals;
  };

  const paidProjects = projects.filter((p) => p.payment_status === "paid");
  const earningsWeekByCur = sumByCurrency(paidProjects.filter((p) => new Date(p.created_at) >= startOfWeek));
  const earningsMonthByCur = sumByCurrency(paidProjects.filter((p) => new Date(p.created_at) >= startOfMonth));
  const earningsYearByCur = sumByCurrency(paidProjects.filter((p) => new Date(p.created_at) >= startOfYear));
  const earningsTotalByCur = sumByCurrency(paidProjects);

  const formatEarnings = (totals: Record<string, number>) => {
    const entries = Object.entries(totals).sort(([a], [b]) => a.localeCompare(b));
    if (entries.length === 0) return "—";
    return entries.map(([cur, val]) => `${CURRENCY_SYMBOLS[cur] || cur}${val.toLocaleString("en", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`).join(" · ");
  };

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
            <img src={logo} alt="Fjord & Waves Travel" className="h-24 max-md:h-16 w-auto brightness-0 invert opacity-90" />
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
            <button onClick={() => setActiveTab("requests")} className={`relative px-5 py-3 text-[0.72rem] font-semibold tracking-[0.08em] uppercase border-b-2 transition-all ${activeTab === "requests" ? "border-gold text-ink" : "border-transparent text-voyage-muted hover:text-ink"}`}>
              {t("requests.tab")}
              {tripRequests.filter((r: any) => r.status === "new").length > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-destructive text-voyage-white text-[0.6rem] font-bold rounded-full flex items-center justify-center">
                  {tripRequests.filter((r: any) => r.status === "new").length}
                </span>
              )}
            </button>
            <button onClick={() => setActiveTab("projects")} className={`px-5 py-3 text-[0.72rem] font-semibold tracking-[0.08em] uppercase border-b-2 transition-all ${activeTab === "projects" ? "border-gold text-ink" : "border-transparent text-voyage-muted hover:text-ink"}`}>
              {t("admin.projects")}
            </button>
            <button onClick={() => setActiveTab("assistant")} className={`px-5 py-3 text-[0.72rem] font-semibold tracking-[0.08em] uppercase border-b-2 transition-all ${activeTab === "assistant" ? "border-gold text-ink" : "border-transparent text-voyage-muted hover:text-ink"}`}>
              {t("admin.assistant")}
            </button>
            <button onClick={() => setActiveTab("routes")} className={`px-5 py-3 text-[0.72rem] font-semibold tracking-[0.08em] uppercase border-b-2 transition-all ${activeTab === "routes" ? "border-gold text-ink" : "border-transparent text-voyage-muted hover:text-ink"}`}>
              🗺 Routes
            </button>
            <button onClick={() => setActiveTab("creator")} className={`px-5 py-3 text-[0.72rem] font-semibold tracking-[0.08em] uppercase border-b-2 transition-all ${activeTab === "creator" ? "border-gold text-ink" : "border-transparent text-voyage-muted hover:text-ink"}`}>
              ✨ Creator
            </button>
          </div>
        </div>

        <div className="p-10 max-w-[1200px] mx-auto max-md:p-6">
          {activeTab === "routes" ? (
            <CatalogManager onEdit={(id) => { setCreatorOpenId(id); setActiveTab("creator"); }} />
          ) : activeTab === "creator" ? (
            <RouteMaker initialSelectedId={creatorOpenId} />
          ) : activeTab === "assistant" ? (
            <div>
              <div className="mb-8">
                <h1 className="font-serif text-3xl font-bold mb-1">{t("admin.assistantTitle")}</h1>

                <p className="text-[0.85rem] text-voyage-muted">{t("admin.assistantDesc")}</p>
              </div>
              <AdvisorAssistant projects={projects as any} />
            </div>
          ) : activeTab === "requests" ? (
            <div>
              <div className="mb-8">
                <h1 className="font-serif text-3xl font-bold mb-1">{t("requests.title")}</h1>
                <p className="text-[0.85rem] text-voyage-muted">{t("requests.desc")}</p>
              </div>
              {requestsLoading ? (
                <p className="text-voyage-muted text-sm">{t("admin.loading")}</p>
              ) : tripRequests.length === 0 ? (
                <div className="bg-voyage-white border border-parchment-3 rounded-lg p-12 text-center">
                  <p className="text-voyage-muted text-sm">{t("requests.noRequests")}</p>
                </div>
              ) : (
                <div className="flex flex-col gap-4">
                  {tripRequests.map((req: any) => {
                    const statusColors: Record<string, string> = {
                      new: "bg-gold/10 text-gold border-gold/30",
                      reviewed: "bg-sage/10 text-sage border-sage/30",
                      converted: "bg-ink/[0.06] text-ink border-parchment-3",
                    };
                    return (
                      <div key={req.id} className="bg-voyage-white border border-parchment-3 rounded-lg p-5 hover:shadow-sm transition-shadow">
                        <div className="flex justify-between items-start mb-3 max-md:flex-col max-md:gap-2">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="font-serif text-lg font-bold text-ink">{req.client_name}</h3>
                              <Badge label={t(`requests.${req.status}`)} style={statusColors[req.status] || statusColors.new} />
                            </div>
                            <p className="text-[0.78rem] text-voyage-muted">{req.client_email} {req.phone && `· ${req.phone}`}</p>
                          </div>
                          <div className="text-[0.72rem] text-voyage-muted">
                            {t("requests.received")}: {new Date(req.created_at).toLocaleDateString()}
                          </div>
                        </div>
                        <div className="grid grid-cols-4 max-md:grid-cols-2 gap-3 mb-4 text-[0.82rem]">
                          {req.departure && <div><span className="text-voyage-muted text-[0.7rem] uppercase tracking-wider block">{t("tripForm.departure")}</span><span className="text-ink">{req.departure}</span></div>}
                          {req.destination && <div><span className="text-voyage-muted text-[0.7rem] uppercase tracking-wider block">{t("tripForm.destination")}</span><span className="text-ink">{req.destination}</span></div>}
                          <div><span className="text-voyage-muted text-[0.7rem] uppercase tracking-wider block">{t("tripForm.groupSize")}</span><span className="text-ink">{req.group_size}</span></div>
                          {req.trip_duration && <div><span className="text-voyage-muted text-[0.7rem] uppercase tracking-wider block">{t("tripForm.duration")}</span><span className="text-ink">{req.trip_duration}</span></div>}
                          {req.start_date && <div><span className="text-voyage-muted text-[0.7rem] uppercase tracking-wider block">{t("tripForm.startDate")}</span><span className="text-ink">{req.start_date}</span></div>}
                          {req.end_date && <div><span className="text-voyage-muted text-[0.7rem] uppercase tracking-wider block">{t("tripForm.endDate")}</span><span className="text-ink">{req.end_date}</span></div>}
                          {req.estimated_budget && <div><span className="text-voyage-muted text-[0.7rem] uppercase tracking-wider block">{t("tripForm.budget")}</span><span className="text-ink">{req.estimated_budget}</span></div>}
                        </div>
                        {req.notes && (
                          <div className="bg-parchment rounded-sm p-3 mb-4 text-[0.82rem] text-ink-2">
                            <span className="text-voyage-muted text-[0.7rem] uppercase tracking-wider block mb-1">{t("admin.notes")}</span>
                            {req.notes}
                          </div>
                        )}
                        <div className="flex gap-2 flex-wrap">
                          {req.status === "new" && (
                            <button onClick={() => updateRequestStatus.mutate({ id: req.id, status: "reviewed" })} className="px-3 py-1.5 rounded-sm border border-sage/30 text-[0.72rem] font-medium text-sage hover:border-sage hover:bg-sage/5 transition-all">
                              {t("requests.markReviewed")}
                            </button>
                          )}
                          {req.status !== "converted" && (
                            <button onClick={() => convertRequestToProject(req)} className="px-3 py-1.5 rounded-sm bg-gold text-ink text-[0.72rem] font-semibold tracking-[0.06em] hover:bg-gold-2 transition-colors">
                              {t("requests.createProject")}
                            </button>
                          )}
                          <button onClick={() => { if (confirm(t("requests.deleteConfirm"))) deleteRequest.mutate(req.id); }} className="px-3 py-1.5 rounded-sm border border-parchment-3 text-[0.72rem] font-medium text-voyage-muted hover:border-destructive hover:text-destructive transition-all">
                            {t("admin.delete")}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
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
                { label: t("admin.thisWeek"), val: formatEarnings(earningsWeekByCur) },
                { label: t("admin.thisMonth"), val: formatEarnings(earningsMonthByCur) },
                { label: `${now.getFullYear()}`, val: formatEarnings(earningsYearByCur) },
                { label: t("admin.allTime"), val: formatEarnings(earningsTotalByCur) },
              ].map((e) => (
                <div key={e.label} className="bg-voyage-white border border-parchment-3 rounded-lg p-5">
                  <div className="text-[0.68rem] font-semibold tracking-[0.1em] uppercase text-voyage-muted mb-1">{e.label}</div>
                  <div className="font-serif text-lg font-bold text-sage leading-snug">{e.val}</div>
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
                      <td className="px-4 py-3.5 border-b border-parchment-3 text-[0.82rem] font-semibold text-ink">{formatPrice(p)}</td>
                      <td className="px-4 py-3.5 border-b border-parchment-3"><Badge label={STATUS_LABELS[p.itinerary_status]} style={statusStyle[p.itinerary_status]} /></td>
                      <td className="px-4 py-3.5 border-b border-parchment-3"><Badge label={PAYMENT_LABELS[p.payment_status]} style={paymentStyle[p.payment_status]} /></td>
                      <td className="px-4 py-3.5 border-b border-parchment-3">
                        <div className="flex items-center gap-2">
                          {p.itinerary_pdf_path ? (
                            <>
                              <button onClick={() => openPdf(p.itinerary_pdf_path!)} className="text-[0.68rem] text-gold hover:text-gold-2 underline">{t("admin.view")}</button>
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
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
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
            <div>
              <label className="text-[0.7rem] font-medium text-voyage-muted uppercase tracking-wider mb-1 block">{t("admin.groupSize")}</label>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[0.65rem] text-voyage-muted mb-0.5 block">{t("admin.adults")}</label>
                  <input type="number" min={1} value={form.adults} onChange={(e) => setForm({ ...form, adults: Math.max(1, Number(e.target.value)) })} className={inputClass} />
                </div>
                <div>
                  <label className="text-[0.65rem] text-voyage-muted mb-0.5 block">{t("admin.childrenLabel")}</label>
                  <input type="number" min={0} value={form.children} onChange={(e) => {
                    const count = Math.max(0, Number(e.target.value));
                    const ages = [...form.children_ages];
                    while (ages.length < count) ages.push(0);
                    while (ages.length > count) ages.pop();
                    setForm({ ...form, children: count, children_ages: ages });
                  }} className={inputClass} />
                </div>
              </div>
              {form.children > 0 && (
                <div className="mt-2">
                  <label className="text-[0.65rem] text-voyage-muted mb-1 block">{t("admin.childrenAges")}</label>
                  <div className="flex flex-wrap gap-2">
                    {form.children_ages.map((age, i) => (
                      <select key={i} value={age} onChange={(e) => {
                        const ages = [...form.children_ages];
                        ages[i] = Number(e.target.value);
                        setForm({ ...form, children_ages: ages });
                      }} className={inputClass + " !w-20"}>
                        {Array.from({ length: 18 }, (_, a) => (
                          <option key={a} value={a}>{a} {t("admin.years")}</option>
                        ))}
                      </select>
                    ))}
                  </div>
                </div>
              )}
              <div className="text-[0.65rem] text-voyage-muted mt-1">
                {t("admin.totalLabel")}: {form.adults + form.children}
              </div>
            </div>
            <div>
              <label className="text-[0.7rem] font-medium text-voyage-muted uppercase tracking-wider mb-1 block">{t("admin.duration")}</label>
              <input value={form.trip_duration} onChange={(e) => setForm({ ...form, trip_duration: e.target.value })} placeholder="e.g. 7 days" className={inputClass} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[0.7rem] font-medium text-voyage-muted uppercase tracking-wider mb-1 block">{t("admin.startDate")}</label>
                <input type="date" value={form.start_date} onChange={(e) => setForm({ ...form, start_date: e.target.value })} className={inputClass} />
              </div>
              <div>
                <label className="text-[0.7rem] font-medium text-voyage-muted uppercase tracking-wider mb-1 block">{t("admin.endDate")}</label>
                <input type="date" value={form.end_date} onChange={(e) => setForm({ ...form, end_date: e.target.value })} className={inputClass} />
              </div>
            </div>
            <div>
              <label className="text-[0.7rem] font-medium text-voyage-muted uppercase tracking-wider mb-1 block">{t("admin.departureLabel")}</label>
              <input value={form.departure} onChange={(e) => setForm({ ...form, departure: e.target.value })} placeholder={t("admin.departurePlaceholder")} className={inputClass} />
            </div>
            <div>
              <label className="text-[0.7rem] font-medium text-voyage-muted uppercase tracking-wider mb-1 block">{t("admin.destinationLabel")}</label>
              <input value={form.destination} onChange={(e) => setForm({ ...form, destination: e.target.value })} className={inputClass} />
            </div>
            <div>
              <label className="text-[0.7rem] font-medium text-voyage-muted uppercase tracking-wider mb-1 block">{t("admin.estimatedBudget")}</label>
              <input value={form.estimated_budget} onChange={(e) => setForm({ ...form, estimated_budget: e.target.value })} placeholder={t("admin.estimatedBudgetPlaceholder")} className={inputClass} />
            </div>
            <div>
              <label className="text-[0.7rem] font-medium text-voyage-muted uppercase tracking-wider mb-1 block">{t("admin.priceLabel")}</label>
              {(() => {
                const CURRENCY_PRESETS: Record<string, number[]> = {
                  EUR: [225, 275, 300, 425],
                  NOK: [2600, 3150, 4000, 4900],
                  BRL: [200, 300, 500, 750],
                };
                const CURRENCY_SYM: Record<string, string> = { EUR: "€", NOK: "kr ", BRL: "R$ " };
                const presets = CURRENCY_PRESETS[form.currency] || CURRENCY_PRESETS.EUR;
                const sym = CURRENCY_SYM[form.currency] || "€";
                const labels = [
                  t("pricingData.r1group") + " / " + t("pricingData.r1dur"),
                  t("pricingData.r2group") + " / " + t("pricingData.r2dur"),
                  t("pricingData.r3group") + " / " + t("pricingData.r3dur"),
                  t("pricingData.r4group") + " / " + t("pricingData.r4dur"),
                ];
                return (
                  <div className="space-y-1.5">
                    <div className="flex gap-2 mb-1.5">
                      {["EUR", "NOK", "BRL"].map((cur) => (
                        <button
                          key={cur}
                          type="button"
                          onClick={() => setForm({ ...form, currency: cur, price: "" })}
                          className={`px-3 py-1.5 rounded-sm text-[0.68rem] font-semibold tracking-[0.06em] border transition-all ${
                            form.currency === cur
                              ? "bg-gold text-ink border-gold"
                              : "bg-parchment text-voyage-muted border-parchment-3 hover:border-gold"
                          }`}
                        >
                          {CURRENCY_SYM[cur]}{cur}
                        </button>
                      ))}
                    </div>
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
                          {sym}{p.toLocaleString()} — {labels[i]}
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
                <button onClick={() => openPdf(sendProject.itinerary_pdf_path!)} className="ml-auto text-[0.68rem] text-gold hover:text-gold-2 underline">{t("admin.preview")}</button>
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
