import { lazy, Suspense } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Index from "./pages/Index.tsx";
import ProtectedRoute from "./components/ProtectedRoute.tsx";
import CookieConsent from "./components/voyage/CookieConsent.tsx";
import CalendlyBadge from "./components/voyage/CalendlyBadge.tsx";

// Code-split everything except the landing page
const Admin = lazy(() => import("./pages/Admin.tsx"));
const About = lazy(() => import("./pages/About.tsx"));
const Login = lazy(() => import("./pages/Login.tsx"));
const ResetPassword = lazy(() => import("./pages/ResetPassword.tsx"));
const NotFound = lazy(() => import("./pages/NotFound.tsx"));
const PlanMyTripPage = lazy(() => import("./pages/PlanMyTrip.tsx"));
const SharedItinerary = lazy(() => import("./pages/SharedItinerary.tsx"));
const Legal = lazy(() => import("./pages/Legal.tsx"));
const Unsubscribe = lazy(() => import("./pages/Unsubscribe.tsx"));
const ItinerariesShop = lazy(() => import("./pages/ItinerariesShop.tsx"));
const ItineraryShopDetail = lazy(() => import("./pages/ItineraryShopDetail.tsx"));
const ItineraryShopSuccess = lazy(() => import("./pages/ItineraryShopSuccess.tsx"));
const DestinationNorway = lazy(() => import("./pages/DestinationNorway.tsx"));
const Routes_ = lazy(() => import("./pages/Routes.tsx"));
const RouteDetail = lazy(() => import("./pages/RouteDetail.tsx"));

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <CookieConsent />
        <CalendlyBadge />
        <Suspense fallback={null}>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/plan-my-trip" element={<PlanMyTripPage />} />
            <Route path="/about" element={<About />} />
            <Route path="/login" element={<Login />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/trip/:token" element={<SharedItinerary />} />
            <Route path="/legal" element={<Legal />} />
            <Route path="/privacy" element={<Legal />} />
            <Route path="/terms" element={<Legal />} />
            <Route path="/unsubscribe" element={<Unsubscribe />} />
            <Route path="/itineraries-shop" element={<ItinerariesShop />} />
            <Route path="/itineraries-shop/success" element={<ItineraryShopSuccess />} />
            <Route path="/itineraries-shop/:slug" element={<ItineraryShopDetail />} />
            <Route path="/destinations/norway" element={<DestinationNorway />} />
            <Route path="/routes" element={<Routes_ />} />
            <Route path="/routes/:slug" element={<RouteDetail />} />
            <Route path="/admin" element={<ProtectedRoute><Admin /></ProtectedRoute>} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
