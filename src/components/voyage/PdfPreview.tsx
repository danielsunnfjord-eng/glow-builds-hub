import { useTranslation } from "react-i18next";
import { markdownToHtml } from "./ItineraryEditor";

interface PdfPreviewProps {
  content: string;
  project: {
    client_name: string;
    destination?: string | null;
    trip_duration?: string | null;
    group_size?: number;
  } | null;
  onClose: () => void;
  onExport: () => void;
}

const PdfPreview = ({ content, project, onClose, onExport }: PdfPreviewProps) => {
  const { t } = useTranslation();

  const htmlContent = markdownToHtml(content);

  return (
    <div className="fixed inset-0 z-[9998] bg-ink/60 flex items-center justify-center p-4">
      <div className="bg-[#f5f5f0] rounded-lg shadow-2xl w-full max-w-[900px] max-h-[92vh] flex flex-col overflow-hidden">
        {/* Header bar */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-parchment-3 bg-voyage-white">
          <h3 className="text-sm font-serif font-semibold text-ink">
            👁️ {t("aa.pdfPreview", "PDF Preview")}
          </h3>
          <div className="flex gap-2">
            <button
              onClick={onExport}
              className="px-4 py-1.5 text-[0.72rem] rounded bg-gold text-ink font-semibold tracking-[0.06em] uppercase hover:bg-gold-2 transition-colors"
            >
              📄 {t("aa.exportPdf")}
            </button>
            <button
              onClick={onClose}
              className="text-voyage-muted hover:text-ink text-lg leading-none px-2"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Simulated page */}
        <div className="flex-1 overflow-auto p-6 bg-[#e8e0d0]">
          <div
            className="bg-white mx-auto shadow-lg"
            style={{
              width: "210mm",
              maxWidth: "100%",
              minHeight: "297mm",
              padding: "40px 50px",
              fontFamily: "'Playfair Display', 'Libre Baskerville', serif",
            }}
          >
            {/* Brand header */}
            <div className="text-center mb-10">
              <p
                style={{
                  fontFamily: "'Playfair Display', serif",
                  fontSize: "14px",
                  letterSpacing: "0.15em",
                  textTransform: "uppercase",
                  color: "#c9a96e",
                  marginBottom: "8px",
                }}
              >
                Fjord & Waves Travel
              </p>
              <h1
                style={{
                  fontFamily: "'Playfair Display', serif",
                  fontSize: "28px",
                  fontWeight: 700,
                  color: "#1a1a2e",
                  borderBottom: "2px solid #c9a96e",
                  paddingBottom: "12px",
                  marginBottom: "8px",
                }}
              >
                {project?.destination
                  ? `${project.destination} ${t("aa.itinerary")}`
                  : t("aa.itinerary")}
              </h1>
              <p style={{ fontSize: "13px", color: "#777" }}>
                {t("aa.preparedFor")}{" "}
                <strong>{project?.client_name || ""}</strong>
                {project?.trip_duration && ` · ${project.trip_duration}`}
                {project?.group_size && project.group_size > 1 && ` · ${project.group_size} ${t("aa.travellers")}`}
              </p>
            </div>

            {/* Content */}
            <div
              className="pdf-preview-content"
              dangerouslySetInnerHTML={{ __html: htmlContent }}
            />

            {/* Footer */}
            <div
              style={{
                textAlign: "center",
                marginTop: "48px",
                fontSize: "11px",
                color: "#999",
                borderTop: "1px solid #e8e0d0",
                paddingTop: "16px",
              }}
            >
              © {new Date().getFullYear()} Fjord & Waves Travel · Org.nr: 928804860
            </div>
          </div>
        </div>
      </div>

      {/* Scoped styles matching the PDF export */}
      <style>{`
        .pdf-preview-content {
          font-family: 'Inter', 'Jost', sans-serif;
          color: #1a1a2e;
          line-height: 1.7;
          font-size: 14px;
        }
        .pdf-preview-content h1,
        .pdf-preview-content h2,
        .pdf-preview-content h3 {
          font-family: 'Playfair Display', 'Libre Baskerville', serif;
          color: #1a1a2e;
        }
        .pdf-preview-content h1 {
          font-size: 24px;
          border-bottom: 2px solid #c9a96e;
          padding-bottom: 10px;
          margin: 28px 0 16px;
        }
        .pdf-preview-content h2 {
          font-size: 20px;
          color: #c9a96e;
          margin: 28px 0 12px;
        }
        .pdf-preview-content h3 {
          font-size: 16px;
          margin: 20px 0 8px;
        }
        .pdf-preview-content p {
          margin: 8px 0;
        }
        .pdf-preview-content ul,
        .pdf-preview-content ol {
          margin: 8px 0;
          padding-left: 24px;
        }
        .pdf-preview-content li {
          margin: 4px 0;
        }
        .pdf-preview-content strong {
          color: #1a1a2e;
        }
        .pdf-preview-content hr {
          border: none;
          border-top: 1px solid #e8e0d0;
          margin: 24px 0;
        }
        .pdf-preview-content img {
          max-width: 100%;
          border-radius: 8px;
          margin: 16px 0;
        }
        .pdf-preview-content em {
          font-size: 11px;
          color: #999;
        }
        .pdf-preview-content blockquote {
          border-left: 3px solid #c9a96e;
          padding-left: 16px;
          margin: 16px 0;
          color: #666;
          font-style: italic;
        }
        .pdf-preview-content figure {
          margin: 16px 0;
        }
        .pdf-preview-content figcaption {
          font-size: 11px;
          color: #999;
          text-align: center;
          margin-top: 4px;
        }
      `}</style>
    </div>
  );
};

export default PdfPreview;
