import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import "./i18n";
import { loadGoogleAnalytics } from "./AnalyticsLoader";

if (typeof window !== "undefined") {
  loadGoogleAnalytics();
}

createRoot(document.getElementById("root")!).render(<App />);
