import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Index from "./pages/Index.tsx";
import Admin from "./pages/Admin.tsx";
import About from "./pages/About.tsx";
import Login from "./pages/Login.tsx";
import ResetPassword from "./pages/ResetPassword.tsx";
import NotFound from "./pages/NotFound.tsx";
import PlanMyTripPage from "./pages/PlanMyTrip.tsx";
import SharedItinerary from "./pages/SharedItinerary.tsx";
import Legal from "./pages/Legal.tsx";
import Unsubscribe from "./pages/Unsubscribe.tsx";
import ItinerariesShop from "./pages/ItinerariesShop.tsx";
import ItineraryShopDetail from "./pages/ItineraryShopDetail.tsx";
import ItineraryShopSuccess from "./pages/ItineraryShopSuccess.tsx";
import DestinationNorway from "./pages/DestinationNorway.tsx";
import ProtectedRoute from "./components/ProtectedRoute.tsx";
import CookieConsent from "./components/voyage/CookieConsent.tsx";
import CalendlyBadge from "./components/voyage/CalendlyBadge.tsx";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <CookieConsent />
        <CalendlyBadge />
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
          <Route path="/admin" element={<ProtectedRoute><Admin /></ProtectedRoute>} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
