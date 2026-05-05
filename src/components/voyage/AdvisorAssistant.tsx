import { useState, useRef, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "react-i18next";
import ReactMarkdown from "react-markdown";
import ItineraryEditor, { type ItineraryEditorHandle } from "./ItineraryEditor";
import ImageCropper from "./ImageCropper";
import PdfPreview from "./PdfPreview";
import { parseItineraryMarkdown, extractCoverImage } from "@/lib/itineraryParser";

interface ClientProject {
  id: string;
  client_name: string;
  client_email: string | null;
  group_size: number;
  destination: string | null;
  departure: string | null;
  trip_duration: string | null;
  start_date: string | null;
  end_date: string | null;
  estimated_budget: string | null;
  price: number | null;
  notes: string | null;
  itinerary_status: string;
  payment_status: string;
}

interface Message {
  role: "user" | "assistant";
  content: string;
  fileName?: string;
}

interface AdvisorAssistantProps {
  projects: ClientProject[];
}

const PICSUM_CATEGORIES = [
  { label: "Landscape", seed: "landscape" },
  { label: "Mountain", seed: "mountain" },
  { label: "Ocean", seed: "ocean" },
  { label: "City", seed: "city" },
  { label: "Nature", seed: "nature" },
  { label: "Forest", seed: "forest" },
];

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/advisor-assistant`;
const IMAGE_GEN_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-itinerary-image`;


const AdvisorAssistant = ({ projects }: AdvisorAssistantProps) => {
  const { toast } = useToast();
  const { t, i18n } = useTranslation();
  const [selectedProjectId, setSelectedProjectId] = useState<string>("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [selectedPrompts, setSelectedPrompts] = useState<Set<number>>(new Set());
  const [customItems, setCustomItems] = useState<string[]>([]);
  const [selectedCustom, setSelectedCustom] = useState<Set<number>>(new Set());
  const [customInput, setCustomInput] = useState("");
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [itineraryContent, setItineraryContent] = useState("");
  const [attachedFile, setAttachedFile] = useState<{ name: string; content: string } | null>(null);
  const [chatMode, setChatMode] = useState<"discuss" | "edit">("discuss");
  const [autoImages, setAutoImages] = useState(true);
  const [pendingEdit, setPendingEdit] = useState<string | null>(null);
  const [previousItinerary, setPreviousItinerary] = useState<string | null>(null);
  
  const [showImagePanel, setShowImagePanel] = useState(false);
  const [aiImagePrompt, setAiImagePrompt] = useState("");
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [imageResults, setImageResults] = useState<{ url: string; credit: string }[]>([]);
  const [cropTarget, setCropTarget] = useState<{ index: number; url: string } | null>(null);
  const [showPdfPreview, setShowPdfPreview] = useState(false);
  const [cityBank, setCityBank] = useState<{ url: string; name: string }[]>([]);
  const [isLoadingBank, setIsLoadingBank] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageUploadRef = useRef<HTMLInputElement>(null);
  const editorRef = useRef<ItineraryEditorHandle>(null);

  // Draft state (per-project auto-save)
  const [currentDraftId, setCurrentDraftId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null);
  const [isLoadingDraft, setIsLoadingDraft] = useState(false);
  const autoSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const selectedProject = projects.find((p) => p.id === selectedProjectId);

  // Derive a stable folder slug from the destination (e.g. "Dubrovnik, Croatia" → "dubrovnik")
  const citySlug = (() => {
    const dest = selectedProject?.destination?.trim();
    if (!dest) return "";
    const first = dest.split(/[,\-—|/]/)[0].trim();
    return first
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 60) || "uncategorized";
  })();
  const cityLabel = selectedProject?.destination?.split(/[,\-—|/]/)[0].trim() || "";

  // --- Load draft when project changes ---
  useEffect(() => {
    if (!selectedProjectId) {
      setCurrentDraftId(null);
      setItineraryContent("");
      setMessages([]);
      setLastSavedAt(null);
      return;
    }

    const loadProjectDraft = async () => {
      setIsLoadingDraft(true);
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data, error } = await supabase
          .from("itinerary_drafts")
          .select("*")
          .eq("user_id", user.id)
          .eq("project_id", selectedProjectId)
          .order("updated_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        if (!error && data) {
          setCurrentDraftId(data.id);
          setItineraryContent(data.content || "");
          setMessages((data.chat_history as unknown as Message[]) || []);
          setLastSavedAt(data.updated_at);
        } else {
          setCurrentDraftId(null);
          setItineraryContent("");
          setMessages([]);
          setLastSavedAt(null);
        }
      } catch {
        // ignore
      } finally {
        setIsLoadingDraft(false);
      }
    };

    loadProjectDraft();
  }, [selectedProjectId]);

  // --- Save draft (manual or auto) ---
  const saveDraft = useCallback(async (content: string, chatMessages: Message[], silent = false) => {
    if (!selectedProjectId) return;
    if (!content && chatMessages.length === 0) return;
    setIsSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const title = selectedProject?.client_name
        ? `${selectedProject.client_name} — ${selectedProject.destination || ""}`
        : t("aa.untitled");

      const draftData = {
        user_id: user.id,
        project_id: selectedProjectId,
        title,
        content,
        chat_history: chatMessages as any,
      };

      if (currentDraftId) {
        const { error } = await supabase
          .from("itinerary_drafts")
          .update(draftData)
          .eq("id", currentDraftId);
        if (error) throw error;
      } else {
        const { data, error } = await supabase
          .from("itinerary_drafts")
          .insert(draftData)
          .select("id")
          .single();
        if (error) throw error;
        setCurrentDraftId(data.id);
      }
      setLastSavedAt(new Date().toISOString());
      if (!silent) toast({ title: `💾 ${t("aa.draftSaved")}` });
    } catch (err: any) {
      if (!silent) toast({ title: t("aa.draftSaveFailed"), description: err.message, variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  }, [selectedProjectId, selectedProject, currentDraftId, t, toast]);

  // --- Auto-save on content/messages change (debounced 3s) ---
  useEffect(() => {
    if (!selectedProjectId) return;
    if (!itineraryContent && messages.length === 0) return;
    if (isLoadingDraft) return;

    if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
    autoSaveTimerRef.current = setTimeout(() => {
      saveDraft(itineraryContent, messages, true);
    }, 3000);

    return () => {
      if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
    };
  }, [itineraryContent, messages, selectedProjectId, isLoadingDraft, saveDraft]);

  const QUICK_PROMPTS = [
    t("aa.qpItinerary"),
    t("aa.qpAccommodation"),
    t("aa.qpRestaurant"),
    t("aa.qpAdventure"),
    t("aa.qpTips"),
    t("aa.qpRomantic"),
    t("aa.qpFlights"),
    t("aa.qpTransfers"),
    t("aa.qpBudget"),
    t("aa.qpFamily"),
    t("aa.qpCulture"),
    t("aa.qpNightlife"),
    t("aa.qpShopping"),
    t("aa.qpWellness"),
    t("aa.qpPhotography"),
    t("aa.qpLocalFood"),
    t("aa.qpNature"),
    t("aa.qpBeach"),
    t("aa.qpWinter"),
    t("aa.qpPacking"),
    t("aa.qpVisa"),
    t("aa.qpInsurance"),
    t("aa.qpCruise"),
    t("aa.qpWine"),
  ];

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // --- City image bank: list previously uploaded images for this destination ---
  const loadCityBank = useCallback(async () => {
    if (!citySlug) { setCityBank([]); return; }
    setIsLoadingBank(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setCityBank([]); return; }
      const prefix = `${user.id}/${citySlug}`;
      const { data, error } = await supabase.storage
        .from("itinerary-images")
        .list(prefix, { limit: 100, sortBy: { column: "created_at", order: "desc" } });
      if (error) throw error;
      const items = (data || [])
        .filter((f) => f.name && !f.name.startsWith("."))
        .map((f) => {
          const path = `${prefix}/${f.name}`;
          const { data: pub } = supabase.storage.from("itinerary-images").getPublicUrl(path);
          return { url: pub.publicUrl, name: f.name };
        });
      setCityBank(items);
    } catch (err) {
      console.error("loadCityBank error:", err);
      setCityBank([]);
    } finally {
      setIsLoadingBank(false);
    }
  }, [citySlug]);

  useEffect(() => {
    if (showImagePanel) loadCityBank();
  }, [showImagePanel, loadCityBank]);

  // --- Image functions ---
  // Helper: upload base64 image to storage and return public URL
  const uploadBase64Image = async (dataUrl: string): Promise<string> => {
    const res = await fetch(dataUrl);
    const blob = await res.blob();
    const ext = blob.type.includes("png") ? "png" : "jpg";
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");
    const folder = citySlug || "uncategorized";
    const fileName = `${user.id}/${folder}/ai-${Date.now()}.${ext}`;
    const { error } = await supabase.storage
      .from("itinerary-images")
      .upload(fileName, blob, { contentType: blob.type });
    if (error) throw error;
    const { data } = supabase.storage.from("itinerary-images").getPublicUrl(fileName);
    return data.publicUrl;
  };

  const handleAiImageGenerate = async () => {
    if (!aiImagePrompt.trim() || isGeneratingImage) return;
    setIsGeneratingImage(true);
    try {
      const resp = await fetch(IMAGE_GEN_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ prompt: aiImagePrompt }),
      });
      const data = await resp.json();
      if (data.fallback || data.error) {
        toast({ title: data.error || t("aa.genFailed"), variant: "destructive" });
        return;
      }
      // If base64 data URL, upload to storage for a proper URL
      let finalUrl = data.imageUrl;
      if (finalUrl && finalUrl.startsWith("data:")) {
        try {
          finalUrl = await uploadBase64Image(finalUrl);
        } catch (uploadErr: any) {
          console.error("Failed to upload AI image:", uploadErr);
          // Still use the data URL as fallback
        }
      }
      setImageResults((prev) => [
        { url: finalUrl, credit: "AI Generated — Fjord & Waves Travel" },
        ...prev,
      ]);
      toast({ title: `✨ ${t("aa.aiImageGenerated")}` });
    } catch (err: any) {
      toast({ title: t("aa.genFailed"), description: err.message, variant: "destructive" });
    } finally {
      setIsGeneratingImage(false);
    }
  };

  const handlePicsumImage = (seed: string) => {
    const w = 800;
    const h = 500;
    const url = `https://picsum.photos/seed/${seed}-${Date.now()}/${w}/${h}`;
    setImageResults((prev) => [
      { url, credit: "Lorem Picsum (picsum.photos) — Free license" },
      ...prev,
    ]);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast({ title: t("aa.selectImage"), variant: "destructive" });
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast({ title: t("aa.imageTooLarge"), variant: "destructive" });
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");
      const folder = citySlug || "uncategorized";
      const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "-");
      const fileName = `${user.id}/${folder}/${Date.now()}-${safeName}`;
      const { error } = await supabase.storage
        .from("itinerary-images")
        .upload(fileName, file, { contentType: file.type });
      if (error) throw error;

      const { data } = supabase.storage
        .from("itinerary-images")
        .getPublicUrl(fileName);

      setImageResults((prev) => [
        { url: data.publicUrl, credit: `Uploaded by advisor${cityLabel ? ` · ${cityLabel}` : ""}` },
        ...prev,
      ]);
      // refresh bank
      loadCityBank();
      toast({ title: `📷 ${file.name} ${t("aa.uploaded")}${cityLabel ? ` → ${cityLabel}` : ""}` });
    } catch (err: any) {
      toast({ title: t("aa.uploadFailed"), description: err.message, variant: "destructive" });
    }
    if (imageUploadRef.current) imageUploadRef.current.value = "";
  };

  const handleCropComplete = async (croppedDataUrl: string) => {
    if (!cropTarget) return;
    try {
      const publicUrl = await uploadBase64Image(croppedDataUrl);
      setImageResults((prev) =>
        prev.map((img, i) =>
          i === cropTarget.index ? { ...img, url: publicUrl } : img
        )
      );
      toast({ title: `✂️ ${t("aa.cropApplied", "Crop applied")}` });
    } catch (err: any) {
      toast({ title: t("aa.uploadFailed"), description: err.message, variant: "destructive" });
    }
    setCropTarget(null);
  };

  // --- Chat functions ---
  const streamChat = useCallback(
    async (userMessages: Message[], opts?: { mode?: "discuss" | "edit" | "create"; currentItinerary?: string }) => {
      const projectContext = selectedProject
        ? {
            clientName: selectedProject.client_name,
            clientEmail: selectedProject.client_email,
            destination: selectedProject.destination,
            departure: selectedProject.departure,
            groupSize: selectedProject.group_size,
            tripDuration: selectedProject.trip_duration,
            startDate: selectedProject.start_date,
            endDate: selectedProject.end_date,
            estimatedBudget: selectedProject.estimated_budget,
            price: selectedProject.price,
            notes: selectedProject.notes,
          }
        : undefined;

      const langMap: Record<string, string> = {
        en: "English",
        pt: "Brazilian Portuguese",
        no: "Norwegian",
      };

      const resp = await fetch(CHAT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          messages: userMessages,
          projectContext,
          language: langMap[i18n.language] || "English",
          mode: opts?.mode,
          currentItinerary: opts?.currentItinerary,
          autoImages,
        }),
      });

      if (!resp.ok) {
        const err = await resp.json().catch(() => ({ error: "Request failed" }));
        throw new Error(err.error || `Error ${resp.status}`);
      }
      if (!resp.body) throw new Error("No response stream");

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let assistantContent = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        let newlineIdx: number;
        while ((newlineIdx = buffer.indexOf("\n")) !== -1) {
          let line = buffer.slice(0, newlineIdx);
          buffer = buffer.slice(newlineIdx + 1);
          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (!line.startsWith("data: ")) continue;
          const jsonStr = line.slice(6).trim();
          if (jsonStr === "[DONE]") break;
          try {
            const parsed = JSON.parse(jsonStr);
            const delta = parsed.choices?.[0]?.delta?.content;
            if (delta) {
              assistantContent += delta;
              setMessages((prev) => {
                const last = prev[prev.length - 1];
                if (last?.role === "assistant") {
                  return prev.map((m, i) =>
                    i === prev.length - 1 ? { ...m, content: assistantContent } : m
                  );
                }
                return [...prev, { role: "assistant", content: assistantContent }];
              });
            }
          } catch {
            buffer = line + "\n" + buffer;
            break;
          }
        }
      }
      return assistantContent;
    },
    [selectedProject, i18n.language, autoImages]
  );

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      toast({ title: t("aa.fileTooLarge"), description: t("aa.fileTooLargeDesc"), variant: "destructive" });
      return;
    }

    try {
      if (file.type === "application/pdf") {
        const formData = new FormData();
        formData.append("file", file);
        const resp = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/parse-form-upload`,
          {
            method: "POST",
            headers: { Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}` },
            body: formData,
          }
        );
        if (!resp.ok) throw new Error("Failed to parse PDF");
        const { text } = await resp.json();
        setAttachedFile({ name: file.name, content: text });
      } else {
        const text = await file.text();
        setAttachedFile({ name: file.name, content: text });
      }
      toast({ title: `📎 ${file.name} ${t("aa.attached")}`, description: t("aa.attachedDesc") });
    } catch (err: any) {
      toast({ title: t("aa.uploadFailed"), description: err.message, variant: "destructive" });
    }
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSend = async (text?: string) => {
    const msg = text || input.trim();
    if ((!msg && !attachedFile) || isLoading) return;

    let userContent = msg;
    let fileName: string | undefined;

    if (attachedFile) {
      const fileBlock = `\n\n---\n📎 Uploaded form: **${attachedFile.name}**\n\`\`\`\n${attachedFile.content.slice(0, 8000)}\n\`\`\``;
      userContent = (msg || "Here is the client's inquiry form. Please use this information to help create the itinerary.") + fileBlock;
      fileName = attachedFile.name;
      setAttachedFile(null);
    }

    if (!userContent) return;

    const userMsg: Message = { role: "user", content: userContent, fileName };
    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setInput("");
    setIsLoading(true);

    try {
      // Decide mode: explicit "create" if no itinerary yet; otherwise honor chatMode toggle
      const effectiveMode: "discuss" | "edit" | "create" = !itineraryContent
        ? "create"
        : chatMode;
      const content = await streamChat(updatedMessages, {
        mode: effectiveMode,
        currentItinerary: itineraryContent || undefined,
      });
      if (!content) return;

      if (effectiveMode === "create") {
        setItineraryContent(content);
      } else if (effectiveMode === "edit") {
        // Stage as pending edit — admin must Accept
        setPendingEdit(content);
      }
      // discuss mode: do nothing to itineraryContent (chat-only)
    } catch (err: any) {
      toast({ title: "AI Error", description: err.message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  // Re-inject any image markdown the AI dropped during an edit, so images
  // (especially advisor-uploaded Supabase URLs) never disappear silently.
  const mergePreserveImages = (original: string, edited: string): string => {
    const imgRegex = /!\[[^\]]*\]\(([^)]+)\)/g;
    const editedUrls = new Set<string>();
    let m: RegExpExecArray | null;
    while ((m = imgRegex.exec(edited)) !== null) editedUrls.add(m[1]);

    const missing: string[] = [];
    imgRegex.lastIndex = 0;
    while ((m = imgRegex.exec(original)) !== null) {
      if (!editedUrls.has(m[1])) missing.push(m[0]);
    }
    if (missing.length === 0) return edited;
    return edited + `\n\n<!-- Restored images preserved from previous version -->\n\n` + missing.join("\n\n");
  };

  const acceptPendingEdit = () => {
    if (!pendingEdit) return;
    setPreviousItinerary(itineraryContent);
    const merged = mergePreserveImages(itineraryContent, pendingEdit);
    const restoredCount = (merged.match(/!\[/g)?.length || 0) - (pendingEdit.match(/!\[/g)?.length || 0);
    updateContent(merged);
    setPendingEdit(null);
    toast({
      title: "✓ Edits applied",
      description: restoredCount > 0 ? `${restoredCount} image${restoredCount > 1 ? "s" : ""} preserved.` : undefined,
    });
  };
  const rejectPendingEdit = () => {
    setPendingEdit(null);
    toast({ title: "Edits discarded — your itinerary is unchanged" });
  };
  const revertEdits = () => {
    if (previousItinerary === null) return;
    updateContent(previousItinerary);
    setPreviousItinerary(null);
    toast({ title: "↩ Reverted to previous version" });
  };

  const handleExportPdf = () => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      toast({ title: t("aa.popupBlocked"), variant: "destructive" });
      return;
    }
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>${t("aa.itinerary")} — ${selectedProject?.client_name || "Client"}</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700&family=Inter:wght@400;500;600&display=swap');
          body { font-family: 'Inter', sans-serif; color: #1a1a2e; max-width: 800px; margin: 0 auto; padding: 40px; line-height: 1.7; }
          h1, h2, h3 { font-family: 'Playfair Display', serif; color: #1a1a2e; }
          h1 { font-size: 28px; border-bottom: 2px solid #c9a96e; padding-bottom: 12px; margin-bottom: 24px; }
          h2 { font-size: 20px; color: #c9a96e; margin-top: 32px; }
          h3 { font-size: 16px; }
          p { margin: 8px 0; font-size: 14px; }
          ul, ol { margin: 8px 0; padding-left: 24px; font-size: 14px; }
          li { margin: 4px 0; }
          strong { color: #1a1a2e; }
          hr { border: none; border-top: 1px solid #e8e0d0; margin: 24px 0; }
          img { max-width: 100%; border-radius: 8px; margin: 16px 0; }
          em { font-size: 11px; color: #999; }
          .header { text-align: center; margin-bottom: 40px; }
          .header .brand { font-family: 'Playfair Display', serif; font-size: 14px; letter-spacing: 0.15em; text-transform: uppercase; color: #c9a96e; }
          .footer { text-align: center; margin-top: 48px; font-size: 11px; color: #999; border-top: 1px solid #e8e0d0; padding-top: 16px; }
          @media print { body { padding: 20px; } }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="brand">Fjord & Waves Travel</div>
          <h1>${selectedProject?.destination ? `${selectedProject.destination} ${t("aa.itinerary")}` : t("aa.itinerary")}</h1>
          <p style="font-size:13px;color:#777;">${t("aa.preparedFor")} <strong>${selectedProject?.client_name || ""}</strong>${selectedProject?.trip_duration ? ` · ${selectedProject.trip_duration}` : ""}${selectedProject?.group_size && selectedProject.group_size > 1 ? ` · ${selectedProject.group_size} ${t("aa.travellers")}` : ""}</p>
        </div>
        <div id="content"></div>
        <div class="footer">© ${new Date().getFullYear()} Fjord & Waves Travel · Org.nr: 928804860</div>
        <script src="https://cdn.jsdelivr.net/npm/marked/marked.min.js"><\/script>
        <script>
          document.getElementById('content').innerHTML = marked.parse(${JSON.stringify(itineraryContent)});
          setTimeout(() => window.print(), 500);
        <\/script>
      </body>
      </html>
    `);
    printWindow.document.close();
  };

  // --- Share link (customer mobile app) ---
  const [isSharing, setIsSharing] = useState(false);

  const handleShareLink = async () => {
    if (!itineraryContent.trim()) return;
    setIsSharing(true);
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) {
        toast({ title: t("aa.shareNotLoggedIn", "Please log in to share"), variant: "destructive" });
        return;
      }

      const days = parseItineraryMarkdown(itineraryContent);
      const cover = extractCoverImage(itineraryContent);
      const clientName = selectedProject?.client_name || t("aa.untitled", "Untitled Draft");

      let row: { share_token: string } | null = null;
      if (selectedProjectId) {
        const { data: existing } = await supabase
          .from("shared_itineraries")
          .select("id, share_token")
          .eq("project_id", selectedProjectId)
          .eq("user_id", userData.user.id)
          .maybeSingle();
        if (existing) {
          await supabase
            .from("shared_itineraries")
            .update({
              client_name: clientName,
              destination: selectedProject?.destination ?? null,
              trip_duration: selectedProject?.trip_duration ?? null,
              start_date: selectedProject?.start_date ?? null,
              end_date: selectedProject?.end_date ?? null,
              group_size: selectedProject?.group_size ?? 1,
              language: i18n.language,
              cover_image_url: cover ?? null,
              markdown_content: itineraryContent,
              days: days as any,
              is_published: true,
            })
            .eq("id", existing.id);
          row = { share_token: existing.share_token };
        }
      }

      if (!row) {
        const { data: inserted, error: insErr } = await supabase
          .from("shared_itineraries")
          .insert({
            user_id: userData.user.id,
            project_id: selectedProjectId || null,
            draft_id: currentDraftId,
            client_name: clientName,
            destination: selectedProject?.destination ?? null,
            trip_duration: selectedProject?.trip_duration ?? null,
            start_date: selectedProject?.start_date ?? null,
            end_date: selectedProject?.end_date ?? null,
            group_size: selectedProject?.group_size ?? 1,
            language: i18n.language,
            cover_image_url: cover ?? null,
            markdown_content: itineraryContent,
            days: days as any,
          })
          .select("share_token")
          .single();
        if (insErr) throw insErr;
        row = inserted;
      }

      const url = `${window.location.origin}/trip/${row.share_token}`;
      try {
        await navigator.clipboard.writeText(url);
        toast({ title: t("aa.shareCopied", "Link copied!"), description: url });
      } catch {
        toast({ title: t("aa.shareReady", "Share link ready"), description: url });
      }
    } catch (err) {
      console.error("Share error:", err);
      toast({ title: t("aa.shareFailed", "Could not create share link"), variant: "destructive" });
    } finally {
      setIsSharing(false);
    }
  };

  // --- Drag-and-drop image reorder ---
  const [dragIdx, setDragIdx] = useState<number | null>(null);

  // --- Undo/Redo ---
  const [undoStack, setUndoStack] = useState<string[]>([]);
  const [redoStack, setRedoStack] = useState<string[]>([]);

  const pushUndo = useCallback((prev: string) => {
    setUndoStack((s) => [...s.slice(-49), prev]);
    setRedoStack([]);
  }, []);

  const updateContent = useCallback((updater: string | ((prev: string) => string)) => {
    setItineraryContent((prev) => {
      const next = typeof updater === "function" ? updater(prev) : updater;
      if (next !== prev) {
        pushUndo(prev);
      }
      return next;
    });
  }, [pushUndo]);

  const handleUndo = useCallback(() => {
    setUndoStack((stack) => {
      if (stack.length === 0) return stack;
      const prev = stack[stack.length - 1];
      setRedoStack((r) => [...r, itineraryContent]);
      setItineraryContent(prev);
      return stack.slice(0, -1);
    });
  }, [itineraryContent]);

  const handleRedo = useCallback(() => {
    setRedoStack((stack) => {
      if (stack.length === 0) return stack;
      const next = stack[stack.length - 1];
      setUndoStack((u) => [...u, itineraryContent]);
      setItineraryContent(next);
      return stack.slice(0, -1);
    });
  }, [itineraryContent]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "z" && !e.shiftKey) {
        e.preventDefault();
        handleUndo();
      }
      if ((e.ctrlKey || e.metaKey) && (e.key === "y" || (e.key === "z" && e.shiftKey))) {
        e.preventDefault();
        handleRedo();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [handleUndo, handleRedo]);

  

  const insertImageAtCursor = useCallback((url: string, alt: string, credit?: string) => {
    if (editorRef.current) {
      editorRef.current.insertImage(url, alt || "Travel photo");
    } else {
      const md = credit
        ? `\n\n![${alt}](${url})\n*Photo: ${credit}*\n`
        : `\n\n![${alt}](${url})\n`;
      updateContent((prev) => prev + md);
    }
    toast({ title: t("aa.imageInserted") });
  }, [updateContent, toast, t]);

  const extractImages = (md: string) => {
    const regex = /!\[([^\]]*)\]\(([^)]+)\)(\n\*Photo:[^*]*\*)?/g;
    const imgs: { full: string; alt: string; url: string; credit: string }[] = [];
    let m: RegExpExecArray | null;
    while ((m = regex.exec(md)) !== null) {
      imgs.push({ full: m[0], alt: m[1], url: m[2], credit: (m[3] || "").trim() });
    }
    return imgs;
  };

  const reorderImages = (fromIdx: number, toIdx: number) => {
    const imgs = extractImages(itineraryContent);
    if (fromIdx === toIdx || !imgs[fromIdx] || !imgs[toIdx]) return;

    let stripped = itineraryContent;
    const placeholders = imgs.map((img, i) => {
      const placeholder = `__IMG_PLACEHOLDER_${i}__`;
      stripped = stripped.replace(img.full, placeholder);
      return placeholder;
    });

    const reordered = [...imgs];
    const [moved] = reordered.splice(fromIdx, 1);
    reordered.splice(toIdx, 0, moved);

    placeholders.forEach((ph, i) => {
      stripped = stripped.replace(ph, reordered[i].full);
    });

    updateContent(stripped);
    toast({ title: t("aa.imageReordered") });
  };

  const inputClass = "w-full px-3 py-2.5 rounded-sm bg-parchment border border-parchment-3 text-ink text-[0.85rem] focus:outline-none focus:border-gold transition-colors";

  return (
    <div className="flex flex-col gap-6">
      {/* Project Selector */}
      <div className="bg-voyage-white border border-parchment-3 rounded-lg p-5">
        <label className="text-[0.7rem] font-semibold text-voyage-muted uppercase tracking-[0.12em] mb-2 block">
          {t("aa.linkProject")}
        </label>
        <select
          value={selectedProjectId}
          onChange={(e) => setSelectedProjectId(e.target.value)}
          className={inputClass}
        >
          <option value="">{t("aa.selectProject")}</option>
          {projects.map((p) => (
            <option key={p.id} value={p.id}>
              {p.client_name} {p.destination ? `— ${p.destination}` : ""} {p.trip_duration ? `(${p.trip_duration})` : ""}
            </option>
          ))}
        </select>

        {selectedProject && (
          <div className="mt-3 flex flex-wrap gap-3 text-[0.75rem]">
            <span className="px-2.5 py-1 bg-gold/10 text-gold border border-gold/20 rounded-full">
              👤 {selectedProject.client_name}
            </span>
            {selectedProject.client_email && (
              <span className="px-2.5 py-1 bg-ink/[0.06] text-ink border border-parchment-3 rounded-full">
                ✉ {selectedProject.client_email}
              </span>
            )}
            {selectedProject.departure && (
              <span className="px-2.5 py-1 bg-ink/[0.06] text-ink border border-parchment-3 rounded-full">
                🛫 {selectedProject.departure}
              </span>
            )}
            {selectedProject.destination && (
              <span className="px-2.5 py-1 bg-sage/10 text-sage border border-sage/20 rounded-full">
                📍 {selectedProject.destination}
              </span>
            )}
            <span className="px-2.5 py-1 bg-ink/[0.06] text-ink border border-parchment-3 rounded-full">
              👥 {selectedProject.group_size} {selectedProject.group_size > 1 ? t("aa.travellers") : "traveller"}
            </span>
            {selectedProject.trip_duration && (
              <span className="px-2.5 py-1 bg-ink/[0.06] text-ink border border-parchment-3 rounded-full">
                ⏱ {selectedProject.trip_duration}
              </span>
            )}
            {selectedProject.start_date && (
              <span className="px-2.5 py-1 bg-ink/[0.06] text-ink border border-parchment-3 rounded-full">
                📅 {selectedProject.start_date}{selectedProject.end_date ? ` → ${selectedProject.end_date}` : ""}
              </span>
            )}
            {selectedProject.estimated_budget && (
              <span className="px-2.5 py-1 bg-gold/10 text-gold border border-gold/20 rounded-full">
                💰 {selectedProject.estimated_budget}
              </span>
            )}
            {selectedProject.notes && (
              <span className="px-2.5 py-1 bg-ink/[0.06] text-ink border border-parchment-3 rounded-full max-w-xs truncate">
                📝 {selectedProject.notes}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Auto-save status indicator */}
      {selectedProjectId && (
        <div className="flex items-center gap-2 px-4 py-2 bg-parchment/50 border border-parchment-3 rounded-lg text-[0.72rem]">
          {isLoadingDraft ? (
            <span className="text-voyage-muted animate-pulse">⏳ {t("aa.loadingDraft")}</span>
          ) : lastSavedAt ? (
            <span className="text-sage">
              ✓ {t("aa.autoSaved")} · {new Date(lastSavedAt).toLocaleString()}
            </span>
          ) : (
            <span className="text-voyage-muted">{t("aa.newItinerary")}</span>
          )}
          {isSaving && <span className="text-gold animate-pulse ml-2">💾 {t("aa.savingDraft")}</span>}
        </div>
      )}

      {/* Main Layout: Chat + Preview */}
      <div className="grid grid-cols-1 gap-6">
        {/* Chat Panel */}
        <div className="bg-voyage-white border border-parchment-3 rounded-lg flex flex-col" style={{ minHeight: 500 }}>
          <div className="px-4 py-3 border-b border-parchment-3 flex justify-between items-center gap-3 flex-wrap">
            <div className="flex items-center gap-3">
              <h3 className="font-serif text-sm font-bold text-ink">{t("aa.chatTitle")}</h3>
              {itineraryContent && (
                <div className="inline-flex rounded-full border border-parchment-3 bg-parchment p-0.5 text-[0.68rem]">
                  <button
                    onClick={() => setChatMode("discuss")}
                    className={`px-3 py-1 rounded-full transition-all ${chatMode === "discuss" ? "bg-ink text-voyage-white shadow-sm" : "text-voyage-muted hover:text-ink"}`}
                    title="Chat without changing the itinerary"
                  >
                    💬 Discuss
                  </button>
                  <button
                    onClick={() => setChatMode("edit")}
                    className={`px-3 py-1 rounded-full transition-all ${chatMode === "edit" ? "bg-gold text-ink shadow-sm font-semibold" : "text-voyage-muted hover:text-ink"}`}
                    title="Apply your next message as edits to the itinerary"
                  >
                    ✏️ Apply edits
                  </button>
                </div>
              )}
              <label className="inline-flex items-center gap-1.5 text-[0.7rem] text-voyage-muted cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={autoImages}
                  onChange={(e) => setAutoImages(e.target.checked)}
                  className="accent-gold"
                />
                🖼 Auto-illustrate
              </label>
            </div>
            {messages.length > 0 && (
              <button
                onClick={() => { setMessages([]); setItineraryContent(""); setPendingEdit(null); }}
                className="text-[0.68rem] text-voyage-muted hover:text-destructive transition-colors"
              >
                {t("aa.clearChat")}
              </button>
            )}
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 max-h-[400px]">
            {messages.length === 0 && (
              <div className="py-4">
                <p className="text-voyage-muted text-[0.85rem] mb-4 text-center">
                  {selectedProject
                    ? t("aa.readyFor", { name: selectedProject.client_name })
                    : t("aa.selectOrChat")}
                </p>

                {/* Scrollable checklist */}
                <div className="max-h-[260px] overflow-y-auto border border-parchment-3 rounded-lg p-3 bg-parchment/30 space-y-1.5">
                  {QUICK_PROMPTS.map((p, idx) => (
                    <label
                      key={idx}
                      className={`flex items-center gap-2.5 px-3 py-2 rounded-md cursor-pointer transition-all text-[0.78rem] ${
                        selectedPrompts.has(idx)
                          ? "bg-gold/15 text-ink font-medium"
                          : "hover:bg-parchment text-voyage-muted"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={selectedPrompts.has(idx)}
                        onChange={() => {
                          setSelectedPrompts((prev) => {
                            const next = new Set(prev);
                            next.has(idx) ? next.delete(idx) : next.add(idx);
                            return next;
                          });
                        }}
                        className="accent-gold w-4 h-4 rounded"
                      />
                      {p}
                    </label>
                  ))}

                  {/* Custom items */}
                  {customItems.map((item, idx) => (
                    <label
                      key={`custom-${idx}`}
                      className={`flex items-center gap-2.5 px-3 py-2 rounded-md cursor-pointer transition-all text-[0.78rem] ${
                        selectedCustom.has(idx)
                          ? "bg-sage/15 text-ink font-medium"
                          : "hover:bg-parchment text-voyage-muted"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={selectedCustom.has(idx)}
                        onChange={() => {
                          setSelectedCustom((prev) => {
                            const next = new Set(prev);
                            next.has(idx) ? next.delete(idx) : next.add(idx);
                            return next;
                          });
                        }}
                        className="accent-sage w-4 h-4 rounded"
                      />
                      <span className="flex-1">{item}</span>
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          setCustomItems((prev) => prev.filter((_, i) => i !== idx));
                          setSelectedCustom((prev) => {
                            const next = new Set<number>();
                            prev.forEach((v) => { if (v < idx) next.add(v); else if (v > idx) next.add(v - 1); });
                            return next;
                          });
                        }}
                        className="text-destructive/50 hover:text-destructive text-xs ml-1"
                      >✕</button>
                    </label>
                  ))}
                </div>

                {/* Add custom item */}
                <div className="flex gap-2 mt-3">
                  <input
                    value={customInput}
                    onChange={(e) => setCustomInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && customInput.trim()) {
                        e.preventDefault();
                        setCustomItems((prev) => [...prev, customInput.trim()]);
                        setSelectedCustom((prev) => new Set([...prev, customItems.length]));
                        setCustomInput("");
                      }
                    }}
                    placeholder={t("aa.customItemPlaceholder")}
                    className="flex-1 px-3 py-2 rounded-sm bg-parchment border border-parchment-3 text-ink text-[0.8rem] focus:outline-none focus:border-gold transition-colors"
                  />
                  <button
                    onClick={() => {
                      if (!customInput.trim()) return;
                      setCustomItems((prev) => [...prev, customInput.trim()]);
                      setSelectedCustom((prev) => new Set([...prev, customItems.length]));
                      setCustomInput("");
                    }}
                    className="px-4 py-2 rounded-sm bg-ink/10 text-ink text-[0.72rem] font-semibold tracking-[0.06em] uppercase hover:bg-ink/20 transition-colors"
                  >
                    {t("aa.addBtn")}
                  </button>
                </div>

                {/* Actions */}
                {(selectedPrompts.size > 0 || selectedCustom.size > 0) && (
                  <div className="flex gap-2 mt-3 justify-center">
                    <button
                      onClick={() => {
                        const parts = [
                          ...Array.from(selectedPrompts).sort().map((i) => QUICK_PROMPTS[i]),
                          ...Array.from(selectedCustom).sort().map((i) => customItems[i]),
                        ];
                        const combined = parts.join(". ");
                        setSelectedPrompts(new Set());
                        setSelectedCustom(new Set());
                        handleSend(combined);
                      }}
                      className="px-5 py-2.5 rounded-sm bg-gold text-ink text-[0.72rem] font-semibold tracking-[0.08em] uppercase hover:bg-gold-2 transition-colors"
                    >
                      {t("aa.buildItinerary")} ({selectedPrompts.size + selectedCustom.size})
                    </button>
                    <button
                      onClick={() => { setSelectedPrompts(new Set()); setSelectedCustom(new Set()); }}
                      className="px-4 py-2.5 rounded-sm border border-parchment-3 text-voyage-muted text-[0.72rem] font-medium tracking-[0.06em] uppercase hover:border-ink hover:text-ink transition-colors"
                    >
                      {t("aa.clearSelection")}
                    </button>
                  </div>
                )}
              </div>
            )}

            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[85%] rounded-lg px-4 py-3 text-[0.82rem] leading-relaxed ${
                    msg.role === "user"
                      ? "bg-ink text-voyage-white"
                      : "bg-parchment text-ink border border-parchment-3"
                  }`}
                >
                  {msg.role === "assistant" ? (
                    <div className="prose prose-sm max-w-none prose-headings:font-serif prose-headings:text-ink prose-p:text-ink-2 prose-strong:text-ink prose-li:text-ink-2">
                      <ReactMarkdown>{msg.content}</ReactMarkdown>
                    </div>
                  ) : (
                    <div>
                      {msg.fileName && (
                        <span className="inline-block mb-1.5 px-2 py-0.5 bg-voyage-white/20 rounded text-[0.68rem]">📎 {msg.fileName}</span>
                      )}
                      <p className="whitespace-pre-wrap">{msg.content.replace(/\n\n---\n📎 Uploaded form:[\s\S]*$/, "").trim() || `Uploaded ${msg.fileName}`}</p>
                    </div>
                  )}
                </div>
              </div>
            ))}

            {isLoading && messages[messages.length - 1]?.role !== "assistant" && (
              <div className="flex justify-start">
                <div className="bg-parchment border border-parchment-3 rounded-lg px-4 py-3 text-[0.82rem] text-voyage-muted">
                  <span className="animate-pulse">{t("aa.thinking")}</span>
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Quick prompts */}
          {messages.length > 0 && !isLoading && (
            <div className="px-4 pb-2">
              <div className="flex flex-wrap gap-1.5">
                {QUICK_PROMPTS.map((p, idx) => (
                  <button
                    key={p}
                    onClick={() => {
                      setSelectedPrompts((prev) => {
                        const next = new Set(prev);
                        next.has(idx) ? next.delete(idx) : next.add(idx);
                        return next;
                      });
                    }}
                    className={`px-2.5 py-1 rounded-full border text-[0.65rem] transition-all ${
                      selectedPrompts.has(idx)
                        ? "bg-gold/20 text-gold border-gold font-semibold"
                        : "border-parchment-3 text-voyage-muted hover:border-gold hover:text-gold"
                    }`}
                  >
                    {selectedPrompts.has(idx) ? "✓ " : ""}{p}
                  </button>
                ))}
              </div>
              {selectedPrompts.size > 0 && (
                <button
                  onClick={() => {
                    const combined = Array.from(selectedPrompts).sort().map((i) => QUICK_PROMPTS[i]).join(". ");
                    setSelectedPrompts(new Set());
                    handleSend(combined);
                  }}
                  className="mt-1.5 px-4 py-1.5 rounded-sm bg-gold text-ink text-[0.68rem] font-semibold tracking-[0.08em] uppercase hover:bg-gold-2 transition-colors"
                >
                  {t("aa.sendSelected")} ({selectedPrompts.size})
                </button>
              )}
            </div>
          )}

          {/* Input */}
          <div className="p-3 border-t border-parchment-3">
            {attachedFile && (
              <div className="mb-2 flex items-center gap-2 px-2 py-1.5 bg-gold/10 border border-gold/20 rounded-sm text-[0.72rem] text-gold">
                <span>📎 {attachedFile.name}</span>
                <button onClick={() => setAttachedFile(null)} className="ml-auto text-destructive hover:text-destructive/80 text-xs">✕</button>
              </div>
            )}
            <div className="flex gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.txt,.csv,.doc,.docx,.rtf,.md"
                className="hidden"
                onChange={handleFileUpload}
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={isLoading}
                title={t("aa.uploadForm")}
                className="px-3 py-2 rounded-sm border border-parchment-3 text-voyage-muted hover:border-gold hover:text-gold transition-colors disabled:opacity-40 self-end text-lg"
              >
                📎
              </button>
              <textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                placeholder={selectedProject ? t("aa.placeholder", { name: selectedProject.client_name }) : t("aa.placeholderGeneric")}
                rows={2}
                className="flex-1 px-3 py-2 rounded-sm bg-parchment border border-parchment-3 text-ink text-[0.82rem] focus:outline-none focus:border-gold transition-colors resize-none"
              />
              <button
                onClick={() => handleSend()}
                disabled={isLoading || (!input.trim() && !attachedFile)}
                className="px-4 py-2 rounded-sm bg-gold text-ink text-[0.72rem] font-semibold tracking-[0.08em] uppercase hover:bg-gold-2 transition-colors disabled:opacity-40 self-end"
              >
                {t("aa.sendBtn")}
              </button>
            </div>
          </div>
        </div>

        {/* Itinerary Preview Panel */}
        <div className="bg-voyage-white border border-parchment-3 rounded-lg flex flex-col" style={{ minHeight: 500 }}>
          <div className="px-4 py-3 border-b border-parchment-3 flex justify-between items-center">
            <h3 className="font-serif text-sm font-bold text-ink">{t("aa.previewTitle")}</h3>
            <div className="flex items-center gap-2 flex-wrap">
              {previousItinerary !== null && !pendingEdit && (
                <button
                  onClick={revertEdits}
                  className="px-3 py-1.5 rounded-sm border border-parchment-3 text-[0.68rem] text-voyage-muted font-semibold tracking-[0.08em] uppercase hover:border-ink hover:text-ink transition-colors"
                  title="Revert the last AI edit"
                >
                  ↩ Revert
                </button>
              )}
              {itineraryContent && (
                <>
                  <button
                    onClick={() => saveDraft(itineraryContent, messages)}
                    disabled={isSaving || !selectedProjectId}
                    className="px-3 py-1.5 rounded-sm bg-sage text-voyage-white text-[0.68rem] font-semibold tracking-[0.08em] uppercase hover:bg-sage/80 transition-colors disabled:opacity-40"
                    title={!selectedProjectId ? t("aa.selectProjectToSave") : ""}
                  >
                    💾 {isSaving ? t("aa.savingDraft") : t("aa.saveDraft")}
                  </button>
                  <button
                    onClick={() => setShowImagePanel(!showImagePanel)}
                    className={`px-3 py-1.5 rounded-sm text-[0.68rem] font-semibold tracking-[0.08em] uppercase transition-colors ${
                      showImagePanel
                        ? "bg-gold/20 text-gold border border-gold/30"
                        : "border border-parchment-3 text-voyage-muted hover:border-gold hover:text-gold"
                    }`}
                  >
                    🖼️ {t("aa.images")}
                  </button>
                  <button
                    onClick={() => setShowPdfPreview(true)}
                    className="px-3 py-1.5 rounded-sm border border-gold text-gold text-[0.68rem] font-semibold tracking-[0.08em] uppercase hover:bg-gold/10 transition-colors"
                  >
                    👁️ {t("aa.pdfPreview", "Preview")}
                  </button>
                  <button
                    onClick={handleShareLink}
                    disabled={isSharing}
                    className="px-3 py-1.5 rounded-sm bg-ink text-voyage-white text-[0.68rem] font-semibold tracking-[0.08em] uppercase hover:bg-ink/85 transition-colors disabled:opacity-40"
                  >
                    🔗 {isSharing ? t("aa.sharing", "Sharing...") : t("aa.share", "Share with Client")}
                  </button>
                  <button
                    onClick={handleExportPdf}
                    className="px-3 py-1.5 rounded-sm bg-gold text-ink text-[0.68rem] font-semibold tracking-[0.08em] uppercase hover:bg-gold-2 transition-colors"
                  >
                    📄 {t("aa.exportPdf")}
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Pending AI edit panel */}
          {pendingEdit && (
            <div className="mx-4 mt-3 p-3 rounded-lg border border-gold/40 bg-gold/10">
              <div className="flex items-center justify-between mb-2 gap-3 flex-wrap">
                <div>
                  <p className="text-[0.78rem] font-semibold text-ink">✨ AI proposed an edit</p>
                  <p className="text-[0.7rem] text-voyage-muted">Review the revised draft below — accept to replace, or reject to keep the current version.</p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={rejectPendingEdit}
                    className="px-3 py-1.5 rounded-sm border border-parchment-3 text-[0.68rem] text-voyage-muted font-semibold tracking-[0.08em] uppercase hover:border-ink hover:text-ink transition-colors"
                  >
                    ✕ Reject
                  </button>
                  <button
                    onClick={acceptPendingEdit}
                    className="px-3 py-1.5 rounded-sm bg-gold text-ink text-[0.68rem] font-semibold tracking-[0.08em] uppercase hover:bg-gold-2 transition-colors"
                  >
                    ✓ Accept edit
                  </button>
                </div>
              </div>
              <div className="max-h-[260px] overflow-y-auto rounded border border-gold/20 bg-voyage-white p-3 prose prose-sm max-w-none prose-headings:font-serif prose-headings:text-ink prose-p:text-ink-2">
                <ReactMarkdown>{pendingEdit}</ReactMarkdown>
              </div>
            </div>
          )}

          {/* Image Panel */}
          {showImagePanel && itineraryContent && (
            <div className="px-4 py-3 border-b border-parchment-3 bg-parchment/50 space-y-3">
              <div>
                <p className="text-[0.68rem] font-semibold text-ink uppercase tracking-[0.1em] mb-1.5">✨ {t("aa.aiGenerate")}</p>
                <div className="flex gap-2">
                  <input
                    value={aiImagePrompt}
                    onChange={(e) => setAiImagePrompt(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") handleAiImageGenerate(); }}
                    placeholder={t("aa.aiPlaceholder")}
                    className="flex-1 px-2.5 py-1.5 rounded-sm bg-voyage-white border border-parchment-3 text-ink text-[0.78rem] focus:outline-none focus:border-gold transition-colors"
                  />
                  <button
                    onClick={handleAiImageGenerate}
                    disabled={isGeneratingImage || !aiImagePrompt.trim()}
                    className="px-3 py-1.5 rounded-sm bg-gold text-ink text-[0.68rem] font-semibold tracking-[0.08em] uppercase hover:bg-gold-2 transition-colors disabled:opacity-40"
                  >
                    {isGeneratingImage ? "⏳" : t("aa.generate")}
                  </button>
                </div>
              </div>

              <div>
                <p className="text-[0.68rem] font-semibold text-ink uppercase tracking-[0.1em] mb-1.5">📸 {t("aa.stockPhotos")}</p>
                <div className="flex flex-wrap gap-1.5">
                  {PICSUM_CATEGORIES.map((cat) => (
                    <button
                      key={cat.seed}
                      onClick={() => handlePicsumImage(cat.seed)}
                      className="px-2.5 py-1 rounded-full border border-parchment-3 text-[0.68rem] text-voyage-muted hover:border-gold hover:text-gold transition-all"
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-[0.68rem] font-semibold text-ink uppercase tracking-[0.1em] mb-1.5">📤 {t("aa.uploadPc")}</p>
                <input
                  ref={imageUploadRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleImageUpload}
                />
                <button
                  onClick={() => imageUploadRef.current?.click()}
                  className="px-3 py-1.5 rounded-sm border border-parchment-3 text-[0.72rem] text-voyage-muted hover:border-gold hover:text-gold transition-all"
                >
                  {t("aa.chooseImage")}
                </button>
              </div>

              {imageResults.length > 0 && (
                <div>
                  <p className="text-[0.68rem] font-semibold text-ink uppercase tracking-[0.1em] mb-1.5">{t("aa.clickInsert")}</p>
                  <div className="grid grid-cols-3 gap-2 max-h-[200px] overflow-y-auto">
                    {imageResults.map((img, i) => (
                      <div key={i} className="group relative rounded-md overflow-hidden border border-parchment-3 hover:border-gold transition-colors">
                        <button
                          onClick={() => insertImageAtCursor(img.url, "Travel photo", img.credit)}
                          className="w-full"
                        >
                          <img src={img.url} alt="Travel" className="w-full h-20 object-cover" loading="lazy" />
                          <div className="absolute inset-0 bg-ink/0 group-hover:bg-ink/40 transition-colors flex items-center justify-center">
                            <span className="text-voyage-white text-xs font-semibold opacity-0 group-hover:opacity-100 transition-opacity">{t("aa.insertImg")}</span>
                          </div>
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); setCropTarget({ index: i, url: img.url }); }}
                          className="absolute top-1 right-1 bg-ink/60 hover:bg-ink/80 text-voyage-white rounded-sm px-1.5 py-0.5 text-[0.6rem] opacity-0 group-hover:opacity-100 transition-opacity z-10"
                          title={t("aa.cropImage", "Crop")}
                        >
                          ✂️
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {(() => {
                const imgs = extractImages(itineraryContent);
                if (imgs.length < 2) return null;
                return (
                  <div>
                    <p className="text-[0.68rem] font-semibold text-ink uppercase tracking-[0.1em] mb-1.5">↕️ {t("aa.reorderImages")}</p>
                    <div className="space-y-1.5 max-h-[200px] overflow-y-auto">
                      {imgs.map((img, i) => (
                        <div
                          key={`${img.url}-${i}`}
                          draggable
                          onDragStart={() => setDragIdx(i)}
                          onDragOver={(e) => e.preventDefault()}
                          onDrop={() => {
                            if (dragIdx !== null && dragIdx !== i) {
                              reorderImages(dragIdx, i);
                            }
                            setDragIdx(null);
                          }}
                          onDragEnd={() => setDragIdx(null)}
                          className={`flex items-center gap-2 p-1.5 rounded-md border cursor-grab active:cursor-grabbing transition-colors ${
                            dragIdx === i
                              ? "border-gold bg-gold/10"
                              : "border-parchment-3 bg-voyage-white hover:border-gold/50"
                          }`}
                        >
                          <span className="text-voyage-muted text-[0.65rem] w-5 text-center select-none">☰</span>
                          <img src={img.url} alt={img.alt} className="w-12 h-8 object-cover rounded" loading="lazy" />
                          <span className="text-[0.7rem] text-ink truncate flex-1">{img.alt || "Image"}</span>
                          <span className="text-[0.6rem] text-voyage-muted">#{i + 1}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })()}
            </div>
          )}

          <div className="flex-1 overflow-y-auto max-h-[500px]">
            {itineraryContent ? (
              <div>
                {selectedProject && (
                  <div className="text-center mb-4 pb-4 border-b border-parchment-3 px-6 pt-6">
                    <p className="text-[0.68rem] tracking-[0.15em] uppercase text-gold font-semibold mb-1">Fjord & Waves Travel</p>
                    <h1 className="font-serif text-xl font-bold text-ink !border-none !pb-0 !mb-1">
                      {selectedProject.destination || t("aa.travel")} {t("aa.itinerary")}
                    </h1>
                    <p className="text-[0.75rem] text-voyage-muted">
                      {t("aa.preparedFor")} <strong>{selectedProject.client_name}</strong>
                      {selectedProject.trip_duration && ` · ${selectedProject.trip_duration}`}
                      {selectedProject.group_size > 1 && ` · ${selectedProject.group_size} ${t("aa.travellers")}`}
                    </p>
                  </div>
                )}
                <ItineraryEditor
                  ref={editorRef}
                  content={itineraryContent}
                  onContentChange={(md) => {
                    setItineraryContent(md);
                  }}
                  placeholder={t("aa.editPlaceholder")}
                />
              </div>
            ) : (
              <div className="flex items-center justify-center h-full text-center p-6">
                <div>
                  <div className="text-4xl mb-3 opacity-30">🗺️</div>
                  <p className="text-voyage-muted text-[0.82rem]">
                    {t("aa.previewEmpty")}
                  </p>
                  <p className="text-voyage-muted text-[0.72rem] mt-1">
                    {t("aa.previewStart")}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      {cropTarget && (
        <ImageCropper
          imageUrl={cropTarget.url}
          onCropComplete={handleCropComplete}
          onCancel={() => setCropTarget(null)}
        />
      )}
      {showPdfPreview && (
        <PdfPreview
          content={itineraryContent}
          project={selectedProject ? {
            client_name: selectedProject.client_name,
            destination: selectedProject.destination,
            trip_duration: selectedProject.trip_duration,
            group_size: selectedProject.group_size,
          } : null}
          onClose={() => setShowPdfPreview(false)}
          onExport={() => { setShowPdfPreview(false); handleExportPdf(); }}
        />
      )}
    </div>
  );
};

export default AdvisorAssistant;
