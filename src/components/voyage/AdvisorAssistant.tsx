import { useState, useRef, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import ReactMarkdown from "react-markdown";

interface ClientProject {
  id: string;
  client_name: string;
  client_email: string | null;
  group_size: number;
  destination: string | null;
  trip_duration: string | null;
  notes: string | null;
}

interface Message {
  role: "user" | "assistant";
  content: string;
  fileName?: string;
}

interface AdvisorAssistantProps {
  projects: ClientProject[];
}

const QUICK_PROMPTS = [
  "Create a full day-by-day itinerary",
  "Suggest luxury accommodations",
  "Add restaurant recommendations",
  "Include adventure activities",
  "Add practical travel tips",
  "Make it more romantic / honeymoon style",
];

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/advisor-assistant`;

const AdvisorAssistant = ({ projects }: AdvisorAssistantProps) => {
  const { toast } = useToast();
  const [selectedProjectId, setSelectedProjectId] = useState<string>("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [itineraryContent, setItineraryContent] = useState("");
  const [attachedFile, setAttachedFile] = useState<{ name: string; content: string } | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const selectedProject = projects.find((p) => p.id === selectedProjectId);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const streamChat = useCallback(
    async (userMessages: Message[]) => {
      const projectContext = selectedProject
        ? {
            clientName: selectedProject.client_name,
            destination: selectedProject.destination,
            groupSize: selectedProject.group_size,
            tripDuration: selectedProject.trip_duration,
            notes: selectedProject.notes,
          }
        : undefined;

      const resp = await fetch(CHAT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ messages: userMessages, projectContext }),
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
    [selectedProject]
  );

  const handleSend = async (text?: string) => {
    const msg = text || input.trim();
    if (!msg || isLoading) return;

    const userMsg: Message = { role: "user", content: msg };
    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setInput("");
    setIsLoading(true);

    try {
      const content = await streamChat(updatedMessages);
      if (content) setItineraryContent(content);
    } catch (err: any) {
      toast({ title: "AI Error", description: err.message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleExportPdf = () => {
    // Use the browser print dialog to save as PDF
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      toast({ title: "Please allow popups to export PDF", variant: "destructive" });
      return;
    }
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Itinerary — ${selectedProject?.client_name || "Client"}</title>
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
          .header { text-align: center; margin-bottom: 40px; }
          .header .brand { font-family: 'Playfair Display', serif; font-size: 14px; letter-spacing: 0.15em; text-transform: uppercase; color: #c9a96e; }
          .footer { text-align: center; margin-top: 48px; font-size: 11px; color: #999; border-top: 1px solid #e8e0d0; padding-top: 16px; }
          @media print { body { padding: 20px; } }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="brand">Fjord & Waves Tours</div>
          <h1>${selectedProject?.destination ? `${selectedProject.destination} Itinerary` : "Travel Itinerary"}</h1>
          <p style="font-size:13px;color:#777;">Prepared for <strong>${selectedProject?.client_name || "Our Valued Client"}</strong>${selectedProject?.trip_duration ? ` · ${selectedProject.trip_duration}` : ""}${selectedProject?.group_size ? ` · ${selectedProject.group_size} traveller${selectedProject.group_size > 1 ? "s" : ""}` : ""}</p>
        </div>
        <div id="content"></div>
        <div class="footer">© ${new Date().getFullYear()} Fjord & Waves Tours · Org.nr: 928804860</div>
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

  const inputClass = "w-full px-3 py-2.5 rounded-sm bg-parchment border border-parchment-3 text-ink text-[0.85rem] focus:outline-none focus:border-gold transition-colors";

  return (
    <div className="flex flex-col gap-6">
      {/* Project Selector */}
      <div className="bg-voyage-white border border-parchment-3 rounded-lg p-5">
        <label className="text-[0.7rem] font-semibold text-voyage-muted uppercase tracking-[0.12em] mb-2 block">
          Link to Client Project
        </label>
        <select
          value={selectedProjectId}
          onChange={(e) => setSelectedProjectId(e.target.value)}
          className={inputClass}
        >
          <option value="">— Select a project —</option>
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
            {selectedProject.destination && (
              <span className="px-2.5 py-1 bg-sage/10 text-sage border border-sage/20 rounded-full">
                📍 {selectedProject.destination}
              </span>
            )}
            <span className="px-2.5 py-1 bg-ink/[0.06] text-ink border border-parchment-3 rounded-full">
              👥 {selectedProject.group_size} traveller{selectedProject.group_size > 1 ? "s" : ""}
            </span>
            {selectedProject.trip_duration && (
              <span className="px-2.5 py-1 bg-ink/[0.06] text-ink border border-parchment-3 rounded-full">
                📅 {selectedProject.trip_duration}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Main Layout: Chat + Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chat Panel */}
        <div className="bg-voyage-white border border-parchment-3 rounded-lg flex flex-col" style={{ minHeight: 500 }}>
          <div className="px-4 py-3 border-b border-parchment-3 flex justify-between items-center">
            <h3 className="font-serif text-sm font-bold text-ink">Chat with AI</h3>
            {messages.length > 0 && (
              <button
                onClick={() => { setMessages([]); setItineraryContent(""); }}
                className="text-[0.68rem] text-voyage-muted hover:text-destructive transition-colors"
              >
                Clear chat
              </button>
            )}
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 max-h-[400px]">
            {messages.length === 0 && (
              <div className="text-center py-8">
                <p className="text-voyage-muted text-[0.85rem] mb-4">
                  {selectedProject
                    ? `Ready to create an itinerary for ${selectedProject.client_name}!`
                    : "Select a project above, or start chatting to create an itinerary."}
                </p>
                <div className="flex flex-wrap gap-2 justify-center">
                  {QUICK_PROMPTS.slice(0, 3).map((p) => (
                    <button
                      key={p}
                      onClick={() => handleSend(p)}
                      className="px-3 py-1.5 rounded-full border border-gold/30 text-[0.72rem] text-gold hover:bg-gold/5 hover:border-gold transition-all"
                    >
                      {p}
                    </button>
                  ))}
                </div>
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
                    msg.content
                  )}
                </div>
              </div>
            ))}

            {isLoading && messages[messages.length - 1]?.role !== "assistant" && (
              <div className="flex justify-start">
                <div className="bg-parchment border border-parchment-3 rounded-lg px-4 py-3 text-[0.82rem] text-voyage-muted">
                  <span className="animate-pulse">Thinking...</span>
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Quick prompts after initial message */}
          {messages.length > 0 && !isLoading && (
            <div className="px-4 pb-2 flex flex-wrap gap-1.5">
              {QUICK_PROMPTS.map((p) => (
                <button
                  key={p}
                  onClick={() => handleSend(p)}
                  className="px-2.5 py-1 rounded-full border border-parchment-3 text-[0.65rem] text-voyage-muted hover:border-gold hover:text-gold transition-all"
                >
                  {p}
                </button>
              ))}
            </div>
          )}

          {/* Input */}
          <div className="p-3 border-t border-parchment-3">
            <div className="flex gap-2">
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
                placeholder={selectedProject ? `Describe the itinerary for ${selectedProject.client_name}...` : "Describe the trip you want to plan..."}
                rows={2}
                className="flex-1 px-3 py-2 rounded-sm bg-parchment border border-parchment-3 text-ink text-[0.82rem] focus:outline-none focus:border-gold transition-colors resize-none"
              />
              <button
                onClick={() => handleSend()}
                disabled={isLoading || !input.trim()}
                className="px-4 py-2 rounded-sm bg-gold text-ink text-[0.72rem] font-semibold tracking-[0.08em] uppercase hover:bg-gold-2 transition-colors disabled:opacity-40 self-end"
              >
                Send
              </button>
            </div>
          </div>
        </div>

        {/* Itinerary Preview Panel */}
        <div className="bg-voyage-white border border-parchment-3 rounded-lg flex flex-col" style={{ minHeight: 500 }}>
          <div className="px-4 py-3 border-b border-parchment-3 flex justify-between items-center">
            <h3 className="font-serif text-sm font-bold text-ink">Itinerary Preview</h3>
            {itineraryContent && (
              <button
                onClick={handleExportPdf}
                className="px-3 py-1.5 rounded-sm bg-gold text-ink text-[0.68rem] font-semibold tracking-[0.08em] uppercase hover:bg-gold-2 transition-colors"
              >
                📄 Export PDF
              </button>
            )}
          </div>

          <div className="flex-1 overflow-y-auto p-6 max-h-[500px]">
            {itineraryContent ? (
              <div className="prose prose-sm max-w-none prose-headings:font-serif prose-headings:text-ink prose-h1:text-xl prose-h1:border-b prose-h1:border-gold/30 prose-h1:pb-2 prose-h2:text-gold prose-h2:text-base prose-p:text-ink-2 prose-strong:text-ink prose-li:text-ink-2 prose-hr:border-parchment-3">
                {selectedProject && (
                  <div className="text-center mb-6 pb-4 border-b border-parchment-3">
                    <p className="text-[0.68rem] tracking-[0.15em] uppercase text-gold font-semibold mb-1">Fjord & Waves Tours</p>
                    <h1 className="font-serif text-xl font-bold text-ink !border-none !pb-0 !mb-1">
                      {selectedProject.destination || "Travel"} Itinerary
                    </h1>
                    <p className="text-[0.75rem] text-voyage-muted">
                      Prepared for <strong>{selectedProject.client_name}</strong>
                      {selectedProject.trip_duration && ` · ${selectedProject.trip_duration}`}
                      {selectedProject.group_size > 1 && ` · ${selectedProject.group_size} travellers`}
                    </p>
                  </div>
                )}
                <ReactMarkdown>{itineraryContent}</ReactMarkdown>
              </div>
            ) : (
              <div className="flex items-center justify-center h-full text-center">
                <div>
                  <div className="text-4xl mb-3 opacity-30">🗺️</div>
                  <p className="text-voyage-muted text-[0.82rem]">
                    Your itinerary preview will appear here
                  </p>
                  <p className="text-voyage-muted text-[0.72rem] mt-1">
                    Start chatting to generate content
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdvisorAssistant;
