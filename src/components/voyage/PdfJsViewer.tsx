import { useEffect, useRef, useState } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";

// Use the worker shipped by pdfjs-dist via Vite's ?url import (works in Edge & Safari).
pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url,
).toString();

interface Props {
  url: string;
}

const PdfJsViewer = ({ url }: Props) => {
  const [numPages, setNumPages] = useState(0);
  const [width, setWidth] = useState(800);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const update = () => {
      if (containerRef.current) {
        setWidth(Math.max(320, containerRef.current.clientWidth - 16));
      }
    };
    update();
    const ro = new ResizeObserver(update);
    if (containerRef.current) ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, []);

  return (
    <div
      ref={containerRef}
      className="flex-1 min-h-[60vh] w-full overflow-y-auto bg-voyage-white p-2"
    >
      <Document
        file={url}
        onLoadSuccess={({ numPages: n }) => setNumPages(n)}
        loading={<div className="p-6 text-sm text-voyage-muted">Loading PDF…</div>}
        error={<div className="p-6 text-sm text-red-600">Failed to load PDF.</div>}
      >
        {Array.from({ length: numPages }, (_, i) => (
          <div key={i} className="mb-3 shadow-sm">
            <Page
              pageNumber={i + 1}
              width={width}
              renderTextLayer={false}
              renderAnnotationLayer={false}
            />
          </div>
        ))}
      </Document>
    </div>
  );
};

export default PdfJsViewer;
