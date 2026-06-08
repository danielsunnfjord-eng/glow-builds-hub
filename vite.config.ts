import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
  },
  plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
    dedupe: ["react", "react-dom", "react/jsx-runtime", "react/jsx-dev-runtime"],
  },
  build: {
    rollupOptions: {
      output: {
        // Split large 3rd-party libraries into their own chunks so the main
        // entry stays small and heavier libs only load on the routes that
        // actually use them (via dynamic import).
        manualChunks(id) {
          if (!id.includes("node_modules")) return;
          if (id.includes("react-router")) return "router";
          if (id.includes("@tanstack/react-query")) return "query";
          if (id.includes("i18next") || id.includes("react-i18next")) return "i18n";
          if (id.includes("@supabase")) return "supabase";
          if (id.includes("lucide-react")) return "icons";
          if (id.includes("@radix-ui")) return "radix";
          if (id.includes("@tiptap") || id.includes("tiptap")) return "tiptap";
          if (id.includes("leaflet") || id.includes("react-leaflet")) return "leaflet";
          if (id.includes("pdfjs") || id.includes("react-pdf")) return "pdf";
          if (id.includes("react-dom") || id.includes("scheduler") || id.includes("/react/")) return "react";
        },
      },
    },
  },
}));
