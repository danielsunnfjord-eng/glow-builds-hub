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
          // IMPORTANT: Do NOT split React or any React-dependent library
          // (react-i18next, react-router, @tanstack/react-query, @radix-ui,
          // react-leaflet, react-pdf, @tiptap/react, lucide-react, etc.)
          // into separate chunks. Doing so can cause the dependent chunk to
          // evaluate before the React chunk in production, producing
          // "Cannot read properties of undefined (reading 'createContext')".
          // Only split self-contained, non-React libs here.
          if (id.includes("@supabase")) return "supabase";
          if (id.includes("i18next/") && !id.includes("react-i18next")) return "i18n-core";
          if (id.includes("leaflet") && !id.includes("react-leaflet")) return "leaflet-core";
          if (id.includes("pdfjs-dist")) return "pdfjs";
        },
      },
    },
  },
}));
