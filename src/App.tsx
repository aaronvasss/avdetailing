import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import ServicesPage from "./pages/ServicesPage";
import CarDetailingPage from "./pages/services/CarDetailingPage";
import CeramicCoatingPage from "./pages/services/CeramicCoatingPage";
import PaintCorrectionPage from "./pages/services/PaintCorrectionPage";
import BoatDetailingPage from "./pages/services/BoatDetailingPage";
import RVDetailingPage from "./pages/services/RVDetailingPage";
import AircraftDetailingPage from "./pages/services/AircraftDetailingPage";
import AboutPage from "./pages/AboutPage";
import MembershipsPage from "./pages/MembershipsPage";
import GalleryPage from "./pages/GalleryPage";
import ReviewsPage from "./pages/ReviewsPage";
import ContactPage from "./pages/ContactPage";
import ServiceAreasPage from "./pages/ServiceAreasPage";
import BookingPage from "./pages/BookingPage";
import BookingManagePage from "@/pages/BookingManagePage";
import BookingCancelPage from "@/pages/BookingCancelPage";
import BookingSuccessPage from "./pages/BookingSuccessPage";
import BookingCanceledPage from "./pages/BookingCanceledPage";
import AuthPage from "./pages/AuthPage";
import AccountPage from "./pages/AccountPage";
import AdminPage from "./pages/AdminPage";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/services" element={<ServicesPage />} />
          <Route path="/services/car-detailing" element={<CarDetailingPage />} />
          <Route path="/services/ceramic-coating" element={<CeramicCoatingPage />} />
          <Route path="/services/paint-correction" element={<PaintCorrectionPage />} />
          <Route path="/services/boat-detailing" element={<BoatDetailingPage />} />
          <Route path="/services/rv-detailing" element={<RVDetailingPage />} />
          <Route path="/services/aircraft-detailing" element={<AircraftDetailingPage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/memberships" element={<MembershipsPage />} />
          <Route path="/gallery" element={<GalleryPage />} />
          <Route path="/reviews" element={<ReviewsPage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/service-areas" element={<ServiceAreasPage />} />
          <Route path="/book" element={<BookingPage />} />
          <Route path="/booking/manage" element={<BookingManagePage />} />
          <Route path="/booking/cancel" element={<BookingCancelPage />} />
          <Route path="/booking/success" element={<BookingSuccessPage />} />
          <Route path="/booking/canceled" element={<BookingCanceledPage />} />
          <Route path="/auth" element={<AuthPage />} />
          <Route path="/account" element={<AccountPage />} />
          <Route path="/admin" element={<AdminPage />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
