import { lazy, Suspense, useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import ProtectedRoute from "@/components/ProtectedRoute";

// Admin pulls in browser-only libraries (pagedjs, react-pdf/pdfjs) at module
// scope, so the page is loaded lazily and only after mount — the server never
// evaluates it. The route is auth-gated; there is nothing to server-render.
const Admin = lazy(() => import("@/pages/Admin"));

const Fallback = () => (
  <div className="min-h-screen flex items-center justify-center bg-parchment">
    <p className="text-voyage-muted text-sm">Loading...</p>
  </div>
);

function AdminRoute() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return <Fallback />;
  return (
    <ProtectedRoute>
      <Suspense fallback={<Fallback />}>
        <Admin />
      </Suspense>
    </ProtectedRoute>
  );
}

export const Route = createFileRoute("/{-$locale}/admin")({
  component: AdminRoute,
});
